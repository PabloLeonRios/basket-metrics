// src/lib/constants.ts

// Usar una variable de entorno o un servicio de gestión de secretos para esto en producción
if (!process.env.JWT_SECRET) {
  throw new Error('La variable de entorno JWT_SECRET no está definida.');
}
export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const COOKIE_NAME = 'token';

export const ROLES = {
  ADMIN: 'admin',
  COACH: 'entrenador',
  PLAYER: 'jugador',
} as const; // 'as const' para que TypeScript infiera los valores como literales

export const EXPIRATION_TIME = '24h';
export const MAX_AGE_COOKIE = 60 * 60 * 24; // 1 día en segundos
