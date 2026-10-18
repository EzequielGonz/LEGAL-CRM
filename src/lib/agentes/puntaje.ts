/**
 * Puntaje de un bot (18/10): una cifra de 0 a 100 calculada solo con
 * resultados reales del perfil (el cálculo único `profile_metrics`). Pura.
 *
 *  - Captación (50): qué parte de las conversaciones terminó en Captado.
 *    Un 30 % o más da el máximo.
 *  - Retención (20): cuántas conversaciones se perdieron (menos es mejor).
 *  - Trato (15): detenciones por enojo (menos es mejor).
 *  - Calidad (15): conversaciones marcadas para revisar (menos es mejor).
 *
 * Con menos de 5 conversaciones no hay puntaje («Pocos datos»): nunca se
 * inventa una cifra.
 */
import type { ProfileMetrics } from "@/lib/metrics";

export interface ComponentePuntaje {
  clave: "captacion" | "retencion" | "trato" | "calidad";
  label: string;
  puntos: number;
  maximo: number;
  detalle: string;
}

export interface PuntajeBot {
  puntaje: number | null;
  nivel: "muy_bien" | "bien" | "mejorable" | "ajustar" | "pocos_datos";
  etiqueta: string;
  conversaciones: number;
  captados: number;
  componentes: ComponentePuntaje[];
  /** Sugerencia en una frase sobre lo más flojo (para pedirle al asistente). */
  sugerencia: string | null;
}

export const MINIMO_CONVERSACIONES = 5;

const pct = (n: number) => `${Math.round(n * 100)} %`;
const tope = (v: number) => Math.max(0, Math.min(1, v));

export function puntajeBot(m: Pick<ProfileMetrics, "captacion" | "detenidos_por_motivo" | "revision_pendiente"> | null): PuntajeBot {
  if (!m) {
    return { puntaje: null, nivel: "pocos_datos", etiqueta: "Sin datos", conversaciones: 0, captados: 0, componentes: [], sugerencia: null };
  }
  const c = m.captacion;
  const conversaciones = c.en_conversacion + c.en_seguimiento + c.captado + c.perdido;
  const base = Math.max(conversaciones, 1);
  const tasaCaptacion = c.captado / base;
  const tasaPerdida = c.perdido / base;
  const tasaEnojo = (m.detenidos_por_motivo?.enojo ?? 0) / base;
  const tasaRevision = m.revision_pendiente / base;

  const componentes: ComponentePuntaje[] = [
    { clave: "captacion", label: "Captación", maximo: 50, puntos: Math.round(tope(tasaCaptacion / 0.3) * 50), detalle: `${pct(tasaCaptacion)} de las conversaciones terminó en captado` },
    { clave: "retencion", label: "Retención", maximo: 20, puntos: Math.round((1 - tope(tasaPerdida / 0.5)) * 20), detalle: `${pct(tasaPerdida)} se perdió` },
    { clave: "trato", label: "Trato", maximo: 15, puntos: Math.round((1 - tope(tasaEnojo / 0.1)) * 15), detalle: `${pct(tasaEnojo)} se cortó por enojo` },
    { clave: "calidad", label: "Calidad", maximo: 15, puntos: Math.round((1 - tope(tasaRevision / 0.2)) * 15), detalle: `${pct(tasaRevision)} quedó para revisar` },
  ];

  if (conversaciones < MINIMO_CONVERSACIONES) {
    return {
      puntaje: null,
      nivel: "pocos_datos",
      etiqueta: "Pocos datos",
      conversaciones,
      captados: c.captado,
      componentes,
      sugerencia: `Hace falta al menos ${MINIMO_CONVERSACIONES} conversaciones para calcular el puntaje.`,
    };
  }

  const puntaje = componentes.reduce((a, x) => a + x.puntos, 0);
  const nivel = puntaje >= 75 ? "muy_bien" : puntaje >= 50 ? "bien" : puntaje >= 30 ? "mejorable" : "ajustar";
  const etiqueta = { muy_bien: "Muy bien", bien: "Bien", mejorable: "Mejorable", ajustar: "Necesita ajustes" }[nivel];
  const flojo = [...componentes].sort((a, b) => a.puntos / a.maximo - b.puntos / b.maximo)[0];
  const sugerencias: Record<ComponentePuntaje["clave"], string> = {
    captacion: "Que proponga el siguiente paso antes y con una pregunta concreta.",
    retencion: "Que retome la conversación cuando la persona duda, sin insistir de más.",
    trato: "Que use un tono más cálido y breve, y ofrezca una persona antes cuando haya molestia.",
    calidad: "Que no responda lo que no sabe y derive esas consultas a una persona.",
  };
  return {
    puntaje,
    nivel,
    etiqueta,
    conversaciones,
    captados: c.captado,
    componentes,
    sugerencia: flojo.puntos < flojo.maximo ? sugerencias[flojo.clave] : null,
  };
}
