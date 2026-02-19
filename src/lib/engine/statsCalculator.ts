// src/lib/engine/statsCalculator.ts
import dbConnect from '../dbConnect';
import GameEvent from '../models/GameEvent';
import Session from '../models/Session';
import PlayerGameStats from '../models/PlayerGameStats';
import TeamGameStats from '../models/TeamGameStats';
import { IGameEvent, ISession } from '@/types/definitions';

// --- INTERFACES ---
interface TeamTotals {
  points: number;
  possessions: number;
  fga: number;
  orb: number;
  tov: number;
  fta: number;
}
interface PlayerStats {
  points: number;
  fga: number;
  fgm: number;
  '3pa': number;
  '3pm': number;
  fta: number;
  ftm: number;
  orb: number;
  drb: number;
  ast: number;
  stl: number;
  tov: number;
  blk: number;
  pf: number;
}

// --- MAIN FUNCTION ---
export async function calculateStatsForSession(
  sessionId: string,
): Promise<void> {
  await dbConnect();

  const session = await Session.findById(sessionId);
  if (!session) throw new Error('Sesión no encontrada');

  const events = await GameEvent.find({ session: sessionId }).sort({
    createdAt: 'asc',
  });
  if (events.length === 0) {
    console.log('No hay eventos para esta sesión.');
    return;
  }

  console.log(`--- Iniciando cálculo para: ${session.name} ---`);

  if (session.sessionType === 'Partido' && session.teams.length === 2) {
    await calculateAndSaveTeamStats(session, events);
  }

  const allPlayerIds = session.teams.flatMap((team) => team.players);

  for (const playerId of allPlayerIds) {
    const playerEvents = events.filter(
      (e) => e.player.toString() === playerId.toString(),
    );
    if (playerEvents.length > 0) {
      const playerStats = calculatePlayerStats(playerEvents);

      const gameScore =
        playerStats.points +
        0.4 * playerStats.fgm -
        0.7 * playerStats.fga -
        0.4 * (playerStats.fta - playerStats.ftm) +
        0.7 * playerStats.orb +
        0.3 * playerStats.drb +
        playerStats.stl +
        0.7 * playerStats.ast +
        0.7 * playerStats.blk -
        0.4 * playerStats.pf -
        playerStats.tov;

      const advancedStats = {
        eFG:
          playerStats.fga > 0
            ? (playerStats.fgm + 0.5 * playerStats['3pm']) / playerStats.fga
            : 0,
        TS:
          playerStats.fga + 0.44 * playerStats.fta > 0
            ? playerStats.points /
              (2 * (playerStats.fga + 0.44 * playerStats.fta))
            : 0,
        gameScore: gameScore,
      };

      await PlayerGameStats.findOneAndUpdate(
        { session: sessionId, player: playerId },
        {
          session: sessionId,
          player: playerId,
          ...playerStats,
          ...advancedStats,
        },
        { upsert: true, new: true },
      );
      console.log(`Stats guardadas para el jugador: ${playerId}`);
    }
  }
  console.log(`--- Cálculo completado para: ${session.name} ---`);
}

// --- HELPER FUNCTIONS ---

async function calculateAndSaveTeamStats(
  session: ISession,
  events: IGameEvent[],
): Promise<void> {
  const [team1, team2] = session.teams;

  const eventsTeam1 = events.filter((e) => e.team === team1.name);
  const eventsTeam2 = events.filter((e) => e.team === team2.name);

  const statsTeam1 = getTeamTotals(eventsTeam1);
  const statsTeam2 = getTeamTotals(eventsTeam2);

  const ortgTeam1 =
    statsTeam1.possessions > 0
      ? (statsTeam1.points / statsTeam1.possessions) * 100
      : 0;
  const ortgTeam2 =
    statsTeam2.possessions > 0
      ? (statsTeam2.points / statsTeam2.possessions) * 100
      : 0;

  await TeamGameStats.findOneAndUpdate(
    { session: session._id, teamName: team1.name },
    {
      session: session._id,
      teamName: team1.name,
      ...statsTeam1,
      ortg: ortgTeam1,
      drtg: ortgTeam2,
    },
    { upsert: true, new: true },
  );
  await TeamGameStats.findOneAndUpdate(
    { session: session._id, teamName: team2.name },
    {
      session: session._id,
      teamName: team2.name,
      ...statsTeam2,
      ortg: ortgTeam2,
      drtg: ortgTeam1,
    },
    { upsert: true, new: true },
  );
  console.log(`Stats de equipo guardadas para ${team1.name} y ${team2.name}`);
}

function getTeamTotals(events: IGameEvent[]): TeamTotals {
  let points = 0,
    fga = 0,
    orb = 0,
    tov = 0,
    fta = 0;
  for (const event of events) {
    if (event.type === 'tiro') {
      const details = event.details as { made: boolean; value: number };
      if (details.made) points += details.value;
      if (details.value > 1) fga++;
      else fta++;
    } else if (event.type === 'rebote') {
      const details = event.details as { type: string };
      if (details.type === 'ofensivo') orb++;
    } else if (event.type === 'perdida') {
      tov++;
    }
  }
  const possessions = fga - orb + tov + 0.44 * fta;
  return { points, possessions: Math.round(possessions), fga, orb, tov, fta };
}

function calculatePlayerStats(playerEvents: IGameEvent[]): PlayerStats {
  const stats: PlayerStats = {
    points: 0,
    fga: 0,
    fgm: 0,
    '3pa': 0,
    '3pm': 0,
    fta: 0,
    ftm: 0,
    orb: 0,
    drb: 0,
    ast: 0,
    stl: 0,
    tov: 0,
    blk: 0,
    pf: 0,
  };
  for (const event of playerEvents) {
    switch (event.type) {
      case 'tiro':
        const tiroDetails = event.details as { made: boolean; value: number };
        if (tiroDetails.value > 1) stats.fga++;
        if (tiroDetails.value === 3) stats['3pa']++;
        if (tiroDetails.value === 1) stats.fta++;
        if (tiroDetails.made) {
          stats.points += tiroDetails.value;
          if (tiroDetails.value > 1) stats.fgm++;
          if (tiroDetails.value === 3) stats['3pm']++;
          if (tiroDetails.value === 1) stats.ftm++;
        }
        break;
      case 'rebote':
        const reboteDetails = event.details as { type: string };
        if (reboteDetails.type === 'ofensivo') stats.orb++;
        else stats.drb++;
        break;
      case 'asistencia':
        stats.ast++;
        break;
      case 'robo':
        stats.stl++;
        break;
      case 'perdida':
        stats.tov++;
        break;
      case 'tapón':
        stats.blk++;
        break;
      case 'falta':
        stats.pf++;
        break;
    }
  }
  return stats;
}
