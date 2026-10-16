/**
 * Catálogo de plantillas de WhatsApp (pregunta 22, bloque 1.8) — funciones
 * puras: sin red ni base, para poder probarlas con datos controlados.
 *
 * Reglas:
 *  - Una plantilla vale solo con el estado que informa Meta. Los nombres
 *    escritos a mano y los textos de ejemplo no cuentan como aprobados, y
 *    nunca se inventa un nombre ni un estado.
 *  - Se eligen por perfil, línea y propósito. En la Etapa 1 solo se
 *    habilita "campana"; los demás propósitos quedan preparados.
 *  - Si falta una plantilla válida, ese envío queda pendiente.
 */

/** Plantilla tal como la devuelve la API de Meta (campos que usamos). */
export interface MetaTemplate {
  id?: string;
  name: string;
  language: string;
  status: string;
  category?: string | null;
  sub_category?: string | null;
  parameter_format?: string | null;
  components?: any[] | null;
  quality_score?: { score?: string | null } | string | null;
  rejected_reason?: string | null;
}

export interface TemplateAnalysis {
  bodyText: string | null;
  /** POSITIONAL ({{1}}, {{2}}) o NAMED ({{nombre}}). */
  format: "POSITIONAL" | "NAMED";
  /** Variables del cuerpo en el orden en que se envían. */
  bodyVariables: string[];
  /** Ejemplos que se cargaron en Meta para cada variable del cuerpo (mismo orden), si existen. */
  bodyExamples: (string | null)[];
  header: { format: string; text: string | null; variables: string[] } | null;
  footer: string | null;
  buttons: { type: string; text: string | null; variables: string[] }[];
  /** ¿Se puede enviar desde una campaña con el envío actual (solo variables de texto en el cuerpo)? */
  campaignCompatible: boolean;
  incompatibilities: string[];
}

const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function placeholders(text: string | null | undefined): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const m of text.matchAll(PLACEHOLDER)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

const MEDIA_HEADER_LABEL: Record<string, string> = {
  IMAGE: "una imagen",
  VIDEO: "un video",
  DOCUMENT: "un documento",
  LOCATION: "una ubicación",
};

// Botones que no necesitan datos al enviar.
const STATIC_BUTTONS = new Set(["QUICK_REPLY", "PHONE_NUMBER", "URL"]);

