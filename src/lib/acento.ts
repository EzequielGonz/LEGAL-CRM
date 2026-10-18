/* ───────────── Color de acento elegido en el panel (18/10) ───────────── */
const PASOS_ESCALA = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Escala de 11 tonos (50–950) a partir de un color: los claros se mezclan
 * con blanco y los oscuros con negro, con el color elegido en el 500. Se
 * usa para pintar el acento del perfil cuando se cambia desde el lápiz de
 * la pantalla de perfiles (`colores.panel`). Pura.
 */
export function escalaDesdeHex(hex: string): Record<(typeof PASOS_ESCALA)[number], string> | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const mezcla = (destino: number, t: number) => rgb.map((c) => Math.round(c + (destino - c) * t));
  const tonos: Record<number, number[]> = {
    50: mezcla(255, 0.94), 100: mezcla(255, 0.86), 200: mezcla(255, 0.7), 300: mezcla(255, 0.5), 400: mezcla(255, 0.25),
    500: rgb,
    600: mezcla(0, 0.14), 700: mezcla(0, 0.3), 800: mezcla(0, 0.44), 900: mezcla(0, 0.56), 950: mezcla(0, 0.72),
  };
  return Object.fromEntries(PASOS_ESCALA.map((p) => [p, tonos[p].join(" ")])) as Record<(typeof PASOS_ESCALA)[number], string>;
}

/** Variables CSS del acento elegido (o null si no hay uno válido). */
export function variablesAcento(hex: unknown): Record<string, string> | null {
  const e = typeof hex === "string" ? escalaDesdeHex(hex.trim()) : null;
  if (!e) return null;
  return Object.fromEntries(Object.entries(e).map(([p, v]) => [`--c-gold-${p}`, v]));
}
