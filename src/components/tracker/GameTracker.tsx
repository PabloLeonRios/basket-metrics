// src/components/tracker/GameTracker.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Court from './Court';
import GameLog from './GameLog';
import FloatingStats from './FloatingStats';
import SubstitutionModal from './SubstitutionModal';
import { toast } from 'react-toastify';
import { IGameEvent, IPlayer, ISession } from '@/types/definitions';
import Button from '@/components/ui/Button';
import PlayerStatsModal from './PlayerStatsModal';
import { isThreePointer } from '@/lib/court-geometry';
import { MagnifyingGlassIcon, FlagIcon, ArrowRightIcon, LightBulbIcon, ArrowsRightLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ProactiveSuggestion } from '@/lib/recommender/lineupRecommender';

interface TrackerSessionData extends ISession { currentQuarter: number; teams: TeamData[]; }
interface TeamData { _id: string; name: string; players: IPlayer[]; }
interface SelectedPlayer { id: string; name: string; teamName: string; }

const getActionButtonClass = (eventType: string) => {
    switch (eventType) {
        case 'asistencia': return '!bg-blue-600 hover:!bg-blue-700';
        case 'robo': return '!bg-teal-600 hover:!bg-teal-700';
        case 'tapon': return '!bg-purple-600 hover:!bg-purple-700';
        case 'perdida': return '!bg-yellow-600 hover:!bg-yellow-700';
        case 'rebote_ofensivo': return '!bg-cyan-600 hover:!bg-cyan-700';
        case 'rebote_defensivo': return '!bg-pink-600 hover:!bg-pink-700';
        case 'falta': return '!bg-orange-600 hover:!bg-orange-700';
        case 'tiro_libre': return '!bg-indigo-600 hover:!bg-indigo-700';
        default: return '!bg-gray-600 hover:!bg-gray-700';
    }
}

