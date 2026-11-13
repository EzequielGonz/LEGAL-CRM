/**
 * Etapa 2 · Bloque 2 (panel) — Indicadores clickeables.
 *
 * Cada indicador de oportunidades se define UNA vez como un conjunto de
 * condiciones. El contador y la lista que abre usan la misma función
 * (`aplicarCondiciones`) sobre la misma tabla: la cifra y el listado no
 * pueden diferir. Las cifras que no salen de oportunidades (mensajes,
 * detenciones) no se presentan como clickeables.
 *
 * Unidad: oportunidad (una por consulta), dentro de un perfil.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import type { ProfileMetrics } from "@/lib/metrics";
import { FUENTES, FUENTE_LABEL } from "@/lib/fuente";

export type Condicion =
  | { col: string; op: "eq"; value: string | boolean }
  | { col: string; op: "neq"; value: string }
  | { col: string; op: "in"; value: string[] }
  | { col: string; op: "is_null" }
  | { col: string; op: "not_null" }
  /** Anterior a «ahora menos N horas» (se resuelve al consultar). */
  | { col: string; op: "antes_de_horas"; value: number }
  | { col: string; op: "desde_horas"; value: number }
  /** Filtro «o» de PostgREST, ya armado (por ejemplo: «a.is.null,a.neq.x»). Uno solo por indicador. */
  | { col: "_or"; op: "or"; value: string };

export interface Indicador {
  clave: string;
  label: string;
  grupo: "contacto" | "captacion" | "derivacion" | "atencion" | "seguimiento" | "revision" | "fuente";
  /** Qué cuenta, en palabras (se muestra arriba de la lista). */
  definicion: string;
  conds: Condicion[];
  /** Cifra equivalente del cálculo único del perfil (para comprobar que coinciden). */
  metrica?: (m: ProfileMetrics) => number;
  /** Orden con el que conviene leer la lista (13/11). */
  orden?: "reciente" | "antiguo" | "creado" | "interes" | "silencio";
}

const eq = (col: string, value: string | boolean): Condicion => ({ col, op: "eq", value });
/** Excluye las detenciones (quejas, pedidos de no contacto): no son oportunidades. */
const sinDetencion: Condicion = { col: "_or", op: "or", value: "attention_category.is.null,attention_category.neq.detencion" };

