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

// --- Types ---
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
}

const getActionButtonClass = (eventType: string) => {
    switch (eventType) {
        case 'asistencia': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        case 'robo': return 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500';
        case 'tapon': return 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500';
        case 'perdida': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
        case 'rebote_ofensivo': return 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500';
        case 'rebote_defensivo': return 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500';
        case 'falta': return 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';
        default: return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
    }
}

// --- Component ---
export default function GameTracker({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  // --- State ---
  const [session, setSession] = useState<TrackerSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]);
  const [onCourtPlayerIds, setOnCourtPlayerIds] = useState<Set<string>>(new Set());
  
  // Modals State
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerToSubOut, setPlayerToSubOut] = useState<IPlayer | null>(null);
  const [showShotModal, setShowShotModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [shotValue, setShotValue] = useState<2 | 3>(2);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState<{player: IPlayer, stats: any} | null>(null);
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);

  // --- Derived State ---
  const isSessionFinished = useMemo(() => !!session?.finishedAt, [session]);
  const currentQuarter = useMemo(() => session?.currentQuarter || 1, [session]);
  const allPlayers = useMemo(() => session?.teams.flatMap(t => t.players) || [], [session]);
  const playerIdToName = useMemo(() => Object.fromEntries(allPlayers.map(p => [p._id, p.name])), [allPlayers]);

  // --- Data Fetching ---
  useEffect(() => {
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
        
        const onCourtIds = new Set<string>();
        sessionData.teams.forEach((team: TeamData) => {
            team.players.slice(0, 5).forEach((p: IPlayer) => onCourtIds.add(p._id));
        });
        
        const subs = eventsData.filter((e: IGameEvent) => e.type === 'substitution');
        for (const event of subs) {
            const details = event.details as { playerIn: string, playerOut: string };
            onCourtIds.delete(details.playerOut);
            onCourtIds.add(details.playerIn);
        }
        setOnCourtPlayerIds(onCourtIds);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Un error desconocido ha ocurrido.');
      } finally {
        setLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId]);

  // --- Event Handlers ---
  const handleUpdateSession = useCallback(async (updateData: Partial<TrackerSessionData>) => {
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        if (!response.ok) throw new Error('No se pudo actualizar la sesión.');
        const { data: updatedSession } = await response.json();
        setSession(updatedSession);
        return updatedSession;
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al actualizar sesión.'); }
  }, [sessionId]);

  const logEvent = useCallback(async (type: string, details: Record<string, unknown>) => {
    let playerForEvent = selectedPlayer;
    if (type === 'substitution') {
        const { playerOut } = details as { playerOut: IPlayer };
        const team = allPlayers.find(p => p._id === playerOut._id)?.team;
        playerForEvent = { id: playerOut._id, name: playerOut.name, teamName: team || 'N/A' };
    }

    if (!playerForEvent) { toast.error('No hay jugador seleccionado.'); return; }
    if (isSessionFinished) { toast.warn('La sesión ya ha finalizado.'); return; }

    const eventData = { session: sessionId, player: playerForEvent.id, team: playerForEvent.teamName, type, details, quarter: currentQuarter };
    
    try {
      const response = await fetch('/api/game-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      if (!response.ok) throw new Error(`No se pudo registrar el evento: ${type}`);
      const { data: newEvent } = await response.json();
      setGameEvents(prev => [newEvent, ...prev]);
      if(type !== 'substitution') toast.success(`Evento '${type}' registrado.`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al registrar evento.'); }
  }, [selectedPlayer, sessionId, isSessionFinished, currentQuarter, allPlayers]);

  const handleSubstitution = (playerOut: IPlayer, playerIn: IPlayer) => {
    if (isSessionFinished) return;
    setOnCourtPlayerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerOut._id);
        newSet.add(playerIn._id);
        return newSet;
    });
    logEvent('substitution', { playerIn: { _id: playerIn._id, name: playerIn.name }, playerOut: { _id: playerOut._id, name: playerOut.name } });
    toast.success(`${playerIn.name} entra por ${playerOut.name}.`);
    if(showSubModal) setShowSubModal(false);
    if(showAISuggestionModal) setShowAISuggestionModal(false);
    setPlayerToSubOut(null);
  };
  
  const handleAdvanceQuarter = () => {
      if (isSessionFinished || currentQuarter >= 4) return;
      if (confirm(`¿Avanzar al cuarto ${currentQuarter + 1}?`)) { handleUpdateSession({ currentQuarter: currentQuarter + 1 }); }
  };
  
  const handleFinishSession = async () => {
    if (isSessionFinished) return;
    if (confirm('¿Finalizar esta sesión?')) {
        const updated = await handleUpdateSession({ finishedAt: new Date().toISOString() });
        if (updated) { toast.success('Sesión finalizada.'); router.push(`/panel/dashboard/${sessionId}`); }
    }
  };

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
                onCourtPlayerIds: Array.from(onCourtPlayerIds),
                sessionId: sessionId,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener sugerencia.');
        setAiSuggestion(data.data);
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo obtener la sugerencia.');
        setShowAISuggestionModal(false);
    } finally {
        setLoadingAISuggestion(false);
    }
  };

  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!selectedPlayer) { toast.error('Selecciona un jugador en cancha.'); return; }
    if (!onCourtPlayerIds.has(selectedPlayer.id)) { toast.error('El jugador seleccionado no está en la cancha.'); return; }
    if (isSessionFinished) { toast.warn('Sesión finalizada.'); return; }
    setShotValue(isThreePointer(x, y) ? 3 : 2);
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  }, [selectedPlayer, isSessionFinished, onCourtPlayerIds]);

  const handleShot = (made: boolean) => {
    if (!shotCoordinates) return;
    logEvent('tiro', { made, value: shotValue, x: shotCoordinates.x, y: shotCoordinates.y });
    setShowShotModal(false); setShotCoordinates(null);
  };
  
  const handleShowPlayerStats = (player: IPlayer) => { /* ... */ };

  // --- Render ---
  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="w-full lg:w-1/4 space-y-4">
          {/* Game & AI Control Panel */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-3">Control del Partido</h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-lg">
                    <span>Cuarto:</span><span className="font-bold text-blue-500">{currentQuarter}</span>
                </div>
                <Button onClick={handleAdvanceQuarter} disabled={isSessionFinished || currentQuarter >= 4} className="w-full"><ArrowRightIcon className="h-5 w-5 mr-2"/>Siguiente Cuarto</Button>
                <Button onClick={handleGetProactiveSuggestion} disabled={isSessionFinished || loadingAISuggestion} className="w-full bg-blue-600 hover:bg-blue-700"><LightBulbIcon className="h-5 w-5 mr-2" /> Sugerencia IA</Button>
                <Button onClick={handleFinishSession} disabled={isSessionFinished} variant="danger" className="w-full"><FlagIcon className="h-5 w-5 mr-2"/>Finalizar Sesión</Button>
            </div>
          </div>
          {/* Player Lists */}
          {session.teams.map(team => (
            <div key={team._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{team.name}</h3>
              <div className="space-y-1">
                {team.players.map((player) => (
                    <div key={player._id} className={`flex items-center justify-between`}>
                      <button onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: team.name })} className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${onCourtPlayerIds.has(player._id) ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                        #{player.dorsal} - {player.name}
                      </button>
                      <button onClick={() => { setPlayerToSubOut(player); setShowSubModal(true); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-1"><ArrowsRightLeftIcon className="h-5 w-5" /></button>
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Center Column */}
        <div className="flex-1 lg:max-w-2xl mx-auto flex flex-col gap-4">
            <Court onClick={handleCourtClick} shotCoordinates={shotCoordinates} />
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">Acciones para: <span className="text-blue-500">{selectedPlayer?.name || '...'}</span></h3>
              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => logEvent('asistencia', {})} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('asistencia')}>AST</Button>
                <Button onClick={() => logEvent('robo', {})} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('robo')}>ROBO</Button>
                <Button onClick={() => logEvent('tapon', {})} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('tapon')}>TAP</Button>
                <Button onClick={() => logEvent('perdida', {})} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('perdida')}>PER</Button>
                <Button onClick={() => logEvent('rebote', { type: 'ofensivo' })} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('rebote_ofensivo')}>REB-O</Button>
                <Button onClick={() => logEvent('rebote', { type: 'defensivo' })} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('rebote_defensivo')}>REB-D</Button>
                <Button onClick={() => logEvent('falta', {})} disabled={!selectedPlayer || isSessionFinished} className={getActionButtonClass('falta')}>FALTA</Button>
                <Button onClick={() => {}} disabled={!selectedPlayer || isSessionFinished} className="bg-indigo-600 hover:bg-indigo-700">LIBRE</Button>
              </div>
            </div>
            <FloatingStats events={gameEvents} />
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/4">
          <GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={() => {}} isSessionFinished={isSessionFinished} sessionId={sessionId} />
        </div>
      </div>
      
      {/* Modals */}
      {showSubModal && playerToSubOut && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setShowSubModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Sustituir a {playerToSubOut.name}</h3>
                <p className="text-sm mb-4">Selecciona el jugador que entrará del banquillo.</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                    {allPlayers.filter(p => !onCourtPlayerIds.has(p._id) && p.team === playerToSubOut.team).map(player => (
                        <button key={player._id} onClick={() => handleSubstitution(playerToSubOut, player)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                           #{player.dorsal} - {player.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
      {showAISuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setShowAISuggestionModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><LightBulbIcon className="h-6 w-6 text-yellow-400" />Sugerencia de la IA</h3>
                {loadingAISuggestion ? ( <p>Pensando...</p> ) : aiSuggestion ? (
                    <div>
                        <p className="mb-4">La IA sugiere cambiar a <strong className="text-red-500">{aiSuggestion.playerOut.name}</strong> porque {aiSuggestion.reason}</p>
                        <p className="mb-4">El reemplazo recomendado es <strong className="text-green-500">{aiSuggestion.playerIn.name}</strong>.</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <Button variant="secondary" onClick={() => setShowAISuggestionModal(false)}>Ignorar</Button>
                            <Button onClick={() => {
                                const playerOutObj = allPlayers.find(p => p._id === (aiSuggestion.playerOut as any).playerId);
                                const playerInObj = allPlayers.find(p => p._id === (aiSuggestion.playerIn as any).playerId);
                                if (playerOutObj && playerInObj) handleSubstitution(playerOutObj, playerInObj);
                            }}><ArrowsRightLeftIcon className="h-5 w-5 mr-2" />Aceptar Cambio</Button>
                        </div>
                    </div>
                ) : ( <p>La IA no tiene ninguna sugerencia por el momento.</p> )}
            </div>
        </div>
      )}
      {/* ... other modals */}
    </>
  );
}
