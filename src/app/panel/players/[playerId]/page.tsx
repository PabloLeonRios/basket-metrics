// src/app/panel/players/[playerId]/page.tsx
import PlayerProfile from '@/components/players/PlayerProfile';
import User from '@/lib/models/User';
import Player from '@/lib/models/Player';
import dbConnect from '@/lib/dbConnect';

// Esta página de servidor puede obtener datos básicos del jugador para el encabezado
async function getPlayerName(playerId: string) {
  try {
    await dbConnect();
    const player = await Player.findById(playerId).select('name');
    return player?.name || 'Jugador';
  } catch (error) {
    return 'Jugador';
  }
}

export default async function PlayerProfilePage({
  params,
}: {
  params: { playerId: string };
}) {
  const playerName = await getPlayerName(params.playerId);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Perfil de: {playerName}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Estadísticas avanzadas y rendimiento histórico.
        </p>
      </header>

      <PlayerProfile playerId={params.playerId} />
    </div>
  );
}
