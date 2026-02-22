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

const MedalIcon = ({ color }: { color: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} className="w-8 h-8">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071 1.052A9.75 9.75 0 0118 10.5c0 5.385-4.365 9.75-9.75 9.75S-1.5 15.885-1.5 10.5a9.75 9.75 0 015.308-8.662.75.75 0 00-1.052-1.071A11.25 11.25 0 000 10.5c0 6.215 5.035 11.25 11.25 11.25s11.25-5.035 11.25-11.25a11.25 11.25 0 00-9.537-11.214z" clipRule="evenodd" />
    </svg>
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

  const medals = [
    { color: '#FFD700' }, // Gold
    { color: '#C0C0C0' }, // Silver
    { color: '#CD7F32' }, // Bronze
  ];

  return (
    <div className="space-y-3">
        <h2 className="text-xl font-bold">Top 3 Jugadores (por Game Score)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPlayers.map((player, index) => (
                <Link href={`/panel/players/${player.playerId}`} key={player.playerId} className="block transition-transform transform hover:scale-105">
                    <div className="relative p-4 rounded-lg shadow-lg flex flex-col items-center space-y-3 bg-white dark:bg-gray-800">
                        <div className="absolute top-2 right-2">
                           <MedalIcon color={medals[index]?.color || '#A0A0A0'} />
                        </div>
                        <div className="flex items-center gap-4">
                            <JerseyIcon number={player.dorsal} className="h-12 w-12 flex-shrink-0" />
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 truncate">{player.name}</p>
                        </div>
                        <div className="w-full border-t border-gray-200 dark:border-gray-700 my-2"></div>
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
