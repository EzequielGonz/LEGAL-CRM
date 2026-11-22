/**
 * Contactos con función (22/11): armado de la consulta, filtros, acciones y CSV.
 * Todo puro (sin base ni navegador): la pantalla y las rutas llaman a estas
 * funciones y las pruebas unitarias las cubren. Rubros separados: la consulta
 * siempre se arma para UN rubro y nunca mezcla datos de otros.
 */
import { FUENTES, type Fuente } from "@/lib/fuente";
import { indicadorPorClave, ORDENES, type Condicion, type Orden } from "@/lib/indicadores";
import { textoBusquedaSeguro, soloDigitos } from "@/lib/busqueda";

export const TAMANO_PAGINA_CONTACTOS = 25;
/** Tope de personas por acción en lote y por exportación de una selección. */
export const TOPE_LOTE = 50;
/** Tope de filas de una exportación por filtros. */
export const TOPE_EXPORTACION = 2000;

/** Etapas del recorrido. Cada una usa el mismo indicador que su lista completa en Oportunidades. */
export const ETAPAS = [
  { clave: "sin_contactar", rotulo: "Sin contactar", indicador: "sin_contactar", nota: "todavía no se les escribió" },
  { clave: "sin_respuesta", rotulo: "Sin respuesta", indicador: "contactado_sin_respuesta", nota: "se les escribió y no contestaron" },
  { clave: "respondio", rotulo: "Respondieron", indicador: "respondio", nota: "contestaron al menos una vez" },
  { clave: "en_conversacion", rotulo: "En conversación", indicador: "en_conversacion", nota: "charla en curso" },
  { clave: "captado", rotulo: "Captados", indicador: "captado", nota: "aceptaron el siguiente paso" },
  { clave: "derivado", rotulo: "Derivados", indicador: "derivado", nota: "pasados a quien los atiende" },
  { clave: "perdido", rotulo: "Perdidos", indicador: "perdido", nota: "marcados como perdidos, con motivo" },
  { clave: "no_contactar", rotulo: "No contactar", indicador: "detencion_reciente", nota: "pidieron no recibir mensajes o se detuvo la charla" },
] as const;
export type ClaveEtapa = (typeof ETAPAS)[number]["clave"];

export const ORDENES_CONTACTOS: Orden[] = ["reciente", "antiguo", "creado", "interes", "silencio"];

export type CampoFecha = "actividad" | "alta";
const COLUMNA_FECHA: Record<CampoFecha, string> = { actividad: "updated_at", alta: "created_at" };

