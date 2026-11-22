import type { ClaveCifra, FilaParaHoy } from "@/lib/resumen/filas";
import type { SlugPerfil } from "@/lib/marca";

/**
 * Lista corta «quiénes» del Resumen de todo (22/11). Funciones puras: nombre corto (sin apellidos
 * completos ni teléfonos), cuánto hace, nivel de urgencia y filtros por perfil. Rubros separados:
 * `filtrarFilas` nunca mezcla perfiles y el navegador solo pide la lista de un perfil por vez.
 */
export interface ItemLista {
  id: string;
  /** Nombre corto: «María L.». Nunca teléfono ni apellido completo. */
  nombre: string;
  /** Texto breve y sin datos sensibles («Espera hace 3 h», «Hoy 15:30»). */
  detalle: string;
  oportunidadId?: string | null;
  conversationId?: string | null;
  contactId?: string | null;
  chatHref?: string | null;
  fichaHref?: string | null;
  /** Solo propuestas del asistente: lo que necesita la tarjeta de confirmación. */
  propuesta?: { id: string; tipo: string; titulo: string; resumen: string; estado: string; detalle: unknown };
}

export type ClaveLista = ClaveCifra;
export const CLAVES_LISTA: ClaveLista[] = ["esperan", "sinDerivar", "citasHoy", "propuestas", "alertas"];
export const esClaveLista = (v: unknown): v is ClaveLista => typeof v === "string" && (CLAVES_LISTA as string[]).includes(v);

/** «María Fernanda López García» → «María L.»; sin nombre → «Sin nombre». */
export function nombreCorto(completo: string | null | undefined): string {
  const partes = String(completo ?? "")
    .replace(/[\d@+()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "Sin nombre";
  const cap = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1).toLocaleLowerCase("es");
  const primero = cap(partes[0].slice(0, 20));
  if (partes.length === 1) return primero;
  const ultimo = partes[partes.length - 1];
  return `${primero} ${ultimo.charAt(0).toLocaleUpperCase("es")}.`;
}

/** «hace 3 h», «hace 2 días»; null si la fecha no sirve. */
export function haceCuanto(desdeIso: string | null | undefined, ahora: Date = new Date()): string | null {
  const t = desdeIso ? Date.parse(desdeIso) : NaN;
  if (Number.isNaN(t)) return null;
  const min = Math.max(0, Math.round((ahora.getTime() - t) / 60_000));
  if (min < 60) return `hace ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

export type NivelUrgencia = "todos" | "urgente" | "hoy" | "despues";
export const NIVELES: { clave: NivelUrgencia; etiqueta: string }[] = [
  { clave: "todos", etiqueta: "Todo" },
  { clave: "urgente", etiqueta: "Urgente" },
  { clave: "hoy", etiqueta: "Del día" },
  { clave: "despues", etiqueta: "Puede esperar" },
];

/** Urgencia de la fila (1 = lo primero): 1-2 urgente (esperan, alertas), 3 del día (citas), 4-5 puede esperar. */
export function nivelDeUrgencia(urgencia: number): Exclude<NivelUrgencia, "todos"> {
  return urgencia <= 2 ? "urgente" : urgencia === 3 ? "hoy" : "despues";
}

export function claveDeFila(f: Pick<FilaParaHoy, "clave" | "slug">): ClaveCifra {
  return f.clave.slice(f.slug.length + 1) as ClaveCifra;
}

export interface FiltroResumen {
  slug: SlugPerfil | "todos";
  nivel: NivelUrgencia;
}

/** Filtra las filas por perfil y por nivel de urgencia sin mezclar rubros. */
export function filtrarFilas(filas: FilaParaHoy[], f: FiltroResumen, ocultas: ReadonlySet<string> = new Set()): FilaParaHoy[] {
  return filas.filter((x) => !ocultas.has(x.clave) && (f.slug === "todos" || x.slug === f.slug) && (f.nivel === "todos" || nivelDeUrgencia(x.urgencia) === f.nivel));
}

/** Clave del día para «ocultar por hoy» (hora argentina). */
export function claveDia(ahora: Date = new Date()): string {
  return new Date(ahora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
}
