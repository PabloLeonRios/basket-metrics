'use client';

import { useEffect, useState, useMemo, useCallback } from 'react'; // Importar useCallback
import Court from './Court'; // Importamos el nuevo componente
import GameLog from './GameLog'; // Importar GameLog
import FloatingStats from './FloatingStats'; // Importar FloatingStats
import { toast } from 'react-toastify'; // Importar toast
import { IGameEvent, IPlayer, ISession } from '@/types/definitions'; // Importar IGameEvent, IPlayer y ISession

// --- Tipos de Datos ---
// Las interfaces Player y Team ahora se importan como IPlayer y ISession
// La interfaz SessionData ahora es ISession, pero necesitamos adaptarla para incluir 'teams' con IPlayer
interface TeamData { // Renombrada para evitar conflicto
  _id: string; // Añadir _id para usar como key estable
  name: string;
  players: IPlayer[]; // Usar IPlayer importado
}
interface TrackerSessionData extends ISession { // Renombrado para evitar conflicto con ISession importada
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
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(
    null,
  );
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]); // Estado para los eventos de juego

  // Estados para el modal de tiro
  const [showShotModal, setShowShotModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
    // Si la sesión ya finalizó, no permitir más eventos
    if (session?.finishedAt) {
      toast.warn('La sesión ya ha finalizado. No se pueden registrar más eventos.');
      return;
    }

    console.log('Logging event:', { type, details });
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
      const newEvent = await response.json(); // Obtener el evento creado del backend
      setGameEvents((prevEvents) => [...prevEvents, newEvent.data]); // Actualizar el estado de eventos
      toast.success('Evento registrado!'); // Feedback de éxito
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!selectedPlayer) {
      toast.error('Selecciona un jugador antes de registrar un tiro.');
      return;
    }
    // Si la sesión ya finalizó, no permitir tiros
    if (session?.finishedAt) {
      toast.warn('La sesión ya ha finalizado. No se pueden registrar tiros.');
      return;
    }
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  }, [selectedPlayer, session]); // Dependencias del useCallback

  const handleShot = (made: boolean) => {
    if (!shotCoordinates) return;

    // Lógica simple para determinar si es un triple. Asumimos que la línea está en y=85.25 y el arco es un semicírculo.
    // Esto es una simplificación y se puede mejorar.
    const isThreePointer =
      shotCoordinates.y < 85.25 &&
      (shotCoordinates.x < 6 || shotCoordinates.x > 94);

    logEvent('tiro', {
      made,
      value: isThreePointer ? 3 : 2,
      x: shotCoordinates.x,
      y: shotCoordinates.y,
    });

    setShowShotModal(false);
    setShotCoordinates(null);
  };

  const handleAction = (type: string, details = {}) => {
    logEvent(type, details);
  };

  const handleUndo = async (eventId: string) => {
    try {
      const response = await fetch(`/api/game-events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al deshacer el evento.');
      }
      // Eliminar el evento del estado local
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
      setSession(updatedSession.data); // Actualizar el estado con la sesión finalizada
      toast.success('Sesión finalizada exitosamente!');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error desconocido al finalizar la sesión.',
      );
    }
  };

  // --- Renderizado ---

  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;

  const actionButtonStyles =
    'w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105';

  const isSessionFinished = !!session.finishedAt;

  return (
    <div className="flex flex-col lg:flex-row gap-4"> {/* Ajustar a 3 columnas en lg */}
      {/* Columna de Jugadores */}
      <div className="w-full lg:w-1/4 space-y-4">
        {session.teams.map((team) => (
          <div key={team._id}> {/* Usar team._id como key */}
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
        <button
          onClick={handleFinalizeSession}
          disabled={isSessionFinished}
          className={`${actionButtonStyles} ${isSessionFinished ? 'bg-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'} mt-4`}
        >
          {isSessionFinished ? 'Sesión Finalizada' : 'Finalizar Sesión'}
        </button>
      </div>

      {/* Columna Principal (Cancha y Acciones) */}
      <div className="w-full lg:w-2/4"> {/* Ajustar el ancho de la columna principal */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl">
            Registrando para:{' '}
            <span className="font-bold text-blue-500">
              {selectedPlayer?.name || 'Nadie'}
            </span>
          </h2>
        </div>

        {/* Cancha */}
        <Court onClick={handleCourtClick} />

        {/* Panel de Acciones Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => handleAction('rebote', { type: 'ofensivo' })}
            className={`${actionButtonStyles} bg-green-500 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSessionFinished}
          >
            Reb. Ofensivo
          </button>
          <button
            onClick={() => handleAction('rebote', { type: 'defensivo' })}
            className={`${actionButtonStyles} bg-green-700 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSessionFinished}
          >
            Reb. Defensivo
          </button>
          <button
            onClick={() => handleAction('asistencia')}
            className={`${actionButtonStyles} bg-sky-500 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSessionFinished}
          >
            Asistencia
          </button>
          <button
            onClick={() => handleAction('robo')}
            className={`${actionButtonStyles} bg-yellow-500 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSessionFinished}
          >
            Robo
          </button>
          <button
            onClick={() => handleAction('perdida')}
            className={`${actionButtonStyles} bg-red-500 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSessionFinished}
          >
            Pérdida
          </button>
          <button
            onClick={() => handleAction('falta')}
            className={`${actionButtonStyles} bg-purple-500 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSessionFinished}
          >
            Falta
          </button>
          <button
            onClick={() => handleAction('tapón')}
            className={`${actionButtonStyles} bg-slate-700 ${isSessionFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {/* Modal de Tiro */}
      {showShotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4">
            <h3 className="text-2xl font-bold text-center">
              Resultado del Tiro
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShot(true)}
                className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg text-xl"
              >
                Anotado
              </button>
              <button
                onClick={() => handleShot(false)}
                className="px-8 py-4 bg-red-500 text-white font-bold rounded-lg text-xl"
              >
                Fallado
              </button>
            </div>
            <button
              onClick={() => setShowShotModal(false)}
              className="mt-4 text-sm text-gray-500 w-full text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <FloatingStats events={gameEvents} />
    </div>
  );
}
