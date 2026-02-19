'use client';

import { useEffect, useState } from 'react';
import Court from './Court'; // Importamos el nuevo componente

// --- Tipos de Datos ---
interface Player {
  _id: string;
  name: string;
}
interface Team {
  name: string;
  players: Player[];
}
interface SessionData {
  _id: string;
  name: string;
  teams: Team[];
}
interface SelectedPlayer {
  id: string;
  name: string;
  teamName: string;
}

export default function GameTracker({ sessionId }: { sessionId: string }) {
  // --- Estados del Componente ---
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(
    null,
  );

  // Estados para el modal de tiro
  const [showShotModal, setShowShotModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // --- Carga de Datos ---
  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error('No se pudo cargar la sesión.');
        const { data } = await response.json();
        setSession(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Ocurrió un error desconocido.',
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  // --- Lógica de Eventos ---

  const logEvent = async (type: string, details: Record<string, unknown>) => {
    if (!selectedPlayer) {
      alert('Por favor, selecciona un jugador primero.');
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
      // Opcional: mostrar feedback al usuario
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  const handleCourtClick = (x: number, y: number) => {
    if (!selectedPlayer) {
      alert('Selecciona un jugador antes de registrar un tiro.');
      return;
    }
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  };

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

  // --- Renderizado ---

  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;

  const actionButtonStyles =
    'w-full p-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform transform hover:scale-105';

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Columna de Jugadores */}
      <div className="w-full md:w-1/3 lg:w-1/4 space-y-4">
        {session.teams.map((team) => (
          <div key={team.name}>
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
                    className={`w-full text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    {player.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Columna Principal (Cancha y Acciones) */}
      <div className="w-full md:w-2/3 lg:w-3/4">
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
            className={`${actionButtonStyles} bg-green-500`}
          >
            Reb. Ofensivo
          </button>
          <button
            onClick={() => handleAction('rebote', { type: 'defensivo' })}
            className={`${actionButtonStyles} bg-green-700`}
          >
            Reb. Defensivo
          </button>
          <button
            onClick={() => handleAction('asistencia')}
            className={`${actionButtonStyles} bg-sky-500`}
          >
            Asistencia
          </button>
          <button
            onClick={() => handleAction('robo')}
            className={`${actionButtonStyles} bg-yellow-500`}
          >
            Robo
          </button>
          <button
            onClick={() => handleAction('perdida')}
            className={`${actionButtonStyles} bg-red-500`}
          >
            Pérdida
          </button>
          <button
            onClick={() => handleAction('falta')}
            className={`${actionButtonStyles} bg-purple-500`}
          >
            Falta
          </button>
          <button
            onClick={() => handleAction('tapón')}
            className={`${actionButtonStyles} bg-slate-700`}
          >
            Tapón
          </button>
        </div>
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
    </div>
  );
}