export const INDICADORES: Indicador[] = [
  { clave: "oportunidades", label: "Oportunidades", grupo: "captacion", definicion: "Todas las oportunidades del perfil", conds: [], metrica: (m) => m.oportunidades },
  { clave: "sin_contactar", label: "Sin contactar", grupo: "contacto", definicion: "Todavía no se les escribió", conds: [eq("contact_state", "sin_contactar")], metrica: (m) => m.contacto.sin_contactar },
  { clave: "contactado_sin_respuesta", label: "Contactados sin respuesta", grupo: "contacto", definicion: "Se les escribió y no respondieron", conds: [eq("contact_state", "contactado_sin_respuesta")], metrica: (m) => m.contacto.contactado_sin_respuesta },
  { clave: "respondio", label: "Respondieron", grupo: "contacto", definicion: "Respondieron al menos una vez", conds: [eq("contact_state", "respondio")], metrica: (m) => m.contacto.respondio },
  { clave: "error_contacto", label: "Error de contacto", grupo: "contacto", definicion: "No se les pudo escribir", conds: [eq("contact_state", "error_contacto")], metrica: (m) => m.contacto.error_contacto },
  { clave: "nuevo", label: "Nuevos", grupo: "captacion", definicion: "Sin conversación todavía", conds: [eq("capture_state", "nuevo")], metrica: (m) => m.captacion.nuevo },
  { clave: "en_conversacion", label: "En conversación", grupo: "captacion", definicion: "Conversación en curso", conds: [eq("capture_state", "en_conversacion")], metrica: (m) => m.captacion.en_conversacion },
  { clave: "en_seguimiento", label: "En seguimiento", grupo: "captacion", definicion: "Con un contacto de seguimiento enviado", conds: [eq("capture_state", "en_seguimiento")], metrica: (m) => m.captacion.en_seguimiento },
  { clave: "captado", label: "Captados", grupo: "captacion", definicion: "Aceptaron el siguiente paso, con evidencia", conds: [eq("capture_state", "captado")], metrica: (m) => m.captacion.captado },
  { clave: "perdido", label: "Perdidos", grupo: "captacion", definicion: "Marcados como perdidos, con motivo", conds: [eq("capture_state", "perdido")], metrica: (m) => m.captacion.perdido },
  { clave: "captado_sin_derivar", label: "Captados sin derivar", grupo: "derivacion", definicion: "Captados que todavía no se marcaron como Derivado", conds: [eq("capture_state", "captado"), eq("derivation_state", "no_derivado")], metrica: (m) => m.derivacion.no_derivado },
  { clave: "derivado", label: "Derivados", grupo: "derivacion", definicion: "Captados marcados como Derivado", conds: [eq("capture_state", "captado"), eq("derivation_state", "derivado")], metrica: (m) => m.derivacion.derivado },
  { clave: "derivado_sin_resultado", label: "Derivados sin resultado", grupo: "derivacion", definicion: "Derivados sin un resultado posterior registrado (nada se infiere del silencio)", conds: [eq("capture_state", "captado"), eq("derivation_state", "derivado"), { col: "post_derivation_state", op: "is_null" }] },
  { clave: "captado_fuera_de_zona", label: "Captados fuera de AMBA", grupo: "captacion", definicion: "Captados con ubicación fuera de AMBA (grupo aparte)", conds: [eq("capture_state", "captado"), eq("location_zone", "fuera")] },
  { clave: "captado_zona_sin_confirmar", label: "Captados con ubicación sin confirmar", grupo: "captacion", definicion: "Captados sin ubicación confirmada (nunca se supone AMBA)", conds: [eq("capture_state", "captado"), eq("location_zone", "sin_confirmar")] },
  { clave: "requiere_humano", label: "Requieren intervención humana", grupo: "atencion", definicion: "Pedidos reales de una persona (la IA no responde en esos chats)", conds: [eq("attention_state", "requiere_humano")], metrica: (m) => m.atencion.requiere_humano },
  { clave: "humano_en_curso", label: "Atención humana en curso", grupo: "atencion", definicion: "Una persona tomó la conversación", conds: [eq("attention_state", "humano_en_curso")], metrica: (m) => m.atencion.humano_en_curso },
  { clave: "detencion_reciente", label: "Detenidos por la conversación", grupo: "atencion", definicion: "Rechazo, enojo, número equivocado o necesidad resuelta: archivo secundario, no es trabajo pendiente", conds: [eq("attention_category", "detencion")] },
  { clave: "seguimiento_activo", label: "Seguimiento activo", grupo: "seguimiento", definicion: "Con seguimiento automático en curso", conds: [eq("followup_state", "activo")], metrica: (m) => m.seguimiento.activo },
  { clave: "seguimiento_caido", label: "Caídos", grupo: "seguimiento", definicion: "Dejaron de contestar y se terminó el seguimiento (un mensaje más a los 3 días y 24 horas de espera)", orden: "silencio", conds: [eq("followup_state", "caido"), { col: "capture_state", op: "in", value: ["nuevo", "en_conversacion", "en_seguimiento"] }, sinDetencion], metrica: (m) => m.seguimiento.caido },
  // Reorganización 2 (18/10): las listas que valen la pena (oportunidades reales).
  // 13/11 · una sola definición por nombre (docs/mejoras-1311/PLAN-4-DETALLE.md §4, B1).
  // «Quién habló último» sale de columnas de la oportunidad que mantiene la base (migración 0607).
  { clave: "piden_persona", label: "Oportunidades reales", grupo: "atencion", definicion: "Esperan a una persona del equipo y tienen interés: pidieron hablar con alguien o preguntaron precio o condiciones. Sin rechazos, quejas ni pedidos de no contacto. Los que ya aceptaron están en «Para cerrar»", orden: "interes", conds: [eq("attention_state", "requiere_humano"), { col: "capture_state", op: "in", value: ["nuevo", "en_conversacion", "en_seguimiento"] }, sinDetencion, { col: "followup_state", op: "neq", value: "caido" }] },
  { clave: "te_escribio", label: "Te escribieron", grupo: "atencion", definicion: "La última palabra del chat es de la persona y todavía nadie le contestó (últimos 7 días)", orden: "silencio", conds: [eq("ultima_palabra", "persona"), { col: "capture_state", op: "neq", value: "perdido" }, sinDetencion, { col: "last_inbound_at", op: "desde_horas", value: 168 }] },
  { clave: "quedaron_sin_respuesta", label: "Quedaron sin respuesta", grupo: "seguimiento", definicion: "Escribieron hace más de 7 días y nadie les contestó: decidí si vale la pena retomarlos", orden: "silencio", conds: [eq("ultima_palabra", "persona"), { col: "capture_state", op: "in", value: ["nuevo", "en_conversacion", "en_seguimiento"] }, sinDetencion, eq("posible_captacion", false), { col: "last_inbound_at", op: "antes_de_horas", value: 168 }] },
  { clave: "posible_captacion", label: "Posible captación a revisar", grupo: "captacion", definicion: "El bot dudó si la persona concretó una llamada: miralo y decidí si es captado", orden: "silencio", conds: [eq("posible_captacion", true), { col: "capture_state", op: "in", value: ["nuevo", "en_conversacion", "en_seguimiento"] }] },
  // 20/10: «Hablando ahora» = charla en curso de verdad: sin detenidos y con actividad en los últimos 3 días.
  { clave: "hablando_ahora", label: "Hablando ahora", grupo: "captacion", definicion: "Conversación en curso: la persona escribió en los últimos 3 días", orden: "silencio", conds: [eq("capture_state", "en_conversacion"), sinDetencion, { col: "followup_state", op: "neq", value: "caido" }, { col: "last_inbound_at", op: "desde_horas", value: 72 }] },
  { clave: "venta", label: "Ventas concretadas", grupo: "derivacion", definicion: "Derivados con el resultado «Operación concretada»", conds: [eq("derivation_state", "derivado"), eq("post_derivation_state", "operacion_concretada")] },
  { clave: "repesca", label: "En repesca", grupo: "seguimiento", definicion: "Terminaron el seguimiento sin avanzar: para volver a intentar a mano", conds: [{ col: "capture_state", op: "neq", value: "captado" }, { col: "_or", op: "or", value: "followup_exhausted_at.not.is.null,repesca_base_id.not.is.null" }] },
  { clave: "perdido_comercial", label: "Perdidos", grupo: "captacion", definicion: "Perdidos por motivo comercial (sin contar quejas ni pedidos de no contacto)", conds: [eq("capture_state", "perdido"), sinDetencion] },
  { clave: "dejaron_de_responder", label: "En seguimiento", grupo: "seguimiento", definicion: "No escriben hace más de 3 días y el sistema todavía lo está intentando: sale un mensaje más y, si en 24 horas no contestan, pasan a Caídos", orden: "silencio", conds: [eq("contact_state", "respondio"), { col: "capture_state", op: "in", value: ["en_conversacion", "en_seguimiento"] }, sinDetencion, eq("ultima_palabra", "nosotros"), { col: "followup_state", op: "in", value: ["ninguno", "activo"] }, { col: "attention_state", op: "neq", value: "requiere_humano" }, { col: "last_inbound_at", op: "antes_de_horas", value: 72 }] },
  { clave: "revision_pendiente", label: "Revisión pendiente", grupo: "revision", definicion: "Marcadas para revisar por una persona", conds: [eq("review_required", true)], metrica: (m) => m.revision_pendiente },
  // Fuente acreditada (2.8): la primera comprobable; «no informada» si no hubo referencia.
  ...FUENTES.map(
    (f): Indicador => ({
      clave: `fuente_${f}`,
      label: `Fuente: ${FUENTE_LABEL[f]}`,
      grupo: "fuente",
      definicion: f === "no_informada" ? "El primer mensaje no traía referencia de origen" : `Primera fuente comprobada: ${FUENTE_LABEL[f]}`,
      conds: [eq("first_source", f)],
    })
  ),
];

