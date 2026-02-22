// src/components/dashboard/TopPlayers.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import JerseyIcon from '@/components/ui/JerseyIcon';
import Link from 'next/link';

interface TopPlayer {
  playerId: string;
  name: string;
  dorsal?: number;
  avgGameScore: number;
  totalGames: number;
  avgPoints: number;
}

const StatCard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
    </div>
);

export default function TopPlayers() {
  const { user } = useAuth();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopPlayers() {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/stats/top-players?coachId=${user.id}`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los mejores jugadores.');
        }
        const { data } = await response.json();
        setTopPlayers(data);
      } catch (err) {
        // Silently fail, this is a non-critical component
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopPlayers();
  }, [user]);

  if (loading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mt-2"></div>
                </div>
            ))}
        </div>
    );
  }

  if (topPlayers.length === 0) {
    return null; // Don't render anything if there are no players with stats
  }

  return (
    <div className="space-y-3">
        <h2 className="text-xl font-bold">Top 3 Jugadores (por Game Score)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPlayers.map((player, index) => (
                <Link href={`/panel/players/${player.playerId}`} key={player.playerId} className="block transition-transform transform hover:scale-105">
                    <div className={`p-4 rounded-lg shadow-lg flex flex-col items-center space-y-3 ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-400 dark:from-yellow-500 dark:to-amber-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600' :
                        'bg-gradient-to-br from-orange-400 to-orange-500 dark:from-orange-600 dark:to-orange-700'
                    }`}>
                        <div className="flex items-center gap-4">
                            <JerseyIcon number={player.dorsal} className="h-12 w-12 flex-shrink-0" />
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 truncate">{player.name}</p>
                        </div>
                        <div className="w-full border-t border-black border-opacity-10 my-2"></div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                           <StatCard title="Game Score" value={player.avgGameScore.toFixed(1)} />
                           <StatCard title="Puntos" value={player.avgPoints.toFixed(1)} />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
  );
}
