// src/components/assistant/Assistant.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  GameSituation,
  PlayerProfile,
  CareerAverages,
} from '@/lib/recommender/lineupRecommender';
import { useAuth } from '@/hooks/useAuth';

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

// Componente para el Tooltip
const StatTooltip = ({ stats }: { stats: CareerAverages | null }) => {
    if (!stats) return null;
    return (
      <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        <p>PTS: {stats.avgPoints.toFixed(1)}</p>
        <p>AST: {stats.avgAst.toFixed(1)}</p>
        <p>REB: {(stats.avgOrb + stats.avgDrb).toFixed(1)}</p>
      </div>
    );
};

export default function Assistant() {
  const { user, loading: authLoading } = useAuth();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [situation, setSituation] = useState<GameSituation>('BALANCED');
  const [recommendation, setRecommendation] = useState<PlayerProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<PlayerProfile[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el modal de detalles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPlayerProfile, setModalPlayerProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      try {
        const response = await fetch(`/api/players?coachId=${user._id}`);
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

  const handleRecommend = async () => {
    if (selectedPlayerIds.size < 5) {
      alert('Debes seleccionar al menos 5 jugadores disponibles.');
      return;
    }
    setLoading(true);
    setRecommendation([]);
    setAllProfiles([]);
    setReasoning('');
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
      setRecommendation(data.lineup);
      setReasoning(data.reasoning);
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
      {error && <p className="text-red-500 text-center">{error}</p>}
      {recommendation.length > 0 && (
        <div className="space-y-6">
          {/* Análisis de la Recomendación */}
          <div>
            <h2 className="text-xl font-bold mb-2">Análisis de la Recomendación</h2>
            <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200">{reasoning}</p>
            </div>
          </div>

          {/* Quinteto Recomendado */}
          <div>
            <h2 className="text-xl font-bold">Quinteto Recomendado</h2>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {recommendation.map((profile) => (
                <div
                  key={profile.playerId}
                  onClick={() => handleProfileClick(profile)}
                  className="group relative bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border-l-4 border-green-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <StatTooltip stats={profile.careerAverages} />
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
          </div>

          {/* Perfiles de Jugadores Considerados */}
          <div>
            <h2 className="text-xl font-bold">Perfiles de Jugadores Considerados</h2>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allProfiles.map((profile) => (
                <div
                  key={profile.playerId}
                  onClick={() => handleProfileClick(profile)}
                  className="group relative bg-white dark:bg-gray-900 p-3 rounded-lg shadow-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <p className="font-bold">{profile.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.tags.size > 0 ? (
                      Array.from(profile.tags).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-semibold rounded-full">{tag}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin perfil definido</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Jugador */}
      {isModalOpen && modalPlayerProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4">{modalPlayerProfile.name}</h3>
            <div className="mb-4">
              <h4 className="font-semibold text-lg mb-2">Perfil del Jugador:</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(modalPlayerProfile.tags).map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Estadísticas de Carrera (Promedios):</h4>
              {modalPlayerProfile.careerAverages ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <p><strong>Puntos:</strong> {modalPlayerProfile.careerAverages.avgPoints.toFixed(1)}</p>
                  <p><strong>Asistencias:</strong> {modalPlayerProfile.careerAverages.avgAst.toFixed(1)}</p>
                  <p><strong>Reb. Ofensivos:</strong> {modalPlayerProfile.careerAverages.avgOrb.toFixed(1)}</p>
                  <p><strong>Reb. Defensivos:</strong> {modalPlayerProfile.careerAverages.avgDrb.toFixed(1)}</p>
                  <p><strong>Robos:</strong> {modalPlayerProfile.careerAverages.avgStl.toFixed(1)}</p>
                  <p><strong>Pérdidas:</strong> {modalPlayerProfile.careerAverages.avgTov.toFixed(1)}</p>
                  <p><strong>3P Hechos:</strong> {modalPlayerProfile.careerAverages.avg3pm.toFixed(1)}</p>
                  <p><strong>3P Intentados:</strong> {modalPlayerProfile.careerAverages.avg3pa.toFixed(1)}</p>
                </div>
              ) : (
                <p className="text-gray-500">No hay suficientes estadísticas para mostrar.</p>
              )}
            </div>
            <button onClick={() => setIsModalOpen(false)} className="mt-6 w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
