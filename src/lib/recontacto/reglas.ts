/**
 * Recontacto del bot dentro de la ventana de 24 h (24/10). Reglas puras,
 * sin dependencias: se prueban solas.
 *
 * Si la persona mostró interés y dejó de responder, el bot le vuelve a
 * escribir con texto libre (no con plantilla), dentro de la ventana de 24 h
 * que abre su último mensaje:
 *  1. A las 2 h de la última respuesta del bot: retoma lo último que se habló.
 *  2. A las 2 h del primer recontacto, si sigue sin contestar: saluda y queda
 *     a disposición para cuando se desocupe. Después no insiste más.
 *
 * Horario (lunes a sábado de 8 a 21, con el calendario de excepciones): si
 * el plazo cae después del cierre, se adelanta a 10 minutos antes del cierre
 * (rompe la regla de las 2 h); si ya cerró, sale a la apertura del próximo
 * día hábil, siempre que la ventana de Meta siga abierta.
 */
import {
  CHANNEL_WINDOW_HOURS,
  DEFAULT_CALENDAR,
  argentinaMidnight,
  argentinaParts,
  hoursForDay,
  isContactAllowed,
  nextAllowedInstant,
  type ContactCalendar,
} from "@/lib/contacto/reglas";

const MIN = 60_000;
const HORA = 60 * MIN;

/** Espera entre la última respuesta y cada recontacto. */
export const ESPERA_RECONTACTO_MS = 2 * HORA;
/** Cuántos recontactos como máximo después de cada mensaje de la persona. */
export const MAX_RECONTACTOS = 2;
/** Si el plazo cae después del cierre, sale esto antes del cierre. */
export const ANTES_DEL_CIERRE_MS = 10 * MIN;
/** Nunca se recontacta antes de esto desde la última respuesta del bot. */
export const MINIMO_ENTRE_MENSAJES_MS = 20 * MIN;
/** Margen antes de que cierre la ventana de 24 h de Meta. */
export const MARGEN_VENTANA_MS = 15 * MIN;

export type PasoRecontacto = 1 | 2;

export type PlanRecontacto =
  | { accion: "enviar"; paso: PasoRecontacto; programado: Date }
  | { accion: "esperar"; paso: PasoRecontacto; programado: Date }
  | { accion: "nada"; motivo: "sin_mensaje_de_la_persona" | "ultimo_es_de_la_persona" | "ya_se_recontacto" | "ventana_cerrada" | "sin_horario" };

/** Cierre (instante) del día hábil en el que cae `instante`, o null si ese día no se envía. */
export function cierreDelDia(instante: Date, calendar: ContactCalendar = DEFAULT_CALENDAR): Date | null {
  const p = argentinaParts(instante);
  const h = hoursForDay(p.day, p.weekday, calendar);
  if (!h) return null;
  return new Date(argentinaMidnight(p.day).getTime() + h.end * HORA);
}

/**
 * Cuándo corresponde el próximo recontacto y si ya toca.
 * - `ultimoEntrante`: último mensaje de la persona (abre la ventana de 24 h).
 * - `ultimoSaliente`: último mensaje del bot (respuesta o recontacto).
 * - `recontactosHechos`: recontactos ya enviados después de `ultimoEntrante`.
 */
export function planRecontacto(
  input: { ultimoEntrante: Date | null; ultimoSaliente: Date | null; recontactosHechos: number },
  ahora: Date,
  calendar: ContactCalendar = DEFAULT_CALENDAR
): PlanRecontacto {
  const { ultimoEntrante, ultimoSaliente } = input;
  if (!ultimoEntrante) return { accion: "nada", motivo: "sin_mensaje_de_la_persona" };
  if (!ultimoSaliente || ultimoSaliente.getTime() <= ultimoEntrante.getTime()) return { accion: "nada", motivo: "ultimo_es_de_la_persona" };
  if (input.recontactosHechos >= MAX_RECONTACTOS) return { accion: "nada", motivo: "ya_se_recontacto" };
  const paso = (input.recontactosHechos + 1) as PasoRecontacto;

  const limite = ultimoEntrante.getTime() + CHANNEL_WINDOW_HOURS * HORA - MARGEN_VENTANA_MS;
  const vence = ultimoSaliente.getTime() + ESPERA_RECONTACTO_MS;
  const minimo = ultimoSaliente.getTime() + MINIMO_ENTRE_MENSAJES_MS;

  let programado: number | null = vence;
  if (!isContactAllowed(new Date(vence), calendar)) {
    // ¿Se puede adelantar a antes del cierre del mismo día hábil?
    const base = new Date(Math.max(minimo, ultimoSaliente.getTime()));
    const cierre = isContactAllowed(base, calendar) ? cierreDelDia(base, calendar) : null;
    const adelantado = cierre ? cierre.getTime() - ANTES_DEL_CIERRE_MS : null;
    if (adelantado !== null && adelantado >= minimo && adelantado < vence) {
      programado = adelantado;
    } else {
      programado = nextAllowedInstant(new Date(vence), calendar)?.getTime() ?? null;
    }
  }
  if (programado === null) return { accion: "nada", motivo: "sin_horario" };
  if (programado > limite) return { accion: "nada", motivo: "ventana_cerrada" };
  if (ahora.getTime() >= programado) {
    // Ya toca, pero el reloj puede haber pasado el cierre o la ventana.
    if (ahora.getTime() > limite) return { accion: "nada", motivo: "ventana_cerrada" };
    if (!isContactAllowed(ahora, calendar)) {
      const otra = nextAllowedInstant(ahora, calendar)?.getTime() ?? null;
      if (otra === null) return { accion: "nada", motivo: "sin_horario" };
      if (otra > limite) return { accion: "nada", motivo: "ventana_cerrada" };
      return { accion: "esperar", paso, programado: new Date(otra) };
    }
    return { accion: "enviar", paso, programado: new Date(programado) };
  }
  return { accion: "esperar", paso, programado: new Date(programado) };
}

