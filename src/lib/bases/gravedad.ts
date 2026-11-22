/**
 * Etiqueta de gravedad y prioridad por perfil (22/11, hallazgos 15 §3 ítem 8). Pura.
 *
 * Solo en Jurídico la lesión ordena el envío (fractura, fallecimiento y amputación primero, las tres al mismo
 * nivel). Las bases «GRAVES/fracturas» traen mucho que no es grave: por eso se muestra la etiqueta de lo que
 * dice el diagnóstico de cada fila, en lugar de suponerla por el nombre de la base. Para Coberturas, Autos y
 * Marketing la prioridad es siempre la normal: «fractura» no significa nada en esos rubros.
 *
 * Desde la segunda vuelta del 22/11 la gravedad SÍ ordena las colas de Jurídico, con niveles
 * (`prioridadDeEnvio`, abajo). `prioridadParaPerfil` queda como estaba (las tres al mismo nivel) y ya no
 * arma colas. Coberturas, Autos y Marketing siguen exactamente como antes.
 */
import type { SlugPerfil } from "@/lib/marca";
import { computeCampaignPriority } from "@/lib/bases/priority";

export type Gravedad = "fractura" | "fallecimiento" | "amputacion";

export const GRAVEDAD_LABEL: Record<Gravedad, string> = {
  fractura: "Fractura",
  fallecimiento: "Fallecimiento",
  amputacion: "Amputación",
};

const SENALES: { gravedad: Gravedad; re: RegExp }[] = [
  { gravedad: "amputacion", re: /amputac/i },
  { gravedad: "fallecimiento", re: /muerte|fallec|falleci|óbito|obito/i },
  { gravedad: "fractura", re: /fractura|fracturad/i },
];

/** La gravedad que dicen los textos de la fila (diagnóstico, tipo de consulta), o null si no dicen ninguna. */
export function gravedadDeFila(...textos: (string | null | undefined)[]): Gravedad | null {
  const t = textos.filter((x): x is string => Boolean(x)).join(" ");
  if (!t.trim()) return null;
  return SENALES.find((s) => s.re.test(t))?.gravedad ?? null;
}

/** Etiqueta para mostrar (solo en bases de Jurídico). */
export function etiquetaDeGravedad(slug: SlugPerfil, ...textos: (string | null | undefined)[]): string | null {
  if (slug !== "juridico") return null;
  const g = gravedadDeFila(...textos);
  return g ? GRAVEDAD_LABEL[g] : null;
}

/** 0 = prioritaria, 1 = normal. Fuera de Jurídico, siempre normal. Coincide con `computeCampaignPriority` en Jurídico. */
export function prioridadParaPerfil(slug: SlugPerfil, ...textos: (string | null | undefined)[]): number {
  return slug === "juridico" ? computeCampaignPriority(...textos) : 1;
}

// ---------------------------------------------------------------------------
// Segunda vuelta del 22/11 (pedido del dueño): la gravedad se conecta a las campañas de Jurídico.
// «Que los mensajes que primero envíe y se centre más sea en esos lesionados.»
//
// Hay un orden de gravedad: fallecimiento, amputación, fractura, otras lesiones de cuidado,
// lesiones leves y, al final, quien no tiene lesión anotada. La cola sale en ese orden
// (`campaign_claim_next` ordena por `priority` ascendente y después por orden de carga):
// mientras haya lesionados pendientes, el cupo del día se va en ellos; cubiertos los
// lesionados, sigue el resto, sin dejar a nadie afuera.
//
// Valores de `campaign_contacts.priority` (smallint, menor = antes). Se eligieron para que
// las colas armadas antes sigan teniendo sentido sin tocarlas: antes 0 = grave y 1 = normal.
// Los graves nuevos quedan por delante del 0 viejo y el 1 viejo queda junto a «otra lesión»
// (no se sabe si era lesionado). Nada cambia de lugar hasta que se reordena lo pendiente.
// ---------------------------------------------------------------------------

export type NivelGravedad = Gravedad | "lesion" | "lesion_leve" | "sin_lesion";

