/**
 * Estadísticas por personas (24/10, pedido de la responsable). Cinco grupos
 * separados y simples, contando personas y no mensajes:
 *
 * - Por cerrar: tiene interés y una duda que el bot no sabe responder
 *   (precio, decisión del profesional, consulta fuera de alcance). Es lo único
 *   que pide intervenir a mano.
 * - Pidió una persona: solo interesados (no quejas ni bajas).
 * - Bot trabado: el bot no pudo responder (respuesta retenida o error real).
 * - Se enfrió: respondió con interés y hace más de 48 h que no contesta.
 * - No interesados: bajas, quejas, ya resuelto, ya tiene abogado, número
 *   equivocado. El bot se disculpa; es solo una cifra, no una tarea.
 */

export type GrupoPersonas = "por_cerrar" | "pide_persona" | "bot_trabado" | "se_enfrio" | "no_interesado";

export const GRUPOS_PERSONAS: { clave: GrupoPersonas; titulo: string; detalle: string; tarea: boolean }[] = [
  { clave: "por_cerrar", titulo: "Por cerrar", detalle: "interés + una duda que el bot no sabe", tarea: true },
  { clave: "pide_persona", titulo: "Pidieron una persona", detalle: "interesados", tarea: true },
  { clave: "bot_trabado", titulo: "Bot trabado", detalle: "no supo o no pudo responder", tarea: true },
  { clave: "se_enfrio", titulo: "Se enfriaron", detalle: "+48 h sin responder", tarea: true },
  { clave: "no_interesado", titulo: "No interesados", detalle: "bajas y quejas · solo cifra", tarea: false },
];

const POR_CERRAR = new Set(["precio_fuera_alcance", "decision_profesional", "consulta_fuera_alcance", "mensaje_posterior_captado"]);
const PIDE_PERSONA = new Set(["pide_persona"]);
const NO_INTERESADO = new Set([
  "no_quiere_mensajes",
  "enojo_por_contacto",
  "numero_equivocado",
  "caso_resuelto",
  "abogado_existente",
  "compra_otro_canal",
  "desinteres",
]);

/** Grupo de una oportunidad según el motivo de atención (pura). */
export function grupoPorMotivo(motivo: string | null | undefined): GrupoPersonas | null {
  if (!motivo) return null;
  if (POR_CERRAR.has(motivo)) return "por_cerrar";
  if (PIDE_PERSONA.has(motivo)) return "pide_persona";
  if (NO_INTERESADO.has(motivo)) return "no_interesado";
  return null;
}

/** ¿Un error de turno es un bot trabado de verdad? (una detención frenada no lo es). */
export function esTrabaReal(resultado: string, error: string | null | undefined): boolean {
  if (resultado === "retenido") return true;
  if (resultado !== "error") return false;
  return !/detenido|pausa/i.test(String(error ?? ""));
}

/** ¿Se enfrió? Respondió alguna vez y lo último fue nuestro, hace más de 48 h (y menos de 30 días). */
export function seEnfrio(input: { respondio: boolean; ultimoEsNuestro: boolean; ultimoAt: string | null }, ahora = new Date()): boolean {
  if (!input.respondio || !input.ultimoEsNuestro || !input.ultimoAt) return false;
  const horas = (ahora.getTime() - new Date(input.ultimoAt).getTime()) / 3_600_000;
  return horas >= 48 && horas <= 30 * 24;
}

/** Texto corto del motivo para la lista (pura). */
export function motivoLegible(motivo: string | null | undefined): string {
  const m: Record<string, string> = {
    precio_fuera_alcance: "Preguntó por precio u honorarios",
    decision_profesional: "Necesita una decisión del profesional",
    consulta_fuera_alcance: "Hizo una pregunta que el bot no sabe",
    mensaje_posterior_captado: "Ya captado, volvió a escribir",
    pide_persona: "Pidió hablar con una persona",
  };
  return (motivo && m[motivo]) || motivo || "";
}
