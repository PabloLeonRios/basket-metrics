'use client';

import { TrophyIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function SeasonsPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-3">
          <TrophyIcon className="h-8 w-8 text-orange-500" />
          Temporadas
        </h1>
        <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
          Planifica y gestiona los partidos de tu equipo.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 p-8 text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 text-orange-500 opacity-5">
          <TrophyIcon className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-semibold text-sm">
            <ClockIcon className="h-5 w-5" />
            Próximamente
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            El Calendario de Temporada está en camino
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            Estamos trabajando en una nueva herramienta para que puedas programar tus próximos partidos,
            establecer rivales, horarios y tener una vista completa de tu calendario competitivo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-8 opacity-60 pointer-events-none grayscale">
            {/* Mock Matches Preview */}
            {[
              { day: '15', month: 'Nov', opponent: 'Águilas', type: 'Local' },
              { day: '22', month: 'Nov', opponent: 'Toros FC', type: 'Visitante' },
              { day: '29', month: 'Nov', opponent: 'Leones', type: 'Local' },
            ].map((match, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <CalendarDaysIcon className="h-10 w-10 text-gray-400 mb-3" />
                <div className="text-2xl font-black text-gray-900 dark:text-white">{match.day}</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{match.month}</div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">{match.opponent}</div>
                <div className="text-xs text-gray-500 mt-1">{match.type}</div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-500 mt-8 italic">
            Muy pronto podrás interactuar con este calendario. ¡Mantente atento a las actualizaciones!
          </p>
        </div>
      </div>
    </div>
  );
}
