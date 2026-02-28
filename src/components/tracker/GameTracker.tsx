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
        case 'tiro_libre': return 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
        default: return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
    }
}

export default function GameTracker({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<TrackerSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]);

  // --- Estados de Jugadores en Cancha y Sustitución ---
  const [onCourtPlayerIds, setOnCourtPlayerIds] = useState<Set<string>>(new Set());
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerToSubOut, setPlayerToSubOut] = useState<IPlayer | null>(null);

  // Estados para modales y UI
  const [showShotModal, setShowShotModal] = useState(false);
  const [showFreeThrowModal, setShowFreeThrowModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [shotValue, setShotValue] = useState<2 | 3>(2);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState<{player: IPlayer, stats: any} | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);


  const isSessionFinished = useMemo(() => !!session?.finishedAt, [session]);
  const currentQuarter = useMemo(() => session?.currentQuarter || 1, [session]);
  
  const allPlayers = useMemo(() => session?.teams.flatMap(t => t.players) || [], [session]);
  const benchPlayers = useMemo(() => allPlayers.filter(p => !onCourtPlayerIds.has(p._id)), [allPlayers, onCourtPlayerIds]);

  const playerIdToName = useMemo(() => {
    if (!allPlayers.length) return {};
    const map: { [key: string]: string } = {};
    allPlayers.forEach((player) => {
      map[player._id] = player.name;
    });
    return map;
  }, [allPlayers]);

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

        // Lógica inicial para determinar quién está en la cancha.
        // Simplificado: Empezamos con los primeros 5 del primer equipo. El coach puede ajustar con la nueva herramienta de sustitución.
        const onCourtIds = new Set<string>();
        const initialPlayers = sessionData.teams.flatMap((t: TeamData) => t.players);
        initialPlayers.slice(0, 5).forEach((p: IPlayer) => onCourtIds.add(p._id));
        setOnCourtPlayerIds(onCourtIds);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Un error desconocido ha ocurrido.');
      } finally {
        setLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId]);

  const handleUpdateSession = useCallback(async (updateData: Partial<TrackerSessionData>) => {
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
    if (type === 'substitution') {
        const eventData = { session: sessionId, player: (details.playerOut as IPlayer)._id, team: "N/A", type, details, quarter: currentQuarter };
        // Logic to post event...
    } else {
        if (!selectedPlayer) return;
        if (isSessionFinished) { toast.warn('La sesión ya ha finalizado.'); return; }
        const eventData = { session: sessionId, player: selectedPlayer.id, team: selectedPlayer.teamName, type, details, quarter: currentQuarter };
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

  const handleManualSubstitution = (playerIn: IPlayer) => {
    if (!playerToSubOut || isSessionFinished) return;
    setOnCourtPlayerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerToSubOut._id);
        newSet.add(playerIn._id);
        return newSet;
    });
    logEvent('substitution', { playerIn, playerOut: playerToSubOut });
    setShowSubModal(false);
    setPlayerToSubOut(null);
  };
  
  const handleGetProactiveSuggestion = async () => {
    // ...
  };

  const openSubModal = (player: IPlayer) => {
    setPlayerToSubOut(player);
    setShowSubModal(true);
  };

  // ... (resto de handlers sin cambios)
  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!selectedPlayer) { toast.error('Selecciona un jugador antes de registrar un tiro.'); return; }
    if (isSessionFinished) { toast.warn('La sesión ya ha finalizado.'); return; }
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
      const playerEvents = gameEvents.filter(event => event.player === playerId);
  
      for (const event of playerEvents) {
          const details = event.details as any; // Cast details to any to avoid TS errors on dynamic properties
          switch (event.type) {
              case 'tiro':
                  stats.FGA++;
                  if (details.value === 3) stats['3PA']++;
                  if (details.made) {
                      stats.FGM++;
                      stats.PTS += details.value as number;
                      if (details.value === 3) stats['3PM']++;
                  }
                  break;
              case 'tiro_libre':
                  stats.FTA++;
                  if (details.made) {
                      stats.FTM++;
                      stats.PTS++;
                  }
                  break;
              case 'rebote':
                  if (details.type === 'ofensivo') stats.ORB++;
                  else stats.DRB++;
                  break;
              case 'asistencia': stats.AST++; break;
              case 'robo': stats.STL++; break;
              case 'tapon': stats.BLK++; break;
              case 'perdida': stats.TOV++; break;
              case 'falta': stats.PF++; break;
          }
      }
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
  
    const teamA = session.teams[0];
    const teamB = session.teams.length > 1 ? session.teams[1] : null;
  
    return (
      <>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Columna Izquierda */}
        <div className="w-full lg:w-1/4 space-y-4">
          {/* Panel de Control */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-3">Control del Partido</h3>
              <div className="space-y-2">
                  <div className="flex items-center justify-between text-lg">
                      <span>Cuarto Actual:</span><span className="font-bold text-blue-500">{currentQuarter}</span>
                  </div>
                  <Button onClick={handleAdvanceQuarter} disabled={isSessionFinished || currentQuarter >= 4} className="w-full flex items-center justify-center gap-2"><ArrowRightIcon className="h-5 w-5" /> Siguiente Cuarto</Button>
                  <Button onClick={handleGetProactiveSuggestion} disabled={isSessionFinished} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"><LightBulbIcon className="h-5 w-5" /> Sugerencia IA</Button>
                  <Button onClick={handleFinishSession} disabled={isSessionFinished} variant="danger" className="w-full flex items-center justify-center gap-2"><FlagIcon className="h-5 w-5" /> Finalizar Sesión</Button>
              </div>
          </div>
  
          {/* Listas de Jugadores */}
          <div className="space-y-4">
            {[teamA, teamB].filter((team): team is TeamData => !!team).map((team: TeamData) => (
              <div key={team._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">{team.name}</h3>
                <div className="space-y-1">
                  {team.players.map((player: IPlayer) => {
                    const isOnCourt = onCourtPlayerIds.has(player._id);
                    return (
                      <div key={player._id} className={`flex items-center justify-between ${!isOnCourt && 'opacity-60'}`}>
                        <button onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: team.name })} className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${isOnCourt ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          #{player.dorsal} - {player.name}
                        </button>
                        <button onClick={() => openSubModal(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-1"><ArrowsRightLeftIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleShowPlayerStats(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-1"><MagnifyingGlassIcon className="h-5 w-5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        
        {/* Acciones Rápidas */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => logEvent('asistencia', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('asistencia')}`}>AST</Button>
            <Button onClick={() => logEvent('robo', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('robo')}`}>ROBO</Button>
            <Button onClick={() => logEvent('tapon', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('tapon')}`}>TAP</Button>
            <Button onClick={() => logEvent('perdida', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('perdida')}`}>PER</Button>
            <Button onClick={() => logEvent('rebote', { type: 'ofensivo' })} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('rebote_ofensivo')}`}>REB-O</Button>
            <Button onClick={() => logEvent('rebote', { type: 'defensivo' })} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('rebote_defensivo')}`}>REB-D</Button>
            <Button onClick={() => logEvent('falta', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('falta')}`}>FALTA</Button>
            <Button onClick={() => setShowFreeThrowModal(true)} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('tiro_libre')}`}>LIBRE</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-2xl mx-auto"><Court onClick={handleCourtClick} /><FloatingStats events={gameEvents} /></div>
      <div className="w-full lg:w-1/4"><GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={handleUndoEvent} isSessionFinished={isSessionFinished} sessionId={sessionId} /></div>

      {/* Modales */}
      {showSubModal && playerToSubOut && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setShowSubModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Sustituir a {playerToSubOut.name}</h3>
                <p className="text-sm mb-4">Selecciona el jugador que entrará a la cancha.</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                    {benchPlayers.map(player => (
                        <button key={player._id} onClick={() => handleManualSubstitution(player)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                           #{player.dorsal} - {player.name}
                        </button>
                              ))}
                            </div>
                            
                            {/* Acciones Rápidas */}
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                              <h3 className="font-bold text-lg mb-2">Acciones Rápidas</h3>
                              <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => logEvent('asistencia', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('asistencia')}`}>AST</Button>
                                <Button onClick={() => logEvent('robo', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('robo')}`}>ROBO</Button>
                                <Button onClick={() => logEvent('tapon', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('tapon')}`}>TAP</Button>
                                <Button onClick={() => logEvent('perdida', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('perdida')}`}>PER</Button>
                                <Button onClick={() => logEvent('rebote', { type: 'ofensivo' })} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('rebote_ofensivo')}`}>REB-O</Button>
                                <Button onClick={() => logEvent('rebote', { type: 'defensivo' })} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('rebote_defensivo')}`}>REB-D</Button>
                                <Button onClick={() => logEvent('falta', {})} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('falta')}`}>FALTA</Button>
                                <Button onClick={() => setShowFreeThrowModal(true)} disabled={!selectedPlayer || isSessionFinished} className={`w-full ${getActionButtonClass('tiro_libre')}`}>LIBRE</Button>
                              </div>
                            </div>
                          </div>        </div>
      )}
       {/* ... otros modales */}
    </div>
    </>
  );
}
