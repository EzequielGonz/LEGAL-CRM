/**
 * «Plantillas» propias de Wasender (10/11). Puras: se prueban solas.
 *
 * - Variables con nombre: {{nombre}} (de la persona), {{asesor}} (nombre de
 *   presentación del perfil) y {{marca}}. Sin aprobación de Meta.
 * - Variantes: el mismo mensaje dicho de otra forma, para que no salgan todos
 *   idénticos (lo que más bloquea números en WhatsApp). Cada persona recibe
 *   siempre la misma variante.
 * - Copia desde Meta: los {{1}}, {{2}}… se pasan a variables con nombre según
 *   la asignación de la plantilla o el texto que los precede, y los botones de respuesta rápida se escriben
 *   como texto («Respondé: …»), porque por Wasender no hay botones confiables.
 */

export const VARIABLES = ["nombre", "asesor", "marca"] as const;
export type Variable = (typeof VARIABLES)[number];
export type UsoPlantilla = "campana" | "seguimiento" | "manual";

/** Largo máximo de un mensaje de WhatsApp. */
export const LARGO_MAXIMO = 4096;

const RE_VARIABLE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function variablesDe(texto: string): string[] {
  const out = new Set<string>();
  for (const m of String(texto ?? "").matchAll(RE_VARIABLE)) out.add(m[1].toLowerCase());
  return [...out];
}

export interface Problema {
  campo: string;
  texto: string;
}

export function validarPlantilla(p: { nombre: string; cuerpo: string; variantes: string[] }): Problema[] {
  const problemas: Problema[] = [];
  if (!p.nombre?.trim()) problemas.push({ campo: "nombre", texto: "Poné un nombre." });
  const textos = [{ campo: "cuerpo", t: p.cuerpo }, ...p.variantes.map((t, i) => ({ campo: `variante ${i + 1}`, t }))];
  for (const { campo, t } of textos) {
    if (!t?.trim()) {
      problemas.push({ campo, texto: "Está vacío." });
      continue;
    }
    if (t.length > LARGO_MAXIMO) problemas.push({ campo, texto: `Tiene ${t.length} caracteres; el máximo es ${LARGO_MAXIMO}.` });
    const malas = variablesDe(t).filter((v) => !(VARIABLES as readonly string[]).includes(v));
    if (malas.length) problemas.push({ campo, texto: `Variables desconocidas: ${malas.map((v) => `{{${v}}}`).join(", ")}. Se pueden usar {{nombre}}, {{asesor}} y {{marca}}.` });
  }
  return problemas;
}

/** Elige siempre la misma variante para la misma persona (por su id). */
export function elegirVariante(cuerpo: string, variantes: string[], semilla: string): string {
  const todas = [cuerpo, ...variantes.filter((v) => v?.trim())];
  let h = 0;
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return todas[h % todas.length];
}

/**
 * Completa las variables. Sin nombre de la persona, se saca la variable sin
 * dejar espacios ni comas sueltas («Hola {{nombre}}, …» → «Hola, …»).
 */
export function completar(texto: string, datos: Partial<Record<Variable, string | null>>): string {
  const lleno = String(texto ?? "").replace(RE_VARIABLE, (_, v: string) => (datos[v.toLowerCase() as Variable] ?? "").trim());
  return lleno
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]+|[ \t]+$/gm, "");
}

/** Fuente de cada variable de Meta (asignación de la plantilla) → variable con nombre. */
export function variableDesdeFuente(fuente: string | null | undefined): Variable | null {
  switch (fuente) {
    case "contacto.nombre":
      return "nombre";
    case "perfil.presentacion":
      return "asesor";
    case "perfil.marca":
      return "marca";
    default:
      return null;
  }
}

export interface CopiaDesdeMeta {
  cuerpo: string;
  /** Variables de Meta que no se pudieron traducir (quedan marcadas para revisar). */
  sinTraducir: string[];
}

/**
 * Variable de Meta deducida por el texto que la precede, para las plantillas
 * sin asignación (cada una usaba los {{1}}, {{2}}… a su manera):
 * «Hola {{n}}» = nombre; «soy / te escribe / habla {{n}}» = asesor;
 * «de {{n}}» después del asesor, o «escribimos de / equipo de {{n}}» = marca.
 * Lo demás («a las {{n}}», «sobre {{n}}») no se adivina.
 */
export function inferirVariable(antes: string): Variable | null {
  const a = antes.toLowerCase().replace(/\s+/g, " ").trimEnd();
  if (/(^|[\s¿¡.])hola,?$/.test(a)) return "nombre";
  if (/(soy|habla|escribe|mi nombre es)$/.test(a)) return "asesor";
  if (/(escribimos de|equipo de)$/.test(a)) return "marca";
  if (/(soy|habla|escribe|mi nombre es) \{\{asesor\}\},? (de|del)$/.test(a)) return "marca";
  return null;
}

/**
 * Pasa el texto de una plantilla de Meta a una propia. `fuentes` es la lista
 * de la asignación de la plantilla (1 → primera, 2 → segunda…). Sin
 * asignación, cada variable se deduce por el texto que la precede; lo que no
 * se puede deducir queda marcado «[revisar n]».
 */
export function copiarDesdeMeta(cuerpoMeta: string, fuentes: (string | null)[] | null, botones: string[] = []): CopiaDesdeMeta {
  const sinTraducir: string[] = [];
  const original = String(cuerpoMeta ?? "");
  let cuerpo = "";
  let ultimo = 0;
  for (const m of original.matchAll(/\{\{\s*(\d+)\s*\}\}/g)) {
    const i = Number(m[1]) - 1;
    cuerpo += original.slice(ultimo, m.index);
    const v = fuentes ? variableDesdeFuente(fuentes[i]) : inferirVariable(cuerpo);
    if (v) cuerpo += `{{${v}}}`;
    else {
      sinTraducir.push(m[0]);
      cuerpo += `[revisar ${m[1]}]`;
    }
    ultimo = (m.index ?? 0) + m[0].length;
  }
  cuerpo += original.slice(ultimo);
  const opciones = botones.map((b) => b.trim()).filter(Boolean);
  const pie = opciones.length ? `\n\nRespondé: ${opciones.map((o) => `«${o}»`).join(", ").replace(/, ([^,]*)$/, " o $1")}.` : "";
  return { cuerpo: `${cuerpo}${pie}`, sinTraducir };
}

/** Perfil (slug) de una plantilla de Meta por su prefijo, cuando no tiene asignación. */
export function perfilPorNombreMeta(nombre: string): "juridico" | "agencia_0km" | "coberturas_medicas" | "marketing" | null {
  const n = nombre.toLowerCase();
  if (/^(autos|.*_autos$)/.test(n)) return "agencia_0km";
  if (/^(cob|.*_cob$)/.test(n)) return "coberturas_medicas";
  if (/^(mkt|kocos|.*_mkt$)/.test(n)) return "marketing";
  if (/^(jur|contacto|estudio|.*_jur$)/.test(n)) return "juridico";
  return null;
}

/** Uso de la plantilla según el propósito de la asignación en Meta. */
export function usoDesdeMeta(proposito: string | null | undefined, nombre: string): UsoPlantilla {
  if (proposito === "campana") return "campana";
  if (proposito && proposito.startsWith("seguimiento")) return "seguimiento";
  if (/recupero|seguimiento|reagendar|form_recibido/.test(nombre)) return "seguimiento";
  if (/^aviso_/.test(nombre)) return "manual";
  return "campana";
}
