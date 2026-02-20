// src/types/definitions.ts

// --- USER ---
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'entrenador' | 'jugador' | 'admin';
  isActive: boolean;
  team?: ITeam;
  createdAt: string;
  updatedAt: string;
}

// --- TEAM ---
export interface ITeam {
  _id: string;
  name: string;
}

// --- PLAYER ---
export interface IPlayer {
  _id: string;
  user: string;
  coach: string;
  name: string;
  position?: string;
  dorsal?: number;
  team?: string;
}

// --- SESSION ---
export const sessionTypes = [
  'Partido',
  'Técnica',
  'Lanzamiento',
  'Otro',
] as const;
export type SessionType = (typeof sessionTypes)[number];

interface ITeamInSession {
  name: string;
  players: string[]; // Referencias a jugadores
}

export interface ISession {
  _id: string;
  coach: string;
  name: string;
  date: string;
  sessionType: SessionType;
  teams: ITeamInSession[];
}

// --- GAME EVENT ---
export interface IGameEvent {
  _id: string;
  session: string;
  player: string;
  team: string;
  type:
    | 'tiro'
    | 'perdida'
    | 'rebote'
    | 'asistencia'
    | 'robo'
    | 'falta'
    | 'tapón';
  details: Record<string, unknown>;
}

// --- STATS ---
export interface ITeamGameStats {
  _id: string;
  session: string;
  teamName: string;
  points: number;
  possessions: number;
  ortg: number;
  drtg: number;
}

export interface IPlayerGameStats {
  _id: string;
  session: string;
  player: string;
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
  eFG: number;
  TS: number;
  gameScore: number;
}
