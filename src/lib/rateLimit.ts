// src/lib/rateLimit.ts

interface RateLimitStore {
  [ip: string]: {
    count: number;
    startTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Un limitador de tasa simple en memoria.
 * @param ip El identificador del cliente (generalmente la IP).
 * @param limit El número máximo de peticiones permitidas.
 * @param windowMs El tiempo en el que se permite el número de peticiones.
 * @returns Un objeto con 'success' y 'remaining'.
 */
export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();

  if (!store[ip]) {
    store[ip] = { count: 1, startTime: now };
    return { success: true, remaining: limit - 1 };
  }

  const { count, startTime } = store[ip];

  // Si el tiempo de la ventana ha pasado, resetear
  if (now - startTime > windowMs) {
    store[ip] = { count: 1, startTime: now };
    return { success: true, remaining: limit - 1 };
  }

  // Si ha superado el límite
  if (count >= limit) {
    return { success: false, remaining: 0 };
  }

  // Incrementar el contador
  store[ip].count++;
  return { success: true, remaining: limit - store[ip].count };
}
