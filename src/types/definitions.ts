// src/types/definitions.ts

// --- USER ---
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'entrenador' | 'jugador' | 'admin';
  isActive: boolean;
  team?: ITeam;
  failedLoginAttempts?: number;
  lockUntil?: Date | null;
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
  isActive?: boolean;
  isRival?: boolean;
}

// --- SESSION ---
export const sessionTypes = [
  'Partido',
  'Partido de Temporada',
  'Técnica',
  'Lanzamiento',
  'Otro',
] as const;
export type SessionType = (typeof sessionTypes)[number];

interface ITeamInSession {
  _id: string; // Los subdocumentos de Mongoose tienen _id por defecto
  name: string;
  players: (string | IPlayer)[]; // Puede ser un array de IDs (strings) o de objetos IPlayer poblados
}

export interface ISession {
  _id: string;
  coach: string;
  name: string;
  date: string;
  sessionType: SessionType;
  teams: ITeamInSession[];
  finishedAt?: string; // Nuevo campo para la fecha de finalización de la sesión
}

// --- GAME EVENT ---
export interface IGameEvent {
  _id: string;
  session: string;
  player: string;
  team: string;
  type:
    | 'tiro'
    | 'tiro_libre'
    | 'perdida'
    | 'rebote'
    | 'asistencia'
    | 'robo'
    | 'falta'
    | 'tapon'
    | 'substitution';
  details: Record<string, unknown>;
  createdAt?: string; // Campo para la fecha de creación del evento
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