const POR_CLAVE = new Map(INDICADORES.map((i) => [i.clave, i]));

export function indicadorPorClave(clave: unknown): Indicador | null {
  return typeof clave === "string" ? POR_CLAVE.get(clave) ?? null : null;
}

/** Acepta el identificador del perfil o su nombre corto (juridico, marketing…). */
export function rubroIdDe(perfil: unknown): string | null {
  if (typeof perfil !== "string") return null;
  if ((Object.keys(RUBRO_IDS) as RubroSlug[]).includes(perfil as RubroSlug)) return RUBRO_IDS[perfil as RubroSlug];
  return (Object.values(RUBRO_IDS) as string[]).includes(perfil) ? perfil : null;
}

/** Aplica las condiciones a una consulta de PostgREST (contador y lista usan esto mismo). */
export function aplicarCondiciones<Q extends { eq: Function; neq: Function; in: Function; is: Function; not: Function; lt: Function; gte: Function; or: Function }>(q: Q, conds: Condicion[]): Q {
  let out: any = q;
  for (const c of conds) {
    if (c.op === "eq") out = out.eq(c.col, c.value);
    else if (c.op === "neq") out = out.neq(c.col, c.value);
    else if (c.op === "in") out = out.in(c.col, c.value);
    else if (c.op === "is_null") out = out.is(c.col, null);
    else if (c.op === "not_null") out = out.not(c.col, "is", null);
    else if (c.op === "antes_de_horas") out = out.lt(c.col, new Date(Date.now() - c.value * 3600 * 1000).toISOString());
    else if (c.op === "desde_horas") out = out.gte(c.col, new Date(Date.now() - c.value * 3600 * 1000).toISOString());
    else if (c.op === "or") out = out.or(c.value);
  }
  return out as Q;
}

