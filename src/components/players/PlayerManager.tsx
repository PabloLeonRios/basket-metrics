'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { IPlayer } from '@/types/definitions'; // Importar IPlayer
import Button from '@/components/ui/Button'; // Import Button
import Input from '@/components/ui/Input';   // Import Input

export default function PlayerManager() {
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State para el formulario
  const [name, setName] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [position, setPosition] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(9); // Matches API default
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      try {
        setLoading(true);
        const response = await fetch(
          `/api/players?coachId=${user.id}&page=${currentPage}&limit=${playersPerPage}`
        );
        if (!response.ok) {
          throw new Error('No se pudieron cargar los jugadores.');
        }
        const { data, totalCount, totalPages: apiTotalPages } = await response.json();
        setPlayers(data);
        setTotalPlayers(totalCount);
        setTotalPages(apiTotalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchPlayers();
    }
  }, [user, authLoading, currentPage, playersPerPage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const newPlayerData = {
        name,
        dorsal: Number(dorsal),
        position,
        team: user.team?.name, // Autocompletado del equipo del entrenador
        coach: user.id,
      };
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo crear el jugador.');
      }

      // After creating a new player, reset to first page to see the new player
      setCurrentPage(1);

      // Limpiar formulario
      setName('');
      setDorsal('');
      setPosition('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear el jugador.');
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
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
            <Input // Using Input component
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Michael Jordan"
              required
              inputSize="lg"
              className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dorsal" className={labelStyles}>
                Dorsal
              </label>
              <Input // Using Input component
                type="number"
                id="dorsal"
                value={dorsal}
                onChange={(e) => setDorsal(e.target.value)}
                placeholder="Ej: 23"
                inputSize="lg"
                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
              />
            </div>
            <div>
              <label htmlFor="position" className={labelStyles}>
                Posición
              </label>
              <Input // Using Input component
                type="text"
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ej: Escolta"
                inputSize="lg"
                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
              />
            </div>
            <div>
              <label htmlFor="team" className={labelStyles}>
                Equipo
              </label>
              <Input // Using Input component
                type="text"
                id="team"
                value={user?.team?.name || 'Sin equipo asignado'}
                className="bg-gray-200 dark:bg-gray-700 cursor-not-allowed border-gray-200 dark:border-gray-700 text-lg" // Kept specific styles
                disabled
                inputSize="lg"
              />
            </div>
          </div>
          <Button // Using Button component
            type="submit"
            disabled={!user?.team}
            variant="primary"
            size="md"
            className="w-full sm:w-auto" // Retain specific width classes
          >
            {user?.team ? 'Guardar Jugador' : 'Asigna un equipo a tu perfil'}
          </Button>
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
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                variant={currentPage === page ? 'primary' : 'secondary'}
                size="sm"
                className={currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'} // Add specific styles for selected page
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
