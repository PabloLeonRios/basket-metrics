// src/app/panel/players/page.tsx
import PlayerManager from '@/components/players/PlayerManager';

export default function PlayersPage() {
  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Gestionar Jugadores
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Añade, edita o elimina los jugadores de tu equipo.
          </p>
        </header>

        <PlayerManager />
      </div>
    </main>
  );
}
