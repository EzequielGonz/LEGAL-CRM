/**
 * Alcance de una tarea u orden (27/11, decisión del dueño: «tiene que poder
 * pedirse una tarea para los 4 rubros juntos o individuales, o mejoras al
 * panel, etc. No tiene que limitar»).
 *
 * Un alcance es:
 *  - `rubros`: uno, varios o los cuatro perfiles. Con `modo: 'juntos'` es UNA
 *    sola tarea con un resultado conjunto; con `modo: 'separados'` es UNA
 *    tarea por rubro (cada una ve solo su perfil).
 *  - `panel`: mejoras o análisis del panel entero (no pertenece a un rubro).
 *
 * Puro y sin acceso a datos: lo usan la Oficina, el «Ordenale» del Cerebro y
 * Jarvis. Contrato en docs/etapa6/CONTRATOS.md.
 */
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

export type Slug = SlugPerfil;
export type ModoAlcance = "juntos" | "separados";

export type Alcance = { tipo: "rubros"; rubros: Slug[]; modo: ModoAlcance } | { tipo: "panel" };

/** Una tarea concreta que sale de expandir un alcance. */
export interface TareaExpandida {
  /** Perfil al que pertenece la tarea; null si es conjunta (varios rubros) o del panel. */
  rubro: Slug | null;
  /** Rubros que la tarea puede ver (vacío = panel). */
  rubros: Slug[];
  /** Identifica la tarea dentro del grupo: `rubro:<slug>`, `juntos` o `panel`. */
  clave: string;
}

const NOMBRE_CORTO: Record<Slug, string> = {
  juridico: "Jurídico",
  coberturas_medicas: "Coberturas",
  agencia_0km: "Autos 0 km",
  marketing: "Marketing",
};

export const TODOS_LOS_RUBROS: readonly Slug[] = SLUGS_PERFIL;

const esSlug = (v: unknown): v is Slug => typeof v === "string" && (SLUGS_PERFIL as readonly string[]).includes(v);

/** Ordena y quita repetidos, en el orden fijo de los perfiles. */
function ordenar(rubros: Iterable<Slug>): Slug[] {
  const set = new Set(rubros);
  return SLUGS_PERFIL.filter((s) => set.has(s));
}

/**
 * Lleva cualquier entrada (objeto, texto viejo, nada) a un Alcance válido, o
 * null si no se entiende. Lo más conservador: con varios rubros y sin modo, va
 * «separados» (cada rubro por su lado); un solo rubro es siempre «juntos».
 */
export function normalizarAlcance(crudo: unknown): Alcance | null {
  if (typeof crudo === "string") {
    const t = crudo.trim().toLowerCase();
    if (t === "panel") return { tipo: "panel" };
    if (t === "cuatro_rubros" || t === "todos") return { tipo: "rubros", rubros: [...SLUGS_PERFIL], modo: "juntos" };
    return esSlug(t) ? { tipo: "rubros", rubros: [t], modo: "juntos" } : null;
  }
  if (!crudo || typeof crudo !== "object") return null;
  const o = crudo as Record<string, unknown>;
  if (o.tipo === "panel") return { tipo: "panel" };
  if (o.tipo !== "rubros") return null;
  const lista = Array.isArray(o.rubros) ? o.rubros : [];
  if (lista.length === 0 || !lista.every(esSlug)) return null;
  const rubros = ordenar(lista as Slug[]);
  if (rubros.length === 1) return { tipo: "rubros", rubros, modo: "juntos" };
  const modo: ModoAlcance = o.modo === "juntos" ? "juntos" : "separados";
  return { tipo: "rubros", rubros, modo };
}

/** Errores de un alcance crudo, en español para la interfaz. Vacío = válido. */
export function validarAlcance(crudo: unknown): string[] {
  if (crudo === null || crudo === undefined) return ["Falta elegir el alcance de la tarea."];
  if (typeof crudo === "object" && !Array.isArray(crudo)) {
    const o = crudo as Record<string, unknown>;
    if (o.tipo === "rubros") {
      const lista = Array.isArray(o.rubros) ? o.rubros : [];
      if (lista.length === 0) return ["Elegí al menos un rubro."];
      if (!lista.every(esSlug)) return ["Hay un rubro que no existe."];
      if (lista.length > 1 && o.modo !== "juntos" && o.modo !== "separados") return ["Con varios rubros elegí si van juntos o separados."];
    }
  }
  return normalizarAlcance(crudo) ? [] : ["El alcance no se entiende."];
}

/** Cuántas tareas crea y con qué rubro cada una. */
export function expandirTareas(alcance: Alcance): TareaExpandida[] {
  if (alcance.tipo === "panel") return [{ rubro: null, rubros: [], clave: "panel" }];
  if (alcance.rubros.length === 1) return [{ rubro: alcance.rubros[0], rubros: [alcance.rubros[0]], clave: `rubro:${alcance.rubros[0]}` }];
  if (alcance.modo === "juntos") return [{ rubro: null, rubros: [...alcance.rubros], clave: "juntos" }];
  return alcance.rubros.map((r) => ({ rubro: r, rubros: [r], clave: `rubro:${r}` }));
}

/** Texto para la interfaz (voseo, sin tecnicismos). */
export function etiquetaAlcance(alcance: Alcance): string {
  if (alcance.tipo === "panel") return "Todo el panel";
  const nombres = alcance.rubros.map((r) => NOMBRE_CORTO[r]);
  if (alcance.rubros.length === 1) return nombres[0];
  const lista = alcance.rubros.length === SLUGS_PERFIL.length ? "Los 4 rubros" : nombres.join(" + ");
  return alcance.modo === "juntos" ? `${lista}, juntos (un solo resultado)` : `${lista}, por separado (una tarea por rubro)`;
}
