'use client';

import { CalendarDaysIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Datos estáticos/mock de muestra para la vista previa del dashboard
const mockUpcomingMatches = [
  {
    id: '1',
    date: '15 Nov 2024',
    time: '20:00',
    opponent: 'Águilas BC',
    location: 'Pabellón Principal',
    isHome: true,
  },
  {
    id: '2',
    date: '22 Nov 2024',
    time: '18:30',
    opponent: 'Toros FC',
    location: 'Cancha Visitante',
    isHome: false,
  },
  {
    id: '3',
    date: '29 Nov 2024',
    time: '19:00',
    opponent: 'Leones',
    location: 'Pabellón Principal',
    isHome: true,
  },
];

export default function UpcomingMatches() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <CalendarDaysIcon className="h-6 w-6 text-orange-500" />
          Próximas 3 Fechas
        </h2>
        <Link
          href="/panel/seasons"
          className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
        >
          Ver todo (Próximamente) &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockUpcomingMatches.map((match) => (
          <div
            key={match.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Banner superior indicando local/visitante */}
            <div className={`absolute top-0 left-0 w-1 h-full ${match.isHome ? 'bg-orange-500' : 'bg-gray-400'}`}></div>

            <div className="flex justify-between items-start mb-3 pl-2">
              <div>
                <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10">
                  {match.isHome ? 'Local' : 'Visitante'}
                </span>
              </div>
            </div>

            <div className="pl-2 space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">vs</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={match.opponent}>
                  {match.opponent}
                </h3>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {match.date}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {match.time}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate" title={match.location}>{match.location}</span>
                </div>
              </div>
            </div>

            {/* Elemento decorativo sutil en el fondo que indica que esto es mock/preview */}
            <div className="absolute -bottom-2 -right-2 text-gray-100 dark:text-gray-800 opacity-50 z-0 pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform">
              <CalendarDaysIcon className="h-24 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
