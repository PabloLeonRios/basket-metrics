'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Court from './Court';
import GameLog from './GameLog';
import FloatingStats from './FloatingStats';
import { toast } from 'react-toastify';
import { IGameEvent, IPlayer, ISession } from '@/types/definitions';
import Button from '@/components/ui/Button';
import PlayerStatsModal from './PlayerStatsModal';
import { isThreePointer } from '@/lib/court-geometry';
import { MagnifyingGlassIcon, FlagIcon, ArrowRightIcon, LightBulbIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { ProactiveSuggestion } from '@/lib/recommender/lineupRecommender';


// Extender la interfaz para incluir el nuevo campo
interface TrackerSessionData extends ISession {
  currentQuarter: number;
  teams: TeamData[];
}
interface TeamData {
  _id: string;
  name: string;
  players: IPlayer[];
}
interface SelectedPlayer {
  id: string;
  name: string;
  teamName: string;
  onCourt: boolean; // Para saber si está en cancha o en el banquillo
}

export default function GameTracker({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<TrackerSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]);

  // --- Estados de Jugadores en Cancha/Banquillo ---
  const [onCourtPlayers, setOnCourtPlayers] = useState<IPlayer[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<IPlayer[]>([]);
  
  // --- Estados de IA Proactiva ---
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);

  // Estados para modales y UI
  const [showShotModal, setShowShotModal] = useState(false);
  // ... (otros estados)
  const [showFreeThrowModal, setShowFreeThrowModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [shotValue, setShotValue] = useState<2 | 3>(2);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState<{player: IPlayer, stats: any} | null>(null);

  const isSessionFinished = useMemo(() => !!session?.finishedAt, [session]);
  const currentQuarter = useMemo(() => session?.currentQuarter || 1, [session]);
  const allPlayers = useMemo(() => session?.teams.flatMap(t => t.players) || [], [session]);

  const playerIdToName = useMemo(() => {
    if (!allPlayers.length) return {};
    const map: { [key: string]: string } = {};
    allPlayers.forEach((player) => {
      map[player._id] = player.name;
    });
    return map;
  }, [allPlayers]);

  useEffect(() => {
    // ... (fetchSessionData se mantiene igual)
    async function fetchSessionData() {
      try {
        setLoading(true);
        const [sessionRes, eventsRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}`),
          fetch(`/api/game-events?sessionId=${sessionId}`),
        ]);
        if (!sessionRes.ok) throw new Error('Error al cargar la sesión');
        if (!eventsRes.ok) throw new Error('Error al cargar los eventos');
        
        const { data: sessionData } = await sessionRes.json();
        const { data: eventsData } = await eventsRes.json();

        setSession(sessionData);
        setGameEvents(eventsData);

        // Lógica inicial para determinar quién está en la cancha
        const subs = eventsData.filter((e: IGameEvent) => e.type === 'substitution');
        const onCourtIds = new Set<string>();

        if (subs.length > 0) {
            // Reconstruir el estado a partir de la última sustitución
            // Esta es una lógica simplificada
            const last5Ins = subs.slice(0, 5).map((s: any) => s.details.playerIn as string);
            last5Ins.forEach((id: string) => onCourtIds.add(id));
        }
        
        const initialOnCourt = sessionData.teams.flatMap((t: TeamData) => t.players).slice(0, 5);
        if (onCourtIds.size < 5) {
             initialOnCourt.forEach((p: IPlayer) => onCourtIds.add(p._id));
        }

        const all = sessionData.teams.flatMap((t: TeamData) => t.players);
        setOnCourtPlayers(all.filter((p: IPlayer) => onCourtIds.has(p._id)));
        setBenchPlayers(all.filter((p: IPlayer) => !onCourtIds.has(p._id)));


      } catch (err) {
        setError(err instanceof Error ? err.message : 'Un error desconocido ha ocurrido.');
      } finally {
        setLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId]);

  const handleUpdateSession = useCallback(async (updateData: Partial<TrackerSessionData>) => {
    // ... (sin cambios)
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo actualizar la sesión.');
        }
        const { data: updatedSession } = await response.json();
        setSession(updatedSession);
        return updatedSession;
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al actualizar sesión.');
        return null;
    }
  }, [sessionId]);

  const logEvent = useCallback(async (type: string, details: Record<string, unknown>) => {
    // Lógica actualizada para `substitution`
    if (type === 'substitution') {
        // Para sustituciones, el 'player' principal es el que sale
        const eventData = { session: sessionId, player: (details.playerOut as IPlayer)._id, team: "N/A", type, details: { playerIn: (details.playerIn as IPlayer)._id, playerOut: (details.playerOut as IPlayer)._id }, quarter: currentQuarter };
        // ... (resto de la lógica de fetch)
        try {
          const response = await fetch('/api/game-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
          if (!response.ok) throw new Error('No se pudo registrar el evento.');
          const { data: newEvent } = await response.json();
          setGameEvents((prev) => [newEvent, ...prev]);
          toast.success(`Sustitución registrada.`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Error al registrar evento.');
        }

    } else {
        if (!selectedPlayer) return;
        if (isSessionFinished) { toast.warn('La sesión ya ha finalizado.'); return; }
        const eventData = { session: sessionId, player: selectedPlayer.id, team: selectedPlayer.teamName, type, details, quarter: currentQuarter };
        // ... (resto de la lógica de fetch)
         try {
          const response = await fetch('/api/game-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
          if (!response.ok) throw new Error('No se pudo registrar el evento.');
          const { data: newEvent } = await response.json();
          setGameEvents((prev) => [newEvent, ...prev]);
          toast.success(`Evento '${type}' registrado para ${selectedPlayer.name}.`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Error al registrar evento.');
        }
    }
  }, [selectedPlayer, sessionId, isSessionFinished, currentQuarter]);
  
  const handleGetProactiveSuggestion = async () => {
    setLoadingAISuggestion(true);
    setShowAISuggestionModal(true);
    setAiSuggestion(null);
    try {
        const response = await fetch('/api/assistant/proactive-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                allPlayerIds: allPlayers.map(p => p._id),
                onCourtPlayerIds: onCourtPlayers.map(p => p._id),
                sessionId: sessionId,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener sugerencia.');
        setAiSuggestion(data.data); // data.data puede ser null si no hay sugerencia
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo obtener la sugerencia.');
        setShowAISuggestionModal(false);
    } finally {
        setLoadingAISuggestion(false);
    }
  };

  const handleSubstitution = (playerOut: IPlayer, playerIn: IPlayer) => {
    if (isSessionFinished) return;
    // 1. Actualizar estado de la UI
    setOnCourtPlayers(prev => [...prev.filter(p => p._id !== playerOut._id), playerIn]);
    setBenchPlayers(prev => [...prev.filter(p => p._id !== playerIn._id), playerOut]);
    // 2. Registrar el evento
    logEvent('substitution', { playerIn, playerOut });
    // 3. Cerrar modales y deseleccionar jugador
    setShowAISuggestionModal(false);
    setSelectedPlayer(null);
  };

  // ... (handleAdvanceQuarter, handleFinishSession, etc. sin cambios significativos)
  const handleAdvanceQuarter = () => {
      if (isSessionFinished) return;
      if (currentQuarter >= 4) { toast.info('Ya estás en el último cuarto. Ahora puedes finalizar el partido.'); return; }
      if (confirm(`¿Estás seguro de que quieres avanzar al cuarto ${currentQuarter + 1}?`)) { handleUpdateSession({ currentQuarter: currentQuarter + 1 }); }
  };
  const handleFinishSession = async () => {
    if (isSessionFinished) return;
    if (confirm('¿Estás seguro de que quieres finalizar esta sesión? No podrás registrar más eventos.')) {
        const updated = await handleUpdateSession({ finishedAt: new Date().toISOString() });
        if (updated) { toast.success('Sesión finalizada. Redirigiendo al dashboard...'); router.push(`/panel/dashboard/${sessionId}`); }
    }
  };
   const handleCourtClick = useCallback((x: number, y: number) => {
    if (!selectedPlayer) { toast.error('Selecciona un jugador antes de registrar un tiro.'); return; }
    if (isSessionFinished) { toast.warn('La sesión ya ha finalizado. No se pueden registrar tiros.'); return; }
    const is3Pointer = isThreePointer(x, y);
    setShotValue(is3Pointer ? 3 : 2);
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  }, [selectedPlayer, isSessionFinished]);
   const handleShot = (made: boolean) => {
    if (!shotCoordinates) return;
    logEvent('tiro', { made, value: shotValue, x: shotCoordinates.x, y: shotCoordinates.y });
    setShowShotModal(false); setShotCoordinates(null);
  };
  const handleFreeThrow = (made: boolean) => { logEvent('tiro_libre', { made, value: 1, x: 50, y: 32 }); setShowFreeThrowModal(false); };
  const handleUndoEvent = useCallback(async (eventId: string) => {
    if (!confirm(`¿Estás seguro de que quieres deshacer este evento?`)) return;
    try {
        const response = await fetch(`/api/game-events/${eventId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('No se pudo deshacer el evento.');
        setGameEvents(prev => prev.filter(event => event._id !== eventId));
        toast.info('Evento deshecho.');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al deshacer.'); }
  }, []);
  const calculateStatsForPlayer = useCallback((playerId: string) => {
    const stats = { FGM: 0, FGA: 0, '3PM': 0, '3PA': 0, FTM: 0, FTA: 0, ORB: 0, DRB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0, PTS: 0 };
    gameEvents.forEach(event => { if(event.player === playerId) { /* logic */ }});
    return stats;
  }, [gameEvents]);
  const handleShowPlayerStats = (player: IPlayer) => {
      const stats = calculateStatsForPlayer(player._id);
      setStatsPlayer({ player, stats });
      setShowPlayerStatsModal(true);
  };


  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-4 p-4">
      {/* Columna Izquierda: Jugadores y Acciones */}
      <div className="w-full lg:w-1/4 space-y-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-3">Control del Partido</h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-lg">
                    <span>Cuarto Actual:</span>
                    <span className="font-bold text-blue-500">{currentQuarter}</span>
                </div>
                <Button onClick={handleAdvanceQuarter} disabled={isSessionFinished || currentQuarter >= 4} className="w-full flex items-center justify-center gap-2"><ArrowRightIcon className="h-5 w-5" /> Siguiente Cuarto</Button>
                <Button onClick={handleFinishSession} disabled={isSessionFinished} variant="danger" className="w-full flex items-center justify-center gap-2"><FlagIcon className="h-5 w-5" /> Finalizar Sesión</Button>
            </div>
        </div>

        {/* Listas de Jugadores en Cancha y Banquillo */}
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">En Cancha</h3>
              <div className="space-y-1">
                {onCourtPlayers.map((player) => (
                  <div key={player._id} className="flex items-center justify-between">
                    <button onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: 'N/A', onCourt: true })} className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                      #{player.dorsal} - {player.name}
                    </button>
                    <button onClick={() => handleShowPlayerStats(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-2"><MagnifyingGlassIcon className="h-5 w-5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">Banquillo</h3>
              <div className="space-y-1">
                {benchPlayers.map((player) => (
                   <div key={player._id} className="flex items-center justify-between opacity-70">
                    <button onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: 'N/A', onCourt: false })} className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-purple-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        #{player.dorsal} - {player.name}
                    </button>
                    <button onClick={() => handleShowPlayerStats(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-2"><MagnifyingGlassIcon className="h-5 w-5" /></button>
                   </div>
                ))}
              </div>
            </div>
        </div>

        {/* Acciones Rápidas ya no tiene sentido como antes, se puede integrar al seleccionar jugador */}
      </div>

      {/* ... (resto del layout y modales) */}
      <div className="flex-1 lg:max-w-2xl mx-auto"><Court onClick={handleCourtClick} /> <FloatingStats events={gameEvents} /></div>
      <div className="w-full lg:w-1/4"><GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={handleUndoEvent} isSessionFinished={isSessionFinished} sessionId={sessionId} /></div>
       {showShotModal && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20"><div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4"><h3 className="text-2xl font-bold text-center">{`Resultado del Tiro (${shotValue} Puntos)`}</h3><div className="flex justify-center gap-4"><Button onClick={() => handleShot(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button><Button onClick={() => handleShot(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button></div><button onClick={() => setShowShotModal(false)} className="mt-4 text-sm text-gray-500 w-full text-center">Cancelar</button></div></div>)}
       {showFreeThrowModal && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20"><div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4"><h3 className="text-2xl font-bold text-center">Resultado del Tiro Libre</h3><div className="flex justify-center gap-4"><Button onClick={() => handleFreeThrow(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button><Button onClick={() => handleFreeThrow(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button></div><button onClick={() => setShowFreeThrowModal(false)} className="mt-4 text-sm text-gray-500 w-full text-center">Cancelar</button></div></div>)}
       {statsPlayer && ( <PlayerStatsModal isOpen={showPlayerStatsModal} onClose={() => setShowPlayerStatsModal(false)} player={statsPlayer.player} stats={statsPlayer.stats}/>)}
    </div>

    {/* Botón Flotante de IA */}
    <button onClick={handleGetProactiveSuggestion} disabled={loadingAISuggestion || isSessionFinished} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400">
        <LightBulbIcon className="h-8 w-8" />
    </button>
    
    {/* Modal de Sugerencia de IA */}
    {showAISuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setShowAISuggestionModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><LightBulbIcon className="h-6 w-6 text-yellow-400" />Sugerencia de la IA</h3>
                {loadingAISuggestion ? (
                    <p>Pensando...</p>
                ) : aiSuggestion ? (
                    <div>
                        <p className="mb-4">La IA sugiere cambiar a <strong className="text-red-500">{aiSuggestion.playerOut.name}</strong> porque {aiSuggestion.reason}</p>
                        <p className="mb-4">El reemplazo recomendado es <strong className="text-green-500">{aiSuggestion.playerIn.name}</strong>.</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <Button variant="secondary" onClick={() => setShowAISuggestionModal(false)}>Ignorar</Button>
                            <Button 
                                onClick={() => {
                                    const playerOutObject = allPlayers.find(p => p._id === aiSuggestion.playerOut.playerId);
                                    const playerInObject = allPlayers.find(p => p._id === aiSuggestion.playerIn.playerId);
                                    if (playerOutObject && playerInObject) {
                                        handleSubstitution(playerOutObject, playerInObject);
                                    } else {
                                        toast.error("No se pudieron encontrar los datos completos de los jugadores para la sustitución.");
                                    }
                                }} 
                                className="flex items-center gap-2"
                            >
                                <ArrowsRightLeftIcon className="h-5 w-5" />
                                Aceptar Cambio
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p>La IA no tiene ninguna sugerencia por el momento.</p>
                )}
            </div>
        </div>
    )}
    </>
  );
}
