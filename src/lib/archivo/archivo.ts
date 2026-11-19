/**
 * Archivo de prospectos (19/11). Archivar no borra: la oportunidad queda con
 * fecha, autor y motivo, sale de Hoy, Activos y Descartados y se ve en
 * Descartados → Archivados. Si la persona vuelve a escribir, se desarchiva sola
 * (disparador de la migración 0634).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { logOpportunityEvent } from "@/lib/opportunities";
import { rubroIdDe } from "@/lib/indicadores";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";

/** Días que un descartado espera antes de archivarse solo. */
export const DIAS_PARA_ARCHIVAR = 30;
/** Clave de `system_settings`: desde cuándo corre el archivo automático (la escribe la responsable al habilitarlo). */
export const CLAVE_ARCHIVO = "archivo_automatico";

export interface FilaArchivable {
  capture_state: string | null;
  followup_state: string | null;
  attention_category: string | null;
  updated_at: string | null;
  last_inbound_at: string | null;
  archived_at?: string | null;
}

/** ¿Es un descartado (perdido, caído o detenido) y pasó más de un mes sin novedades? Pura. Un captado nunca. */
export function debeArchivarse(f: FilaArchivable, ahora: Date, dias = DIAS_PARA_ARCHIVAR): boolean {
  if (f.archived_at || f.capture_state === "captado") return false;
  const descartado = f.capture_state === "perdido" || f.followup_state === "caido" || f.attention_category === "detencion";
  if (!descartado) return false;
  const limite = ahora.getTime() - dias * 86_400_000;
  const fechas = [f.updated_at, f.last_inbound_at].filter(Boolean).map((x) => Date.parse(x as string));
  if (!fechas.length) return false;
  return Math.max(...fechas) <= limite;
}

export async function archivarOportunidad(id: string, actor: "operador" | "sistema", motivo: string): Promise<boolean> {
  const s = createAdminClient();
  const ahora = new Date().toISOString();
  const { data } = await (s.from("opportunities") as any)
    .update({ archived_at: ahora, archived_by: actor, archive_reason: motivo })
    .eq("id", id)
    .is("archived_at", null)
    .select("id");
  if (!data?.length) return false;
  await logOpportunityEvent({ opportunityId: id, actor, dimension: "ficha", from: "activo", to: "archivado", reason: motivo });
  return true;
}

export async function desarchivarOportunidad(id: string, actor: "operador" | "sistema"): Promise<boolean> {
  const s = createAdminClient();
  const { data } = await (s.from("opportunities") as any)
    .update({ archived_at: null, archived_by: null, archive_reason: null })
    .eq("id", id)
    .not("archived_at", "is", null)
    .select("id");
  if (!data?.length) return false;
  await logOpportunityEvent({ opportunityId: id, actor, dimension: "ficha", from: "archivado", to: "activo", reason: "Desarchivado" });
  return true;
}

export async function archivoAutomaticoEncendido(): Promise<boolean> {
  const { data } = await (createAdminClient().from("system_settings") as any).select("value").eq("key", CLAVE_ARCHIVO).maybeSingle();
  return Boolean((data as any)?.value?.desde);
}

/** Archiva a los descartados de más de un mes. Apagado hasta que la responsable lo habilite. */
export async function archivarDescartadosViejos(opts: { ahora?: Date; maximo?: number } = {}): Promise<{ archivados: number; apagado?: true }> {
  if (!(await archivoAutomaticoEncendido())) return { archivados: 0, apagado: true };
  const ahora = opts.ahora ?? new Date();
  const corte = new Date(ahora.getTime() - DIAS_PARA_ARCHIVAR * 86_400_000).toISOString();
  const s = createAdminClient();
  let archivados = 0;
  for (const perfil of Object.keys(AREAS_DE_PERFIL)) {
    const rubroId = rubroIdDe(perfil);
    if (!rubroId) continue;
    const { data } = await (s.from("opportunities") as any)
      .select("id, capture_state, followup_state, attention_category, updated_at, last_inbound_at, archived_at")
      .eq("rubro_id", rubroId)
      .is("archived_at", null)
      .neq("capture_state", "captado")
      .lt("updated_at", corte)
      .or("capture_state.eq.perdido,followup_state.eq.caido,attention_category.eq.detencion")
      .limit(opts.maximo ?? 200);
    for (const f of (data ?? []) as any[]) {
      if (!debeArchivarse(f, ahora)) continue;
      if (await archivarOportunidad(f.id, "sistema", `Archivado automáticamente: más de ${DIAS_PARA_ARCHIVAR} días sin novedades en Descartados.`)) archivados++;
    }
  }
  return { archivados };
}
