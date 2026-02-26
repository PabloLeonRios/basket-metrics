'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Court from './Court';
import GameLog from './GameLog';
import FloatingStats from './FloatingStats';
import { toast } from 'react-toastify';
import { IGameEvent, IPlayer, ISession } from '@/types/definitions';
import Button from '@/components/ui/Button';

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

    // --- REVISED 3-POINT LOGIC ---
    const basketCenter = { x: 50, y: 15.5 };
    const threePointRadius = 36.5; 
    const threePointLineYLimit = 30;
    const threePointLineX1 = 8;
    const threePointLineX2 = 92;

    const distance = Math.sqrt(Math.pow(x - basketCenter.x, 2) + Math.pow(y - basketCenter.y, 2));
    
    let isThree = false;
    if (distance > threePointRadius) {
        isThree = true;
    }
    if (distance <= threePointRadius && y < threePointLineYLimit && (x < threePointLineX1 || x > threePointLineX2)) {
        isThree = false;
    }

    setShotValue(isThree ? 3 : 2);
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
    logEvent('tiro_libre', { made });
    setShowFreeThrowModal(false);
  };

  const handleUndoLastEvent = useCallback(async () => {
    if (gameEvents.length === 0) return;
    const lastEvent = gameEvents[0];
    if (!confirm(`¿Estás seguro de que quieres deshacer el último evento: ${lastEvent.type.toUpperCase()}?`)) return;

    try {
        const response = await fetch(`/api/game-events/${lastEvent._id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('No se pudo deshacer el evento.');
        setGameEvents(prev => prev.slice(1));
        toast.info('Último evento deshecho.');
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al deshacer.');
    }
  }, [gameEvents]);

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
                  <button
                    key={player._id}
                    onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: teamA.name })}
                    className={`w-full text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    #{player.dorsal} - {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {teamB && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{teamB.name}</h3>
              <div className="space-y-1">
                {teamB.players.map((player) => (
                  <button
                    key={player._id}
                    onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: teamB.name })}
                    className={`w-full text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    #{player.dorsal} - {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => logEvent('asistencia', {})} disabled={!selectedPlayer || isSessionFinished}>AST</Button>
            <Button onClick={() => logEvent('robo', {})} disabled={!selectedPlayer || isSessionFinished}>ROBO</Button>
            <Button onClick={() => logEvent('tapon', {})} disabled={!selectedPlayer || isSessionFinished}>TAP</Button>
            <Button onClick={() => logEvent('perdida', {})} disabled={!selectedPlayer || isSessionFinished}>PER</Button>
            <Button onClick={() => logEvent('falta', {})} disabled={!selectedPlayer || isSessionFinished}>FALTA</Button>
            <Button onClick={() => setShowFreeThrowModal(true)} disabled={!selectedPlayer || isSessionFinished} className="col-span-2">Tiro Libre</Button>
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
        <GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={handleUndoLastEvent} isSessionFinished={isSessionFinished} sessionId={sessionId} />
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
    </div>
  );
}
