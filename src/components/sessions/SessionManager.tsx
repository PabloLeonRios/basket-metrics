'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { IPlayer, ISession, sessionTypes } from '@/types/definitions';
import { useAuth } from '@/hooks/useAuth';

export default function SessionManager() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculationStatus, setCalculationStatus] = useState<{
    [sessionId: string]: 'idle' | 'calculating' | 'done' | 'error';
  }>({});
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  // --- FORM STATE ---
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<string>(sessionTypes[0]);
  const [teamAName, setTeamAName] = useState('Equipo A');
  const [teamAPlayers, setTeamAPlayers] = useState<Set<string>>(new Set());
  const [teamBName, setTeamBName] = useState('Equipo B');
  const [teamBPlayers, setTeamBPlayers] = useState<Set<string>>(new Set());
  // --- END FORM STATE ---

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const [playersRes, sessionsRes] = await Promise.all([
          fetch(`/api/players?coachId=${user.id}`),
          fetch(`/api/sessions?coachId=${user.id}`),
        ]);

        if (!playersRes.ok || !sessionsRes.ok) {
          throw new Error('No se pudieron cargar los datos.');
        }

        const { data: playersData } = await playersRes.json();
        const { data: sessionsData } = await sessionsRes.json();

        setAllPlayers(playersData);
        setSessions(sessionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const { openSessions, closedSessions } = useMemo(() => {
    const open: ISession[] = [];
    const closed: ISession[] = [];
    sessions.forEach(session => {
      if (session.finishedAt) {
        closed.push(session);
      } else {
        open.push(session);
      }
    });
    return { openSessions: open, closedSessions: closed };
  }, [sessions]);

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

      const { data: newSession } = await response.json();
      setSessions((prev) => [newSession, ...prev]);

      // Reset form
      setSessionName('');
      setTeamAPlayers(new Set());
      setTeamBPlayers(new Set());
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

  const inputStyles =
    'w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelStyles =
    'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  
  const sessionsToDisplay = activeTab === 'open' ? openSessions : closedSessions;

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
              <input
                type="text"
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className={inputStyles}
                placeholder="Ej: Partido vs Rivales"
                required
              />
            </div>
            <div>
              <label htmlFor="sessionType" className={labelStyles}>
                Tipo de Sesión
              </label>
              <select
                id="sessionType"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className={inputStyles}
              >
                {sessionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className={inputStyles}
              />
              <p className={labelStyles}>Seleccionar Jugadores:</p>
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                {allPlayers.map((player) => (
                  <label
                    key={player._id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={teamAPlayers.has(player._id)}
                      onChange={() => handlePlayerToggle('A', player._id)}
                      className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{player.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* --- Columna Equipo B (Solo si es Partido) --- */}
            {sessionType === 'Partido' && (
              <div className="space-y-3">
                <label className={labelStyles}>Nombre Equipo B</label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className={inputStyles}
                />
                <p className={labelStyles}>Seleccionar Jugadores:</p>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  {allPlayers.map((player) => (
                    <label
                      key={player._id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={teamBPlayers.has(player._id)}
                        onChange={() => handlePlayerToggle('B', player._id)}
                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{player.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Crear Sesión
          </button>
        </form>
      </div>

      {/* Lista de Sesiones */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => setActiveTab('open')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'open' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Abiertas ({openSessions.length})
            </button>
            <button 
                onClick={() => setActiveTab('closed')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'closed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Cerradas ({closedSessions.length})
            </button>
        </div>

        {sessionsToDisplay.length === 0 && <p>No hay sesiones en esta categoría.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessionsToDisplay.map((session) => (
            <div
              key={session._id}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md flex flex-col"
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
              <div className="mt-4 flex flex-col gap-2">
                {activeTab === 'open' ? (
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
                    <button
                      onClick={() => handleCalculateStats(session._id)}
                      disabled={calculationStatus[session._id] === 'calculating' || calculationStatus[session._id] === 'done'}
                      className="text-center bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 w-full disabled:bg-gray-400"
                    >
                      {calculationStatus[session._id] === 'calculating'
                        ? 'Calculando...'
                        : 'Calcular/Recalcular Stats'}
                    </button>
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
      </div>
    </div>
  );
}