export function analyzeTemplate(t: MetaTemplate): TemplateAnalysis {
  const components = Array.isArray(t.components) ? t.components : [];
  const find = (type: string) => components.find((c) => String(c?.type ?? "").toUpperCase() === type);
  const body = find("BODY");
  const headerC = find("HEADER");
  const footerC = find("FOOTER");
  const buttonsC = find("BUTTONS");
  const incompatibilities: string[] = [];

  const bodyText: string | null = typeof body?.text === "string" ? body.text : null;
  const rawVars = placeholders(bodyText);
  const declared = String(t.parameter_format ?? "").toUpperCase();
  const allNumeric = rawVars.every((v) => /^\d+$/.test(v));
  const format: "POSITIONAL" | "NAMED" =
    declared === "NAMED" || declared === "POSITIONAL"
      ? (declared as "POSITIONAL" | "NAMED")
      : rawVars.length > 0 && !allNumeric
      ? "NAMED"
      : "POSITIONAL";

  let bodyVariables = rawVars;
  let bodyExamples: (string | null)[] = rawVars.map(() => null);
  if (format === "POSITIONAL") {
    if (!allNumeric) incompatibilities.push("El cuerpo mezcla variables con nombre y numeradas");
    bodyVariables = [...rawVars].sort((a, b) => Number(a) - Number(b));
    const expected = bodyVariables.map((_, i) => String(i + 1));
    if (allNumeric && bodyVariables.join(",") !== expected.join(",")) {
      incompatibilities.push("Las variables del cuerpo no son correlativas ({{1}}, {{2}}…)");
    }
    const ex = body?.example?.body_text;
    const row: unknown[] = Array.isArray(ex) && Array.isArray(ex[0]) ? ex[0] : [];
    bodyExamples = bodyVariables.map((v) => {
      const val = row[Number(v) - 1];
      return typeof val === "string" ? val : null;
    });
  } else {
    const named: any[] = Array.isArray(body?.example?.body_text_named_params) ? body.example.body_text_named_params : [];
    bodyExamples = bodyVariables.map((v) => {
      const hit = named.find((p) => p?.param_name === v);
      return typeof hit?.example === "string" ? hit.example : null;
    });
  }

  if (!body) incompatibilities.push("La plantilla no tiene cuerpo");

  let header: TemplateAnalysis["header"] = null;
  if (headerC) {
    const hf = String(headerC.format ?? "TEXT").toUpperCase();
    const htext = typeof headerC.text === "string" ? headerC.text : null;
    header = { format: hf, text: htext, variables: placeholders(htext) };
    if (hf === "TEXT" && header.variables.length > 0) {
      incompatibilities.push("El encabezado lleva una variable, que todavía no se completa desde campañas");
    } else if (MEDIA_HEADER_LABEL[hf]) {
      incompatibilities.push(`El encabezado lleva ${MEDIA_HEADER_LABEL[hf]}, que todavía no se envía desde campañas`);
    } else if (hf !== "TEXT") {
      incompatibilities.push(`Encabezado de tipo ${hf}`);
    }
  }

  const buttons: TemplateAnalysis["buttons"] = [];
  const rawButtons: any[] = Array.isArray(buttonsC?.buttons) ? buttonsC.buttons : [];
  for (const b of rawButtons) {
    const type = String(b?.type ?? "").toUpperCase();
    const vars = placeholders(typeof b?.url === "string" ? b.url : null);
    buttons.push({ type, text: typeof b?.text === "string" ? b.text : null, variables: vars });
    if (!STATIC_BUTTONS.has(type)) incompatibilities.push(`Botón de tipo ${type}, que todavía no se envía desde campañas`);
    else if (type === "URL" && vars.length > 0) incompatibilities.push("Un botón lleva un enlace con variable");
  }

  const known = new Set(["HEADER", "BODY", "FOOTER", "BUTTONS"]);
  for (const c of components) {
    const type = String(c?.type ?? "").toUpperCase();
    if (!known.has(type)) incompatibilities.push(`Componente ${type}, que todavía no se envía desde campañas`);
  }
  if (String(t.category ?? "").toUpperCase() === "AUTHENTICATION") {
    incompatibilities.push("Es una plantilla de autenticación");
  }

  return {
    bodyText,
    format,
    bodyVariables,
    bodyExamples,
    header,
    footer: typeof footerC?.text === "string" ? footerC.text : null,
    buttons,
    campaignCompatible: incompatibilities.length === 0,
    incompatibilities,
  };
}

/** Etiqueta en castellano junto al estado real que informa Meta (nunca se reemplaza el valor). */
const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprobada",
  PENDING: "En revisión",
  IN_REVIEW: "En revisión",
  REJECTED: "Rechazada",
  PAUSED: "Pausada por Meta",
  DISABLED: "Deshabilitada",
  IN_APPEAL: "En apelación",
  APPEAL_REQUESTED: "En apelación",
  PENDING_DELETION: "En eliminación",
  DELETED: "Eliminada",
  ARCHIVED: "Archivada",
  LIMIT_EXCEEDED: "Límite excedido",
  REINSTATED: "Restablecida",
  FLAGGED: "Marcada por calidad",
};

export function statusLabel(status: string | null | undefined): string {
  const s = String(status ?? "").toUpperCase();
  if (!s) return "Sin estado";
  return STATUS_LABEL[s] ? `${STATUS_LABEL[s]} (${s})` : s;
}

/** Solo una plantilla aprobada se puede enviar. */
export function isSendable(status: string | null | undefined): boolean {
  return String(status ?? "").toUpperCase() === "APPROVED";
}

export function qualityText(q: MetaTemplate["quality_score"]): string | null {
  if (!q) return null;
  if (typeof q === "string") return q;
  return typeof q.score === "string" ? q.score : null;
}

// ---------------------------------------------------------------------
// Propósitos y fuentes de las variables

export type TemplatePurpose =
  | "campana"
  | "seguimiento"
  | "seguimiento_3"
  | "reagendamiento"
  | "inicio_cita"
  | "aviso_interno"
  | "formulario";

