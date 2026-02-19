// src/components/assistant/Assistant.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  GameSituation,
  PlayerProfile,
} from '@/lib/recommender/lineupRecommender';

// Tipos locales
interface Player {
  _id: string;
  name: string;
}

const situations: { value: GameSituation; label: string }[] = [
  { value: 'BALANCED', label: 'Quinteto Equilibrado' },
  { value: 'NEEDS_SCORING', label: 'Necesito Anotar' },
  { value: 'NEEDS_3P', label: 'Necesito Tiro de 3 Puntos' },
  { value: 'NEEDS_DEFENSE', label: 'Necesito Defensa y Rebote' },
];

export default function Assistant() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [situation, setSituation] = useState<GameSituation>('BALANCED');
  const [recommendation, setRecommendation] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MOCK_COACH_ID = '65c9b8d3a17e5a7a4b0d3e5b'; // Reemplazar con Auth

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch(`/api/players?coachId=${MOCK_COACH_ID}`);
        if (!response.ok)
          throw new Error('No se pudieron cargar los jugadores.');
        const { data } = await response.json();
        setAllPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    }
    fetchPlayers();
  }, []);

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) newSet.delete(playerId);
      else newSet.add(playerId);
      return newSet;
    });
  };

  const handleRecommend = async () => {
    if (selectedPlayerIds.size < 5) {
      alert('Debes seleccionar al menos 5 jugadores disponibles.');
      return;
    }
    setLoading(true);
    setRecommendation([]);
    setError(null);
    try {
      const response = await fetch('/api/assistant/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerIds: Array.from(selectedPlayerIds),
          situation,
        }),
      });
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'No se pudo generar la recomendación.');
      }
      const { data } = await response.json();
      setRecommendation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Paso 1: Selección de Jugadores */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Paso 1: Selecciona los Jugadores Disponibles
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {allPlayers.map((player) => (
            <label
              key={player._id}
              className={`p-3 rounded-lg cursor-pointer text-center border-2 ${selectedPlayerIds.has(player._id) ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-800 border-gray-200'}`}
            >
              <input
                type="checkbox"
                checked={selectedPlayerIds.has(player._id)}
                onChange={() => handlePlayerToggle(player._id)}
                className="sr-only"
              />
              <span className="font-medium">{player.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Paso 2: Selección de Situación y Acción */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Paso 2: Elige la Situación del Partido
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select
            value={situation}
            onChange={(e) => setSituation(e.target.value as GameSituation)}
            className="w-full sm:w-1/2 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {situations.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleRecommend}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
          >
            {loading ? 'Pensando...' : 'Recomendar Quinteto'}
          </button>
        </div>
      </div>

      {/* Paso 3: Resultado */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Paso 3: Quinteto Recomendado</h2>
        {error && <p className="text-red-500">{error}</p>}
        {recommendation.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recommendation.map((profile) => (
              <div
                key={profile.playerId}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border-l-4 border-green-500"
              >
                <p className="text-lg font-bold">{profile.name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(profile.tags).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs font-semibold rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
