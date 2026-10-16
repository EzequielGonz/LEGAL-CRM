/**
 * Etapa 2 · Bloque 2.2 — Reglas puras de las citas (sin dependencias).
 *
 *  - Jurídico, Fase 2 por IA: la cita es de tipo «ia», no consume turnos
 *    humanos y empieza unos 2 minutos después si la persona puede.
 *  - Cita incumplida: un solo reagendamiento, una hora después del mensaje
 *    de inicio REALMENTE enviado (no de la hora prevista), en franja válida
 *    (lunes a sábado 8–21 con el calendario) y dentro de la ventana del
 *    canal; si la ventana ya cerró, hace falta una plantilla aprobada.
 *  - Una cita que ya es un reagendamiento no se vuelve a reagendar.
 *  - Si la persona respondió después del inicio, no hay cita incumplida.
 *
 * Referencia: `.claude/referencias/reglas-comunes.md`, secciones 4 y 5.
 */

import {
  DEFAULT_CALENDAR,
  isContactAllowed,
  messageKindAllowed,
  nextAllowedInstant,
  type ContactCalendar,
} from "@/lib/contacto/reglas";

export const TIPOS_CITA = ["ia", "profesional"] as const;
export type TipoCita = (typeof TIPOS_CITA)[number];

export const TIPO_CITA_LABEL: Record<TipoCita, string> = {
  ia: "Revisión con la IA (no usa turnos del equipo)",
  profesional: "Con el profesional",
};

/** Minutos entre aceptar la Fase 2 y el inicio de la cita de IA. */
export const FASE2_DEMORA_MIN = 2;
/** Horas entre el inicio enviado y el único reagendamiento. */
export const REAGENDAMIENTO_HORAS = 1;
/** Duración de la cita de IA (solo para el registro: no ocupa agenda). */
export const CITA_IA_DURACION_MIN = 30;

export function esTipoCita(v: unknown): v is TipoCita {
  return typeof v === "string" && (TIPOS_CITA as readonly string[]).includes(v);
}

/** Inicio y fin de una cita de IA de Fase 2: unos minutos después, o la hora que la persona eligió. */
export function horarioFase2(now: Date, elegido?: Date | null): { startsAt: Date; endsAt: Date } {
  const minimo = new Date(now.getTime() + FASE2_DEMORA_MIN * 60_000);
  const startsAt = elegido && elegido.getTime() > minimo.getTime() ? elegido : minimo;
  return { startsAt, endsAt: new Date(startsAt.getTime() + CITA_IA_DURACION_MIN * 60_000) };
}

export type DecisionReagendamiento =
  | { programar: true; at: Date; mensaje: "texto_libre" | "plantilla" }
  | { programar: false; motivo: "sin_inicio_enviado" | "ya_es_reagendamiento" | "ya_reagendada" | "respondio" | "sin_franja" };

/**
 * ¿Corresponde el reagendamiento de una cita? Se llama al registrar el
 * envío del inicio (para programarlo) y otra vez justo antes de enviarlo.
 */
export function decidirReagendamiento(
  input: {
    /** Momento en que Meta aceptó el mensaje de inicio (no la hora prevista). */
    inicioEnviadoAt: Date | null;
    /** La cita ya es el reagendamiento de otra. */
    esReagendamiento: boolean;
    /** Ya existe la tarea de reagendamiento de esta cita. */
    yaReagendada: boolean;
    /** Último mensaje de la persona (para saber si respondió y la ventana). */
    ultimoEntranteAt: Date | null;
  },
  calendar: ContactCalendar = DEFAULT_CALENDAR
): DecisionReagendamiento {
  if (!input.inicioEnviadoAt) return { programar: false, motivo: "sin_inicio_enviado" };
  if (input.esReagendamiento) return { programar: false, motivo: "ya_es_reagendamiento" };
  if (input.yaReagendada) return { programar: false, motivo: "ya_reagendada" };
  if (input.ultimoEntranteAt && input.ultimoEntranteAt.getTime() > input.inicioEnviadoAt.getTime()) {
    return { programar: false, motivo: "respondio" };
  }
  const objetivo = new Date(input.inicioEnviadoAt.getTime() + REAGENDAMIENTO_HORAS * 3_600_000);
  const at = isContactAllowed(objetivo, calendar) ? objetivo : nextAllowedInstant(objetivo, calendar);
  if (!at) return { programar: false, motivo: "sin_franja" };
  return { programar: true, at, mensaje: messageKindAllowed(input.ultimoEntranteAt, at) };
}

/** Texto del mensaje de inicio de una cita de IA (sin datos de la persona). */
export function textoInicioCita(nombrePresentacion: string): string {
  const quien = nombrePresentacion.trim() || "el equipo";
  return `Hola, te escribe ${quien}. Ya podemos empezar con la revisión de tu consulta. ¿Te parece bien que arranquemos ahora?`;
}

/** Texto del único reagendamiento. */
export function textoReagendamiento(nombrePresentacion: string): string {
  const quien = nombrePresentacion.trim() || "el equipo";
  return `Hola, soy ${quien}. Hace un rato te escribimos para empezar la revisión de tu consulta y no pudimos seguir. ¿Querés que la retomemos en otro momento? Decime qué día y horario te queda cómodo.`;
}
