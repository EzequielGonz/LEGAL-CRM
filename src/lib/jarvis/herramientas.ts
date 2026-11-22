/**
 * Jarvis · herramientas propias (22/11). Solo declaraciones y el glosario:
 * puras. Las demás herramientas (chats, campañas, bot, operaciones del
 * panel) son las del asistente de siempre, menos las vedadas
 * (`seguridad.ts`). Las propias de Jarvis no cambian nada en la base:
 * `dejar_borrador` solo muestra un texto, `estado_lineas` y `explicar_cifra`
 * leen.
 */

export const NOMBRES_JARVIS = ["dejar_borrador", "estado_lineas", "explicar_cifra"] as const;

export const DECLARACIONES_JARVIS = [
  {
    name: "dejar_borrador",
    description:
      "Deja un BORRADOR de mensaje para una persona (no se envía nada): se ve en una tarjeta, se copia y se manda a mano desde el chat. Usalo para «redactame una respuesta». Leé el chat antes con buscar_chat para que el texto calce.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        para: { type: "string", description: "Nombre de la persona, como figura en el chat" },
        texto: { type: "string", description: "Mensaje listo para copiar (corto, cálido, sin precios ni promesas)" },
      },
      required: ["texto"],
    },
  },
  {
    name: "estado_lineas",
    description: "Estado de las líneas de WhatsApp de este perfil: si están conectadas, si pueden enviar y su límite diario. Solo lectura.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "explicar_cifra",
    description: "Explica en palabras simples qué cuenta una cifra del panel (captados, esperan a una persona, en seguimiento, perdidos, tasa de respuesta, enviados, derivados…). Para el valor actual usá además resumen_perfil.",
    parametersJsonSchema: { type: "object", properties: { cifra: { type: "string", description: "Nombre de la cifra o del número que la persona ve" } }, required: ["cifra"] },
  },
] as const;

export interface EntradaGlosario {
  clave: string;
  palabras: string[];
  explicacion: string;
}

/** Definiciones simples, alineadas con `definiciones/cifras.ts` y el contexto del CRM. */
export const GLOSARIO: readonly EntradaGlosario[] = [
  { clave: "Captado", palabras: ["captado", "captados", "captacion", "captación"], explicacion: "Una persona que mostró interés y aceptó el siguiente paso, con evidencia en el chat. Agendar una cita o compartir datos no alcanza para contarla." },
  { clave: "Esperan a una persona", palabras: ["esperan", "esperando", "piden una persona", "requiere humano", "quieren hablar"], explicacion: "Personas que pidieron hablar con alguien del equipo y todavía no tuvieron respuesta. No cuenta a los perdidos ni a los que se detuvieron por rechazo o número equivocado." },
  { clave: "En conversación", palabras: ["en conversacion", "en conversación", "hablando ahora", "charlas"], explicacion: "Charlas en curso con movimiento en los últimos 3 días." },
  { clave: "Con seguimiento enviado", palabras: ["seguimiento", "con seguimiento"], explicacion: "Personas a las que ya se les mandó un mensaje de seguimiento. Son como máximo tres intentos, y solo si respondieron antes." },
  { clave: "Se les insiste", palabras: ["insiste", "dejaron de responder", "sin respuesta"], explicacion: "Personas que dejaron de responder hace más de 3 días y a las que el sistema todavía les escribe." },
  { clave: "Perdidos", palabras: ["perdido", "perdidos", "no avanzo", "no avanzó"], explicacion: "Personas que no avanzaron: dijeron que no les interesa, se enojaron, era un número equivocado o ya lo resolvieron. Pasan solas a un archivo y no se les vuelve a escribir." },
  { clave: "Tasa de respuesta", palabras: ["tasa", "respuesta", "respondieron", "porcentaje"], explicacion: "Personas que respondieron dividido las personas a las que se les envió. «Enviados» cuenta mensajes y «Respondieron» cuenta personas, por eso no se comparan uno a uno." },
  { clave: "Enviados", palabras: ["enviados", "enviado", "mensajes"], explicacion: "Cantidad de mensajes que salieron. Una persona puede recibir más de uno." },
  { clave: "Derivado", palabras: ["derivado", "derivados", "sin derivar", "derivar"], explicacion: "Un captado que alguien del equipo pasó a mano al profesional. Derivar es siempre manual: nunca se deriva solo." },
  { clave: "Horario de envío", palabras: ["horario", "hora", "cuando envia", "cuándo envía"], explicacion: "Lo que arranca la empresa (campañas, seguimientos) sale de lunes a sábado de 8 a 21, hora de Argentina. Las respuestas a quien escribe salen las 24 horas si el bot está habilitado." },
];

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Entradas del glosario que calzan con lo que pregunta la persona (hasta 3; si ninguna, las más comunes). */
export function buscarEnGlosario(consulta: unknown): EntradaGlosario[] {
  const q = sinTildes(String(consulta ?? ""));
  const calzan = GLOSARIO.filter((e) => e.palabras.some((p) => q.includes(sinTildes(p))) || q.includes(sinTildes(e.clave)));
  return (calzan.length > 0 ? calzan : GLOSARIO.slice(0, 3)).slice(0, 3);
}