export interface Periodo {
  desde?: string | null;
  hasta?: string | null;
}

function base(rubroId: string, sel: string, opts?: { count?: "exact"; head?: boolean }, periodo?: Periodo) {
  let q: any = createAdminClient().from("opportunities").select(sel, opts as any).eq("rubro_id", rubroId);
  if (periodo?.desde) q = q.gte("created_at", periodo.desde);
  if (periodo?.hasta) q = q.lt("created_at", periodo.hasta);
  return q;
}

export async function contarIndicador(rubroId: string, ind: Indicador, periodo?: Periodo): Promise<{ count: number | null; error: string | null }> {
  const { count, error } = await aplicarCondiciones(base(rubroId, "id", { count: "exact", head: true }, periodo), ind.conds);
  return { count: error ? null : count ?? 0, error: error ? String(error.message ?? error) : null };
}

export const ORDENES = {
  reciente: { col: "updated_at", asc: false, label: "Actividad más reciente" },
  antiguo: { col: "updated_at", asc: true, label: "Actividad más antigua" },
  creado: { col: "created_at", asc: false, label: "Creadas más recientes" },
  // 13/11
  interes: { col: "interest_score", asc: false, label: "Más interés primero" },
  silencio: { col: "last_inbound_at", asc: false, label: "Último mensaje de la persona" },
} as const;
export type Orden = keyof typeof ORDENES;
export const TAMANO_PAGINA = 50;

export async function listarIndicador(
  rubroId: string,
  ind: Indicador,
  opts: { pagina?: number; orden?: Orden; periodo?: Periodo } = {}
): Promise<{ filas: any[]; total: number | null; error: string | null; pagina: number }> {
  const pagina = Math.max(1, Math.floor(opts.pagina ?? 1));
  const orden = ORDENES[opts.orden ?? ind.orden ?? "reciente"] ?? ORDENES.reciente;
  const from = (pagina - 1) * TAMANO_PAGINA;
  const sel =
    "id, contact_id, conversation_id, area, contact_state, capture_state, derivation_state, attention_state, attention_reason, followup_state, followup_reason, followup_next_at, capture_reason, interest_score, interest_reason, last_inbound_at, last_outbound_at, ultima_palabra, posible_captacion, posible_captacion_reason, location_zone, capture_warnings, post_derivation_state, first_source, updated_at, created_at, contacts(full_name, phone)";
  const { data, count, error } = await aplicarCondiciones(base(rubroId, sel, { count: "exact" }, opts.periodo), ind.conds)
    .order(orden.col, { ascending: orden.asc, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + TAMANO_PAGINA - 1);
  return { filas: data ?? [], total: error ? null : count ?? 0, error: error ? String(error.message ?? error) : null, pagina };
}

/** Enlace a la lista de un indicador (con el retorno que conserva filtros y posición). */
export function enlaceIndicador(perfil: string, clave: string, volver?: string | null): string {
  const p = new URLSearchParams({ perfil, indicador: clave });
  if (volver && volver.startsWith("/") && !volver.startsWith("//")) p.set("volver", volver);
  return `/oportunidades?${p.toString()}`;
}

/** Solo rutas internas para «Volver» (nunca otra web). */
export function volverSeguro(v: unknown): string | null {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : null;
}