/** Orden de gravedad, del más grave al menos grave. */
export const ORDEN_DE_GRAVEDAD: NivelGravedad[] = ["fallecimiento", "amputacion", "fractura", "lesion", "lesion_leve", "sin_lesion"];

export const NIVEL_LABEL: Record<NivelGravedad, string> = {
  fallecimiento: "Fallecimiento",
  amputacion: "Amputación",
  fractura: "Fractura",
  lesion: "Otra lesión de cuidado",
  lesion_leve: "Lesión leve",
  sin_lesion: "Sin lesión anotada",
};

/** Prioridad de envío por nivel en Jurídico (menor = sale antes). */
export const PRIORIDAD_POR_NIVEL: Record<NivelGravedad, number> = {
  fallecimiento: -3,
  amputacion: -2,
  fractura: -1,
  lesion: 1,
  lesion_leve: 2,
  sin_lesion: 3,
};

/** Lesiones de cuidado que no son de las tres graves (por la raíz, para no depender de tildes). */
const LESION_DE_CUIDADO = /luxac|quemad|traumatism|herida|desgarr|hemorrag|hernia|neumot|conmoc|aplastam|politraum|secuela|medular/i;
/** «Rotura» o «ruptura» solo son una lesión si hablan de una parte del cuerpo («ruptura de contrato» no lo es). */
const ROTURA = /rotura|ruptura/i;
const PARTE_DEL_CUERPO =
  /ligament|tend[oó]n|menisc|manguito|hueso|[oó]se[oa]|bazo|h[ií]gado|ri[ñn][oó]n|pulm[oó]n|t[ií]mpano|cr[aá]neo|brazo|antebrazo|pierna|mano|pie\b|rodilla|hombro|codo|mu[ñn]eca|tobillo|cadera|cuello|columna|costilla|cl[aá]vic|nariz|mand[ií]bula|\bojo|labio|muslo|dedo|vejiga|[uú]tero|aorta|arteria|diafragma|esf[ií]nter|ves[ií]cula|intestino|est[oó]mago|globo ocular|retina|cart[ií]lago|m[uú]sculo|f[eé]mur|t[ií]bia|peron[eé]|h[uú]mero|r[aá]dio|c[uú]bito|pelvis|v[eé]rtebra|disco/i;
/** Lo «superficial» (traumatismo superficial, herida superficial) es leve aunque nombre una lesión. */
const SUPERFICIAL = /superficial/i;
/** «Sin lesiones» / «sin lesión» / «no presenta lesiones»: dice que no hay lesión, no es un diagnóstico leve. */
const SIN_LESION = /\b(sin|ninguna?|no\s+(presenta|tiene|hubo|hay|registra))\s+(ninguna\s+)?lesi[oó]n(es)?\b/i;

function hayLesionDeCuidado(texto: string): boolean {
  return LESION_DE_CUIDADO.test(texto) || (ROTURA.test(texto) && PARTE_DEL_CUERPO.test(texto));
}

/**
 * Nivel de gravedad de una fila de Jurídico. Las tres graves salen de `gravedadDeFila`; si no, una
 * lesión de cuidado; si hay un diagnóstico cualquiera, leve; si no dice nada (o dice «sin lesiones»),
 * sin lesión. `diagnostico` es la columna de la lesión; `otros` (tipo de consulta, motivo) solo suben
 * de nivel si nombran una lesión: por sí solos no cuentan como diagnóstico.
 */
export function nivelDeGravedad(diagnostico: string | null | undefined, ...otros: (string | null | undefined)[]): NivelGravedad {
  const grave = gravedadDeFila(diagnostico, ...otros);
  if (grave) return grave;
  const todo = [diagnostico, ...otros].filter((x): x is string => Boolean(x)).join(" ");
  const cuidado = hayLesionDeCuidado(todo);
  if (cuidado && !SUPERFICIAL.test(todo)) return "lesion";
  if (cuidado) return "lesion_leve";
  const dx = (diagnostico ?? "").trim();
  if (dx && !SIN_LESION.test(dx)) return "lesion_leve";
  return "sin_lesion";
}

/**
 * Prioridad con la que un destinatario entra a la cola. Jurídico: por nivel de gravedad.
 * Coberturas, Autos y Marketing: exactamente la de antes (`computeCampaignPriority`).
 */
