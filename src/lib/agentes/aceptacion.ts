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

const NEGATIVO = [
  /\bno (me|nos) interesa\b/,
  /\bno,? gracias\b/,
  /\bahora no\b/,
  /\bno por ahora\b/,
  /\bmas adelante\b/,
  /\bno (quiero|necesito|hace falta)\b/,
  /\bno estoy interesad[oa]\b/,
  /\bno (tengo|me da el) tiempo\b/,
  /^no[.!]*$/,
  /\bdespues (te|les) (aviso|escribo)\b/,
  /\blo (voy a )?pienso\b|\blo tengo que pensar\b|\bdejame pensarlo\b/,
];

const POSITIVO = [
  /\b(si|sii+|dale|ok|okey|oka|bueno|listo|perfecto|genial|joya|claro|obvio|de una|de acuerdo|va|vamos)\b/,
  /\bme (interesa|sirve|parece bien|viene bien)\b/,
  /\b(quiero|quisiera|necesito)\b/,
  /\b(llam[ae]me|llamenme|llamar|llamen|llamada|contactar|contactenme|escribanme|hablar|hablemos)\b/,
  /\b(manana|tarde|noche|hoy|lunes|martes|miercoles|jueves|viernes|sabado|domingo|a la (manana|tarde)|despues de las|antes de las|\d{1,2}\s?(hs|h|horas)?)\b/,
  /\bpor favor\b/,
  /\bagend/,
  /\b(cuando|a que hora) (me|pueden|podes|puede)\b/,
];

/** Pide el contacto con sus palabras: vale aunque arranque con un «no» («ahora no puedo, llamame a la tarde»). */
const PIDE_CONTACTO = /\b(llam[ae]me|llamenme|llamame|llamen|contactenme|escribanme|hablemos|agend\w*)\b/;

export type Aceptacion = { ok: true } | { ok: false; motivo: "rechazo" | "pregunta_sin_aceptacion" | "vacio" };

export function aceptacionReal(ultimoEntrante: string | null | undefined): Aceptacion {
  const t = normalizar(ultimoEntrante ?? "");
  if (!t) return { ok: false, motivo: "vacio" };
  if (NEGATIVO.some((r) => r.test(t)) && !PIDE_CONTACTO.test(t)) return { ok: false, motivo: "rechazo" };
  const pregunta = t.includes("?");
  if (pregunta && !POSITIVO.some((r) => r.test(t))) return { ok: false, motivo: "pregunta_sin_aceptacion" };
  return { ok: true };
}
