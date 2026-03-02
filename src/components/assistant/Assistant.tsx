// src/components/assistant/Assistant.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  GameSituation,
  PlayerProfile,
  PlayerProfileWithScore,
  StrategicOption,
} from '@/lib/recommender/lineupRecommender';
import { useAuth } from '@/hooks/useAuth';
import { SparklesIcon, ScaleIcon, BoltIcon } from '@heroicons/react/24/solid';

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
  const { user, loading: authLoading } = useAuth();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [situation, setSituation] = useState<GameSituation>('BALANCED');

  // Updated states for new data structure
  const [recommendations, setRecommendations] = useState<StrategicOption[]>([]);
  const [allProfiles, setAllProfiles] = useState<PlayerProfileWithScore[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPlayerProfile, setModalPlayerProfile] =
    useState<PlayerProfile | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      try {
        const teamQuery = user.team
          ? `&userTeamName=${encodeURIComponent(user.team.name)}`
          : '';
        const response = await fetch(
          `/api/players?coachId=${user._id}&teamType=mine${teamQuery}`,
        );
        if (!response.ok)
          throw new Error('No se pudieron cargar los jugadores.');
        const { data } = await response.json();
        setAllPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    }
    if (!authLoading) {
      fetchPlayers();
    }
  }, [user, authLoading]);

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) newSet.delete(playerId);
      else newSet.add(playerId);
      return newSet;
    });
  };

  const handleSelectAllToggle = () => {
    // If all are already selected, deselect all. Otherwise, select all.
    if (selectedPlayerIds.size === allPlayers.length) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(allPlayers.map((p) => p._id)));
    }
  };

  const handleRecommend = async () => {
    if (selectedPlayerIds.size < 5) {
      alert('Debes seleccionar al menos 5 jugadores disponibles.');
      return;
    }
    setLoading(true);
    setRecommendations([]);
    setAllProfiles([]);
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
      setRecommendations(data.recommendations);
      setAllProfiles(data.allProfiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: PlayerProfile) => {
    setModalPlayerProfile(profile);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Step 1 & 2 */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Paso 1: Selecciona Jugadores y Situación
          </h2>
          <button
            onClick={handleSelectAllToggle}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            {selectedPlayerIds.size === allPlayers.length
              ? 'Deseleccionar Todos'
              : 'Seleccionar Todos'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-6">
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
            {loading ? 'Pensando...' : 'Generar Opciones'}
          </button>
        </div>
      </div>

      {/* Step 3: Results */}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {recommendations.length > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Strategic Options */}
            {recommendations.map((option) => (
              <div
                key={option.title}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg"
              >
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
                  {option.title.includes('Especialistas') ? (
                    <BoltIcon className="h-7 w-7 text-red-500" />
                  ) : (
                    <ScaleIcon className="h-7 w-7 text-blue-500" />
                  )}
                  {option.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {option.reasoning}
                </p>

                <div className="space-y-3">
                  {option.lineup.map((profile) => (
                    <div
                      key={profile.playerId}
                      onClick={() => handleProfileClick(profile)}
                      className="group relative bg-gray-50 dark:bg-gray-800 p-3 rounded-lg cursor-pointer hover:shadow-md"
                    >
                      <p className="font-bold">{profile.name}</p>
                      <p className="text-xs text-gray-500">
                        Idoneidad:{' '}
                        <span className="font-semibold text-blue-500">
                          {profile.suitabilityScore.toFixed(1)}/10
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(profile.tags).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-semibold rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {option.xFactor && (
                  <div className="mt-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-yellow-400" />
                      Factor X: {option.xFactor.player.name}
                    </h3>
                    <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg mt-1 text-sm">
                      <p className="text-gray-800 dark:text-gray-200">
                        {option.xFactor.reasoning}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suitability Ranking */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-3">
              Ranking General de Idoneidad
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {allProfiles.map((profile) => (
                <div
                  key={profile.playerId}
                  onClick={() => handleProfileClick(profile)}
                  className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${recommendations.some((rec) => rec.lineup.some((p) => p.playerId === profile.playerId)) ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-50 dark:bg-gray-800'}`}
                >
                  <div>
                    <p className="font-bold">{profile.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {profile.suitabilityScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Idoneidad</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Player Details Modal */}
      {isModalOpen && modalPlayerProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4">
              {modalPlayerProfile.name}
            </h3>
            <div className="mb-4">
              <h4 className="font-semibold text-lg mb-2">
                Perfil del Jugador:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(modalPlayerProfile.tags).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">
                Estadísticas de Carrera (Promedios):
              </h4>
              {modalPlayerProfile.careerAverages ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <p>
                    <strong>Puntos:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avgPoints.toFixed(1)}
                  </p>
                  <p>
                    <strong>Asistencias:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avgAst.toFixed(1)}
                  </p>
                  <p>
                    <strong>Reb. Ofensivos:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avgOrb.toFixed(1)}
                  </p>
                  <p>
                    <strong>Reb. Defensivos:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avgDrb.toFixed(1)}
                  </p>
                  <p>
                    <strong>Robos:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avgStl.toFixed(1)}
                  </p>
                  <p>
                    <strong>Pérdidas:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avgTov.toFixed(1)}
                  </p>
                  <p>
                    <strong>3P Hechos:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avg3pm.toFixed(1)}
                  </p>
                  <p>
                    <strong>3P Intentados:</strong>{' '}
                    {modalPlayerProfile.careerAverages.avg3pa.toFixed(1)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">
                  No hay suficientes estadísticas para mostrar.
                </p>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
