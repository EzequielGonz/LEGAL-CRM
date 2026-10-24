/**
 * Medianoche de hoy en Argentina (UTC−3, sin horario de verano), como
 * instante. Pura (24/10): el servidor corre en UTC y `setHours(0)` cortaba
 * el día a las 21 h de Argentina.
 */
export function inicioDelDiaAR(ahora = new Date()): Date {
  const ar = new Date(ahora.getTime() - 3 * 3_600_000);
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate(), 3, 0, 0, 0));
}
