'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Court from './Court';
import GameLog from './GameLog';
import FloatingStats from './FloatingStats';
import { toast } from 'react-toastify';
import { IGameEvent, IPlayer, ISession } from '@/types/definitions';
import Button from '@/components/ui/Button'; // Using our new Button component

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

  // Crear un mapa de playerId a nombre de jugador para mostrar en el log
  const playerIdToName = useMemo(() => {
    const map: { [key: string]: string } = {};
    if (session) {
      session.teams.forEach((team) => {
        team.players.forEach((player) => {
          map[player._id] = player.name;
        });
      });
    }
    return map;
  }, [session]);

  // --- Carga de Datos ---
  useEffect(() => {
    async function fetchSessionData() {
      try {
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionResponse.ok) throw new Error('No se pudo cargar la sesión.');
        const { data: sessionData } = await sessionResponse.json();
        setSession(sessionData);

        const eventsResponse = await fetch(`/api/game-events?sessionId=${sessionId}`);
        if (!eventsResponse.ok) throw new Error('No se pudieron cargar los eventos de juego.');
        const { data: eventsData } = await eventsResponse.json();
        setGameEvents(eventsData);

      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Ocurrió un error desconocido.',
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId]);

  // --- Lógica de Eventos ---

  const logEvent = async (type: string, details: Record<string, unknown>) => {
    if (!selectedPlayer) {
      toast.error('Por favor, selecciona un jugador primero.');
      return;
    }
    if (session?.finishedAt) {
      toast.warn('La sesión ya ha finalizado. No se pueden registrar más eventos.');
      return;
    }

    try {
      const response = await fetch('/api/game-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sessionId,
          player: selectedPlayer.id,
          team: selectedPlayer.teamName,
          type,
          details,
        }),
      });
      if (!response.ok) throw new Error('Error al registrar el evento.');
      const newEvent = await response.json();
      setGameEvents((prevEvents) => [...prevEvents, newEvent.data]);
      toast.success('Evento registrado!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!selectedPlayer) {
      toast.error('Selecciona un jugador antes de registrar un tiro.');
      return;
    }
    if (session?.finishedAt) {
      toast.warn('La sesión ya ha finalizado. No se pueden registrar tiros.');
      return;
    }
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  }, [selectedPlayer, session]);

  const handleShot = (made: boolean) => {
    if (!shotCoordinates) return;

    // Correct 3-point logic based on the SVG viewBox "0 0 100 94"
    const { x, y } = shotCoordinates;
    const basketCenter = { x: 50, y: 10.58 };
    const threePointRadius = 45.32;
    const threePointLineY = 21.48;
    const threePointLineX1 = 6;
    const threePointLineX2 = 94;

    const distance = Math.sqrt(Math.pow(x - basketCenter.x, 2) + Math.pow(y - basketCenter.y, 2));

    const isThreePointer = 
      (y <= threePointLineY && distance > threePointRadius) ||
      (y > threePointLineY && x >= threePointLineX1 && x <= threePointLineX2);

    logEvent('tiro', {
      made,
      value: isThreePointer ? 3 : 2,
      x,
      y,
    });

    setShowShotModal(false);
    setShotCoordinates(null);
  };
  
  const handleFreeThrow = (made: boolean) => {
    // Fixed coordinates for a free throw on our SVG
    const freeThrowCoordinates = { x: 50, y: 38.97 };

    logEvent('tiro', {
        made,
        value: 1,
        x: freeThrowCoordinates.x,
        y: freeThrowCoordinates.y,
    });
    setShowFreeThrowModal(false);
  };

  const handleAction = (type: string, details = {}) => {
    logEvent(type, details);
  };

  const handleUndo = async (eventId: string) => {
    try {
      const response = await fetch(`/api/game-events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al deshacer el evento.');
      setGameEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventId));
      toast.info('Evento deshecho.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido al deshacer.');
    }
  };

  const handleFinalizeSession = async () => {
    if (!session) return;
    if (session.finishedAt) {
      toast.info('Esta sesión ya ha sido finalizada.');
      return;
    }
    if (!confirm('¿Estás seguro de que quieres finalizar esta sesión? Esta acción es irreversible y no se podrán registrar más eventos.')) {
        return;
    }
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finishedAt: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Error al finalizar la sesión.');
      const updatedSession = await response.json();
      setSession(updatedSession.data);
      toast.success('Sesión finalizada exitosamente!');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error desconocido al finalizar la sesión.',
      );
    }
  };

  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;

  const isSessionFinished = !!session.finishedAt;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Columna de Jugadores */}
      <div className="w-full lg:w-1/4 space-y-4">
        {session.teams.map((team) => (
          <div key={team._id}>
            <h3 className="font-bold text-xl mb-2">{team.name}</h3>
            <ul className="space-y-1">
              {team.players.map((player) => (
                <li key={player._id}>
                  <button
                    onClick={() =>
                      setSelectedPlayer({
                        id: player._id,
                        name: player.name,
                        teamName: team.name,
                      })
                    }
                    className={`w-full text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'} ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSessionFinished}
                  >
                    {player.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Button
          onClick={handleFinalizeSession}
          disabled={isSessionFinished}
          variant={isSessionFinished ? 'secondary' : 'danger'}
          className="w-full mt-4"
        >
          {isSessionFinished ? 'Sesión Finalizada' : 'Finalizar Sesión'}
        </Button>
      </div>

      {/* Columna Principal (Cancha y Acciones) */}
      <div className="w-full lg:w-2/4">
        <div className="mb-4 text-center">
          <h2 className="text-2xl">
            Registrando para:{' '}
            <span className="font-bold text-blue-500">
              {selectedPlayer?.name || 'Nadie'}
            </span>
          </h2>
        </div>

        <Court onClick={handleCourtClick} shotCoordinates={shotCoordinates} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => setShowFreeThrowModal(true)}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-cyan-500"
            disabled={isSessionFinished}
          >
            Tiro Libre
          </button>
          <button
            onClick={() => handleAction('rebote', { type: 'ofensivo' })}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-green-500"
            disabled={isSessionFinished}
          >
            Reb. Ofensivo
          </button>
          <button
            onClick={() => handleAction('rebote', { type: 'defensivo' })}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-green-700"
            disabled={isSessionFinished}
          >
            Reb. Defensivo
          </button>
          <button
            onClick={() => handleAction('asistencia')}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-sky-500"
            disabled={isSessionFinished}
          >
            Asistencia
          </button>
          <button
            onClick={() => handleAction('robo')}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-yellow-500"
            disabled={isSessionFinished}
          >
            Robo
          </button>
          <button
            onClick={() => handleAction('perdida')}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-red-500"
            disabled={isSessionFinished}
          >
            Pérdida
          </button>
          <button
            onClick={() => handleAction('falta')}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-purple-500"
            disabled={isSessionFinished}
          >
            Falta
          </button>
          <button
            onClick={() => handleAction('tapón')}
            className="w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105 bg-slate-700"
            disabled={isSessionFinished}
          >
            Tapón
          </button>
        </div>
      </div>

      {/* Columna para el Log de Eventos */}
      <div className="w-full lg:w-1/4">
        <GameLog 
          sessionId={sessionId} 
          events={gameEvents} 
          playerIdToName={playerIdToName}
          onUndo={handleUndo}
          isSessionFinished={isSessionFinished}
        />
      </div>

      {/* Modal de Tiro de Campo */}
      {showShotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4">
            <h3 className="text-2xl font-bold text-center">Resultado del Tiro</h3>
            <div className="flex justify-center gap-4">
              <Button onClick={() => handleShot(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button>
              <Button onClick={() => handleShot(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button>
            </div>
            <button onClick={() => setShowShotModal(false)} className="mt-4 text-sm text-gray-500 w-full text-center">Cancelar</button>
          </div>
        </div>
      )}
      
      {/* Modal de Tiro Libre */}
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

      <FloatingStats events={gameEvents} />
    </div>
  );
}
