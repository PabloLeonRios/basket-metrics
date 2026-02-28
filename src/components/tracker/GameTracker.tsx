'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Court from './Court';
import GameLog from './GameLog';
import FloatingStats from './FloatingStats';
import { toast } from 'react-toastify';
import { IGameEvent, IPlayer, ISession } from '@/types/definitions';
import Button from '@/components/ui/Button';
import PlayerStatsModal from './PlayerStatsModal';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// --- Tipos de Datos ---
interface TeamData {
  _id: string;
  name: string;
  players: IPlayer[];
}
interface TrackerSessionData extends ISession {
  teams: TeamData[];
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
  // --- Estados del Componente ---
  const [session, setSession] = useState<TrackerSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]);

  // Estados para modales
  const [showShotModal, setShowShotModal] = useState(false);
  const [showFreeThrowModal, setShowFreeThrowModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [shotValue, setShotValue] = useState<2 | 3>(2); // State for the shot value
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState<{player: IPlayer, stats: any} | null>(null);

  const playerIdToName = useMemo(() => {
    if (!session) return {};
    const map: { [key: string]: string } = {};
    session.teams.forEach((team) => {
      if (team && team.players) {
        team.players.forEach((player) => {
          if (player) {
            map[player._id] = player.name;
          }
        });
      }
    });
    return map;
  }, [session]);

  const isSessionFinished = !!session?.finishedAt;

  useEffect(() => {
    async function fetchSessionData() {
      try {
        setLoading(true);
        const [sessionRes, eventsRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}`),
          fetch(`/api/game-events?sessionId=${sessionId}`),
        ]);

        if (!sessionRes.ok) {
          const errorData = await sessionRes.json();
          throw new Error(
            `Error al cargar la sesión: ${errorData.message || 'Error del servidor'}`,
          );
        }
        if (!eventsRes.ok) {
          const errorData = await eventsRes.json();
          throw new Error(
            `Error al cargar los eventos: ${errorData.message || 'Error del servidor'}`,
          );
        }

        const { data: sessionData } = await sessionRes.json();
        const { data: eventsData } = await eventsRes.json();

        setSession(sessionData);
        setGameEvents(eventsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Un error desconocido ha ocurrido.',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSessionData();
  }, [sessionId]);

  const logEvent = useCallback(async (type: string, details: Record<string, unknown>) => {
    if (!selectedPlayer) return;
    if (isSessionFinished) {
        toast.warn('La sesión ya ha finalizado.');
        return;
    }

    const eventData = {
      session: sessionId,
      player: selectedPlayer.id,
      team: selectedPlayer.teamName,
      type: type,
      details: details,
    };

    try {
      const response = await fetch('/api/game-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error('No se pudo registrar el evento.');
      const { data: newEvent } = await response.json();
      setGameEvents((prev) => [newEvent, ...prev]);
      toast.success(`Evento '${type}' registrado para ${selectedPlayer.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar evento.');
    }
  }, [selectedPlayer, sessionId, isSessionFinished]);

  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!selectedPlayer) {
      toast.error('Selecciona un jugador antes de registrar un tiro.');
      return;
    }
    if (session?.finishedAt) {
      toast.warn('La sesión ya ha finalizado. No se pueden registrar tiros.');
      return;
    }

    // Lógica para determinar 2 o 3 puntos basado en la imagen 'prueba2.png'
    // Asumimos coordenadas basadas en un viewBox de "0 0 100 94"
    // Verde = 3 puntos, Rojo = 2 Puntos.
    // Esta es una APROXIMACIÓN y puede necesitar ajustes finos.
    
    const basketX = 50;
    const basketY = 13.5; // Posición Y del centro del aro

    // Coordenadas de la línea de 3 puntos (aproximadas)
    const threePointRadius = 36; // Radio del arco de 3 puntos
    const threePointSideLineX_left = 12; // Línea recta izquierda de 3pts
    const threePointSideLineX_right = 88; // Línea recta derecha de 3pts
    const threePointSideLineY_end = 31; // Donde el arco se encuentra con las líneas rectas

    const distance = Math.sqrt(Math.pow(x - basketX, 2) + Math.pow(y - basketY, 2));

    let isThreePointer = false;

    if (y < threePointSideLineY_end) {
        // Estamos en la zona de las líneas rectas de 3 puntos
        if (x < threePointSideLineX_left || x > threePointSideLineX_right) {
            isThreePointer = true;
        }
    } else {
        // Estamos en la zona del arco de 3 puntos
        if (distance > threePointRadius) {
            isThreePointer = true;
        }
    }
    
    // Cualquier tiro desde detrás del tablero no es de 3.
    if (y < basketY) {
        isThreePointer = false;
    }

    setShotValue(isThreePointer ? 3 : 2);
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  }, [selectedPlayer, session]);

  const handleShot = (made: boolean) => {
    if (!shotCoordinates) return;
    logEvent('tiro', { made, value: shotValue, x: shotCoordinates.x, y: shotCoordinates.y });
    setShowShotModal(false);
    setShotCoordinates(null);
  };
  
  const handleFreeThrow = (made: boolean) => {
    // A free throw always has a value of 1 and occurs at a fixed spot.
    logEvent('tiro_libre', { made, value: 1, x: 50, y: 32 });
    setShowFreeThrowModal(false);
  };

  const handleUndoEvent = useCallback(async (eventId: string) => {
    if (!confirm(`¿Estás seguro de que quieres deshacer este evento?`)) return;

    try {
        const response = await fetch(`/api/game-events/${eventId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('No se pudo deshacer el evento.');
        setGameEvents(prev => prev.filter(event => event._id !== eventId));
        toast.info('Evento deshecho.');
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al deshacer.');
    }
  }, []);

  const calculateStatsForPlayer = useCallback((playerId: string) => {
    const stats = { FGM: 0, FGA: 0, '3PM': 0, '3PA': 0, FTM: 0, FTA: 0, ORB: 0, DRB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0, PTS: 0 };
    const playerEvents = gameEvents.filter(event => event.player === playerId);

    for (const event of playerEvents) {
        switch (event.type) {
            case 'tiro':
                stats.FGA++;
                if (event.details.value === 3) stats['3PA']++;
                if (event.details.made) {
                    stats.FGM++;
                    stats.PTS += event.details.value as number;
                    if (event.details.value === 3) stats['3PM']++;
                }
                break;
            case 'tiro_libre':
                stats.FTA++;
                if (event.details.made) {
                    stats.FTM++;
                    stats.PTS++;
                }
                break;
            case 'rebote':
                if (event.details.type === 'ofensivo') stats.ORB++;
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
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Columna Izquierda: Jugadores y Acciones */}
      <div className="w-full lg:w-1/4 space-y-4">
        {/* Lista de Jugadores */}
        <div className="space-y-4">
          {teamA && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{teamA.name}</h3>
              <div className="space-y-1">
                {teamA.players.map((player) => (
                  <div key={player._id} className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: teamA.name })}
                      className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      #{player.dorsal} - {player.name}
                    </button>
                    <button onClick={() => handleShowPlayerStats(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-2">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {teamB && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{teamB.name}</h3>
              <div className="space-y-1">
                {teamB.players.map((player) => (
                   <div key={player._id} className="flex items-center justify-between">
                    <button
                        onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: teamB.name })}
                        className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        #{player.dorsal} - {player.name}
                    </button>
                    <button onClick={() => handleShowPlayerStats(player)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-2">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
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

      {/* Columna Central: Cancha y Stats */}
      <div className="flex-1 lg:max-w-2xl mx-auto">
        <Court onClick={handleCourtClick} />
        <FloatingStats events={gameEvents} />
      </div>

      {/* Columna Derecha: Log de Juego */}
      <div className="w-full lg:w-1/4">
        <GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={handleUndoEvent} isSessionFinished={isSessionFinished} sessionId={sessionId} />
      </div>

      {/* Modales */}
      {showShotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4">
            <h3 className="text-2xl font-bold text-center">{`Resultado del Tiro (${shotValue} Puntos)`}</h3>
            <div className="flex justify-center gap-4">
              <Button onClick={() => handleShot(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button>
              <Button onClick={() => handleShot(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button>
            </div>
            <button onClick={() => setShowShotModal(false)} className="mt-4 text-sm text-gray-500 w-full text-center">Cancelar</button>
          </div>
        </div>
      )}
      {showFreeThrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4">
            <h3 className="text-2xl font-bold text-center">Resultado del Tiro Libre</h3>
            <div className="flex justify-center gap-4">
                <Button onClick={() => handleFreeThrow(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button>
                <Button onClick={() => handleFreeThrow(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button>
            </div>
            <button onClick={() => setShowFreeThrowModal(false)} className="mt-4 text-sm text-gray-500 w-full text-center">Cancelar</button>
          </div>
        </div>
      )}
      {statsPlayer && (
        <PlayerStatsModal
            isOpen={showPlayerStatsModal}
            onClose={() => setShowPlayerStatsModal(false)}
            player={statsPlayer.player}
            stats={statsPlayer.stats}
        />
      )}
    </div>
  );
}
