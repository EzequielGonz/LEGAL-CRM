/**
 * Modo entrenamiento de una campaña (15/11, decisión de la responsable).
 *
 * Al crear una campaña, un botón deja el ritmo prudente: 20 envíos por día
 * durante 7 días, con esperas largas y lotes chicos, para mirar los resultados
 * antes de subir. El límite y el ritmo se siguen pudiendo elegir a mano: si se
 * pone un límite diario mayor, el entrenamiento se apaga (es decisión propia y
 * nada lo frena). Al día 7 el panel pide el resultado de la semana
 * (avanzó / no avanzó / vendido). Nada se sube solo: después del día 7 el
 * límite sigue en 20 hasta que se cambie a mano. Pura.
 */
export const ENTRENAMIENTO = {
  porDia: 20,
  dias: 7,
  ritmo: { min_send_delay_seconds: 90, max_send_delay_seconds: 300, batch_size: 5, batch_pause_seconds: 900 },
} as const;

export const RESULTADOS_SEMANA = ["avanzo", "no_avanzo", "vendido"] as const;
export type ResultadoSemana = (typeof RESULTADOS_SEMANA)[number];
export const ETIQUETA_RESULTADO: Record<ResultadoSemana, string> = {
  avanzo: "Avanzó",
  no_avanzo: "No avanzó",
  vendido: "Vendido",
};

export function esResultadoSemana(v: unknown): v is ResultadoSemana {
  return typeof v === "string" && (RESULTADOS_SEMANA as readonly string[]).includes(v);
}

/** Valores que pone el botón al crear la campaña. */
export function valoresDeEntrenamiento(ahora = new Date()) {
  return { ...ENTRENAMIENTO.ritmo, daily_send_limit: ENTRENAMIENTO.porDia, entrenamiento_desde: ahora.toISOString() };
}

/** ¿Un límite elegido a mano apaga el entrenamiento? (solo si es mayor que el del entrenamiento) */
export function apagaEntrenamiento(limiteNuevo: number | null): boolean {
  return limiteNuevo === null || limiteNuevo > ENTRENAMIENTO.porDia;
}

export interface EstadoEntrenamiento {
  enEntrenamiento: boolean;
  /** día 1 a 7 mientras dura; después, el número de días que pasaron */
  dia: number;
  terminado: boolean;
  /** día 7 o más y todavía sin resultado cargado */
  pideResultado: boolean;
}

export function estadoEntrenamiento(
  c: { entrenamiento_desde?: string | null; resultado_semana?: string | null },
  ahora = new Date()
): EstadoEntrenamiento | null {
  if (!c.entrenamiento_desde) return null;
  const desde = Date.parse(c.entrenamiento_desde);
  if (!Number.isFinite(desde)) return null;
  const dia = Math.max(1, Math.floor((ahora.getTime() - desde) / 86_400_000) + 1);
  const terminado = dia > ENTRENAMIENTO.dias;
  return { enEntrenamiento: !terminado, dia, terminado, pideResultado: dia >= ENTRENAMIENTO.dias && !c.resultado_semana };
}
