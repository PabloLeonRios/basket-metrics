'use client';

import { useEffect, useRef } from 'react';
import { IGameEvent } from '@/types/definitions'; // Asumiendo que IGameEvent está en definitions.ts

interface GameLogProps {
  sessionId: string;
  events: IGameEvent[];
  playerIdToName: { [key: string]: string }; // Mapa para resolver ID de jugador a nombre
  onUndo: (eventId: string) => void; // Función para deshacer un evento
  isSessionFinished: boolean; // Para deshabilitar los botones si la sesión ha terminado
}

export default function GameLog({ events, playerIdToName, onUndo, isSessionFinished }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll automático al final del log cuando se añaden nuevos eventos
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md h-96 overflow-y-auto">
      <h3 className="text-xl font-bold mb-3">Log de Eventos</h3>
      {events.length === 0 ? (
        <p className="text-gray-500">No hay eventos registrados aún.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event._id} className="bg-white dark:bg-gray-700 p-2 rounded-md text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p>
                    <strong>Jugador:</strong>{' '}
                    {playerIdToName[event.player] || event.player} {/* Mostrar nombre o ID */}
                  </p>
                  <p><strong>Acción:</strong> {event.type}</p>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {Object.entries(event.details)
                        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                        .join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(event.createdAt as string).toLocaleTimeString()} {/* Asumiendo que createdAt existe */}
                  </p>
                </div>
                <button
                  onClick={() => onUndo(event._id)}
                  disabled={isSessionFinished}
                  className="text-xs bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deshacer
                </button>
              </div>
            </li>
          ))}
          <div ref={logEndRef} /> {/* Elemento para el scroll automático */}
        </ul>
      )}
    </div>
  );
}