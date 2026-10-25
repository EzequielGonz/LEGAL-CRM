/**
 * Conocimiento del bot en el panel (25/10): resumen por perfil, cambio de
 * versión y edición de ítems. Todo cambio queda en ops_change_log con el
 * valor anterior, para poder volver atrás.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { limpiarCacheConocimiento } from "./servicio";
import { sumar, tasas, veredicto, type FilaEstadistica } from "./estadisticas";
import type { RubroConocimiento } from "./seleccion";

export const RUBROS_CONOCIMIENTO: RubroConocimiento[] = ["juridico", "agencia_0km", "coberturas_medicas", "marketing"];
const SLUG_POR_ID: Record<string, RubroConocimiento> = Object.fromEntries(Object.entries(RUBRO_IDS).map(([s, id]) => [id, s as RubroConocimiento]));

export async function resumenConocimiento(dias: number) {
  const s = createAdminClient();
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - Math.max(1, Math.min(90, dias)) * 86_400_000);
  const [vers, asig, est, fichas, items] = await Promise.all([
    s.from("bot_knowledge_versions" as any).select("version, nombre, descripcion").order("version"),
    s.from("bot_knowledge_assignment" as any).select("rubro, version, comparar_con, porcentaje, desde, updated_by"),
    s.rpc("conocimiento_estadisticas" as any, { p_desde: desde.toISOString(), p_hasta: hasta.toISOString() }),
    s.rpc("conocimiento_fichas" as any, { p_desde: desde.toISOString(), p_hasta: hasta.toISOString() }),
    s.from("bot_knowledge_items" as any).select("version, clave, capa, rubro, titulo, activo"),
  ]);
  for (const r of [vers, asig, est, fichas, items]) if (r.error) throw r.error;
  const titulo = new Map<string, string>(((items.data as any[]) ?? []).filter((i) => i.version === 2).map((i) => [i.clave, i.titulo]));
  const perfiles = RUBROS_CONOCIMIENTO.map((rubro) => {
    const filas: FilaEstadistica[] = ((est.data as any[]) ?? [])
      .filter((f) => SLUG_POR_ID[f.rubro_id] === rubro)
      .map((f) => ({ ...f, version: Number(f.version), conversaciones: Number(f.conversaciones), turnos: Number(f.turnos), siguieron: Number(f.siguieron), captados: Number(f.captados), escalados: Number(f.escalados), detenidos: Number(f.detenidos), retenidos: Number(f.retenidos), tokens_promedio: f.tokens_promedio == null ? null : Number(f.tokens_promedio), latencia_promedio: f.latencia_promedio == null ? null : Number(f.latencia_promedio) }));
    const v1 = sumar(filas, 1);
    const v2 = sumar(filas, 2);
    const usos = ((fichas.data as any[]) ?? [])
      .filter((f) => SLUG_POR_ID[f.rubro_id] === rubro)
      .map((f) => ({ clave: f.clave as string, titulo: titulo.get(f.clave) ?? f.clave, usos: Number(f.usos), siguieron: Number(f.siguieron) }))
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 12);
    const deRubro = ((items.data as any[]) ?? []).filter((i) => i.version === 2 && i.activo && (i.rubro === rubro || i.rubro === "comun" || i.rubro === null));
    return {
      rubro,
      asignacion: ((asig.data as any[]) ?? []).find((a) => a.rubro === rubro) ?? null,
      v1: tasas(v1),
      v2: tasas(v2),
      veredicto: veredicto(v1, v2),
      fichas: usos,
      contenido_v2: { total: deRubro.length, fichas: deRubro.filter((i) => i.capa === "objecion").length, temas: deRubro.filter((i) => i.capa === "tema").length },
    };
  });
  return { dias, desde: desde.toISOString(), hasta: hasta.toISOString(), versiones: vers.data ?? [], perfiles };
}

export async function cambiarAsignacion(rubro: RubroConocimiento, input: { version: number; comparar_con: number | null; porcentaje: number }, actor: string) {
  const s = createAdminClient();
  if (![1, 2].includes(input.version)) throw new Error("Versión no válida.");
  if (input.comparar_con !== null && (![1, 2].includes(input.comparar_con) || input.comparar_con === input.version)) throw new Error("La versión para comparar tiene que ser distinta.");
  const porcentaje = input.comparar_con === null ? 100 : Math.max(10, Math.min(90, Math.round(input.porcentaje)));
  const { data: antes } = await s.from("bot_knowledge_assignment" as any).select("*").eq("rubro", rubro).maybeSingle();
  const despues = { rubro, version: input.version, comparar_con: input.comparar_con, porcentaje, desde: new Date().toISOString(), updated_by: actor };
  const { error } = await s.from("bot_knowledge_assignment" as any).upsert(despues, { onConflict: "rubro" });
  if (error) throw error;
  await s.from("ops_change_log" as any).insert({ actor, action: "conocimiento_version", target: rubro, before: antes ?? null, after: despues, note: "Cambio de versión del conocimiento del bot desde Perfiles." });
  limpiarCacheConocimiento();
  return despues;
}

export async function listarItems(version: number, rubro: RubroConocimiento) {
  const { data, error } = await createAdminClient()
    .from("bot_knowledge_items" as any)
    .select("clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden, updated_at, updated_by")
    .eq("version", version)
    .or(`rubro.eq.${rubro},rubro.eq.comun,rubro.is.null`)
    .order("capa")
    .order("orden");
  if (error) throw error;
  return data ?? [];
}

export async function editarItem(version: number, clave: string, cambios: { contenido?: unknown; activo?: unknown }, actor: string) {
  const s = createAdminClient();
  const { data: antes } = await s.from("bot_knowledge_items" as any).select("*").eq("version", version).eq("clave", clave).maybeSingle();
  if (!antes) throw new Error("No existe ese ítem.");
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: actor };
  if (typeof cambios.contenido === "string") {
    const t = cambios.contenido.replace(/\r\n/g, "\n").trim();
    if (t.length < 10 || t.length > 4000) throw new Error("El texto tiene que tener entre 10 y 4000 caracteres.");
    upd.contenido = t;
  }
  if (typeof cambios.activo === "boolean") upd.activo = cambios.activo;
  if (!("contenido" in upd) && !("activo" in upd)) throw new Error("No hay cambios.");
  const { error } = await s.from("bot_knowledge_items" as any).update(upd).eq("version", version).eq("clave", clave);
  if (error) throw error;
  await s.from("ops_change_log" as any).insert({
    actor,
    action: "conocimiento_item",
    target: `v${version}:${clave}`,
    before: { contenido: (antes as any).contenido, activo: (antes as any).activo },
    after: { contenido: upd.contenido ?? (antes as any).contenido, activo: upd.activo ?? (antes as any).activo },
    note: "Edición de un ítem del conocimiento del bot desde Perfiles.",
  });
  limpiarCacheConocimiento();
  return { ok: true };
}