export interface FiltrosContactos {
  q: string;
  etapa: ClaveEtapa | null;
  origen: Fuente | null;
  /** Solo Jurídico: «civil» o «penal». */
  area: string | null;
  campoFecha: CampoFecha;
  /** AAAA-MM-DD (hora de Argentina). */
  desde: string | null;
  hasta: string | null;
  orden: Orden;
  pagina: number;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Una fecha AAAA-MM-DD válida o null (rechaza 2026-02-31). */
export function fechaValida(v: unknown): string | null {
  if (typeof v !== "string" || !FECHA.test(v)) return null;
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

function primero(v: unknown): string | undefined {
  return Array.isArray(v) ? (typeof v[0] === "string" ? v[0] : undefined) : typeof v === "string" ? v : undefined;
}

/** Lee los filtros de la dirección. Todo lo desconocido se descarta (nada llega crudo a la consulta). */
export function parsearFiltros(sp: Record<string, unknown>, areasValidas: readonly string[] = []): FiltrosContactos {
  const etapa = ETAPAS.find((e) => e.clave === primero(sp.etapa))?.clave ?? null;
  const origenCrudo = primero(sp.origen);
  const origen = (FUENTES as readonly string[]).includes(origenCrudo ?? "") ? (origenCrudo as Fuente) : null;
  const areaCruda = primero(sp.area);
  const area = areaCruda && areasValidas.length > 1 && areasValidas.includes(areaCruda) ? areaCruda : null;
  let desde = fechaValida(primero(sp.desde));
  let hasta = fechaValida(primero(sp.hasta));
  if (desde && hasta && desde > hasta) [desde, hasta] = [hasta, desde];
  const ordenCrudo = primero(sp.orden) as Orden | undefined;
  const orden = ordenCrudo && ORDENES_CONTACTOS.includes(ordenCrudo) ? ordenCrudo : "reciente";
  const pagina = Math.max(1, Math.min(10_000, Number.parseInt(primero(sp.pagina) ?? "1", 10) || 1));
  return {
    q: textoBusquedaSeguro(primero(sp.q) ?? ""),
    etapa,
    origen,
    area,
    campoFecha: primero(sp.fecha) === "alta" ? "alta" : "actividad",
    desde,
    hasta,
    orden,
    pagina,
  };
}

/** Principio de un día argentino (UTC-3, sin horario de verano) como instante ISO. */
export function inicioDiaAR(fecha: string): string {
  return new Date(`${fecha}T00:00:00-03:00`).toISOString();
}

/** Día siguiente (AAAA-MM-DD). */
export function diaSiguiente(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Condición «o» de PostgREST para buscar por nombre o teléfono (sobre la tabla de contactos). null si no hay búsqueda. */
export function armarOrBusqueda(q: string): string | null {
  const texto = textoBusquedaSeguro(q);
  if (!texto) return null;
  const partes = [`full_name.ilike.%${texto}%`];
  const digitos = soloDigitos(texto);
  // Un teléfono se escribe con espacios, guiones o «+»: se busca también solo con los dígitos.
  if (digitos.length >= 3) partes.push(`phone.ilike.%${digitos}%`);
  else partes.push(`phone.ilike.%${texto}%`);
  return partes.join(",");
}

export interface ConsultaContactos {
  conds: Condicion[];
  /** Filtro «o» sobre `contacts` (búsqueda). */
  busqueda: string | null;
  /** Rango de la columna de fecha elegida. */
  fecha: { col: string; desde: string | null; hastaExclusivo: string | null };
  orden: { col: string; asc: boolean };
  desplazamiento: { from: number; to: number };
  /** Solo en Jurídico: el área elegida. */
  area: string | null;
}

/** Arma la consulta completa a partir de los filtros. Pura. */
export function armarConsulta(f: FiltrosContactos, tamano = TAMANO_PAGINA_CONTACTOS): ConsultaContactos {
  const conds: Condicion[] = [];
  if (f.etapa) {
    const e = ETAPAS.find((x) => x.clave === f.etapa);
    const ind = e ? indicadorPorClave(e.indicador) : null;
    if (ind) conds.push(...ind.conds);
  }
  if (f.origen) conds.push({ col: "first_source", op: "eq", value: f.origen });
  const o = ORDENES[f.orden];
  const from = (f.pagina - 1) * tamano;
  return {
    conds,
    busqueda: armarOrBusqueda(f.q),
    fecha: {
      col: COLUMNA_FECHA[f.campoFecha],
      desde: f.desde ? inicioDiaAR(f.desde) : null,
      hastaExclusivo: f.hasta ? inicioDiaAR(diaSiguiente(f.hasta)) : null,
    },
    orden: { col: o.col, asc: o.asc },
    desplazamiento: { from, to: from + tamano - 1 },
    area: f.area,
  };
}

/** Dirección con los filtros actuales más los cambios pedidos (`undefined` o "" quitan el parámetro). */
export function enlaceContactos(base: string, slug: string, f: FiltrosContactos, cambios: Partial<Record<"q" | "etapa" | "origen" | "area" | "fecha" | "desde" | "hasta" | "orden" | "pagina", string | undefined>> = {}): string {
  const actual: Record<string, string | undefined> = {
    perfil: slug,
    q: f.q || undefined,
    etapa: f.etapa ?? undefined,
    origen: f.origen ?? undefined,
    area: f.area ?? undefined,
    fecha: f.campoFecha === "alta" ? "alta" : undefined,
    desde: f.desde ?? undefined,
    hasta: f.hasta ?? undefined,
    orden: f.orden === "reciente" ? undefined : f.orden,
    pagina: f.pagina > 1 ? String(f.pagina) : undefined,
    ...cambios,
  };
  // Al cambiar cualquier filtro se vuelve a la primera página.
  if (Object.keys(cambios).some((k) => k !== "pagina") && !("pagina" in cambios)) actual.pagina = undefined;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(actual)) if (v) p.set(k, v);
  return `${base}?${p.toString()}`;
}

/** Cantidad de filtros encendidos (sin contar orden ni página). */
export function filtrosActivos(f: FiltrosContactos): number {
  return [f.q, f.etapa, f.origen, f.area, f.desde, f.hasta].filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Etapa que se muestra en cada fila
// ---------------------------------------------------------------------------

export interface FilaOportunidad {
  contact_state?: string | null;
  capture_state?: string | null;
  derivation_state?: string | null;
  attention_category?: string | null;
}

/** Etapa con la que se rotula a una persona (prioridad: detenida, perdida, derivada, captada, charla, respuesta). Pura. */
export function etapaDe(o: FilaOportunidad): ClaveEtapa {
  if (o.attention_category === "detencion") return "no_contactar";
  if (o.capture_state === "perdido") return "perdido";
  if (o.capture_state === "captado") return o.derivation_state === "derivado" ? "derivado" : "captado";
  if (o.capture_state === "en_conversacion" || o.capture_state === "en_seguimiento") return "en_conversacion";
  if (o.contact_state === "respondio") return "respondio";
  if (o.contact_state === "contactado_sin_respuesta") return "sin_respuesta";
  return "sin_contactar";
}

export function rotuloEtapa(clave: ClaveEtapa): string {
  return ETAPAS.find((e) => e.clave === clave)?.rotulo ?? clave;
}

// ---------------------------------------------------------------------------
// Acciones sobre una persona (usan la ruta que ya existe: /api/oportunidades/[id])
// ---------------------------------------------------------------------------

export type AccionContacto = "captar" | "derivar" | "no_derivar" | "perder" | "no_contactar";

export interface DefAccion {
  clave: AccionContacto;
  rotulo: string;
  /** Qué hay que escribir antes de confirmar. */
  pide: "nota" | "motivo" | "destinatario" | null;
  pregunta: string;
  ayuda: string;
  /** Si lo escrito es obligatorio. */
  obligatorio: boolean;
}

export const ACCIONES: Record<AccionContacto, DefAccion> = {
  captar: { clave: "captar", rotulo: "Captado", pide: "nota", pregunta: "¿Qué aceptó la persona?", ayuda: "Es la evidencia de la captación; queda en el historial.", obligatorio: true },
  derivar: { clave: "derivar", rotulo: "Derivado", pide: "destinatario", pregunta: "¿A quién se lo pasaste? (opcional)", ayuda: "Marca como Derivado. No envía ningún mensaje.", obligatorio: false },
  no_derivar: { clave: "no_derivar", rotulo: "Volver a «sin derivar»", pide: "nota", pregunta: "¿Por qué vuelve a sin derivar?", ayuda: "Queda anotado en el historial.", obligatorio: true },
  perder: { clave: "perder", rotulo: "Perdido", pide: "motivo", pregunta: "¿Por qué se perdió?", ayuda: "La persona no se borra: queda como perdida, con el motivo.", obligatorio: true },
  no_contactar: { clave: "no_contactar", rotulo: "No contactar", pide: "nota", pregunta: "Nota (opcional)", ayuda: "Frena los mensajes automáticos a esta persona. No se borra nada.", obligatorio: false },
};

export interface EstadoPersona {
  capture_state: string;
  derivation_state: string;
  /** La persona ya está detenida (no contactar). */
  detenido?: boolean;
}

/** ¿Se puede hacer esta acción sobre esta persona? Si no, por qué. Pura. */
export function puedeHacer(accion: AccionContacto, e: EstadoPersona): { ok: true } | { ok: false; porque: string } {
  switch (accion) {
    case "captar":
      if (e.capture_state === "captado") return { ok: false, porque: "ya está captada" };
      if (e.capture_state === "perdido") return { ok: false, porque: "está marcada como perdida" };
      return { ok: true };
    case "derivar":
      if (e.capture_state !== "captado") return { ok: false, porque: "solo se deriva a quien ya está captado" };
      if (e.derivation_state === "derivado") return { ok: false, porque: "ya está derivada" };
      return { ok: true };
    case "no_derivar":
      return e.capture_state === "captado" && e.derivation_state === "derivado" ? { ok: true } : { ok: false, porque: "no está derivada" };
    case "perder":
      return e.capture_state === "perdido" ? { ok: false, porque: "ya está perdida" } : { ok: true };
    case "no_contactar":
      return e.detenido ? { ok: false, porque: "ya está en no contactar" } : { ok: true };
  }
}

/** Cuerpo del pedido a `/api/oportunidades/[id]` para una acción, con lo que escribió la persona. */
export function cuerpoDeAccion(accion: AccionContacto, texto: string): Record<string, unknown> {
  const t = texto.trim().slice(0, 300);
  switch (accion) {
    case "captar":
      return { accion: "captar", nota: t };
    case "derivar":
      return { accion: "derivar", ...(t ? { destinatario: t } : {}) };
    case "no_derivar":
      return { accion: "no_derivar", nota: t };
    case "perder":
      return { accion: "perder", motivo: t };
    case "no_contactar":
      // El motivo «no_quiere_mensajes» pausa el chat y detiene (misma regla que el chat del bot).
      return { accion: "atencion_motivo", motivo: "no_quiere_mensajes", ...(t ? { nota: t } : {}) };
  }
}

/** Falta escribir algo obligatorio. Devuelve el mensaje o null. */
export function faltaTexto(accion: AccionContacto, texto: string): string | null {
  const def = ACCIONES[accion];
  return def.obligatorio && !texto.trim() ? `Escribí: ${def.pregunta.replace(/[¿?]/g, "").toLowerCase()}.` : null;
}

export interface PlanLote {
  aplicables: string[];
  omitidas: { id: string; nombre: string; porque: string }[];
  /** Pasa el tope y se corta. */
  excedeTope: boolean;
}

/** Quiénes entran en una acción en lote y a quiénes se saltea (con el motivo). Pura. */
export function planDeLote(accion: AccionContacto, filas: { id: string; nombre: string; estado: EstadoPersona }[]): PlanLote {
  const aplicables: string[] = [];
  const omitidas: PlanLote["omitidas"] = [];
  for (const f of filas.slice(0, TOPE_LOTE)) {
    const r = puedeHacer(accion, f.estado);
    if (r.ok) aplicables.push(f.id);
    else omitidas.push({ id: f.id, nombre: f.nombre, porque: r.porque });
  }
  return { aplicables, omitidas, excedeTope: filas.length > TOPE_LOTE };
}

// ---------------------------------------------------------------------------
// Identificadores y CSV
// ---------------------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Solo identificadores válidos, sin repetir y hasta el tope. */
export function idsValidos(crudo: unknown, tope = TOPE_LOTE): string[] {
  const lista = Array.isArray(crudo) ? crudo : typeof crudo === "string" ? crudo.split(",") : [];
  const vistos = new Set<string>();
  for (const x of lista) {
    const s = typeof x === "string" ? x.trim() : "";
    if (UUID.test(s)) vistos.add(s.toLowerCase());
    if (vistos.size >= tope) break;
  }
  return Array.from(vistos);
}

export const COLUMNAS_CSV = ["Nombre", "Teléfono", "Etapa", "Estado", "Área", "Origen", "Última actividad", "Alta"] as const;

export interface FilaCsv {
  nombre: string | null;
  telefono: string | null;
  etapa: string;
  estado: string;
  area: string | null;
  origen: string | null;
  actividad: string | null;
  alta: string | null;
}

/** Una celda de CSV: comillas dobles y sin fórmulas (una celda que empieza con = + - @ se neutraliza). */
export function celdaCsv(valor: string | null | undefined): string {
  let s = (valor ?? "").replace(/[\r\n]+/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[",;]/.test(s) || s.startsWith("'") ? `"${s.replace(/"/g, '""')}"` : s;
}

function fechaAR(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23", dateStyle: "short", timeStyle: "short" });
}

/** CSV con BOM (para que Excel respete los acentos). Solo las columnas de arriba: nada de notas, DNI ni correos. */
export function armarCsv(filas: FilaCsv[]): string {
  const lineas = [COLUMNAS_CSV.map(celdaCsv).join(",")];
  for (const f of filas) {
    lineas.push([f.nombre, f.telefono, f.etapa, f.estado, f.area, f.origen, fechaAR(f.actividad), fechaAR(f.alta)].map(celdaCsv).join(","));
  }
  return `﻿${lineas.join("\r\n")}\r\n`;
}

export function nombreArchivoCsv(slug: string, ahora = new Date()): string {
  const d = new Date(ahora.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  return `contactos-${slug}-${d}.csv`;
}
