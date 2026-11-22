/**
 * Tiempo de espera de quien escribió y no tuvo respuesta (22/11). Función pura: recibe «ahora» por
 * parámetro para que el servidor y las pruebas den lo mismo (nada de `Date.now()` escondido).
 */
export type NivelEspera = "info" | "atencion" | "error";

export interface Espera {
  /** «hace 5 min», «hace 3 h», «hace 2 d». */
  texto: string;
  /** Menos de 2 h: info; hasta 24 h: atención; más de un día: error (se enfría). */
  nivel: NivelEspera;
  minutos: number;
}

export function esperaHace(desde: string | null | undefined, ahoraMs: number): Espera | null {
  if (!desde) return null;
  const t = new Date(desde).getTime();
  if (!Number.isFinite(t) || !Number.isFinite(ahoraMs)) return null;
  const minutos = Math.max(0, Math.floor((ahoraMs - t) / 60000));
  let texto: string;
  if (minutos < 1) texto = "recién";
  else if (minutos < 60) texto = `hace ${minutos} min`;
  else if (minutos < 60 * 24) texto = `hace ${Math.floor(minutos / 60)} h`;
  else texto = `hace ${Math.floor(minutos / (60 * 24))} d`;
  const nivel: NivelEspera = minutos < 120 ? "info" : minutos < 60 * 24 ? "atencion" : "error";
  return { texto, nivel, minutos };
}
