'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Tipo para el objeto Jugador
interface Player {
  _id: string;
  name: string;
  dorsal?: number;
  position?: string;
  team?: string;
}

export default function PlayerManager() {
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State para el formulario
  const [name, setName] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [position, setPosition] = useState('');
  const [team, setTeam] = useState('');

  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/players?coachId=${user.id}`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los jugadores.');
        }
        const { data } = await response.json();
        setPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchPlayers();
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const newPlayerData = {
        name,
        dorsal: Number(dorsal),
        position,
        team,
        coach: user.id,
      };
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayerData),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear el jugador.');
      }

      const { data: newPlayer } = await response.json();
      setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);

      // Limpiar formulario
      setName('');
      setDorsal('');
      setPosition('');
      setTeam('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear el jugador.');
    }
  };

  const inputStyles =
    'w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelStyles =
    'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="space-y-8">
      {/* Formulario para añadir jugador */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Añadir Nuevo Jugador</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className={labelStyles}>
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyles}
              placeholder="Ej: Michael Jordan"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dorsal" className={labelStyles}>
                Dorsal
              </label>
              <input
                type="number"
                id="dorsal"
                value={dorsal}
                onChange={(e) => setDorsal(e.target.value)}
                className={inputStyles}
                placeholder="Ej: 23"
              />
            </div>
            <div>
              <label htmlFor="position" className={labelStyles}>
                Posición
              </label>
              <input
                type="text"
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={inputStyles}
                placeholder="Ej: Escolta"
              />
            </div>
            <div>
              <label htmlFor="team" className={labelStyles}>
                Equipo (Opcional)
              </label>
              <input
                type="text"
                id="team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className={inputStyles}
                placeholder="Ej: Bulls"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Guardar Jugador
          </button>
        </form>
      </div>

      {/* Lista de Jugadores */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Jugadores del Equipo</h2>
        {loading && <p>Cargando jugadores...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && players.length === 0 && (
          <p>Aún no has añadido ningún jugador.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <Link
              href={`/panel/players/${player._id}`}
              key={player._id}
              className="block"
            >
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md flex items-center space-x-4 h-full transition-transform transform hover:scale-105 hover:shadow-lg">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                    {player.dorsal || '?'}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    {player.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {player.position || 'Sin posición'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
