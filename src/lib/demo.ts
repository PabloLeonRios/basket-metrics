/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 *
 * Este archivo define si el sistema está
 * corriendo en modo DEMO o en modo REAL.
 *
 * Cuando DEMO_MODE = 1:
 * - Las APIs NO deben usar MongoDB
 * - Deben devolver datos mock
 *
 * Cuando DEMO_MODE = 0:
 * - Se habilita la conexión real a Mongo
 * - Las APIs usan modelos reales
 */

export function isDemoMode() {
  return (
    process.env.DEMO_MODE === "1" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1"
  );
}
