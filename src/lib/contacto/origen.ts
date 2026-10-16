/**
 * Etapa 2 · Parche 2.0 (sección 6.3) — Origen de cada tarea y política de
 * horario que le corresponde. Sin dependencias: se prueba solo.
 *
 * Cada salida automática lleva su origen y el servidor aplica la política
 * según ese origen, además de pausa, baja, ventana del canal, intentos y
 * relaciones del perfil:
 *
 *  - Respuesta a un mensaje entrante: la IA puede responder las 24 horas,
 *    todos los días, dentro de la ventana del canal, cuando el perfil tiene
 *    habilitada la atención entrante 24 h, el agente está activo, no hay
 *    pausa general y el chat no está tomado por una persona. Sin esa
 *    habilitación, la respuesta entrante sigue el horario general.
 *  - Salidas iniciadas por la empresa (inicio de campaña, seguimiento,
 *    reagendamiento, inicio de cita, recuperación): lunes a sábado de 8 a 21,
 *    hora de Argentina, con el calendario de excepciones; se revalida justo
 *    antes de enviar.
 *  - Atención humana (una persona escribe desde el panel): sin horario
 *    automático; la responsabilidad es de quien escribe.
 */

import { DEFAULT_CALENDAR, isContactAllowed, type ContactCalendar } from "@/lib/contacto/reglas";

export const ORIGENES_TAREA = [
  "respuesta_entrante",
  "inicio_campana",
  "seguimiento",
  "reagendamiento",
  "inicio_cita",
  "recuperacion",
  "atencion_humana",
] as const;
export type OrigenTarea = (typeof ORIGENES_TAREA)[number];

export const ORIGEN_LABEL: Record<OrigenTarea, string> = {
  respuesta_entrante: "Respuesta a un mensaje entrante",
  inicio_campana: "Inicio de campaña",
  seguimiento: "Seguimiento",
  reagendamiento: "Reagendamiento de cita",
  inicio_cita: "Inicio de cita",
  recuperacion: "Recuperación",
  atencion_humana: "Atención humana",
};

export type PoliticaHorario = "entrante" | "salida_empresa" | "manual";

/** Qué política de horario corresponde a cada origen. */
export function politicaPorOrigen(origen: OrigenTarea): PoliticaHorario {
  if (origen === "respuesta_entrante") return "entrante";
  if (origen === "atencion_humana") return "manual";
  return "salida_empresa";
}

export function esOrigenTarea(value: unknown): value is OrigenTarea {
  return typeof value === "string" && (ORIGENES_TAREA as readonly string[]).includes(value);
}

export interface CondicionesEntrante {
  /** El perfil tiene habilitada la atención entrante las 24 horas. */
  entrante24hHabilitado: boolean;
  /** El agente del área está activo y con identidad configurada. */
  agenteActivo: boolean;
  /** Pausa general de respuestas de la IA. */
  pausaIa: boolean;
  /** Una persona tomó el chat (ai_enabled = false). */
  chatTomado: boolean;
  /** El mensaje es legible para el agente (texto, botón). */
  legible: boolean;
  /** Contacto detenido (baja, enojo, número equivocado...). */
  detenido: boolean;
  /** La oportunidad ya está captada: lo posterior va a una persona. */
  captado: boolean;
  /** Ventana de 24 horas del canal abierta (último mensaje de la persona). */
  ventanaAbierta: boolean;
}

export type DecisionEntrante =
  | { responder: true }
  | {
      responder: false;
      motivo:
        | "pausa_general"
        | "chat_tomado"
        | "no_legible"
        | "detenido"
        | "captado_mensaje_posterior"
        | "agente_inactivo"
        | "ventana_cerrada"
        | "fuera_de_horario_sin_24h";
    };

/**
 * Compuerta de la respuesta a un mensaje entrante. El orden importa: la pausa
 * y la toma del chat van primero (nunca se responde encima de una persona);
 * un captado que vuelve a escribir va a atención humana, no a la IA.
 */
export function decidirRespuestaEntrante(
  c: CondicionesEntrante,
  now: Date,
  calendar: ContactCalendar = DEFAULT_CALENDAR
): DecisionEntrante {
  if (c.pausaIa) return { responder: false, motivo: "pausa_general" };
  if (c.chatTomado) return { responder: false, motivo: "chat_tomado" };
  if (c.detenido) return { responder: false, motivo: "detenido" };
  if (c.captado) return { responder: false, motivo: "captado_mensaje_posterior" };
  if (!c.legible) return { responder: false, motivo: "no_legible" };
  if (!c.agenteActivo) return { responder: false, motivo: "agente_inactivo" };
  if (!c.ventanaAbierta) return { responder: false, motivo: "ventana_cerrada" };
  if (!c.entrante24hHabilitado && !isContactAllowed(now, calendar)) {
    return { responder: false, motivo: "fuera_de_horario_sin_24h" };
  }
  return { responder: true };
}

export const MOTIVO_ENTRANTE_TEXT: Record<Exclude<DecisionEntrante, { responder: true }>["motivo"], string> = {
  pausa_general: "Pausa general de respuestas de la IA: el mensaje queda para atención manual",
  chat_tomado: "Una persona tomó la conversación: la IA no responde",
  no_legible: "El mensaje no es legible para el agente (audio, imagen o archivo): queda para una persona",
  detenido: "Contacto detenido: sin respuesta automática",
  captado_mensaje_posterior: "La persona ya está captada: su mensaje pasa a atención humana prioritaria",
  agente_inactivo: "El agente del perfil está apagado o sin identidad configurada",
  ventana_cerrada: "La ventana de 24 horas del canal está cerrada: solo plantilla aprobada",
  fuera_de_horario_sin_24h: "Fuera del horario general y sin atención entrante 24 h habilitada en el perfil",
};

export interface CondicionesSalida {
  origen: OrigenTarea;
  pausaEnvios: boolean;
  detenido: boolean;
  chatTomado: boolean;
}

export type DecisionSalida =
  | { enviar: true }
  | { enviar: false; motivo: "pausa_general" | "detenido" | "chat_tomado" | "fuera_de_horario" | "origen_no_automatico" };

/**
 * Compuerta común de una salida iniciada por la empresa. El horario se
 * comprueba con el reloj y el calendario que se pasan: quien llama debe
 * volver a llamar inmediatamente antes de contactar a Meta.
 */
export function decidirSalidaEmpresa(c: CondicionesSalida, now: Date, calendar: ContactCalendar = DEFAULT_CALENDAR): DecisionSalida {
  const politica = politicaPorOrigen(c.origen);
  if (politica !== "salida_empresa") return { enviar: false, motivo: "origen_no_automatico" };
  if (c.pausaEnvios) return { enviar: false, motivo: "pausa_general" };
  if (c.detenido) return { enviar: false, motivo: "detenido" };
  if (c.chatTomado) return { enviar: false, motivo: "chat_tomado" };
  if (!isContactAllowed(now, calendar)) return { enviar: false, motivo: "fuera_de_horario" };
  return { enviar: true };
}
