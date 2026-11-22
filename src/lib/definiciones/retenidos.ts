/**
 * Definición única de «mensajes retenidos» (22/11, hallazgos 15 §3 ítems 2 y 7; pendiente 15d y 15f).
 *
 * - Un mensaje retenido es un evento de webhook que no se pudo procesar y que nadie revisó todavía
 *   (`reviewed_at` vacío), sin tope de horas: lo mismo cuenta Revisión, la barra de Salud y las fallas.
 *   Antes Salud contaba solo las últimas 24 h («sin cuarentena») y Fallas todo lo pendiente («4 retenidos»).
 * - Cada retenido guarda el perfil (rubro) de la línea por la que llegó. Cada panel muestra solo los
 *   suyos. Los que no tienen rubro (anteriores a la migración 0637, o de una línea que no está asignada
 *   a ningún perfil) se ven únicamente en Jurídico, que es el panel base, rotulados «sin perfil».
 *   Nunca se muestran en Coberturas, Autos ni Marketing.
 * Pura: se prueba sola.
 */
import { AREA_TO_RUBRO_ID, RUBRO_IDS } from "@/lib/rubros";
import type { SlugPerfil } from "@/lib/marca";

/** Rubro de un retenido a partir del área de la línea por la que llegó (null si no se conoce). */
export function rubroDeRetenidoPorArea(area: string | null | undefined): string | null {
  if (!area) return null;
  return AREA_TO_RUBRO_ID[area] ?? null;
}

/** ¿El retenido se muestra en el panel de ese perfil? */
export function retenidoEsDelPerfil(rubroId: string | null | undefined, slug: SlugPerfil): boolean {
  if (!rubroId) return slug === "juridico";
  return rubroId === RUBRO_IDS[slug];
}

/** Filtro PostgREST para la consulta de retenidos pendientes de un perfil (misma regla que `retenidoEsDelPerfil`). */
export function filtroRetenidosDelPerfil(slug: SlugPerfil): { tipo: "eq"; valor: string } | { tipo: "or"; valor: string } {
  const id = RUBRO_IDS[slug];
  return slug === "juridico" ? { tipo: "or", valor: `rubro_id.eq.${id},rubro_id.is.null` } : { tipo: "eq", valor: id };
}

/** Texto del rótulo del perfil de un retenido. */
export function rotuloPerfilDeRetenido(rubroId: string | null | undefined): string {
  if (!rubroId) return "Sin perfil asignado";
  const slug = (Object.entries(RUBRO_IDS).find(([, id]) => id === rubroId)?.[0] ?? null) as SlugPerfil | null;
  return slug === "juridico" ? "Jurídico" : slug === "agencia_0km" ? "Autos 0 km" : slug === "coberturas_medicas" ? "Coberturas" : slug === "marketing" ? "Marketing" : "Sin perfil asignado";
}

export interface RetenidoMinimo {
  rubro_id: string | null;
  reviewed_at: string | null;
  detail?: string | null;
  reason?: string | null;
}

/** Cuántos retenidos pendientes tiene un perfil y el motivo del más reciente (lista en orden de llegada, el último primero). */
export function resumenRetenidosDelPerfil(rows: RetenidoMinimo[], slug: SlugPerfil): { cantidad: number; motivo: string | null } {
  const mios = rows.filter((r) => !r.reviewed_at && retenidoEsDelPerfil(r.rubro_id, slug));
  return { cantidad: mios.length, motivo: mios[0] ? mios[0].detail ?? mios[0].reason ?? null : null };
}
