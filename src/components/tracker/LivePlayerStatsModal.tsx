'use client';

import { useMemo } from 'react';
import { IGameEvent } from '@/types/definitions';

interface LivePlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  playerEvents: IGameEvent[];
}

export default function LivePlayerStatsModal({
  isOpen,
  onClose,
  playerName,
  playerEvents,
}: LivePlayerStatsModalProps) {
  // Calcular las estadísticas del jugador para la sesión actual
  const stats = useMemo(() => {
    let points = 0, fga = 0, fgm = 0, threePa = 0, threePm = 0, fta = 0, ftm = 0;
    let orb = 0, drb = 0, ast = 0, stl = 0, blk = 0, tov = 0, pf = 0;

    playerEvents.forEach((event) => {
      switch (event.type) {
        case 'tiro':
          const { made, value } = event.details;
          if (value === 1) {
            fta++;
            if (made) ftm++;
          } else {
            fga++;
            if (made) fgm++;
            if (value === 3) {
              threePa++;
              if (made) threePm++;
            }
          }
          if(made) points += value as number;
          break;
        case 'rebote':
          event.details.type === 'ofensivo' ? orb++ : drb++;
          break;
        case 'asistencia':
          ast++;
          break;
        case 'robo':
          stl++;
          break;
        case 'tapón':
          blk++;
          break;
        case 'perdida':
          tov++;
          break;
        case 'falta':
          pf++;
          break;
      }
    });
    
    const eFG = fga > 0 ? (fgm + 0.5 * (threePm)) / fga : 0;
    const tsAttempts = fga + 0.44 * fta;
    const TS = tsAttempts > 0 ? points / (2 * tsAttempts) : 0;


    return {
      points, fga, fgm, '3pa': threePa, '3pm': threePm, fta, ftm,
      reb: orb + drb, ast, stl, blk, tov, pf,
      eFG, TS,
    };
  }, [playerEvents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-4">Estadísticas en Vivo: {playerName}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-lg">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-3xl">{stats.points}</p>
            <p className="text-sm text-gray-500">Puntos</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-3xl">{stats.reb}</p>
            <p className="text-sm text-gray-500">Rebotes</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-3xl">{stats.ast}</p>
            <p className="text-sm text-gray-500">Asistencias</p>
          </div>
           <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-xl">{stats.fgm}/{stats.fga} ({stats.fga > 0 ? ((stats.fgm/stats.fga)*100).toFixed(1) : 0}%)</p>
            <p className="text-sm text-gray-500">Tiros de Campo</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-xl">{stats['3pm']}/{stats['3pa']} ({stats['3pa'] > 0 ? ((stats['3pm']/stats['3pa'])*100).toFixed(1) : 0}%)</p>
            <p className="text-sm text-gray-500">Tiros de 3</p>
          </div>
           <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-xl">{stats.ftm}/{stats.fta} ({stats.fta > 0 ? ((stats.ftm/stats.fta)*100).toFixed(1) : 0}%)</p>
            <p className="text-sm text-gray-500">Tiros Libres</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-2xl">{stats.stl}</p>
            <p className="text-sm text-gray-500">Robos</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-2xl">{stats.blk}</p>
            <p className="text-sm text-gray-500">Tapones</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <p className="font-bold text-2xl">{stats.tov}</p>
            <p className="text-sm text-gray-500">Pérdidas</p>
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}