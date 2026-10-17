/**
 * Recorrido guiado de Contenido (rediseño 17/10, bloque 3). Funciones puras:
 * qué falta para crear, qué pasa con cada acción y cuándo se puede
 * programar. No guarda ni publica nada.
 */
import { MOTIVO_RETENCION_TEXTO, type EvaluacionPieza } from "@/lib/contenido/politica";

export type AccionPieza = "vista" | "borrador" | "programar";

/** Dónde se completa cada dato del brief (anclas de Contenido · Avanzado). */
export const ANCLA_FALTANTE: Record<string, string> = {
  "nombre público": "brief-nombre_publico",
  "servicios (al menos uno)": "brief-servicios_txt",
  "público al que se habla": "brief-publico",
  tono: "brief-tono",
  "color principal": "brief-color_principal",
};

/** Lo imprescindible para crear: si falta, la pieza quedaría retenida. */
export function faltaImprescindible(faltantes: string[]): { texto: string; ancla: string }[] {
  return faltantes
    .filter((f) => !f.startsWith("logo"))
    .map((f) => ({ texto: f, ancla: ANCLA_FALTANTE[f] ?? "c-brief" }));
}

export interface Consecuencias {
  borrador: string;
  programar: string;
  publicar: string;
  /** Motivos legibles por los que no se publicaría (vacío si se publicaría). */
  bloqueos: string[];
  sePublicaria: boolean;
}

/** Qué pasa con cada acción, dicho antes de elegirla. */
export function consecuencias(ev: EvaluacionPieza, motivosBrief: string[] = []): Consecuencias {
  const bloqueos = [...motivosBrief, ...ev.motivos.map((m) => MOTIVO_RETENCION_TEXTO[m])];
  const sePublicaria = ev.publicable && motivosBrief.length === 0;
  return {
    borrador: "Se guarda como borrador en Contenido. No se programa ni se publica; podés retomarlo cuando quieras.",
    programar: sePublicaria
      ? "Queda programada y se publica sola en la fecha elegida, porque la política del canal está habilitada y la cuenta conectada. Podés cancelarla antes."
      : "Queda guardada con su fecha, pero no se publica mientras siga pendiente lo que figura abajo.",
    publicar:
      "No hay «publicar ahora»: la publicación la hace el ejecutor en la fecha programada y solo con la política del canal habilitada y la cuenta conectada (regla vigente).",
    bloqueos,
    sePublicaria,
  };
}

/** Fecha para programar: entre 10 minutos y 90 días desde ahora. */
export function fechaProgramable(iso: unknown, ahora = new Date()): { ok: true; fecha: string } | { ok: false; error: string } {
  if (typeof iso !== "string" || !iso.trim()) return { ok: false, error: "Elegí fecha y hora para programar." };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "La fecha no es válida." };
  const min = ahora.getTime() + 10 * 60 * 1000;
  const max = ahora.getTime() + 90 * 24 * 60 * 60 * 1000;
  if (d.getTime() < min) return { ok: false, error: "La fecha tiene que ser al menos 10 minutos más tarde que ahora." };
  if (d.getTime() > max) return { ok: false, error: "Se puede programar hasta 90 días hacia adelante." };
  return { ok: true, fecha: d.toISOString() };
}
