// src/lib/constants.ts

export const COOKIE_NAME = 'token';

export const ROLES = {
  ADMIN: 'admin',
  COACH: 'entrenador',
  PLAYER: 'jugador',
} as const; // 'as const' para que TypeScript infiera los valores como literales

export const EXPIRATION_TIME = '24h';
export const MAX_AGE_COOKIE = 60 * 60 * 24; // 1 día en segundos
