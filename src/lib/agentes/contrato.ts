/**
 * Etapa 3 · Contrato de salida del agente y validación determinista (cap. 16, R07).
 *
 * La salida interna de un turno se separa en: texto propuesto, datos
 * extraídos, acciones pedidas (solo por herramienta) y evidencia (mensajes
 * que sustentan la decisión). El servidor valida el TEXTO antes de enviarlo:
 * una respuesta con precio, cuota, plazo, promesa de resultado, urgencia
 * inventada o identidad humana falsa se retiene y pasa a revisión; el
 * modelo nunca actualiza estados por sí solo. Puro, sin dependencias.
 */

export interface SalidaAgente {
  texto: string;
  datos: Record<string, unknown>;
  acciones: { herramienta: string; argumentos: Record<string, unknown>; id?: string }[];
  evidencia: string[];
}

export type MotivoRetencion =
  | "precio_o_importe"
  | "cuotas_o_financiacion"
  | "plazo_o_resultado_prometido"
  | "urgencia_inventada"
  | "identidad_humana_falsa"
  | "diagnostico_o_dictamen"
  | "testimonio_o_caso"
  | "texto_vacio"
  | "texto_largo"
  | "varios_mensajes";

export const MOTIVO_RETENCION_TEXTO: Record<MotivoRetencion, string> = {
  precio_o_importe: "Menciona un precio, importe o porcentaje",
  cuotas_o_financiacion: "Menciona cuotas, financiación, descuento o promoción",
  plazo_o_resultado_prometido: "Promete un plazo, un resultado o una garantía",
  urgencia_inventada: "Crea urgencia o escasez sin una condición autorizada",
  identidad_humana_falsa: "Se presenta como una persona real, abogado o profesional, o niega ser una automatización",
  diagnostico_o_dictamen: "Emite diagnóstico, dictamen jurídico o indemnización",
  testimonio_o_caso: "Cita clientes, casos de éxito o testimonios",
  texto_vacio: "Respuesta vacía",
  texto_largo: "Respuesta demasiado larga para WhatsApp",
  varios_mensajes: "Parte la respuesta en demasiados mensajes",
};

export const MAX_TEXTO = 900;

/** Detectores. Cada uno con pocas falsas alarmas: se prefiere retener a enviar. */
const DETECTORES: { motivo: MotivoRetencion; re: RegExp[] }[] = [
  {
    motivo: "precio_o_importe",
    re: [/\$\s?\d/, /\b(?:ars|usd|u\$s|pesos|dólares|dolares)\b\s*\d/i, /\d[\d.,]*\s?(?:pesos|dólares|dolares|usd|ars)\b/i, /\b\d{1,3}\s?%/, /\b(?:precio|cuesta|sale|vale|cobramos|honorarios?)\s+(?:es|son|de|desde|unos?|aprox\w*)?\s*\$?\s?\d/i],
  },
  {
    motivo: "cuotas_o_financiacion",
    re: [/\b\d+\s+cuotas?\b/i, /\bcuotas?\s+(?:sin interés|fijas|de)\b/i, /\bfinanciaci[oó]n\s+(?:aprobada|garantizada|del\s+\d)/i, /\bdescuento\s+del?\s+\d/i, /\bpromoci[oó]n\b/i, /\bbonificaci[oó]n\b/i],
  },
  {
    motivo: "plazo_o_resultado_prometido",
    re: [/\bte\s+(?:garantiz|asegur)\w*/i, /\bgarantizad[oa]s?\b/i, /\b(?:vas a|van a)\s+(?:cobrar|ganar|recibir)\b/i, /\ben\s+\d+\s+(?:d[ií]as|horas|semanas|meses)\s+(?:lo\s+)?(?:resolvemos|cobr[aá]s|ten[eé]s|est[aá]\s+listo)/i, /\bseguro\s+que\s+(?:gan|cobr)/i, /\bseguro\s+(?:gan[aá]s|cobr[aá]s|lo\s+gan)/i, /\bgan[aá]s\s+seguro\b/i, /\b(?:sin\s+)?riesgo\s+de\s+perder\b/i],
  },
  {
    motivo: "urgencia_inventada",
    re: [/\b(?:[uú]ltim[oa]s?\s+(?:cupos?|lugares?|d[ií]as?|unidades?))\b/i, /\bquedan?\s+(?:pocos?|solo\s+\d+)\s+(?:cupos?|lugares?|unidades?)\b/i, /\bsolo\s+(?:por\s+)?hoy\b/i, /\bvence\s+(?:hoy|mañana)\b/i, /\bapurate\b/i],
  },
  {
    motivo: "identidad_humana_falsa",
    re: [/\bsoy\s+(?:el|la|un|una)\s+(?:abogad[oa]|doctor[a]?|dr\.?|dra\.?|m[eé]dic[oa]|asesor[a]?\s+humano)/i, /\bno\s+soy\s+(?:un\s+)?(?:bot|robot|automatizaci[oó]n|inteligencia artificial|ia)\b/i, /\bsoy\s+una\s+persona\b/i, /\bte\s+habla\s+(?:el|la)\s+(?:abogad|dr|dra|doctor)/i, /\bmi\s+matr[ií]cula\b/i],
  },
  {
    motivo: "diagnostico_o_dictamen",
    re: [/\bte\s+corresponde\s+(?:una\s+)?indemnizaci[oó]n/i, /\bla\s+indemnizaci[oó]n\s+(?:ser[ií]a|es|va a ser)\b/i, /\b(?:tienen|ten[eé]s)\s+(?:la\s+)?(?:culpa|responsabilidad)\b/i, /\bprescribi[oó]\b/i, /\bten[eé]s\s+(?:un\s+)?caso\s+ganado\b/i, /\bdiagn[oó]stico\s+es\b/i, /\bla\s+cartilla\s+incluye\b/i, /\bten[eé]s\s+cobertura\s+(?:asegurada|garantizada)\b/i],
  },
  {
    motivo: "testimonio_o_caso",
    re: [/\b(?:otro|un)\s+cliente\s+(?:nuestro\s+)?(?:cobr|gan|logr)/i, /\bcaso\s+de\s+[eé]xito\b/i, /\btestimonio/i, /\bnuestros\s+clientes\s+(?:ya\s+)?(?:cobraron|ganaron|ahorraron)\b/i],
  },
];

