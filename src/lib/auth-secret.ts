// src/lib/auth-secret.ts

// Usar una variable de entorno o un servicio de gestión de secretos para esto en producción
if (!process.env.JWT_SECRET) {
  throw new Error('La variable de entorno JWT_SECRET no está definida.');
}

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
