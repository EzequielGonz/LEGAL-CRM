/**
 * Etapa 2 · Bloque 2.3 — Circuito de seguimiento (sin dependencias: se prueba solo).
 *
 * Un solo circuito para los cuatro perfiles:
 *  - El contacto inicial es el contacto 1. Solo entra quien respondió.
 *  - Si la persona respondió y la conversación se interrumpió (nuestro último
 *    mensaje quedó sin respuesta), el contacto 2 se programa a las 48–72 h.
 *  - Sin respuesta al contacto 2: el circuito se detiene, sin repesca.
 *  - Si respondió al 2 y se volvió a interrumpir: contacto 3 con el mismo
 *    criterio. Después del 3, si no responde o no avanza, pasa a la base para
 *    campaña manual (agotamiento: no es una baja ni una detención).
 *  - Los mensajes de una conversación activa no cuentan como intentos: solo
 *    cuentan los contactos 2 y 3 enviados por el circuito.
 */

import { FOLLOWUP_RANGE } from "@/lib/contacto/reglas";

const HOUR_MS = 3600 * 1000;

export interface SentStep {
  step: 2 | 3;
  sentAt: Date;
}

export interface ConversationSnapshot {
  /** Último mensaje de la conversación (sin duplicados). */
  lastMessage: { direction: "entrante" | "saliente"; senderType: string; at: Date; id: string } | null;
  /** Último mensaje entrante (de la persona). */
  lastInboundAt: Date | null;
  /** Contactos 2 y 3 que ya salieron (o que pudieron salir: inciertos). */
  sent: SentStep[];
}

export type CircuitDecision =
  | { action: "nada"; reason: string }
  | { action: "programar"; step: 2 | 3; baseAt: Date; baseMessageId: string }
  | { action: "detener"; state: "caido" | "completado"; reason: string; repesca: boolean };

/**
 * Qué corresponde para una oportunidad que respondió, con la IA a cargo de la
 * conversación (la elegibilidad general la filtra quien llama).
 *
 * `enabledSince`: activación del seguimiento en el perfil; una interrupción
 * anterior no entra sola al circuito. `now`: para saber si ya venció la espera
 * de un contacto enviado.
 */
export function decideCircuit(snapshot: ConversationSnapshot, opts: { enabledSince: Date; now: Date }): CircuitDecision {
  const { lastMessage, lastInboundAt } = snapshot;
  if (!lastInboundAt) return { action: "nada", reason: "Nunca respondió: no recibe seguimiento" };
  if (!lastMessage) return { action: "nada", reason: "Sin mensajes" };
  if (lastMessage.direction === "entrante") {
    return { action: "nada", reason: "La persona escribió último: la conversación está activa" };
  }

  const sent = [...snapshot.sent].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  const last = sent[sent.length - 1] ?? null;
  const waitMs = FOLLOWUP_RANGE.maxHours * HOUR_MS;

  if (last) {
    const answeredAfterLast = lastInboundAt.getTime() > last.sentAt.getTime();
    if (!answeredAfterLast) {
      // El último contacto del circuito sigue sin respuesta: se espera el plazo y se detiene.
      if (opts.now.getTime() < last.sentAt.getTime() + waitMs) {
        return { action: "nada", reason: `Esperando respuesta al contacto ${last.step}` };
      }
      return last.step === 2
        ? { action: "detener", state: "caido", reason: "Sin respuesta al segundo contacto: no recibe más mensajes", repesca: false }
        : { action: "detener", state: "completado", reason: "Sin respuesta al tercer contacto: pasa a la base para campaña manual", repesca: true };
    }
    if (last.step === 3) {
      // Respondió al 3 y se volvió a interrumpir: no hay más contactos automáticos.
      if (opts.now.getTime() < lastMessage.at.getTime() + waitMs) {
        return { action: "nada", reason: "Conversación después del tercer contacto: se espera" };
      }
      return { action: "detener", state: "completado", reason: "Llegó al tercer contacto sin avanzar: pasa a la base para campaña manual", repesca: true };
    }
  }

  // Interrupción: nuestro último mensaje quedó sin respuesta.
  if (lastMessage.senderType === "admin") {
    return { action: "nada", reason: "El último mensaje lo mandó una persona del equipo: atención humana" };
  }
  if (lastMessage.at.getTime() < opts.enabledSince.getTime()) {
    return { action: "nada", reason: "Interrupción anterior a la activación del seguimiento: no entra sola" };
  }
  if (opts.now.getTime() > lastMessage.at.getTime() + waitMs) {
    return { action: "nada", reason: "Pasaron más de 72 horas desde la interrupción: queda para decisión manual" };
  }
  const step: 2 | 3 = last ? 3 : 2;
  return { action: "programar", step, baseAt: lastMessage.at, baseMessageId: lastMessage.id };
}

/** Estados de una tarea de seguimiento, para el panel. */
export const FOLLOWUP_TASK_STATUS_LABEL: Record<string, string> = {
  programada: "Programado",
  enviando: "Enviando",
  enviada: "Enviado",
  cancelada: "Cancelado",
  conflicto: "Conflicto de horario",
  pendiente: "Pendiente (falta configuración)",
  a_revisar: "A revisar (incierto)",
  fallida: "Fallido",
};

/** Motivos de la compuerta antes de enviar, en palabras. */
export const GATE_REASON_TEXT: Record<string, string> = {
  pausa_general: "Pausa general de envíos automáticos activa",
  seguimiento_inactivo: "El seguimiento automático del perfil está apagado",
  chat_tomado: "Una persona tomó la conversación: sin seguimiento automático",
  oportunidad_cerrada: "La oportunidad ya está captada o perdida",
  atencion_humana: "La conversación está en atención humana",
  derivada: "La oportunidad ya fue derivada",
  retenida: "Oportunidad retenida para revisión",
  detenido: "Contacto detenido: nada automático",
  respondio: "La persona respondió: la conversación sigue activa",
  reserva_perdida: "La tarea cambió mientras se procesaba",
  sin_conversacion: "No se encontró la conversación",
  linea_incompatible: "La línea no corresponde al perfil de la tarea o a la conversación: no se envía hasta corregirlo",
  datos_incompatibles: "La conversación, el contacto o la oportunidad no corresponden entre sí: no se envía hasta revisarlo",
};