export default function GameTracker({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<TrackerSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]);
  const [coachPlayers, setCoachPlayers] = useState<IPlayer[]>([]);
  const [onCourtPlayerIds, setOnCourtPlayerIds] = useState<Set<string>>(new Set());
  
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerToSubOut, setPlayerToSubOut] = useState<IPlayer | null>(null);
  const [showShotModal, setShowShotModal] = useState(false);
  const [showFreeThrowModal, setShowFreeThrowModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [shotValue, setShotValue] = useState<2 | 3>(2);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState<{player: IPlayer, stats: any} | null>(null);
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);

  const isSessionFinished = useMemo(() => !!session?.finishedAt, [session]);
  const currentQuarter = useMemo(() => session?.currentQuarter || 1, [session]);
  const allPlayers = useMemo(() => session?.teams.flatMap(t => t.players) || [], [session]);
  const playerIdToName = useMemo(() => Object.fromEntries(allPlayers.map(p => [p._id, p.name])), [allPlayers]);
  const benchPlayers = useMemo(() => allPlayers.filter(p => !onCourtPlayerIds.has(p._id)), [allPlayers, onCourtPlayerIds]);

  const extraPlayers = useMemo(() => {
    return coachPlayers.filter(cp => !allPlayers.some(ap => ap._id === cp._id));
  }, [coachPlayers, allPlayers]);

  const playerFouls = useMemo(() => {
    const fouls: Record<string, number> = {};
    for (const event of gameEvents) {
      if (event.type === 'falta') {
        fouls[event.player] = (fouls[event.player] || 0) + 1;
      }
    }
    return fouls;
  }, [gameEvents]);

  const teamScores = useMemo(() => {
    const scores: Record<string, number> = {};
    if (session) {
      session.teams.forEach(t => { scores[t.name] = 0; });
    }

    for (const event of gameEvents) {
      if ((event.type === 'tiro' || event.type === 'tiro_libre') && event.details.made) {
        if (scores[event.team] !== undefined) {
          scores[event.team] += (event.details.value as number) || 1;
        }
      }
    }
    return scores;
  }, [gameEvents, session]);

  useEffect(() => {
    async function fetchSessionData() {
      try {
        setLoading(true);
        const [sessionRes, eventsRes] = await Promise.all([ fetch(`/api/sessions/${sessionId}`), fetch(`/api/game-events?sessionId=${sessionId}`), ]);
        if (!sessionRes.ok) throw new Error('Error al cargar la sesión');
        if (!eventsRes.ok) throw new Error('Error al cargar los eventos');
        const { data: sessionData } = await sessionRes.json();
        const { data: eventsData } = await eventsRes.json();
        setSession(sessionData);
        setGameEvents(eventsData);

        if (sessionData.coach) {
          const playersRes = await fetch(`/api/players?coachId=${sessionData.coach}&limit=1000`);
          if (playersRes.ok) {
            const { data: playersData } = await playersRes.json();
            setCoachPlayers(playersData || []);
          }
        }

        const onCourtIds = new Set<string>();
        const allPlayersCurrent = sessionData.teams.flatMap((t: TeamData) => t.players);
        if (sessionData.sessionType === 'Partido' || sessionData.sessionType === 'Partido de Temporada') {
            const onCourtStarters = new Set<string>();
            sessionData.teams.forEach((team: TeamData) => { team.players.slice(0, 5).forEach((p: IPlayer) => onCourtStarters.add(p._id)); });
            const subs = eventsData.filter((e: IGameEvent) => e.type === 'substitution').sort((a: IGameEvent, b: IGameEvent) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
            subs.forEach((event: IGameEvent) => {
                const details = event.details as { playerIn: string, playerOut: string };
                onCourtStarters.delete(details.playerOut);
                onCourtStarters.add(details.playerIn);
            });
            onCourtStarters.forEach(id => onCourtIds.add(id));
        } else {
            allPlayersCurrent.forEach((p: IPlayer) => onCourtIds.add(p._id));
        }
        setOnCourtPlayerIds(onCourtIds);
      } catch (err) { setError(err instanceof Error ? err.message : 'Un error desconocido ha ocurrido.'); } finally { setLoading(false); }
    }
    fetchSessionData();
  }, [sessionId]);

  const handleUpdateSession = useCallback(async (updateData: Partial<TrackerSessionData>) => {
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
        if (!response.ok) throw new Error('No se pudo actualizar la sesión.');
        const { data: updatedSession } = await response.json(); setSession(updatedSession); return updatedSession;
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al actualizar sesión.'); }
  }, [sessionId]);

  const logEvent = useCallback(async (type: string, details: Record<string, unknown>) => {
    let playerForEvent = selectedPlayer;
    if (type === 'substitution') {
        const { playerOut } = details as { playerOut: IPlayer };
        const teamData = session?.teams.find(t => t.players.some(p => p._id === playerOut._id));
        playerForEvent = { id: playerOut._id, name: playerOut.name, teamName: teamData?.name || 'N/A' };
    }
    if (!playerForEvent) { toast.error('No hay jugador seleccionado.'); return; }
    if (isSessionFinished) { toast.warn('La sesión ya ha finalizado.'); return; }
    const eventData = { session: sessionId, player: playerForEvent.id, team: playerForEvent.teamName, type, details, quarter: currentQuarter };
    try {
      const response = await fetch('/api/game-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      if (!response.ok) throw new Error(`No se pudo registrar el evento: ${type}`);
      const { data: newEvent } = await response.json();
      setGameEvents(prev => [newEvent, ...prev]);
      if(type !== 'substitution') toast.success(`'${type}' para ${playerForEvent.name}.`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al registrar evento.'); }
  }, [selectedPlayer, sessionId, isSessionFinished, currentQuarter, session]);

  const handleSubstitution = (playerOut: IPlayer, playerIn: IPlayer) => {
    if (isSessionFinished) return;

    // Check if playerIn is from extraPlayers and not in the current team
    const teamIndex = session?.teams.findIndex(t => t.players.some(p => p._id === playerOut._id));
    if (session && teamIndex !== undefined && teamIndex !== -1) {
        const team = session.teams[teamIndex];
        if (!team.players.some(p => p._id === playerIn._id)) {
            const updatedTeams = [...session.teams];
            updatedTeams[teamIndex] = { ...team, players: [...team.players, playerIn] };

            // This will update both local state and backend
            handleUpdateSession({ teams: updatedTeams });
        }
    }

    setOnCourtPlayerIds(prev => { const newSet = new Set(prev); newSet.delete(playerOut._id); newSet.add(playerIn._id); return newSet; });
    logEvent('substitution', { playerIn: { _id: playerIn._id, name: playerIn.name }, playerOut: { _id: playerOut._id, name: playerOut.name } });
    toast.success(`${playerIn.name} entra por ${playerOut.name}.`);
    if(showSubModal) { setShowSubModal(false); setPlayerToSubOut(null); }
    if(showAISuggestionModal) setShowAISuggestionModal(false);
  };
  
  const handleAdvanceQuarter = () => { if (!isSessionFinished && currentQuarter < 10 && confirm(`¿Avanzar al cuarto ${currentQuarter + 1}?`)) { handleUpdateSession({ currentQuarter: currentQuarter + 1 }); } };
  const handleFinishSession = async () => { if (!isSessionFinished && confirm('¿Finalizar esta sesión?')) { const updated = await handleUpdateSession({ finishedAt: new Date().toISOString() }); if (updated) { toast.success('Sesión finalizada.'); router.push(`/panel/dashboard/${sessionId}`); } } };
  
  const handleGetProactiveSuggestion = async () => {
    setLoadingAISuggestion(true); setShowAISuggestionModal(true); setAiSuggestion(null);
    try {
        const response = await fetch('/api/assistant/proactive-suggestion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allPlayerIds: allPlayers.map(p => p._id), onCourtPlayerIds: Array.from(onCourtPlayerIds), sessionId: sessionId, currentQuarter: currentQuarter }), });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al obtener sugerencia.');
        setAiSuggestion(data.data);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo obtener la sugerencia.'); setShowAISuggestionModal(false); } finally { setLoadingAISuggestion(false); }
  };
  
  const handleCourtClick = useCallback((x: number, y: number) => { if (!selectedPlayer) { toast.error('Selecciona un jugador en cancha.'); return; } if (!onCourtPlayerIds.has(selectedPlayer.id)) { toast.error('El jugador seleccionado no está en la cancha.'); return; } if (isSessionFinished) { toast.warn('Sesión finalizada.'); return; } setShotValue(isThreePointer(x, y) ? 3 : 2); setShotCoordinates({ x, y }); setShowShotModal(true); }, [selectedPlayer, isSessionFinished, onCourtPlayerIds]);
  const handleShot = (made: boolean) => { if (!shotCoordinates) return; logEvent('tiro', { made, value: shotValue, x: shotCoordinates.x, y: shotCoordinates.y }); setShowShotModal(false); setShotCoordinates(null); };
  const handleFreeThrow = (made: boolean) => { logEvent('tiro_libre', { made }); setShowFreeThrowModal(false); };

  const calculateStatsForPlayer = useCallback((playerId: string) => {
    const stats = { FGM: 0, FGA: 0, '3PM': 0, '3PA': 0, FTM: 0, FTA: 0, ORB: 0, DRB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0, PTS: 0 };
    for (const event of gameEvents) {
        if (event.player !== playerId) continue;
        const details = event.details as any;
        switch (event.type) {
            case 'tiro': stats.FGA++; if (details.value === 3) stats['3PA']++; if (details.made) { stats.FGM++; stats.PTS += details.value; if (details.value === 3) stats['3PM']++; } break;
            case 'tiro_libre': stats.FTA++; if (details.made) { stats.FTM++; stats.PTS++; } break;
            case 'rebote': if (details.type === 'ofensivo') stats.ORB++; else stats.DRB++; break;
            case 'asistencia': stats.AST++; break;
            case 'robo': stats.STL++; break;
            case 'tapon': stats.BLK++; break;
            case 'perdida': stats.TOV++; break;
            case 'falta': stats.PF++; break;
        }
    }
    return stats;
  }, [gameEvents]);

  const handleShowPlayerStats = (player: IPlayer) => { const stats = calculateStatsForPlayer(player._id); setStatsPlayer({ player, stats }); setShowPlayerStatsModal(true); };

  if (loading) return <div className="p-8 text-center">Cargando tracker...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!session) return <div className="p-8 text-center">No se encontraron datos de la sesión.</div>;
  
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="w-full lg:w-1/4 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-3">Control del Partido</h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-lg"><span>Cuarto:</span><span className="font-bold text-blue-500">{currentQuarter}</span></div>
                <Button onClick={handleAdvanceQuarter} disabled={isSessionFinished || currentQuarter >= 10} className="w-full justify-center flex items-center"><ArrowRightIcon className="h-5 w-5 mr-2"/>Siguiente Cuarto</Button>
                <Button onClick={handleGetProactiveSuggestion} disabled={isSessionFinished || loadingAISuggestion} className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700 flex items-center"><LightBulbIcon className="h-5 w-5 mr-2" />Sugerencia IA</Button>
                <Button onClick={handleFinishSession} disabled={isSessionFinished} variant="danger" className="w-full justify-center flex items-center"><FlagIcon className="h-5 w-5 mr-2"/>Finalizar Sesión</Button>
            </div>
          </div>
          {session.teams.map(team => (
            <div key={team._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{team.name}</h3>
              <div className="space-y-1">
                {team.players.map((player) => {
                  const isOnCourt = onCourtPlayerIds.has(player._id);
                  const isPartido = session.sessionType === 'Partido' || session.sessionType === 'Partido de Temporada';
                  const foulCount = gameEvents.filter(e => e.player === player._id && e.type === 'falta').length;
                  const isFoulDanger = foulCount >= 4;
                  return (
                    <div key={player._id} className={`flex items-center justify-between ${!isOnCourt && isPartido ? 'opacity-50' : ''}`}>
                      <button onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: team.name })} className={`flex-grow flex items-center text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {isPartido && <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${isOnCourt ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>}
                        <span className={`flex-grow ${isFoulDanger && selectedPlayer?.id !== player._id ? 'text-orange-600 font-semibold' : ''}`}>
                          #{player.dorsal} - {player.name}
                        </span>
                        {isFoulDanger && (
                            <ExclamationTriangleIcon
                                className={`h-5 w-5 ml-2 ${selectedPlayer?.id === player._id ? 'text-white' : 'text-orange-500'}`}
                                title={`${foulCount} faltas`}
                            />
                        )}
                      </button>
                      <div className="flex ml-1">
                        {isPartido && <button onClick={() => { setPlayerToSubOut(player); setShowSubModal(true); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full" title="Sustituir"><ArrowsRightLeftIcon className="h-5 w-5" /></button>}
                        <button onClick={() => handleShowPlayerStats(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full" title="Ver Estadísticas"><MagnifyingGlassIcon className="h-5 w-5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 lg:max-w-2xl mx-auto flex flex-col gap-4">
            {/* Scoreboard */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center text-center">
                {(session.sessionType === 'Partido' || session.sessionType === 'Partido de Temporada') ? (
                    <>
                        <div className="w-1/3">
                            <div className="text-xl font-bold truncate">{session.teams[0]?.name || 'Equipo A'}</div>
                            <div className="text-4xl font-black text-orange-600 dark:text-orange-400">{teamScores[session.teams[0]?.name] || 0}</div>
                        </div>
                        <div className="w-1/3 text-gray-500">
                            <div className="text-sm font-semibold uppercase tracking-widest">Cuarto</div>
                            <div className="text-2xl font-bold">{currentQuarter}</div>
                        </div>
                        <div className="w-1/3">
                            <div className="text-xl font-bold truncate">{session.teams[1]?.name || 'Equipo B'}</div>
                            <div className="text-4xl font-black text-orange-600 dark:text-orange-400">{teamScores[session.teams[1]?.name] || 0}</div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-1/2">
                            <div className="text-xl font-bold truncate">Puntos Totales</div>
                            <div className="text-4xl font-black text-orange-600 dark:text-orange-400">
                                {Object.values(teamScores).reduce((a, b) => a + b, 0)}
                            </div>
                        </div>
                        <div className="w-1/2 text-gray-500 border-l border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-semibold uppercase tracking-widest">Cuarto</div>
                            <div className="text-2xl font-bold">{currentQuarter}</div>
                        </div>
                    </>
                )}
            </div>

            <Court onClick={handleCourtClick} shotCoordinates={shotCoordinates} />
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-lg truncate">Acciones Rápidas</h3>
                <span className="text-blue-500 text-sm font-medium truncate ml-2">{selectedPlayer?.name || '...'}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm">
                <Button onClick={() => logEvent('asistencia', {})} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('asistencia')}>AST</Button>
                <Button onClick={() => logEvent('robo', {})} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('robo')}>ROBO</Button>
                <Button onClick={() => logEvent('tapon', {})} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('tapon')}>TAP</Button>
                <Button onClick={() => logEvent('perdida', {})} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('perdida')}>PER</Button>
                <Button onClick={() => logEvent('rebote', { type: 'ofensivo' })} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('rebote_ofensivo')}>REB-O</Button>
                <Button onClick={() => logEvent('rebote', { type: 'defensivo' })} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('rebote_defensivo')}>REB-D</Button>
                <Button onClick={() => logEvent('falta', {})} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('falta')}>FALTA</Button>
                <Button onClick={() => setShowFreeThrowModal(true)} disabled={!selectedPlayer || !onCourtPlayerIds.has(selectedPlayer.id) || isSessionFinished} className={getActionButtonClass('tiro_libre')}>LIBRE</Button>
              </div>
            </div>
            <FloatingStats events={gameEvents} />
        </div>
        <div className="w-full lg:w-1/4">
          <GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={() => {}} isSessionFinished={isSessionFinished} sessionId={sessionId} />
        </div>
      </div>
      <SubstitutionModal isOpen={showSubModal} onClose={() => setShowSubModal(false)} playerToSubOut={playerToSubOut} teamPlayers={session?.teams.find(t => t.players.some(p => p._id === playerToSubOut?._id))?.players || []} extraPlayers={extraPlayers} onCourtPlayerIds={onCourtPlayerIds} onSubstitute={(playerIn) => handleSubstitution(playerToSubOut!, playerIn)} />
      {showAISuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setShowAISuggestionModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><LightBulbIcon className="h-6 w-6 text-yellow-400" />Sugerencia de la IA</h3>
                {loadingAISuggestion ? ( <p>Pensando...</p> ) : aiSuggestion ? (
                    <div>
                        {aiSuggestion.type === 'SUSTITUCION' && aiSuggestion.playerOut && aiSuggestion.playerIn ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <p className={`mb-4 ${aiSuggestion.type === 'POSITIVA' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {aiSuggestion.reason}
                                </p>
                                <div className="flex justify-end mt-6">
                                    <Button onClick={() => setShowAISuggestionModal(false)}>Entendido</Button>
                                </div>
                            </>
                        )}
                    </div>
                ) : ( <p>La IA no tiene ninguna sugerencia por el momento.</p> )}
            </div>
        </div>
      )}
      {showShotModal && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20"><div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4"><h3 className="text-2xl font-bold text-center">{`Tiro de ${shotValue} Puntos`}</h3><div className="flex justify-center gap-4"><Button onClick={() => handleShot(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button><Button onClick={() => handleShot(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button></div><button onClick={() => setShowShotModal(false)} className="mt-4 text-sm text-gray-500">Cancelar</button></div></div> )}
      {showFreeThrowModal && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20"><div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4"><h3 className="text-2xl font-bold text-center">Tiro Libre</h3><div className="flex justify-center gap-4"><Button onClick={() => handleFreeThrow(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button><Button onClick={() => handleFreeThrow(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button></div><button onClick={() => setShowFreeThrowModal(false)} className="mt-4 text-sm text-gray-500">Cancelar</button></div></div> )}
      {showPlayerStatsModal && statsPlayer && ( <PlayerStatsModal isOpen={showPlayerStatsModal} onClose={() => setShowPlayerStatsModal(false)} player={statsPlayer.player} stats={statsPlayer.stats}/>)}
    </>
  );
}
