/**
 * Modo prueba de las líneas de Wasender (10/11, pedido de la responsable).
 *
 * Mientras se prueba en la Preview, producción comparte la base pero no conoce
 * Wasender: su recontacto (a las 2 h, si la persona dejó de responder) podría
 * intentar escribir por Meta. Para que eso no pase, en modo prueba cada chat de
 * Wasender queda en atención humana entre un mensaje y otro:
 *  1. Llega un mensaje: si el chat lo tomó el modo prueba, se devuelve a la IA.
 *  2. El bot responde como siempre.
 *  3. Al terminar, el chat vuelve a quedar tomado (atención humana).
 * Si una persona tomó el chat a mano, se respeta: no se devuelve a la IA.
 * Puras: se prueban solas.
 */

/** Margen para reconocer que la última toma fue la del modo prueba. */
export const MARGEN_TOMA_MS = 2_000;

export interface EstadoChat {
  aiEnabled: boolean;
  humanTakeoverAt: string | null;
  tomaAutomaticaAt: string | null;
}

/** ¿El chat está tomado por el modo prueba (y no por una persona)? */
export function tomadoPorModoPrueba(c: EstadoChat): boolean {
  if (c.aiEnabled || !c.tomaAutomaticaAt) return false;
  const auto = Date.parse(c.tomaAutomaticaAt);
  if (Number.isNaN(auto)) return false;
  const humano = c.humanTakeoverAt ? Date.parse(c.humanTakeoverAt) : NaN;
  // Sin fecha de toma, o una toma que no es posterior a la del modo prueba: fue el modo prueba.
  return Number.isNaN(humano) || humano <= auto + MARGEN_TOMA_MS;
}

/** Antes de procesar un mensaje entrante en modo prueba. */
export function antesDeProcesar(c: EstadoChat, modoPrueba: boolean): "devolver_a_ia" | "nada" {
  return modoPrueba && tomadoPorModoPrueba(c) ? "devolver_a_ia" : "nada";
}

/** Después de procesar: en modo prueba el chat queda en atención humana. */
export function despuesDeProcesar(modoPrueba: boolean): "tomar" | "nada" {
  return modoPrueba ? "tomar" : "nada";
}

/** Cambios en la conversación, iguales a «Tomar el chat» y «Devolver a la IA» del panel. */
export function cambiosTomar(ahora: Date): Record<string, unknown> {
  const at = ahora.toISOString();
  return {
    ai_enabled: false,
    status: "requiere_atencion_humana",
    ai_ack_token: null,
    ai_ack_expires_at: null,
    human_takeover_at: at,
    wasender_toma_automatica_at: at,
  };
}

export function cambiosDevolver(): Record<string, unknown> {
  return { ai_enabled: true, status: "en_conversacion" };
}
