/**
 * Una sola definición para cada cifra (22/11, hallazgos 15 §3 ítem 7; pendiente 15g). Pura.
 *
 * Qué estaba mal: la misma palabra contaba cosas distintas según la pantalla.
 *  - «En seguimiento» era tres cosas: el estado de captación «con un seguimiento enviado», las personas
 *    que dejaron de escribir hace más de 3 días y el sistema todavía insiste, y (en otra pantalla) las
 *    tareas «Programadas». Ahora cada una tiene su nombre y su unidad.
 *  - «Perdidos» figuraba dos veces con conjuntos distintos (todos / solo motivo comercial).
 *  - «Esperan a una persona» tenía cinco definiciones (con y sin perdidos, con y sin detenidos, con y sin
 *    ventana de 7 días, con y sin caídos). Ahora hay una sola (`ESPERAN_A_UNA_PERSONA`).
 *  - La suma de los grupos de «Contactos» no es el total de personas: los grupos se pisan (un derivado
 *    puede estar también en una cita próxima), así que no se suman y el título dice de qué unidad habla.
 */
import type { Condicion } from "@/lib/indicadores";

/** Unidades: cada cifra dice qué cuenta. */
export const UNIDAD = {
  oportunidad: "oportunidades (una por persona en cada perfil)",
  tarea: "contactos de seguimiento programados",
  mensaje: "mensajes",
} as const;

/** Rótulos únicos. Dos cifras distintas nunca comparten rótulo. */
export const ROTULO = {
  /** Estado de captación `en_seguimiento`. */
  estadoConSeguimiento: "Con seguimiento enviado",
  /** Indicador `dejaron_de_responder`. */
  seInsiste: "Se les insiste (sin respuesta hace +3 días)",
  /** Tareas de `followup_tasks` en estado programada. */
  contactosProgramados: "Contactos programados",
  perdidosTodos: "Perdidos",
  perdidosComerciales: "Perdidos por motivo comercial",
} as const;

/**
 * «Esperan a una persona» (definición única): la oportunidad pidió una persona (`attention_state` =
 * requiere_humano), no está perdida ni es una detención (rechazo, queja, número equivocado), sin tope de
 * fecha. «Oportunidades reales» (`piden_persona`) es un subconjunto con nombre propio: además tiene interés
 * y no está caída. Las pantallas que cuentan «los que esperan» usan estas condiciones.
 */
export const ESPERAN_A_UNA_PERSONA: Condicion[] = [
  { col: "attention_state", op: "eq", value: "requiere_humano" },
  { col: "capture_state", op: "neq", value: "perdido" },
  { col: "_or", op: "or", value: "attention_category.is.null,attention_category.neq.detencion" },
];

/** La misma definición como predicado sobre una fila ya leída. */
export function esperaAUnaPersona(o: { attention_state?: string | null; capture_state?: string | null; attention_category?: string | null }): boolean {
  return o.attention_state === "requiere_humano" && o.capture_state !== "perdido" && o.attention_category !== "detencion";
}

/**
 * Total de personas de un perfil: las oportunidades (una por contacto y perfil). Los grupos de una pantalla
 * que pueden pisarse no se suman: se compara contra este total solo la suma de estados excluyentes.
 */
export function totalDePersonas(m: { oportunidades: number }): number {
  return m.oportunidades;
}

/** Suma de los estados de contacto, que son excluyentes: tiene que dar el total. */
export function sumaEstadosDeContacto(c: { sin_contactar: number; contactado_sin_respuesta: number; respondio: number; error_contacto: number }): number {
  return c.sin_contactar + c.contactado_sin_respuesta + c.respondio + c.error_contacto;
}

/** ¿Cierra la cuenta? Si no, hay filas con un estado fuera de los cuatro y se avisa en vez de mostrar dos totales. */
export function coherenciaDeTotales(m: { oportunidades: number; contacto: { sin_contactar: number; contactado_sin_respuesta: number; respondio: number; error_contacto: number } }): { cierra: boolean; diferencia: number } {
  const diferencia = sumaEstadosDeContacto(m.contacto) - totalDePersonas(m);
  return { cierra: diferencia === 0, diferencia };
}
