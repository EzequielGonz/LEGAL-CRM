/** 15/11: «[Escribió el 12/11, 3 días después]» cuando pasó más de un día. Pura. */
export function marcaDeTiempo(anterior: string | null, actual: string | null): string | null {
  if (!anterior || !actual) return null;
  const dif = Date.parse(actual) - Date.parse(anterior);
  if (!Number.isFinite(dif) || dif < 24 * 3600_000) return null;
  const dias = Math.floor(dif / (24 * 3600_000));
  const f = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(actual));
  return `[Escribió el ${f}, ${dias === 1 ? "1 día" : `${dias} días`} después]`;
}
