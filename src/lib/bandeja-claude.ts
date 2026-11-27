/**
 * Bandeja para Claude (19/10; 27/11 con alcance). Tareas complejas que se
 * dejan en el panel (generar y cargar contenido, mejorar landings, etc.) para
 * que Claude las tome con la Oficina («Arrancar ahora») o cuando se escribe
 * «oficina» en un chat de Claude del proyecto.
 *
 * Claude no corre dentro del panel: el panel solo guarda el pedido y muestra
 * el estado y el resultado. Lo que cambie el panel o el código sigue el
 * esquema propuesta → confirmación (PR para el programador o propuesta que se
 * confirma). Sin datos personales de prospectos: el pedido y los enlaces son
 * referencias (una base, una campaña, una landing).
 *
 * Puro: sin dependencias del navegador ni de la base.
 */
import { RUBRO_IDS } from "@/lib/rubros";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { etiquetaAlcance, expandirTareas, normalizarAlcance, validarAlcance, type Alcance } from "@/lib/alcance";

export const ESTADOS_BANDEJA = ["pendiente", "en_curso", "en_espera", "lista", "descartada"] as const;
export type EstadoBandeja = (typeof ESTADOS_BANDEJA)[number];

export const ETIQUETA_ESTADO: Record<EstadoBandeja, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  en_espera: "En espera",
  lista: "Lista",
  descartada: "Descartada",
};

export const MAX_PEDIDO = 4000;
export const MAX_ENLACES = 5;
export const MAX_ENLACE = 500;
export const MAX_MOTIVO = 500;
/** Una tarea «en curso» sin avance por más de estas horas se muestra «en espera». */
export const HORAS_SIN_AVANCE = 6;

export interface TareaBandeja {
  id: string;
  /** null = tarea conjunta de varios rubros o de «Todo el panel» (27/11): se ve solo en la Oficina. */
  rubro_id: string | null;
  /** Alcance guardado (27/11). null en las filas viejas: son del rubro de rubro_id. */
  alcance: Alcance | null;
  grupo_id: string | null;
  pedido: string;
  enlaces: string[];
  estado: EstadoBandeja;
  motivo_espera: string | null;
  resultado: string | null;
  resultado_enlaces: string[];
  motivo_descarte: string | null;
  created_at: string;
  updated_at: string;
  tomada_at: string | null;
  cerrada_at: string | null;
}

/** Lo que muestra el panel: el estado guardado o «en espera» si quedó trabada. */
export interface EstadoVisible {
  estado: EstadoBandeja;
  /** Por qué está en espera (el que dejó Claude o el que deduce el panel). */
  aviso: string | null;
  /** true si el panel la pasó a «en espera» por falta de avance. */
  deducido: boolean;
}

type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

// --- Perfil ---------------------------------------------------------------

export function rubroIdDePerfil(slug: unknown): string | null {
  return esSlugPerfil(slug) ? RUBRO_IDS[slug] : null;
}

export function perfilDeRubroId(id: unknown): SlugPerfil | null {
  for (const [slug, rid] of Object.entries(RUBRO_IDS)) if (rid === id && esSlugPerfil(slug)) return slug;
  return null;
}

// --- Alcance (27/11) ----------------------------------------------------

/**
 * Lee el destino de una tarea del cuerpo de un pedido. Acepta el alcance
 * nuevo (`alcance`, ver src/lib/alcance.ts) y el formato viejo (`perfil`), que
 * siguen mandando varias pantallas. Sin nada, error (no se elige Jurídico por
 * defecto).
 */
export function destinoDeCuerpo(body: unknown): Resultado<Alcance> {
  const b = (body ?? {}) as Record<string, unknown>;
  const crudo = b.alcance !== undefined && b.alcance !== null && b.alcance !== "" ? b.alcance : b.perfil;
  if (crudo === undefined || crudo === null || crudo === "") return { ok: false, error: "Elegí para qué rubro (o rubros) es la tarea." };
  const errores = typeof crudo === "string" ? [] : validarAlcance(crudo);
  if (errores.length) return { ok: false, error: errores[0] };
  const alcance = normalizarAlcance(crudo);
  return alcance ? { ok: true, valor: alcance } : { ok: false, error: "Perfil no válido." };
}

export interface FilaDeAlcance {
  /** null = conjunta o del panel. */
  rubro_id: string | null;
  slug: SlugPerfil | null;
  clave: string;
}

/** Qué filas de la bandeja crea un alcance: una, o una por rubro si van por separado. */
export function filasDeAlcance(alcance: Alcance): FilaDeAlcance[] {
  return expandirTareas(alcance).map((t) => ({ rubro_id: t.rubro ? RUBRO_IDS[t.rubro] : null, slug: t.rubro, clave: t.clave }));
}