/** Estados de la conversación u oportunidad con los que nunca se recontacta. */
export function excluidoDelRecontacto(c: {
  aiEnabled: boolean;
  estadoConversacion?: string | null;
  captacion?: string | null;
  derivacion?: string | null;
  atencion?: string | null;
}): string | null {
  if (!c.aiEnabled) return "chat tomado por una persona";
  if (["cerrado_ganado", "cerrado_perdido", "requiere_atencion_humana", "agendado"].includes(String(c.estadoConversacion ?? ""))) return `conversación ${c.estadoConversacion}`;
  if (c.captacion === "captado" || c.captacion === "perdido") return `oportunidad ${c.captacion}`;
  if (c.derivacion === "derivado") return "ya derivado";
  if (c.atencion === "requiere_humano" || c.atencion === "humano_en_curso") return "espera a una persona";
  return null;
}

/** Instrucción para el bot según el paso. */
export function instruccionRecontacto(paso: PasoRecontacto, horasSinRespuesta: number): string {
  const comun = [
    "[Nota interna del sistema: esto NO lo escribió la persona.]",
    `La persona no responde desde hace unas ${Math.max(1, Math.round(horasSinRespuesta))} h. Antes de escribir, decidí si corresponde:`,
    "- escribir = false si dijo que no le interesa, pidió que no le escriban, dijo «ahora no», «no por ahora» o que está ocupado (con un botón o con sus palabras), se enojó, dijo que ya lo resolvió, es un número equivocado, la charla ya quedó cerrada (se despidieron, ya agendó o la deriva una persona) o no mostró ningún interés real.",
    "- escribir = true si mostró interés (respondió, preguntó o contó su situación) y quedó sin contestar.",
    "Si escribís: español rioplatense, breve (una o dos frases), cálido, sin presión, sin inventar datos, plazos, montos ni turnos, sin repetir textual tu último mensaje y sin presentarte de nuevo como si fuera el primer contacto.",
  ];
  const paso1 = "Este es el primer recontacto: retomá lo último que se habló para reflotar la charla y terminá con una pregunta simple y fácil de responder.";
  const paso2 =
    "Este es el último recontacto: saludá breve, decile que quedás a disposición y que, si está con poco tiempo, te escriba cuando se desocupe. No hagas preguntas que presionen y no prometas volver a escribir.";
  return [...comun, paso === 1 ? paso1 : paso2, 'Respondé SOLO con JSON: {"escribir": true|false, "motivo": "por qué, en pocas palabras", "texto": "el mensaje para la persona o vacío"}'].join("\n");
}

/** Lee la respuesta del modelo (JSON, a veces envuelto en ```). */
export function leerDecision(raw: string): { escribir: boolean; motivo: string; texto: string } | null {
  const limpio = String(raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    const j = JSON.parse(limpio);
    if (typeof j !== "object" || j === null || typeof j.escribir !== "boolean") return null;
    const texto = typeof j.texto === "string" ? j.texto.trim() : "";
    if (j.escribir && texto.length < 2) return null;
    return { escribir: j.escribir, motivo: typeof j.motivo === "string" ? j.motivo.slice(0, 200) : "", texto: texto.slice(0, 700) };
  } catch {
    return null;
  }
}

/** Configuración por perfil (encendido salvo que se apague a mano). */
export const CLAVE_RECONTACTO = "recontacto_ia";
export function recontactoEncendido(valor: unknown, perfil: string): boolean {
  const v = (valor ?? {}) as Record<string, unknown>;
  return v[perfil] !== false;
}
