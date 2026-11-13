/**
 * Limpieza de lo ya cargado (13/11). Decisión de la responsable: «Reclasificar
 * solo»: releer cada chat mal ubicado y moverlo a donde corresponde, con el
 * motivo escrito, sin borrar nada, sin mandar mensajes y con una lista para
 * deshacer. Y sobre quienes quedaron sin respuesta: «reconocé el mensaje de lo
 * último que habló, si concretó una llamada derivalo a captado, si no dejalo
 * en quedaron sin respuesta»; ante la duda, «posible captación a revisar».
 *
 * Acá están las reglas puras: qué se le pregunta al bot al releer un chat,
 * cómo se lee su respuesta y qué movimiento corresponde. Se prueban solas.
 */

export const LOTE_LIMPIEZA = "limpieza-1311";

export type TipoRelectura = "oportunidad" | "rechazo" | "baja" | "duda";
export type ConcretoLlamada = "si" | "no" | "duda";

export interface Relectura {
  tipo: TipoRelectura;
  concreto_llamada: ConcretoLlamada;
  /** Por qué, en pocas palabras, con lo que dijo la persona. */
  motivo: string;
}

export const INSTRUCCION_RELECTURA = [
  "Vas a leer la conversación de WhatsApp entre un negocio argentino y una persona. Clasificala mirando sobre todo LO ÚLTIMO que dijo la persona.",
  "tipo:",
  '- "rechazo": dijo que no le interesa, que ya lo resolvió, que ya tiene abogado, asesor, cobertura, auto o proveedor, que es un número equivocado, o es el contestador automático de otro negocio.',
  '- "baja": pidió que no le escriban más, se quejó del contacto, insultó o preguntó con enojo de dónde sacaron su número.',
  '- "oportunidad": muestra interés real: pidió hablar con alguien, preguntó precio, cuota, turno, horario o condiciones, contó su situación, dejó sus datos o aceptó seguir.',
  '- "duda": no alcanza para decidir (un «ok», un emoji, un audio, un mensaje cortado).',
  "concreto_llamada:",
  '- "si": aceptó que la llamen o pidió que la llamen, dio un día u horario para hablar, o pasó su número para eso. También si le propusieron una llamada y contestó que sí («dale», «ok», «bueno», «sí»).',
  '- "no": no hay nada de eso.',
  '- "duda": parece que sí pero no queda claro (por ejemplo, un «ok» que no se sabe a qué responde).',
  "Una negativa clara manda sobre todo lo demás. No inventes: si la persona no lo dijo, no lo supongas.",
  'Respondé SOLO con JSON: {"tipo": "oportunidad|rechazo|baja|duda", "concreto_llamada": "si|no|duda", "motivo": "por qué, en una frase corta, con lo que dijo la persona"}',
].join("\n");

/** Lee la respuesta del bot. Devuelve null si no se entiende (el chat queda sin tocar). */
export function leerRelectura(crudo: unknown): Relectura | null {
  const limpio = String(crudo ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    const j = JSON.parse(limpio);
    if (typeof j !== "object" || j === null) return null;
    const tipo = String(j.tipo ?? "").toLowerCase();
    const llamada = String(j.concreto_llamada ?? "").toLowerCase().replace("sí", "si");
    if (!["oportunidad", "rechazo", "baja", "duda"].includes(tipo)) return null;
    if (!["si", "no", "duda"].includes(llamada)) return null;
    return { tipo: tipo as TipoRelectura, concreto_llamada: llamada as ConcretoLlamada, motivo: typeof j.motivo === "string" ? j.motivo.trim().slice(0, 240) : "" };
  } catch {
    return null;
  }
}

export type Accion = "queda" | "perder" | "perder_y_detener" | "captar" | "posible_captacion";

/** De dónde viene la persona que se relee. */
export type ContextoRelectura = "pedia_persona" | "ultima_palabra_persona";

/**
 * Qué movimiento corresponde. Regla dura: ante la duda no se pierde a nadie
 * ni se marca captado sin evidencia.
 */
export function accionPorRelectura(contexto: ContextoRelectura, r: Relectura): Accion {
  if (r.tipo === "baja") return "perder_y_detener";
  if (r.tipo === "rechazo") return "perder";
  if (contexto === "ultima_palabra_persona") {
    if (r.concreto_llamada === "si") return "captar";
    if (r.concreto_llamada === "duda") return "posible_captacion";
  }
  return "queda";
}

export const TEXTO_REGLA: Record<string, { titulo: string; que: string }> = {
  perdido_sin_atencion: { titulo: "Perdidos que seguían pidiendo una persona", que: "Ya estaban cerrados como perdidos, pero seguían apareciendo como pendientes. Dejan de pedir una persona; el chat vuelve al bot por si escriben de nuevo." },
  rechazo_no_es_atencion: { titulo: "Rechazos que figuraban como atención humana", que: "Dijeron que no, o pidieron que no les escriban. Pasan a Perdidos con su motivo." },
  relectura_rechazo: { titulo: "Releídos: en realidad dijeron que no", que: "El bot releyó el chat y la persona había rechazado. Pasan a Perdidos con el motivo." },
  relectura_baja: { titulo: "Releídos: pidieron que no les escriban", que: "El bot releyó el chat. Pasan a No contactar." },
  dejo_de_responder: { titulo: "Dejaron de responder", que: "No contestan hace más de 4 días. Pasan a Caídos, sin otro mensaje." },
  concreto_llamada: { titulo: "Habían concretado una llamada y nadie les contestó", que: "Lo último que dijeron fue aceptar o pedir una llamada. Pasan a Captados, en «Para cerrar»." },
  posible_captacion: { titulo: "Posible captación a revisar", que: "Parece que concretaron una llamada, pero no queda claro. Decidilo vos." },
  incidencia_de_migracion: { titulo: "Incidencias de la migración", que: "Eran diferencias de datos del 10/10, no reclamos. Quedan archivadas con su nota." },
  relectura_sin_cambio: { titulo: "Releídos: quedan donde estaban", que: "El bot releyó el chat y no correspondía moverlos." },
};