/** Texto del alcance de una tarea guardada (las viejas, sin alcance, son de su perfil). */
export function etiquetaDeTarea(t: Pick<TareaBandeja, "rubro_id" | "alcance">, nombrePerfil: (s: SlugPerfil | null) => string): string {
  if (t.alcance && !(t.alcance.tipo === "rubros" && t.alcance.rubros.length === 1)) {
    const base = etiquetaAlcance(t.alcance);
    const propio = perfilDeRubroId(t.rubro_id);
    return propio ? `${nombrePerfil(propio)} · ${base}` : base;
  }
  return nombrePerfil(perfilDeRubroId(t.rubro_id));
}

/** ¿Se ve esta tarea dentro del perfil? Solo las de ese rubro (lo conjunto y lo del panel, solo en la Oficina). */
export function esDelPerfil(t: Pick<TareaBandeja, "rubro_id">, slug: SlugPerfil): boolean {
  return t.rubro_id === RUBRO_IDS[slug];
}

// --- Datos personales -----------------------------------------------------

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i;
// Teléfono: ocho o más dígitos, con espacios, guiones o paréntesis entre ellos
// y un «+» adelante (11 5555-5555, +54 9 11 5555 5555, 4444-5555).
// Sin «lookbehind» en las expresiones: Safari viejo (iPhone) no lo entiende y
// este archivo también corre en el navegador.
const TELEFONO = /(^|[^\d.,$])(\+?\d(?:[\s()-]*\d){7,})/g;
// Documento con puntos (30.123.456), salvo que sea un precio ($ 15.000.000).
const DOCUMENTO = /(^|[^\d.,])(\$\s?)?(\d{1,2}\.\d{3}\.\d{3})(?![.,]?\d)/g;
// Lo que tiene forma de número largo pero es una fecha o un rango de años.
const FECHA_ISO = /^\d{4}-\d{1,2}-\d{1,2}$/;
const RANGO_ANIOS = /^(19|20)\d{2}\s*-\s*(19|20)\d{2}$/;

/**
 * Señala lo que parece un dato personal (correo, teléfono o documento).
 * Se rechaza para que la bandeja nunca guarde datos de prospectos. Fechas
 * (2026-11-01), rangos de años (2025-2026) y precios ($ 15.000.000) pasan.
 */
export function pareceDatoPersonal(texto: string): "correo" | "numero" | null {
  if (EMAIL.test(texto)) return "correo";
  for (const m of Array.from(texto.matchAll(TELEFONO))) {
    const s = m[2].trim();
    if (FECHA_ISO.test(s) || RANGO_ANIOS.test(s)) continue;
    return "numero";
  }
  for (const m of Array.from(texto.matchAll(DOCUMENTO))) {
    if (!m[2]) return "numero"; // con «$» adelante es un precio
  }
  return null;
}

const AVISO_DATO: Record<"correo" | "numero", string> = {
  correo: "Sacá el correo: la bandeja no guarda datos personales. Nombrá la base, la campaña o la landing.",
  numero: "Sacá el número largo (teléfono o documento): la bandeja no guarda datos personales. Nombrá la base, la campaña o la landing.",
};

// --- Validaciones ---------------------------------------------------------

export function validarPedido(v: unknown): Resultado<string> {
  const texto = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "";
  if (!texto) return { ok: false, error: "Escribí qué querés que haga Claude." };
  if (texto.length > MAX_PEDIDO) return { ok: false, error: `El pedido es muy largo (máximo ${MAX_PEDIDO} caracteres).` };
  const dato = pareceDatoPersonal(texto);
  if (dato) return { ok: false, error: AVISO_DATO[dato] };
  return { ok: true, valor: texto };
}

const HOSTS_DE_CONTACTO = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com"]);

/** Enlaces de referencia: hasta 5, solo http(s), sin enlaces de contacto directo. */
export function validarEnlaces(v: unknown): Resultado<string[]> {
  if (v == null || v === "") return { ok: true, valor: [] };
  const lista = Array.isArray(v) ? v : typeof v === "string" ? v.split(/\s+/) : null;
  if (!lista) return { ok: false, error: "Los enlaces no son válidos." };
  const limpios = Array.from(new Set(lista.map((e) => (typeof e === "string" ? e.trim() : "")).filter(Boolean)));
  if (limpios.length > MAX_ENLACES) return { ok: false, error: `Podés sumar hasta ${MAX_ENLACES} enlaces.` };
  for (const e of limpios) {
    if (e.length > MAX_ENLACE) return { ok: false, error: "Hay un enlace demasiado largo." };
    let url: URL;
    try {
      url = new URL(e);
    } catch {
      return { ok: false, error: `«${e.slice(0, 60)}» no es un enlace (tiene que empezar con https://).` };
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "Solo se aceptan enlaces web (https://)." };
    if (HOSTS_DE_CONTACTO.has(url.hostname.toLowerCase())) return { ok: false, error: "No sumes enlaces de WhatsApp a personas: la bandeja no guarda datos de contacto." };
    if (url.username || url.password) return { ok: false, error: "Sacá el usuario o la clave del enlace." };
    if (pareceDatoPersonal(decodeURIComponent(url.search + url.hash)) === "correo") return { ok: false, error: AVISO_DATO.correo };
  }
  return { ok: true, valor: limpios };
}

