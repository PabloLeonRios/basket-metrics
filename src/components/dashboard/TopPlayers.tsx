// src/components/dashboard/TopPlayers.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import JerseyIcon from "@/components/ui/JerseyIcon";
import Link from "next/link";

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * ESPEJO DEMO (sin Mongo/API):
 * - En PROD este componente llama: /api/stats/top-players?coachId=<user._id>
 * - En DEMO, useAuth() puede no traer user o no traer _id (no hay JWT).
 *   Eso dejaba TopPlayers vacío y no se veía el “Top 3” como en producción.
 *
 * Fix:
 * - Si NEXT_PUBLIC_DEMO_MODE="1": usamos datos demo locales que imitan el shape
 *   de la API (TopPlayer[]).
 * - Si DEMO está apagado: se mantiene el fetch original.
 *
 * Migración real:
 * - DEMO apagado => usar Mongo + endpoint real como hoy.
 */

interface TopPlayer {
  playerId: string;
  name: string;
  dorsal?: number;
  avgGameScore: number;
  totalGames: number;
  avgPoints: number;
}

const DEMO_TOP_PLAYERS: TopPlayer[] = [
  {
    playerId: "demo-1",
    name: "Marcelo Riestra",
    dorsal: 12,
    avgGameScore: 10.1,
    totalGames: 8,
    avgPoints: 11.8,
  },
  {
    playerId: "demo-2",
    name: "Agustín Biglieri",
    dorsal: 7,
    avgGameScore: 10.0,
    totalGames: 8,
    avgPoints: 11.9,
  },
  {
    playerId: "demo-3",
    name: "Juan Manuel Rodríguez",
    dorsal: 15,
    avgGameScore: 7.5,
    totalGames: 8,
    avgPoints: 7.3,
  },
];

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="text-center">
    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{title}</p>
    <p className="text-xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
  </div>
);

export default function TopPlayers() {
  const { user } = useAuth();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const DEMO_MODE = useMemo(() => process.env.NEXT_PUBLIC_DEMO_MODE === "1", []);

  useEffect(() => {
    async function fetchTopPlayers() {
      try {
        setLoading(true);

        // DEMO: espejo sin API
        if (DEMO_MODE) {
          setTopPlayers(DEMO_TOP_PLAYERS);
          return;
        }

        // REAL: requiere user._id
        if (!user?._id) return;

        const response = await fetch(`/api/stats/top-players?coachId=${user._id}`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar los mejores jugadores.");
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
  }, [user, DEMO_MODE]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Top 3 Jugadores (por Game Score)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow animate-pulse">
              <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topPlayers.length === 0) return null;

  const cardColors = [
    "bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-900 dark:to-yellow-700",
    "bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-600",
    "bg-gradient-to-br from-orange-100 to-orange-300 dark:from-orange-900 dark:to-orange-700",
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Top 3 Jugadores (por Game Score)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPlayers.map((player, index) => (
          <Link
            href={`/panel/players/${player.playerId}`}
            key={player.playerId}
            className="block transition-transform transform hover:scale-105"
          >
            <div
              className={`p-4 rounded-lg shadow-lg flex flex-col items-center space-y-3 ${cardColors[index]}`}
            >
              <div className="flex items-center gap-4">
                <JerseyIcon number={player.dorsal} className="h-24 w-24 flex-shrink-0" />
                <p className="text-lg font-bold text-gray-900 dark:text-gray-50 truncate">
                  {player.name}
                </p>
              </div>

              <div className="w-full border-t border-black border-opacity-10 my-2" />

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