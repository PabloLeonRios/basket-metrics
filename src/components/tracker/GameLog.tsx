'use client';

import { useEffect, useRef } from 'react';
import { IGameEvent } from '@/types/definitions';

interface GameLogProps {
  sessionId: string;
  events: IGameEvent[];
  playerIdToName: { [key: string]: string };
  onUndo: (eventId: string) => void;
  isSessionFinished: boolean;
}

// Función para formatear los detalles del evento
const formatEventDetails = (event: IGameEvent): string => {
  const { type, details } = event;
  switch (type) {
    case 'tiro':
      const { made, value } = details;
      const shotType = value === 1 ? 'Tiro Libre' : `Tiro de ${value}`;
      return `${shotType} ${made ? 'Anotado' : 'Fallado'}`;
    case 'rebote':
      return `Rebote ${details.type === 'ofensivo' ? 'Ofensivo' : 'Defensivo'}`;
    case 'asistencia':
      return 'Asistencia';
    case 'robo':
      return 'Robo';
    case 'perdida':
      return 'Pérdida';
    case 'falta':
      return 'Falta';
    case 'tapón':
      return 'Tapón';
    default:
      return type;
  }
};

export default function GameLog({ events, playerIdToName, onUndo, isSessionFinished }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
                    <strong>{playerIdToName[event.player] || 'Jugador desconocido'}:</strong>{' '}
                    <span className="text-blue-600 dark:text-blue-400">{formatEventDetails(event)}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(event.createdAt as string).toLocaleTimeString()}
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
          <div ref={logEndRef} />
        </ul>
      )}
    </div>
  );
}