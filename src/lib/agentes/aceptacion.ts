/**
 * 15/11 (auditoría): segunda llave antes de captar. El modelo decide que la
 * persona aceptó, pero si su último mensaje es un rechazo o una pregunta sin
 * ninguna señal de sí, no se capta y la charla sigue. Pura.
 */
function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rechazo siempre (salvo que pida el contacto con sus palabras). */
const RECHAZO_DURO = [
  /\bno (me|nos) interesa\b/,
  /\bno,? gracias\b/,
  /^no[.!]*$/,
  /\bno estoy interesad[oa]\b/,
];
/** Rechazo suave: no cuenta si el mensaje arranca con un «sí» claro («sí, me interesa, pero hoy no tengo tiempo»). */
const RECHAZO_SUAVE = [
  /\bahora no\b/,
  /\bno por ahora\b/,
  /\bmas adelante\b/,
  /\bno (quiero|necesito|hace falta)\b/,
  /\bno (tengo|me da el) tiempo\b/,
  /\bdespues (te|les) (aviso|escribo)\b/,
  /\blo (voy a pensar|pienso|pensamos|vamos a pensar)\b|\blo tengo que pensar\b|\bdejame pensarlo\b/,
];
const SI_AL_EMPEZAR = /^(si+|dale|ok|okey|oka|de una|me interesa|perfecto|listo|bueno|claro|obvio|genial|joya)\b/;

/** En una pregunta, solo cuenta como aceptación un «sí» o un pedido de contacto u horario (no un número suelto). */
const ACEPTA_EN_PREGUNTA = [
  /\b(si|sii+|dale|ok|okey|bueno|listo|perfecto|claro|de acuerdo)\b/,
  /\bme (interesa|sirve|parece bien|viene bien)\b/,
  /\b(llam[ae]me|llamenme|llamar|llamen|llamada|contactar|contactenme|escribanme|hablar|hablemos)\b/,
  /\b(manana|tarde|a la (manana|tarde)|despues de las|antes de las|lunes|martes|miercoles|jueves|viernes|sabado)\b/,
  /\bagend/,
  /\b(cuando|a que hora) (me|pueden|podes|puede)\b/,
];

/** Pide el contacto con sus palabras: vale aunque arranque con un «no» («ahora no puedo, llamame a la tarde»). */
const PIDE_CONTACTO = /\b(llam[ae]me|llamenme|llamame|llamen|contactenme|escribanme|hablemos|agend\w*)\b/;

export type Aceptacion = { ok: true } | { ok: false; motivo: "rechazo" | "pregunta_sin_aceptacion" | "vacio" };

export function aceptacionReal(ultimoEntrante: string | null | undefined): Aceptacion {
  const t = normalizar(ultimoEntrante ?? "");
  if (!t) return { ok: false, motivo: "vacio" };
  const pide = PIDE_CONTACTO.test(t);
  if (!pide && RECHAZO_DURO.some((r) => r.test(t))) return { ok: false, motivo: "rechazo" };
  if (!pide && !SI_AL_EMPEZAR.test(t) && RECHAZO_SUAVE.some((r) => r.test(t))) return { ok: false, motivo: "rechazo" };
  const pregunta = t.includes("?");
  if (pregunta && !ACEPTA_EN_PREGUNTA.some((r) => r.test(t))) return { ok: false, motivo: "pregunta_sin_aceptacion" };
  return { ok: true };
}