export interface ValidacionSalida {
  ok: boolean;
  motivos: MotivoRetencion[];
  fragmentos: string[];
}

export function validarTextoSalida(texto: string, opts: { permitirCifras?: boolean } = {}): ValidacionSalida {
  const t = (texto ?? "").trim();
  const motivos: MotivoRetencion[] = [];
  const fragmentos: string[] = [];
  if (!t) return { ok: false, motivos: ["texto_vacio"], fragmentos };
  if (t.length > MAX_TEXTO) motivos.push("texto_largo");
  if ((t.match(/\n{2,}/g) ?? []).length > 3) motivos.push("varios_mensajes");
  for (const d of DETECTORES) {
    if (opts.permitirCifras && (d.motivo === "precio_o_importe" || d.motivo === "cuotas_o_financiacion")) continue;
    for (const re of d.re) {
      const m = t.match(re);
      if (m) {
        if (!motivos.includes(d.motivo)) motivos.push(d.motivo);
        fragmentos.push(m[0]);
        break;
      }
    }
  }
  return { ok: motivos.length === 0, motivos, fragmentos };
}

/** Herramientas que el agente puede pedir; cualquier otra acción se descarta. */
export const HERRAMIENTAS_PERMITIDAS = [
  "guardar_datos_calificacion",
  "evaluar_calificacion",
  "consultar_disponibilidad",
  "agendar_cita",
  "escalar_a_humano",
  "finalizar_consulta",
  "registrar_resultado_marketing",
  "analizar_negocio",
  "captar",
  "detener_contacto",
  "registrar_ubicacion",
  "elegir_ruta_juridica",
  "programar_fase2",
] as const;

/** Normaliza lo que devuelve el modelo a un contrato cerrado. Nada fuera del contrato pasa. */
export function normalizarSalida(parts: { text?: string; functionCall?: { id?: string; name?: string; args?: unknown } }[], evidencia: string[] = []): SalidaAgente {
  const texto = parts
    .filter((p) => typeof p.text === "string")
    .map((p) => p.text as string)
    .join("\n")
    .trim();
  const acciones = parts
    .filter((p) => p.functionCall && typeof p.functionCall.name === "string" && (HERRAMIENTAS_PERMITIDAS as readonly string[]).includes(p.functionCall.name))
    .map((p) => ({
      herramienta: p.functionCall!.name as string,
      argumentos: p.functionCall!.args && typeof p.functionCall!.args === "object" ? (p.functionCall!.args as Record<string, unknown>) : {},
      ...(typeof p.functionCall!.id === "string" && p.functionCall!.id ? { id: p.functionCall!.id } : {}),
    }));
  const datos: Record<string, unknown> = {};
  for (const a of acciones) {
    if (a.herramienta === "guardar_datos_calificacion" && a.argumentos.datos && typeof a.argumentos.datos === "object") Object.assign(datos, a.argumentos.datos as object);
  }
  return { texto, datos, acciones, evidencia: evidencia.slice(-3) };
}

/**
 * Instrucciones de reparación cuando se retiene un texto: el modelo recibe el
 * motivo y vuelve a redactar una sola vez; si vuelve a fallar, va a una persona.
 */
export function instruccionReparacion(v: ValidacionSalida): string {
  return `Tu respuesta anterior no se puede enviar: ${v.motivos.map((m) => MOTIVO_RETENCION_TEXTO[m]).join("; ")}. Redactala de nuevo sin cifras, promesas, urgencia ni identidad humana; si la persona pidió precio o un resultado, decile que una persona del equipo se lo responde y usá escalar_a_humano.`;
}
