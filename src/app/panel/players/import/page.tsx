import PlayerImportManager from '@/components/players/PlayerImportManager';

export default function ImportPlayersPage() {
  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Importación de Jugadores
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Importa múltiples jugadores a tu equipo mediante un archivo Excel.
          </p>
        </header>

        <PlayerImportManager />
      </div>
    </main>
  );
}
