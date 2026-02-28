// src/components/tracker/GameTracker.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Court from './Court';
import GameLog from './GameLog';
import FloatingStats from './FloatingStats';
import SubstitutionModal from './SubstitutionModal';
import { toast } from 'react-toastify';
import { IGameEvent, IPlayer, ISession } from '@/types/definitions';
import Button from '@/components/ui/Button';
import PlayerStatsModal from './PlayerStatsModal';
import { isThreePointer } from '@/lib/court-geometry';
import { MagnifyingGlassIcon, FlagIcon, ArrowRightIcon, LightBulbIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

// --- Types ---
interface TrackerSessionData extends ISession {
  currentQuarter: number;
  teams: TeamData[];
}
interface TeamData {
  _id: string;
  name: string;
  players: IPlayer[];
}
interface SelectedPlayer {
  id: string;
  name: string;
  teamName: string;
}

const getActionButtonClass = (eventType: string) => {
    // ... (esta función se mantiene igual)
    return '';
};

// --- Component ---
export default function GameTracker({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  // --- State ---
  const [session, setSession] = useState<TrackerSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [gameEvents, setGameEvents] = useState<IGameEvent[]>([]);
  const [onCourtPlayerIds, setOnCourtPlayerIds] = useState<Set<string>>(new Set());
  
  // Modals State
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerToSubOut, setPlayerToSubOut] = useState<IPlayer | null>(null);
  const [showShotModal, setShowShotModal] = useState(false);
  const [shotCoordinates, setShotCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [shotValue, setShotValue] = useState<2 | 3>(2);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState<{player: IPlayer, stats: any} | null>(null);
  
  // --- Derived State ---
  const isSessionFinished = useMemo(() => !!session?.finishedAt, [session]);
  const currentQuarter = useMemo(() => session?.currentQuarter || 1, [session]);
  const allPlayers = useMemo(() => session?.teams.flatMap(t => t.players) || [], [session]);
  const playerIdToName = useMemo(() => Object.fromEntries(allPlayers.map(p => [p._id, p.name])), [allPlayers]);
  const benchPlayers = useMemo(() => allPlayers.filter(p => !onCourtPlayerIds.has(p._id)), [allPlayers, onCourtPlayerIds]);

  // --- Data Fetching ---
  useEffect(() => {
    async function fetchSessionData() {
      try {
        setLoading(true);
        // ... (fetch logic sin cambios)
        const [sessionRes, eventsRes] = await Promise.all([
          fetch(`/api/sessions/${sessionId}`),
          fetch(`/api/game-events?sessionId=${sessionId}`),
        ]);
        if (!sessionRes.ok) throw new Error('Error al cargar la sesión');
        if (!eventsRes.ok) throw new Error('Error al cargar los eventos');
        const { data: sessionData } = await sessionRes.json();
        const { data: eventsData } = await eventsRes.json();
        setSession(sessionData);
        setGameEvents(eventsData);

        // --- Lógica de Jugadores en Cancha ---
        const onCourtIds = new Set<string>();
        // Si es un partido, se gestionan los jugadores en cancha. Si no, todos están "en cancha".
        if (sessionData.sessionType === 'Partido') {
            const subs = eventsData.filter((e: IGameEvent) => e.type === 'substitution').sort((a: IGameEvent, b: IGameEvent) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
            const initialStarters = new Set<string>();
            sessionData.teams.forEach((team: TeamData) => {
                team.players.slice(0, 5).forEach((p: IPlayer) => initialStarters.add(p._id));
            });

            // Replay all substitutions over the initial starters
            subs.forEach((event: IGameEvent) => {
                const details = event.details as { playerIn: string, playerOut: string };
                initialStarters.delete(details.playerOut);
                initialStarters.add(details.playerIn);
            });
            initialStarters.forEach(id => onCourtIds.add(id));
        } else {
            // Para otros tipos de sesión, todos los jugadores se consideran en cancha
            allPlayers.forEach(p => onCourtIds.add(p._id));
        }
        setOnCourtPlayerIds(onCourtIds);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Un error desconocido ha ocurrido.');
      } finally {
        setLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId, allPlayers]);

  // --- Event Handlers ---
  const logEvent = useCallback(async (type: string, details: Record<string, unknown>) => {
      // ... (lógica de logEvent sin cambios importantes, pero asegurando que el 'teamName' sea correcto)
    if (!selectedPlayer && type !== 'substitution') { toast.error('No hay jugador seleccionado.'); return; }
    if (isSessionFinished) { toast.warn('La sesión ya ha finalizado.'); return; }
    
    let eventPlayerId = selectedPlayer?.id;
    let eventTeamName = selectedPlayer?.teamName;

    if (type === 'substitution') {
        const { playerOut } = details as { playerOut: IPlayer };
        eventPlayerId = playerOut._id;
        const playerTeam = allPlayers.find(p => p._id === playerOut._id)?.team;
        const teamDoc = session?.teams.find(t => t._id === playerTeam);
        eventTeamName = teamDoc?.name || 'N/A';
    }
    
    if (!eventPlayerId) return;

    const eventData = { session: sessionId, player: eventPlayerId, team: eventTeamName, type, details, quarter: currentQuarter };
    try {
      const response = await fetch('/api/game-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      if (!response.ok) throw new Error(`No se pudo registrar el evento: ${type}`);
      const { data: newEvent } = await response.json();
      setGameEvents(prev => [newEvent, ...prev]);
      if(type !== 'substitution') toast.success(`Evento '${type}' registrado.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar evento.');
    }
  }, [selectedPlayer, sessionId, isSessionFinished, currentQuarter, allPlayers, session?.teams]);

  const handleManualSubstitution = (playerIn: IPlayer) => {
    if (!playerToSubOut || isSessionFinished) return;
    setOnCourtPlayerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerToSubOut._id);
        newSet.add(playerIn._id);
        return newSet;
    });
    logEvent('substitution', { playerIn: { _id: playerIn._id, name: playerIn.name }, playerOut: { _id: playerToSubOut._id, name: playerToSubOut.name } });
    toast.success(`${playerIn.name} entra por ${playerToSubOut.name}.`);
    setShowSubModal(false);
    setPlayerToSubOut(null);
  };
  
  const handleUpdateSession = useCallback(async (updateData: Partial<TrackerSessionData>) => { /* ... */ }, [sessionId]);
  const handleAdvanceQuarter = () => { /* ... */ };
  const handleFinishSession = async () => { /* ... */ };
  const handleCourtClick = useCallback((x: number, y: number) => { /* ... */ }, [selectedPlayer, isSessionFinished, onCourtPlayerIds]);
  const handleShot = (made: boolean) => { /* ... */ };

  // --- Render ---
  if (loading) return <div>Cargando tracker...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!session) return <div>No se encontraron datos de la sesión.</div>;
  
  const teamA = session.teams[0];
  const teamB = session.teams.length > 1 ? session.teams[1] : null;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Left Column */}
        <div className="w-full lg:w-1/4 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-3">Control del Partido</h3>
            {/* ... botones de control ... */}
          </div>
          {[teamA, teamB].filter((team): team is TeamData => !!team).map(team => (
            <div key={team._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{team.name}</h3>
              <div className="space-y-1">
                {team.players.map((player) => {
                  const isOnCourt = onCourtPlayerIds.has(player._id);
                  const isPartido = session.sessionType === 'Partido';
                  return (
                    <div key={player._id} className={`flex items-center justify-between ${!isOnCourt && isPartido ? 'opacity-50' : ''}`}>
                      <button onClick={() => setSelectedPlayer({ id: player._id, name: player.name, teamName: team.name })} className={`flex-grow text-left p-2 rounded-md ${selectedPlayer?.id === player._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {isPartido && <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${isOnCourt ? 'bg-green-400' : 'bg-gray-400'}`}></span>}
                        #{player.dorsal} - {player.name}
                      </button>
                      {isPartido && <button onClick={() => { setPlayerToSubOut(player); setShowSubModal(true); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-1"><ArrowsRightLeftIcon className="h-5 w-5" /></button>}
                      <button onClick={() => { /* handleShowPlayerStats */ }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-1"><MagnifyingGlassIcon className="h-5 w-5" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Center Column */}
        <div className="flex-1 lg:max-w-2xl mx-auto flex flex-col gap-4">
            <Court onClick={handleCourtClick} shotCoordinates={shotCoordinates} />
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                <span>Acciones Rápidas</span>
                <span className="text-blue-500 text-sm font-medium">{selectedPlayer?.name || ''}</span>
              </h3>
              <div className="grid grid-cols-4 gap-2">
                 {/* ... botones de acciones ... */}
                <Button onClick={() => logEvent('asistencia', {})} disabled={!selectedPlayer || isSessionFinished}>AST</Button>
                <Button onClick={() => logEvent('robo', {})} disabled={!selectedPlayer || isSessionFinished}>ROBO</Button>
                <Button onClick={() => logEvent('tapon', {})} disabled={!selectedPlayer || isSessionFinished}>TAP</Button>
                <Button onClick={() => logEvent('perdida', {})} disabled={!selectedPlayer || isSessionFinished}>PER</Button>
                <Button onClick={() => logEvent('rebote', { type: 'ofensivo' })} disabled={!selectedPlayer || isSessionFinished}>REB-O</Button>
                <Button onClick={() => logEvent('rebote', { type: 'defensivo' })} disabled={!selectedPlayer || isSessionFinished}>REB-D</Button>
                <Button onClick={() => logEvent('falta', {})} disabled={!selectedPlayer || isSessionFinished}>FALTA</Button>
                <Button disabled={isSessionFinished}><LightBulbIcon className="h-5 w-5" /></Button>
              </div>
            </div>
            <FloatingStats events={gameEvents} />
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/4">
          <GameLog events={gameEvents} playerIdToName={playerIdToName} onUndo={() => {}} isSessionFinished={isSessionFinished} sessionId={sessionId} />
        </div>
      </div>
      
      {/* Modals */}
      <SubstitutionModal 
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        playerToSubOut={playerToSubOut}
        benchPlayers={benchPlayers}
        onSubstitute={handleManualSubstitution}
      />
      {/* ... otros modales */}
    </>
  );
}
