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
      const shotValue =
        details.value === 1 ? 'Tiro Libre' : `Tiro de ${details.value}`;
      return `${shotValue} ${details.made ? 'Anotado' : 'Fallado'}`;
    case 'tiro_libre':
      return `Tiro Libre ${details.made ? 'Anotado' : 'Fallado'}`;
    case 'rebote':
      return `Rebote ${details.type === 'ofensivo' ? 'Ofensivo' : 'Defensivo'}`;
    case 'asistencia':
      return 'Asistencia';
    case 'robo':
      return 'Robo';
    case 'perdida':
      return 'Pérdida';
    case 'falta':
      return 'Falta Personal';
    case 'tapon':
      return 'Tapón';
    case 'substitution':
      const subDetails = details as {
        playerIn: { name: string };
        playerOut: { name: string };
      };
      return `Sustitución: Entra ${subDetails.playerIn.name} por ${subDetails.playerOut.name}`;
    default:
      return type;
  }
};

const getEventRowClass = (event: IGameEvent): string => {
  const baseClass = 'p-2 rounded-md text-sm';
  const colorClass = 'border-l-4';

  switch (event.type) {
    case 'tiro':
    case 'tiro_libre':
      return event.details.made
        ? `${baseClass} bg-green-50 dark:bg-green-900/50 ${colorClass} border-green-500`
        : `${baseClass} bg-red-50 dark:bg-red-900/50 ${colorClass} border-red-500`;
    case 'asistencia':
      return `${baseClass} bg-blue-50 dark:bg-blue-900/50 ${colorClass} border-blue-500`;
    case 'perdida':
      return `${baseClass} bg-yellow-50 dark:bg-yellow-900/50 ${colorClass} border-yellow-500`;
    case 'falta':
      return `${baseClass} bg-orange-50 dark:bg-orange-900/50 ${colorClass} border-orange-500`;
    case 'robo':
      return `${baseClass} bg-teal-50 dark:bg-teal-900/50 ${colorClass} border-teal-500`;
    case 'tapon':
      return `${baseClass} bg-purple-50 dark:bg-purple-900/50 ${colorClass} border-purple-500`;
    case 'rebote':
      return event.details.type === 'ofensivo'
        ? `${baseClass} bg-cyan-50 dark:bg-cyan-900/50 ${colorClass} border-cyan-500`
        : `${baseClass} bg-pink-50 dark:bg-pink-900/50 ${colorClass} border-pink-500`;
    case 'substitution':
      return `${baseClass} bg-gray-50 dark:bg-gray-700/50 ${colorClass} border-gray-400`;
    default:
      return `${baseClass} bg-white dark:bg-gray-700`;
  }
};

export default function GameLog({
  events,
  playerIdToName,
  onUndo,
  isSessionFinished,
}: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md h-[700px] flex flex-col">
      <h3 className="text-xl font-bold mb-3 flex-shrink-0">Log de Eventos</h3>
      {events.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">No hay eventos registrados aún.</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {[...events].reverse().map((event) => (
            <li key={event._id} className={getEventRowClass(event)}>
              <div className="flex justify-between items-start">
                <div>
                  <p>
                    <strong>
                      {playerIdToName[event.player] || 'Jugador desconocido'}:
                    </strong>{' '}
                    <span className="font-semibold">
                      {formatEventDetails(event)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(event.createdAt as string).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => onUndo(event._id)}
                  disabled={isSessionFinished}
                  className="text-xs bg-gray-500 text-white rounded px-2 py-1 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