export function prioridadDeEnvio(slug: SlugPerfil, diagnostico: string | null | undefined, ...otros: (string | null | undefined)[]): number {
  if (slug !== "juridico") return computeCampaignPriority(diagnostico, ...otros);
  return PRIORIDAD_POR_NIVEL[nivelDeGravedad(diagnostico, ...otros)];
}

export type GrupoDeCola = "grave" | "lesionado" | "resto";

/** Grupo de una prioridad guardada (sirve también para las colas viejas: 0 = grave, 1 = sin saber). */
export function grupoDePrioridad(prioridad: number): GrupoDeCola {
  if (prioridad <= 0) return "grave";
  if (prioridad <= PRIORIDAD_POR_NIVEL.lesion_leve) return "lesionado";
  return "resto";
}

export interface FilaDeCola {
  id: string;
  prioridad: number;
  /** Orden de carga (ISO o milisegundos). */
  encolada: string | number;
}

/** El mismo orden que `campaign_claim_next`: prioridad, orden de carga e id. Pura: no modifica la lista. */
export function ordenarCola<T extends FilaDeCola>(filas: T[]): T[] {
  const t = (v: string | number) => (typeof v === "number" ? v : Date.parse(v));
  return [...filas].sort((a, b) => a.prioridad - b.prioridad || t(a.encolada) - t(b.encolada) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Cómo se reparte el cupo del día con la cola en orden: primero los graves, después los
 * lesionados y, una vez cubiertos, el resto.
 */
export function repartoDelCupo(prioridadesPendientes: number[], cupo: number): Record<GrupoDeCola, number> {
  return resumenPorGravedad([...prioridadesPendientes].sort((a, b) => a - b).slice(0, Math.max(0, Math.floor(cupo))));
}

/** Cantidad de destinatarios por grupo (para mostrar qué sale primero). */
export function resumenPorGravedad(prioridades: Iterable<number>): Record<GrupoDeCola, number> {
  const out: Record<GrupoDeCola, number> = { grave: 0, lesionado: 0, resto: 0 };
  for (const p of prioridades) out[grupoDePrioridad(p)]++;
  return out;
}

export interface FuenteDeDiagnostico {
  diagnostico?: string | null;
  tipoDeConsulta?: string | null;
}

/**
 * Prioridad más grave entre varias fuentes del mismo destinatario (la fila de la base con que se
 * encoló y lo guardado en el contacto): si una fuente dice fractura y la otra está vacía, vale la
 * fractura. Sin fuentes, la de «sin lesión anotada».
 */
export function prioridadMasGrave(fuentes: FuenteDeDiagnostico[]): number {
  if (!fuentes.length) return PRIORIDAD_POR_NIVEL.sin_lesion;
  return Math.min(...fuentes.map((f) => prioridadDeEnvio("juridico", f.diagnostico, f.tipoDeConsulta)));
}

/**
 * Cambios de prioridad para reordenar lo que falta enviar de una cola de Jurídico. Solo filas
 * pendientes y solo las que cambian: lo enviado, lo que se está enviando y lo que está a revisar
 * no se toca (reordenar nunca genera un reenvío). Una fila que ya estaba en prioridad grave (<= 0)
 * nunca baja. Devuelve prioridad nueva → ids.
 */
export function cambiosDePrioridad(
  filas: { id: string; status: string; prioridad: number; diagnostico?: string | null; tipoDeConsulta?: string | null; fuentes?: FuenteDeDiagnostico[] }[]
): Map<number, string[]> {
  const out = new Map<number, string[]>();
  for (const f of filas) {
    if (f.status !== "pendiente") continue;
    const nueva = f.fuentes ? prioridadMasGrave(f.fuentes) : prioridadDeEnvio("juridico", f.diagnostico, f.tipoDeConsulta);
    if (nueva === f.prioridad) continue;
    // Una fila que ya estaba en prioridad grave (<= 0) nunca baja: solo puede subir (p. ej. de 0 a fallecimiento).
    if (f.prioridad <= 0 && nueva > f.prioridad) continue;
    out.set(nueva, [...(out.get(nueva) ?? []), f.id]);
  }
  return out;
}