export function validarMotivo(v: unknown): Resultado<string> {
  const texto = typeof v === "string" ? v.trim() : "";
  if (texto.length < 3) return { ok: false, error: "Contá en pocas palabras por qué la descartás." };
  if (texto.length > MAX_MOTIVO) return { ok: false, error: `El motivo es muy largo (máximo ${MAX_MOTIVO} caracteres).` };
  const dato = pareceDatoPersonal(texto);
  if (dato) return { ok: false, error: AVISO_DATO[dato] };
  return { ok: true, valor: texto };
}

// --- Estados --------------------------------------------------------------

/** Desde el panel solo se descarta lo que Claude no está trabajando ni terminó. */
export const DESCARTABLES: EstadoBandeja[] = ["pendiente", "en_espera"];

export function puedeDescartar(estado: EstadoBandeja): boolean {
  return DESCARTABLES.includes(estado);
}

/** Lo que Claude toma en cada vuelta: lo pendiente y lo que quedó en espera. */
export const PARA_TOMAR: EstadoBandeja[] = ["pendiente", "en_espera"];

export function estadoVisible(t: Pick<TareaBandeja, "estado" | "motivo_espera" | "updated_at">, ahora: Date = new Date()): EstadoVisible {
  if (t.estado === "en_espera") {
    return { estado: "en_espera", aviso: t.motivo_espera?.trim() || "Claude no pudo terminarla. La retoma la próxima vez que arranque la Oficina.", deducido: false };
  }
  if (t.estado === "en_curso") {
    const desde = Date.parse(t.updated_at);
    if (Number.isFinite(desde) && ahora.getTime() - desde > HORAS_SIN_AVANCE * 3600 * 1000) {
      return {
        estado: "en_espera",
        aviso: `Lleva más de ${HORAS_SIN_AVANCE} h sin avance: puede que se haya agotado el uso del plan. La retoma la próxima vez que arranque la Oficina.`,
        deducido: true,
      };
    }
  }
  return { estado: t.estado, aviso: null, deducido: false };
}

const ORDEN: Record<EstadoBandeja, number> = { en_espera: 0, en_curso: 1, pendiente: 2, lista: 3, descartada: 4 };

/** Arriba lo que necesita atención; dentro de cada estado, lo más viejo primero (lo cerrado, lo más nuevo). */
export function ordenarTareas<T extends Pick<TareaBandeja, "estado" | "motivo_espera" | "updated_at" | "created_at">>(tareas: T[], ahora: Date = new Date()): T[] {
  return [...tareas].sort((a, b) => {
    const ea = ORDEN[estadoVisible(a, ahora).estado];
    const eb = ORDEN[estadoVisible(b, ahora).estado];
    if (ea !== eb) return ea - eb;
    const cerrada = ea >= ORDEN.lista;
    const d = Date.parse(a.created_at) - Date.parse(b.created_at);
    return cerrada ? -d : d;
  });
}

export function resumenBandeja(tareas: Pick<TareaBandeja, "estado" | "motivo_espera" | "updated_at">[], ahora: Date = new Date()): Record<EstadoBandeja, number> {
  const r: Record<EstadoBandeja, number> = { pendiente: 0, en_curso: 0, en_espera: 0, lista: 0, descartada: 0 };
  for (const t of tareas) r[estadoVisible(t, ahora).estado]++;
  return r;
}

/** Normaliza una fila de la base (jsonb de enlaces, estado desconocido). */
export function filaATarea(f: any): TareaBandeja | null {
  if (!f || typeof f.id !== "string" || !(ESTADOS_BANDEJA as readonly string[]).includes(f.estado)) return null;
  // Solo enlaces web: el panel los muestra como vínculos (nada de javascript: ni data:).
  const enlaces = (v: unknown) => (Array.isArray(v) ? v.filter((e): e is string => typeof e === "string" && /^https?:\/\//i.test(e.trim())).map((e) => e.trim()) : []);
  return {
    id: f.id,
    rubro_id: typeof f.rubro_id === "string" && f.rubro_id ? f.rubro_id : null,
    alcance: f.alcance ? normalizarAlcance(f.alcance) : null,
    grupo_id: typeof f.grupo_id === "string" ? f.grupo_id : null,
    pedido: String(f.pedido ?? ""),
    enlaces: enlaces(f.enlaces),
    estado: f.estado,
    motivo_espera: f.motivo_espera ?? null,
    resultado: f.resultado ?? null,
    resultado_enlaces: enlaces(f.resultado_enlaces),
    motivo_descarte: f.motivo_descarte ?? null,
    created_at: String(f.created_at ?? ""),
    updated_at: String(f.updated_at ?? f.created_at ?? ""),
    tomada_at: f.tomada_at ?? null,
    cerrada_at: f.cerrada_at ?? null,
  };
}
