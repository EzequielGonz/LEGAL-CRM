/**
 * Reclamos serios (13/11). Decisión de la responsable: «una incidencia o
 * detención tiene que ser un reclamo serio, un problema real, no que se
 * enojen o pidan no contacto». Quedan como incidencia de una persona solo
 * dos cosas: una amenaza legal o denuncia contra nosotros, y la queja de un
 * cliente ya captado.
 *
 * Estas funciones marcan candidatos por el texto. En Jurídico las palabras
 * «denuncia», «demanda» o «carta documento» son el tema de la consulta: por
 * eso se exige que la amenaza esté dirigida a quien le escribe (segunda
 * persona) o nombre un organismo de reclamo contra empresas. Puras.
 */

export function normalizar(texto: unknown): string {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const A_NOSOTROS = "(?:los|las|les|te|lo|la|le)";
const ACCION = "(?:denunci|demand|report|escrach)";

const AMENAZAS: { patron: RegExp; que: string }[] = [
  { patron: new RegExp(`\\b${A_NOSOTROS} (?:voy|vamos|va|van) a ${ACCION}ar\\b`), que: "Dice que nos va a denunciar o demandar" },
  { patron: new RegExp(`\\b(?:voy|vamos) a ${ACCION}ar(?:los|las|te|lo|la)\\b`), que: "Dice que nos va a denunciar o demandar" },
  { patron: new RegExp(`\\b${A_NOSOTROS} (?:denuncio|demando|reporto)\\b`), que: "Dice que nos denuncia" },
  { patron: new RegExp(`\\b${ACCION}ar(?:los|las|te)\\b`), que: "Habla de denunciarnos o demandarnos" },
  { patron: new RegExp(`\\b${A_NOSOTROS} (?:mando|envio|voy a mandar|voy a enviar|vamos a mandar)(?: una?)? carta documento\\b`), que: "Dice que nos manda carta documento" },
  { patron: /\bdefensa (?:del|al|de el) consumidor\b/, que: "Nombra a Defensa del Consumidor" },
  { patron: new RegExp(`\\bmi abogad[oa] (?:${A_NOSOTROS}|se) va a (?:contactar|llamar|escribir|comunicar)`), que: "Dice que su abogado nos va a contactar" },
  { patron: /\b(?:denuncia|denunciar|denuncio|denunciare)\b[^.?!]{0,40}\b(?:acoso|hostigamiento|spam|uso de mis datos|mis datos|estafa)\b/, que: "Habla de denunciar por acoso, datos o estafa" },
  { patron: /\b(?:acoso|hostigamiento|estaf)\w*\b[^.?!]{0,40}\b(?:denunci|demand)\w*/, que: "Habla de denunciar por acoso o estafa" },
  {
    patron: /\bsi (?:me )?(?:vuelven|siguen|volves|seguis|vuelve|sigue)(?: a)? (?:escrib|llam|molest|mand|contact)\w*[^.?!]{0,60}\b(?:denunci|demand|abogad|policia|carta documento|justicia)\w*/,
    que: "Amenaza con una acción legal si se le vuelve a escribir",
  },
];

export interface SenalReclamo {
  que: string;
  fragmento: string;
}

/** ¿El texto amenaza con una acción legal contra quien le escribe? Devuelve la señal o null. */
export function senalDeAmenaza(texto: unknown): SenalReclamo | null {
  const t = normalizar(texto);
  if (!t) return null;
  for (const a of AMENAZAS) {
    const m = a.patron.exec(t);
    if (m) return { que: a.que, fragmento: t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).trim() };
  }
  return null;
}

const QUEJAS: { patron: RegExp; que: string }[] = [
  { patron: /\bnadie me (?:llamo|contacto|escribio|atendio|respondio|contesto)\b/, que: "Dice que nadie lo contactó" },
  { patron: /\bno me (?:llamaron|contactaron|atendieron|respondieron|contestaron|llamo nadie)\b/, que: "Dice que no lo atendieron" },
  { patron: /\b(?:sigo|todavia|aun) (?:estoy )?esperando\b/, que: "Sigue esperando" },
  { patron: /\bhace (?:\w+ )?(?:dias|semanas|meses) que (?:espero|estoy esperando|no se nada|no me)\b/, que: "Espera hace días" },
  { patron: /\b(?:pesima|mala|malisima|horrible) atencion\b/, que: "Se queja de la atención" },
  { patron: /\bquiero (?:hacer |presentar )?(?:un |una )?(?:reclamo|queja)\b/, que: "Quiere hacer un reclamo" },
  { patron: /\bme (?:mintieron|estafaron|enganaron|tomaron el pelo)\b/, que: "Dice que lo engañaron" },
  { patron: /\b(?:una|que) verguenza\b/, que: "Se queja con dureza" },
  { patron: /\bquedaron en (?:llamar|llamarme|contactar|contactarme|escribir|escribirme|avisar|avisarme)\b/, que: "Dice que quedaron en llamarlo y no pasó" },
  { patron: /\bme prometieron\b/, que: "Reclama algo prometido" },
];

/** ¿El texto de un cliente ya captado es una queja por la atención o el servicio? */
export function senalDeQueja(texto: unknown): SenalReclamo | null {
  const t = normalizar(texto);
  if (!t) return null;
  for (const q of QUEJAS) {
    const m = q.patron.exec(t);
    if (m) return { que: q.que, fragmento: t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).trim() };
  }
  return null;
}

export type TipoReclamo = "amenaza_legal" | "queja_cliente_captado";

/** Qué reclamo serio hay en un mensaje, si hay alguno. La queja solo cuenta si la persona ya es cliente. */
export function reclamoEnMensaje(texto: unknown, o: { captado: boolean }): { tipo: TipoReclamo; senal: SenalReclamo } | null {
  const amenaza = senalDeAmenaza(texto);
  if (amenaza) return { tipo: "amenaza_legal", senal: amenaza };
  if (o.captado) {
    const queja = senalDeQueja(texto);
    if (queja) return { tipo: "queja_cliente_captado", senal: queja };
  }
  return null;
}
