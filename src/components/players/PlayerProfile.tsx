'use client';

import { useState, useEffect, useMemo } from 'react';
import ShotChart from '@/components/charts/ShotChart';
import { IGameEvent } from '@/types/definitions';

// Deberíamos centralizar estos tipos
interface CareerAverages {
  avgPoints: number;
  avgEFG: number;
  avgTS: number;
  avgGameScore: number;
  totalGames: number;
}
interface GameStats {
  _id: string;
  session: { name: string; date: string; finishedAt?: string };
  points: number;
  eFG: number;
  TS: number;
  ast: number;
  orb: number;
  drb: number;
  stl: number;
  tov: number;
  blk: number;
  pf: number;
  gameScore: number;
}
interface Shot {
  x: number;
  y: number;
  made: boolean;
}

export default function PlayerProfile({ playerId }: { playerId: string }) {
  const [averages, setAverages] = useState<CareerAverages | null>(null);
  const [games, setGames] = useState<GameStats[]>([]);
  const [allShots, setAllShots] = useState<Shot[]>([]);
  const [globalValue, setGlobalValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!playerId) return;
      try {
        setLoading(true);
        const [statsResponse, eventsResponse] = await Promise.all([
            fetch(`/api/players/${playerId}/stats`),
            fetch(`/api/game-events?playerId=${playerId}`)
        ]);

        if (!statsResponse.ok) throw new Error('No se pudieron cargar las estadísticas del jugador.');
        const { data: statsData } = await statsResponse.json();
        setAverages(statsData.careerAverages);
        setGames(statsData.gameByGameStats);
        setGlobalValue(statsData.globalValue);
        
        if (!eventsResponse.ok) throw new Error('No se pudieron cargar los eventos de tiro.');
        const { data: eventsData } = await eventsResponse.json();
        const shots = eventsData
            .filter((event: IGameEvent) => event.type === 'tiro' && event.details.x != null && event.details.y != null)
            .map((event: IGameEvent) => ({
                x: event.details.x as number,
                y: event.details.y as number,
                made: event.details.made as boolean,
            }));
        setAllShots(shots);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [playerId]);

  const StatCard = ({
    title,
    value,
    className = ''
  }: {
    title: string;
    value: string | number;
    className?: string;
  }) => (
    <div className={`bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md text-center ${className}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
        {value}
      </p>
    </div>
  );

  if (loading) return <p>Cargando perfil...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-8">
      {/* Tarjetas de Promedios */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          title="Valor Global" 
          value={globalValue || '--'} 
          className="bg-blue-100 dark:bg-blue-900"
        />
        <StatCard title="Partidos Jugados" value={averages?.totalGames || 0} />
        <StatCard
          title="Puntos Por Partido"
          value={averages?.avgPoints.toFixed(1) || '0.0'}
        />
        <StatCard
          title="Game Score Promedio"
          value={averages?.avgGameScore.toFixed(1) || '0.0'}
        />
        <StatCard
          title="eFG% Promedio"
          value={`${((averages?.avgEFG || 0) * 100).toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla de Partidos */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
          <h3 className="text-xl font-bold p-4">Rendimiento Partido a Partido</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Partido</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Game Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PTS</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">AST</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">REB</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STL</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">BLK</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TOV</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {games.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No hay partidos finalizados con estadísticas calculadas.
                    </td>
                  </tr>
                ) : (
                  games.map((game) => (
                    <tr key={game._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <p className="font-semibold text-gray-900 dark:text-white">{game.session.name}</p>
                        <p>Inicio: {new Date(game.session.date).toLocaleString()}</p>
                        {game.session.finishedAt && <p>Fin: {new Date(game.session.finishedAt).toLocaleString()}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">{game.gameScore.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{game.points}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.ast}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.orb + game.drb}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.stl}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.blk}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.tov}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.pf}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Gráfico de Tiro */}
        <div className="lg:col-span-1">
          <ShotChart shots={allShots} title="Mapa de Tiro (Carrera)" />
        </div>
      </div>
    </div>
  );
}
