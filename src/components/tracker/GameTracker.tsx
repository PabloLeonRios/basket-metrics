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
    // ... (same as before)
  }, [session]);

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

  const logEvent = async (type: string, details: Record<string, unknown>) => {
    // ... (same as before)
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

    // --- REVISED 3-POINT LOGIC ---
    // Visually re-estimated coordinates from prueba.png for viewBox "0 0 100 94"
    const basketCenter = { x: 50, y: 15.5 };
    const threePointRadius = 36.5; // Approx distance from basket to top of arc (52 - 15.5)
    const threePointLineYLimit = 30; // Approx Y-coordinate where the straight lines start
    const threePointLineX1 = 8;
    const threePointLineX2 = 92;

    const distance = Math.sqrt(Math.pow(x - basketCenter.x, 2) + Math.pow(y - basketCenter.y, 2));
    
    let isThree = false;
    // Check if it's beyond the arc part
    if (distance > threePointRadius) {
        isThree = true;
    }
    // If it's inside the arc's distance, check if it's in the corner three area
    if (distance <= threePointRadius && y < threePointLineYLimit && (x < threePointLineX1 || x > threePointLineX2)) {
        // This is behind the backboard, not a valid shot. Let's consider it a 2 for simplicity of UI.
        isThree = false;
    }

    setShotValue(isThree ? 3 : 2);
    setShotCoordinates({ x, y });
    setShowShotModal(true);
  }, [selectedPlayer, session]);

  const handleShot = (made: boolean) => {
    if (!shotCoordinates) return;

    logEvent('tiro', {
      made,
      value: shotValue,
      x: shotCoordinates.x,
      y: shotCoordinates.y,
    });

    setShowShotModal(false);
    setShotCoordinates(null);
  };
  
  const handleFreeThrow = (made: boolean) => {
    // ... (same as before)
  };

  // ... other handlers ...

  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;

  const isSessionFinished = !!session.finishedAt;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* ... Player List and Actions ... */}
      
      {/* Modal de Tiro de Campo */}
      {showShotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl space-y-4">
            <h3 className="text-2xl font-bold text-center">
              {`Resultado del Tiro (${shotValue} Puntos)`}
            </h3>
            <div className="flex justify-center gap-4">
              <Button onClick={() => handleShot(true)} variant="primary" className="bg-green-500 px-8 py-4 text-xl">Anotado</Button>
              <Button onClick={() => handleShot(false)} variant="danger" className="px-8 py-4 text-xl">Fallado</Button>
            </div>
            <button onClick={() => setShowShotModal(false)} className="mt-4 text-sm text-gray-500 w-full text-center">Cancelar</button>
          </div>
        </div>
      )}
      
      {/* ... Other Modals and components ... */}
    </div>
  );
}
