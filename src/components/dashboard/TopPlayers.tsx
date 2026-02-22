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
        const response = await fetch(`/api/stats/top-players?coachId=${user._id}`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los mejores jugadores.');
        }
        const { data } = await response.json();
        setTopPlayers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopPlayers();
  }, [user]);

  if (loading) {
    // ... loading skeleton
  }

  if (topPlayers.length === 0) {
    return null;
  }
  
  const cardColors = [
    'bg-blue-100 dark:bg-blue-900', // 1st place
    'bg-gray-100 dark:bg-gray-800', // 2nd place
    'bg-amber-100 dark:bg-amber-900' // 3rd place
  ];

  return (
    <div className="space-y-3">
        <h2 className="text-xl font-bold">Top 3 Jugadores (por Game Score)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPlayers.map((player, index) => (
                <Link href={`/panel/players/${player.playerId}`} key={player.playerId} className="block transition-transform transform hover:scale-105">
                    <div className={`p-4 rounded-lg shadow-lg flex flex-col items-center space-y-3 ${cardColors[index]}`}>
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
