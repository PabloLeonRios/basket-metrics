'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button'; // Added import
import Input from '@/components/ui/Input'; // Added import
import { IPlayer, ISession, sessionTypes } from '@/types/definitions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-toastify';

interface EditSessionFormProps {
  sessionId: string;
}

export default function EditSessionForm({ sessionId }: EditSessionFormProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<ISession | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGameEvents, setHasGameEvents] = useState(true);

  // --- FORM STATE ---
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<string>('');
  const [teamAName, setTeamAName] = useState('Equipo A');
  const [teamAPlayers, setTeamAPlayers] = useState<Set<string>>(new Set());
  const [teamBName, setTeamBName] = useState('Equipo B');
  const [teamBPlayers, setTeamBPlayers] = useState<Set<string>>(new Set());
  // --- END FORM STATE ---

  useEffect(() => {
    async function fetchData() {
      if (!user || !sessionId) return;
      try {
        setLoading(true);
        const [playersRes, sessionRes, eventsRes] = await Promise.all([
          fetch(`/api/players?coachId=${user._id}`),
          fetch(`/api/sessions/${sessionId}`),
          fetch(`/api/game-events?sessionId=${sessionId}`),
        ]);

        if (!playersRes.ok || !sessionRes.ok || !eventsRes.ok) {
          throw new Error('No se pudieron cargar los datos para editar.');
        }

        const { data: playersData } = await playersRes.json();
        const { data: sessionData } = await sessionRes.json();
        const { data: eventsData } = await eventsRes.json();

        setAllPlayers(playersData);
        setSession(sessionData);
        setHasGameEvents(eventsData.length > 0);

        setSessionName(sessionData.name);
        setSessionType(sessionData.sessionType);
        if (sessionData.teams[0]) {
          setTeamAName(sessionData.teams[0].name);
          setTeamAPlayers(new Set(sessionData.teams[0].players.map((p: any) => p._id || p)));
        }
        if (sessionData.teams[1]) {
          setTeamBName(sessionData.teams[1].name);
          setTeamBPlayers(new Set(sessionData.teams[1].players.map((p: any) => p._id || p)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast.error(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchData();
    }
  }, [sessionId, user, authLoading]);

  const handlePlayerToggle = (team: 'A' | 'B', playerId: string) => {
    const isPartido = sessionType === 'Partido';
    if (team === 'A') {
      setTeamAPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.has(playerId) ? newSet.delete(playerId) : newSet.add(playerId);
        return newSet;
      });
      if (isPartido) setTeamBPlayers((prev) => { const newSet = new Set(prev); newSet.delete(playerId); return newSet; });
    } else if (isPartido && team === 'B') {
      setTeamBPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.has(playerId) ? newSet.delete(playerId) : newSet.add(playerId);
        return newSet;
      });
      setTeamAPlayers((prev) => { const newSet = new Set(prev); newSet.delete(playerId); return newSet; });
    }
  };

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();

    const teams = [{ name: teamAName, players: Array.from(teamAPlayers) }];
    if (sessionType === 'Partido') {
      teams.push({ name: teamBName, players: Array.from(teamBPlayers) });
    }

    const updateData = { name: sessionName, sessionType, teams };

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('No se pudieron guardar los cambios.');
      toast.success('Sesión actualizada con éxito.');
      router.push('/panel/sessions');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.');
    }
  };

  const handleDeleteSession = async () => {
    if (hasGameEvents) {
      toast.error('No se puede eliminar una sesión que ya tiene eventos registrados.');
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar esta sesión? Esta acción es irreversible.')) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar la sesión.');
        toast.success('Sesión eliminada.');
        router.push('/panel/sessions');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar la sesión.');
      }
    }
  };

  const inputStyles = 'w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelStyles = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (loading) return <p>Cargando datos de la sesión...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <form onSubmit={handleSaveChanges} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sessionName" className={labelStyles}>Nombre de la Sesión</label>
          <Input type="text" id="sessionName" value={sessionName} onChange={(e) => setSessionName(e.target.value)} required inputSize="lg" className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg" />
        </div>
        <div>
          <label htmlFor="sessionType" className={labelStyles}>Tipo de Sesión</label>
          <select id="sessionType" value={sessionType} onChange={(e) => setSessionType(e.target.value)} className={inputStyles}>
            {sessionTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div className="space-y-3">
          <label className={labelStyles}>{sessionType === 'Partido' ? 'Nombre Equipo A' : 'Nombre del Grupo'}</label>
          <input type="text" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} className={inputStyles} />
          <p className={labelStyles}>Seleccionar Jugadores:</p>
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
            {allPlayers.map((player) => (
              <label key={player._id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <input type="checkbox" checked={teamAPlayers.has(player._id)} onChange={() => handlePlayerToggle('A', player._id)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                <span>{player.name}</span>
              </label>
            ))}
          </div>
        </div>
        {sessionType === 'Partido' && (
          <div className="space-y-3">
            <label className={labelStyles}>Nombre Equipo B</label>
            <input type="text" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} className={inputStyles} />
            <p className={labelStyles}>Seleccionar Jugadores:</p>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              {allPlayers.map((player) => (
                <label key={player._id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={teamBPlayers.has(player._id)} onChange={() => handlePlayerToggle('B', player._id)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                  <span>{player.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
        <Button type="submit" variant="primary" size="md">Guardar Cambios</Button>
        <Button type="button" variant="danger" size="md" onClick={handleDeleteSession} disabled={hasGameEvents}>Eliminar Sesión</Button>
      </div>
      {hasGameEvents && <p className="text-xs text-gray-500 mt-2">No se puede eliminar una sesión con eventos registrados.</p>}
    </form>
  );
}