export const TEMPLATE_PURPOSES: { key: TemplatePurpose; label: string; enabled: boolean; when: string }[] = [
  { key: "campana", label: "Primer contacto de campaña", enabled: true, when: "Etapa 1 (bloque 1.8)" },
  { key: "seguimiento", label: "Seguimiento: contacto 2", enabled: true, when: "Etapa 2 (bloque 2.3)" },
  {
    key: "seguimiento_3",
    label: "Seguimiento: contacto 3 (si no hay, se usa la del contacto 2)",
    enabled: true,
    when: "Etapa 2 (bloque 2.3)",
  },
  { key: "reagendamiento", label: "Reagendamiento de la cita", enabled: false, when: "Se habilita en la Etapa 2 (bloque 2.2)" },
  { key: "inicio_cita", label: "Inicio de la cita (Fase 2)", enabled: false, when: "Se habilita en la Etapa 2 (bloque 2.2)" },
  { key: "aviso_interno", label: "Aviso interno de cierre", enabled: false, when: "Se habilita en la Etapa 2 (bloque 2.9)" },
  {
    key: "formulario",
    label: "Formulario verificado sin respuesta",
    enabled: false,
    when: "Preparado y desactivado hasta definir su cadencia (pregunta 34)",
  },
];

export function purposeInfo(key: string) {
  return TEMPLATE_PURPOSES.find((p) => p.key === key) ?? null;
}

export type VariableSource = "contacto.nombre" | "perfil.presentacion" | "perfil.marca";

export const VARIABLE_SOURCES: { key: VariableSource; label: string }[] = [
  { key: "contacto.nombre", label: "Nombre del contacto" },
  { key: "perfil.presentacion", label: "Nombre de presentación del agente (perfil)" },
  { key: "perfil.marca", label: "Nombre del perfil o marca (perfil)" },
];

export function sourceLabel(key: string): string {
  return VARIABLE_SOURCES.find((s) => s.key === key)?.label ?? key;
}

export function variableToken(variable: string): string {
  return `{{${variable}}}`;
}

/** Problemas de una asignación: cada variable del cuerpo necesita una fuente conocida. */
export function sourcesProblems(analysis: Pick<TemplateAnalysis, "bodyVariables" | "format">, sources: unknown): string[] {
  const list = Array.isArray(sources) ? sources : [];
  const problems: string[] = [];
  if (list.length !== analysis.bodyVariables.length) {
    problems.push(
      `La plantilla tiene ${analysis.bodyVariables.length} variable(s) en el cuerpo y la asignación indica ${list.length}`
    );
  }
  analysis.bodyVariables.forEach((v, i) => {
    const s = list[i];
    if (typeof s !== "string" || !VARIABLE_SOURCES.some((x) => x.key === s)) {
      problems.push(`Falta indicar con qué dato se completa ${variableToken(v)}`);
    }
  });
  return problems;
}

export interface SourceValues {
  "contacto.nombre": string | null | undefined;
  "perfil.presentacion": string | null | undefined;
  "perfil.marca": string | null | undefined;
}

export type BodyParameter = { type: "text"; text: string; parameter_name?: string };

/**
 * Arma los parámetros del cuerpo. Si falta un dato, no se arma nada: ese
 * envío no sale (nunca se manda una variable vacía ni un valor inventado).
 */
export function buildBodyParameters(
  analysis: Pick<TemplateAnalysis, "bodyVariables" | "format">,
  sources: string[],
  values: SourceValues
): { ok: true; parameters: BodyParameter[] } | { ok: false; missing: { variable: string; source: string; label: string }[] } {
  const missing: { variable: string; source: string; label: string }[] = [];
  const parameters: BodyParameter[] = [];
  analysis.bodyVariables.forEach((v, i) => {
    const source = sources[i];
    const raw = source ? (values as any)[source] : null;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!source || !text) {
      missing.push({ variable: variableToken(v), source: source ?? "", label: source ? sourceLabel(source) : "sin fuente" });
      return;
    }
    parameters.push(analysis.format === "NAMED" ? { type: "text", parameter_name: v, text } : { type: "text", text });
  });
  return missing.length ? { ok: false, missing } : { ok: true, parameters };
}

/** Texto del cuerpo con los valores de ejemplo o con las fuentes elegidas, para la vista previa. */
export function previewBody(
  analysis: Pick<TemplateAnalysis, "bodyText" | "bodyVariables">,
  fill: (variable: string, index: number) => string
): string {
  if (!analysis.bodyText) return "";
  return analysis.bodyText.replace(PLACEHOLDER, (_m, v: string) => {
    const i = analysis.bodyVariables.indexOf(v);
    return fill(v, i);
  });
}

// Los errores al enviar (plantilla, cuenta, destinatario, técnicos e
// inciertos) se clasifican en src/lib/envios/errores.ts.

// ---------------------------------------------------------------------
// Horario general (pregunta 39)

/** Lunes a sábado de 8 a 21, hora de Argentina; los domingos no se envía. Los feriados no se excluyen. */
export const GENERAL_SCHEDULE = { startHour: 8, endHour: 21, sunday: false } as const;
