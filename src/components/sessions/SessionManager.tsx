'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { IPlayer, ISession, sessionTypes } from '@/types/definitions';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button'; // Import Button
import Input from '@/components/ui/Input';   // Import Input
import Dropdown from '@/components/ui/Dropdown'; // Import Dropdown
import Checkbox from '@/components/ui/Checkbox'; // Import Checkbox
import { useRouter } from 'next/navigation'; // Added import

export default function SessionManager() {
  const router = useRouter(); // Initialize router
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculationStatus, setCalculationStatus] = useState<{
    [sessionId: string]: 'idle' | 'calculating' | 'done' | 'error';
  }>({});
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(9); // Matches API default
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // --- FORM STATE ---
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<string>(sessionTypes[0]);
  const [teamAName, setTeamAName] = useState('Equipo A');
  const [teamAPlayers, setTeamAPlayers] = useState(new Set<string>()); // Corrected initialization
  const [teamBName, setTeamBName] = useState('Equipo B');
  const [teamBPlayers, setTeamBPlayers] = useState(new Set<string>()); // Corrected initialization
  // --- END FORM STATE ---

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const statusParam = activeTab === 'open' ? 'open' : 'closed';
        const [playersRes, sessionsRes] = await Promise.all([
          fetch(`/api/players?coachId=${user.id}`),
          fetch(`/api/sessions?coachId=${user.id}&page=${currentPage}&limit=${sessionsPerPage}&status=${statusParam}`),
        ]);

        if (!playersRes.ok || !sessionsRes.ok) {
          throw new Error('No se pudieron cargar los datos.');
        }

        const { data: playersData } = await playersRes.json();
        const { data: sessionsData, totalCount, totalPages: apiTotalPages } = await sessionsRes.json();

        setAllPlayers(playersData);
        setSessions(sessionsData);
        setTotalSessions(totalCount);
        setTotalPages(apiTotalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, currentPage, sessionsPerPage, activeTab]); // Updated dependencies

  const handlePlayerToggle = (team: 'A' | 'B', playerId: string) => {
    const isPartido = sessionType === 'Partido';
    if (team === 'A') {
      setTeamAPlayers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) newSet.delete(playerId);
        else newSet.add(playerId);
        return newSet;
      });
      if (isPartido)
        setTeamBPlayers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(playerId);
          return newSet;
        });
    } else if (isPartido && team === 'B') {
      setTeamBPlayers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) newSet.delete(playerId);
        else newSet.add(playerId);
        return newSet;
      });
      setTeamAPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const teams = [{ name: teamAName, players: Array.from(teamAPlayers) }];
    if (sessionType === 'Partido') {
      teams.push({ name: teamBName, players: Array.from(teamBPlayers) });
    }

    const newSessionData = {
      name: sessionName,
      coach: user.id,
      sessionType,
      teams,
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionData),
      });
      if (!response.ok) throw new Error('No se pudo crear la sesión');

      const { data: newSession } = await response.json(); // Capture newSession

      // Redirect to the tracker for the new session
      router.push(`/panel/tracker/${newSession._id}`);
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear la sesión');
    }
  };

  const handleCalculateStats = async (sessionId: string) => {
    setCalculationStatus((prev) => ({ ...prev, [sessionId]: 'calculating' }));
    try {
      const response = await fetch(`/api/engine/calculate/${sessionId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Falló el cálculo de estadísticas.');
      setCalculationStatus((prev) => ({ ...prev, [sessionId]: 'done' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al calcular.');
      setCalculationStatus((prev) => ({ ...prev, [sessionId]: 'error' }));
    }
  };

  const labelStyles = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'; // Keeping labelStyles

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulario */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Crear Nueva Sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sessionName" className={labelStyles}>
                Nombre de la Sesión
              </label>
              <Input // Using Input component
                type="text"
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ej: Partido vs Rivales"
                required
                inputSize="lg"
                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
              />
            </div>
            <div>
              <label htmlFor="sessionType" className={labelStyles}>
                Tipo de Sesión
              </label>
              <Dropdown
                options={sessionTypes.map(type => ({ value: type, label: type }))}
                value={sessionType}
                onChange={setSessionType}
                className="w-full" // Apply width here
                inputSize="lg" // Added for consistency
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* --- Columna Equipo A / Grupo --- */}
            <div className="space-y-3">
              <label className={labelStyles}>
                {sessionType === 'Partido'
                  ? 'Nombre Equipo A'
                  : 'Nombre del Grupo'}
              </label>
              <Input // Using Input component
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                inputSize="lg"
                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
              />
              <p className={labelStyles}>Seleccionar Jugadores:</p>
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                {allPlayers.map((player) => (
                  <div // Changed from label to div, as Checkbox has its own label
                    key={player._id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Checkbox // Using Checkbox component
                      id={`teamA-player-${player._id}`}
                      checked={teamAPlayers.has(player._id)}
                      onChange={() => handlePlayerToggle('A', player._id)}
                      label={player.name}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* --- Columna Equipo B (Solo si es Partido) --- */}
            {sessionType === 'Partido' && (
              <div className="space-y-3">
                <label className={labelStyles}>Nombre Equipo B</label>
                <Input // Using Input component
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  inputSize="lg"
                  className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
                />
                <p className={labelStyles}>Seleccionar Jugadores:</p>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  {allPlayers.map((player) => (
                    <div // Changed from label to div, as Checkbox has its own label
                      key={player._id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <Checkbox // Using Checkbox component
                        id={`teamB-player-${player._id}`}
                        checked={teamBPlayers.has(player._id)}
                        onChange={() => handlePlayerToggle('B', player._id)}
                        label={player.name}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button // Using Button component
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto" // Retain specific width classes
          >
            Crear Sesión
          </Button>
        </form>
      </div>

      {/* Lista de Sesiones */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => { setActiveTab('open'); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'open' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Abiertas ({activeTab === 'open' ? totalSessions : '...'})
            </button>
            <button 
                onClick={() => { setActiveTab('closed'); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'closed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Cerradas ({activeTab === 'closed' ? totalSessions : '...'})
            </button>
        </div>

        {sessions.length === 0 && totalSessions === 0 && <p>No hay sesiones en esta categoría.</p>} {/* Use sessions.length */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => ( // Use sessions directly
            <div
              key={session._id}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md flex flex-col h-full transition-transform transform hover:scale-105 hover:shadow-lg" // Fixed layout
            >
              <div className="flex-grow">
                <p className="font-bold text-lg">{session.name}</p>
                <div className="text-sm text-gray-500">
                  <p>{session.sessionType}</p>
                  <p>Inicio: {new Date(session.date).toLocaleString()}</p>
                  {session.finishedAt && (
                    <p className="text-green-600">Fin: {new Date(session.finishedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 w-full"> {/* Fixed layout */}
                {activeTab === 'open' ? ( // activeTab 'open' logic
                  <>
                    <Link
                      href={`/panel/tracker/${session._id}`}
                      className="text-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 w-full"
                    >
                      Ir al Tracker
                    </Link>
                    <Link
                      href={`/panel/sessions/${session._id}/edit`}
                      className="text-center bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 w-full"
                    >
                      Editar
                    </Link>
                  </>
                ) : null}

                {(session.sessionType === 'Partido' || session.sessionType === 'Lanzamiento') && (
                  <>
                    <Button // Using Button component
                      onClick={() => handleCalculateStats(session._id)}
                      disabled={calculationStatus[session._id] === 'calculating' || calculationStatus[session._id] === 'done'}
                      variant="secondary" // Assuming a greyish button is secondary
                      size="md"
                      className="w-full" // Retain specific width class
                    >
                      {calculationStatus[session._id] === 'calculating'
                        ? 'Calculando...'
                        : 'Calcular/Recalcular Stats'}
                    </Button>
                    {(calculationStatus[session._id] === 'done' || session.finishedAt) && (
                      <Link
                        href={`/panel/dashboard/${session._id}`}
                        className="text-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 w-full"
                      >
                        Resumen
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
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
