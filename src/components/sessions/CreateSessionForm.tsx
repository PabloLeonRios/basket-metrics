'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { IPlayer, sessionTypes } from '@/types/definitions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import Checkbox from '@/components/ui/Checkbox';
import { toast } from 'react-toastify';

export default function CreateSessionForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Player fetching state
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<string>(sessionTypes[0]);
  const [teamAName, setTeamAName] = useState('Equipo A');
  const [teamAPlayers, setTeamAPlayers] = useState(new Set<string>());
  const [teamBName, setTeamBName] = useState('Equipo B');
  const [teamBPlayers, setTeamBPlayers] = useState(new Set<string>());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch players available to the user/admin
  useEffect(() => {
    async function fetchPlayers() {
      if (!user) return;
      try {
        setPlayersLoading(true);
        const isAdmin = user.role === 'admin';
        let playersUrl = '/api/players?';
        if (!isAdmin) {
          playersUrl += `coachId=${user._id}`;
        }

        const playersRes = await fetch(playersUrl);
        if (!playersRes.ok) throw new Error('No se pudieron cargar los jugadores.');

        const { data: playersData } = await playersRes.json();
        setAllPlayers(playersData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cargar jugadores.');
      } finally {
        setPlayersLoading(false);
      }
    }
    if (!authLoading) {
      fetchPlayers();
    }
  }, [user, authLoading]);

  // Handle "Partido de Temporada" auto-population
  useEffect(() => {
    if (sessionType === 'Partido de Temporada' && !playersLoading && user && user.team?.name && allPlayers.length > 0) {
      const coachTeamName = user.team.name;
      setTeamAName(coachTeamName);

      const teamAIds = new Set<string>();

      allPlayers.forEach(player => {
        if (player.team === coachTeamName) {
          teamAIds.add(player._id);
        }
      });

      setTeamAPlayers(teamAIds);

      // We clear Team B so the user can select generic players
      setTeamBPlayers(new Set<string>());
      setTeamBName('Equipo B');
    }
  }, [sessionType, playersLoading, user, allPlayers]);

  const handlePlayerToggle = (team: 'A' | 'B', playerId: string) => {
    const isPartido = sessionType === 'Partido' || sessionType === 'Partido de Temporada';
    if (team === 'A') {
      setTeamAPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) newSet.delete(playerId);
        else newSet.add(playerId);
        return newSet;
      });
      if (isPartido) setTeamBPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    } else if (isPartido && team === 'B') {
      setTeamBPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) newSet.delete(playerId);
        else newSet.add(playerId);
        return newSet;
      });
      setTeamAPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    const teams = [{ name: teamAName, players: Array.from(teamAPlayers) }];
    if (sessionType === 'Partido' || sessionType === 'Partido de Temporada') {
      teams.push({ name: teamBName, players: Array.from(teamBPlayers) });
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName, coach: user._id, sessionType, teams, date: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('No se pudo crear la sesión');

      const { data: newSession } = await response.json();
      toast.success('Sesión creada. Redirigiendo al tracker...');
      router.push(`/panel/tracker/${newSession._id}`);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la sesión.');
      setIsSubmitting(false);
    }
  };

  const labelStyles = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Crear Nueva Sesión</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... Form fields ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sessionName" className={labelStyles}>Nombre de la Sesión</label>
            <Input type="text" id="sessionName" value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Ej: Partido vs Rivales" required inputSize="lg" />
          </div>
          <div>
            <label htmlFor="sessionType" className={labelStyles}>Tipo de Sesión</label>
            <Dropdown options={sessionTypes.map(type => ({ value: type, label: type }))} value={sessionType} onChange={setSessionType} className="w-full" inputSize="lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-3">
            <label className={labelStyles}>{(sessionType === 'Partido' || sessionType === 'Partido de Temporada') ? 'Nombre Equipo A' : 'Nombre del Grupo'}</label>
            <Input type="text" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} inputSize="lg" />
            <p className={labelStyles}>Seleccionar Jugadores:</p>
            <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              {playersLoading ? <p>Cargando jugadores...</p> : allPlayers
                .filter(player => sessionType !== 'Partido de Temporada' || !user?.team?.name || player.team === user.team.name)
                .map((player) => (
                <div key={player._id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  <Checkbox id={`teamA-player-${player._id}`} checked={teamAPlayers.has(player._id)} onChange={() => handlePlayerToggle('A', player._id)} label={player.name} />
                </div>
              ))}
            </div>
          </div>
          {(sessionType === 'Partido' || sessionType === 'Partido de Temporada') && (
            <div className="space-y-3">
              <label className={labelStyles}>Nombre Equipo B</label>
              <Input type="text" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} inputSize="lg" />
              <p className={labelStyles}>Seleccionar Jugadores:</p>
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                {playersLoading ? <p>Cargando jugadores...</p> : allPlayers
                  .filter(player => sessionType !== 'Partido de Temporada' || !user?.team?.name || player.team !== user.team.name)
                  .map((player) => (
                  <div key={player._id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <Checkbox id={`teamB-player-${player._id}`} checked={teamBPlayers.has(player._id)} onChange={() => handlePlayerToggle('B', player._id)} label={player.name} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Sesión e ir al Tracker'}
        </Button>
      </form>
    </div>
  );
}
