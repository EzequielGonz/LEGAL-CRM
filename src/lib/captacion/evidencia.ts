/**
 * Evidencia de captación con el mensaje real de la persona (22/11, hallazgos 15 §3 ítem 3).
 *
 * Antes la evidencia era la frase que el modelo decía que la persona había dicho, y la «segunda llave»
 * leía el último mensaje entrante sin saber si era de una persona o de un contestador, y dejaba pasar
 * el caso «sin texto». Así se registró un falso captado con un mensaje automático seguido de «que no me
 * contacte nadie». Ahora la captación sale solo si el último mensaje entrante:
 *  - existe, tiene identificador (se guarda como `evidence_message_id` del evento) y texto;
 *  - no es una respuesta automática de otro negocio;
 *  - y, cuando se exige, es una aceptación real (no un rechazo ni una pregunta sin aceptación).
 * Pura: se prueba sola.
 */
import { aceptacionReal } from "@/lib/agentes/aceptacion";
import { esRespuestaAutomatica } from "@/lib/agentes/automaticos";

export interface MensajeParaEvidencia {
  id?: string | null;
  direction: string;
  sender_type?: string | null;
  body: string | null;
  created_at?: string | null;
}

export type MotivoSinEvidencia = "sin_mensaje_de_la_persona" | "sin_id" | "respuesta_automatica" | "rechazo" | "pregunta_sin_aceptacion" | "vacio";

export type EvidenciaDeCaptacion =
  | { ok: true; messageId: string; textoPersona: string; evidencia: string }
  | { ok: false; motivo: MotivoSinEvidencia };

/** Texto guardado como evidencia: la frase real, con su id, y lo que anotó el agente. */
export function textoDeEvidencia(messageId: string, textoPersona: string, notaDelAgente: string): string {
  const frase = textoPersona.replace(/\s+/g, " ").trim().slice(0, 400);
  const nota = (notaDelAgente ?? "").replace(/\s+/g, " ").trim().slice(0, 1200);
  return `Mensaje de la persona (${messageId}): «${frase}»${nota ? `. Nota del agente: ${nota}` : ""}`.slice(0, 2000);
}

/**
 * `historial` de más viejo a más nuevo. `exigirAceptacion` en false (presupuesto pedido, aprobación de
 * Marketing) solo descarta lo que no es de una persona o es un rechazo claro.
 */
export function evidenciaDeCaptacion(
  historial: MensajeParaEvidencia[],
  notaDelAgente: string,
  opts: { exigirAceptacion?: boolean } = {}
): EvidenciaDeCaptacion {
  const exigir = opts.exigirAceptacion !== false;
  const ultimo = [...historial].reverse().find((m) => m.direction === "entrante");
  if (!ultimo) return { ok: false, motivo: "sin_mensaje_de_la_persona" };
  const texto = (ultimo.body ?? "").trim();
  if (!texto) return { ok: false, motivo: "vacio" };
  if (!ultimo.id) return { ok: false, motivo: "sin_id" };
  if (esRespuestaAutomatica(texto)) return { ok: false, motivo: "respuesta_automatica" };
  const llave = aceptacionReal(texto);
  if (!llave.ok) {
    if (llave.motivo === "rechazo") return { ok: false, motivo: "rechazo" };
    if (exigir) return { ok: false, motivo: llave.motivo === "pregunta_sin_aceptacion" ? "pregunta_sin_aceptacion" : "vacio" };
  }
  return { ok: true, messageId: String(ultimo.id), textoPersona: texto, evidencia: textoDeEvidencia(String(ultimo.id), texto, notaDelAgente) };
}

/** Nota para el modelo cuando no se capta. */
export const NOTA_SIN_EVIDENCIA: Record<MotivoSinEvidencia, string> = {
  sin_mensaje_de_la_persona: "No hay un mensaje de la persona que respalde la captación. Seguí la conversación.",
  sin_id: "No se pudo identificar el mensaje de la persona. No captes: seguí la conversación.",
  vacio: "Su último mensaje no tiene texto que muestre aceptación. No captes: seguí la conversación.",
  respuesta_automatica: "Lo último que llegó es una respuesta automática de otro negocio, no una persona. No captes.",
  rechazo: "Su último mensaje no es una aceptación. No captes: seguí la regla de rechazos.",
  pregunta_sin_aceptacion: "Su último mensaje es una pregunta sin aceptación. Respondela y volvé a proponer el siguiente paso.",
};
