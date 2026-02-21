'use client';

import { useState, useMemo } from 'react';
import { IGameEvent } from '@/types/definitions';

interface FloatingStatsProps {
  events: IGameEvent[];
}

export default function FloatingStats({ events }: FloatingStatsProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calcular las estadísticas totales de la sesión usando useMemo
  const totalStats = useMemo(() => {
    let points = 0;
    let offensiveRebounds = 0;
    let defensiveRebounds = 0;
    let assists = 0;
    let turnovers = 0;
    let shotsMade = 0;
    let shotsAttempted = 0;

    events.forEach((event) => {
      switch (event.type) {
        case 'tiro':
          shotsAttempted++;
          if (event.details.made) {
            shotsMade++;
            points += event.details.value as number;
          }
          break;
        case 'rebote':
          if (event.details.type === 'ofensivo') {
            offensiveRebounds++;
          } else {
            defensiveRebounds++;
          }
          break;
        case 'asistencia':
          assists++;
          break;
        case 'perdida':
          turnovers++;
          break;
        default:
          break;
      }
    });

    return {
      points,
      offensiveRebounds,
      defensiveRebounds,
      assists,
      turnovers,
      shotsMade,
      shotsAttempted,
    };
  }, [events]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700"
          aria-label="Abrir estadísticas"
        >
          {/* Icono de estadísticas, podrías usar un SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 21.945V11C13 10.447 12.553 10 12 10H3.055A9.001 9.001 0 0013 21.945z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-80 border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Estadísticas en Vivo</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            aria-label="Cerrar estadísticas"
          >
            {/* Icono de cerrar, podrías usar un SVG */}
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="font-semibold">Puntos:</span> {totalStats.points}
          </div>
          <div>
            <span className="font-semibold">Tiros:</span> {totalStats.shotsMade}/{totalStats.shotsAttempted}
          </div>
          <div>
            <span className="font-semibold">Reb. Of:</span> {totalStats.offensiveRebounds}
          </div>
          <div>
            <span className="font-semibold">Reb. Def:</span> {totalStats.defensiveRebounds}
          </div>
          <div>
            <span className="font-semibold">Asist.:</span> {totalStats.assists}
          </div>
          <div>
            <span className="font-semibold">Pérd.:</span> {totalStats.turnovers}
          </div>
        </div>
      </div>
    </div>
  );
}