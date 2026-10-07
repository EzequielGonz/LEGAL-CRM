import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, LeadList, type LeadRow } from "@/components/marketing/lead-list";
import { AutoOutreachControl } from "@/components/marketing/auto-outreach-control";
import { AUTO_CAMPAIGN_NAME } from "@/lib/marketing/outreach";

export const dynamic = "force-dynamic";

/**
 * Prospectos prioritarios: los datos fríos del scraper ya analizados,
 * ordenados de mejor a peor oportunidad. Desde acá también se prende o
 * apaga el envío automático del primer mensaje a los mejor calificados.
 */
export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: { prioridad?: string; estado?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("marketing_leads")
    .select(LEAD_COLUMNS)
    .eq("source_kind", "scraper")
    .order("lead_score", { ascending: false, nullsFirst: false })
    .limit(300);

  if (searchParams.prioridad) query = query.eq("priority", searchParams.prioridad);
  if (searchParams.estado) query = query.eq("outreach_status", searchParams.estado);

  const [{ data: leads }, { data: autoCampaign }, { count: pendientes }] = await Promise.all([
    query,
    supabase
      .from("campaigns")
      .select("id, status, message_template_name, daily_send_limit")
      .eq("area", "marketing")
      .eq("name", AUTO_CAMPAIGN_NAME)
      .maybeSingle(),
    supabase
      .from("marketing_leads")
      .select("*", { count: "exact", head: true })
      .eq("source_kind", "scraper")
      .in("analysis_status", ["pendiente", "analizando"]),
  ]);

  const hasFilters = Boolean(searchParams.prioridad || searchParams.estado);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Prospectos prioritarios</h1>
        <p className="text-sm text-slate-500">
          Negocios de Google Maps ya analizados (web + ficha de Google), ordenados por oportunidad. Los de prioridad alta
          y media reciben el primer mensaje; los de prioridad baja no se contactan.
          {pendientes ? ` Hay ${pendientes} negocio(s) en cola de análisis.` : ""}
        </p>
      </div>

      <AutoOutreachControl
        status={(autoCampaign as any)?.status ?? null}
        templateName={(autoCampaign as any)?.message_template_name ?? ""}
        dailyLimit={(autoCampaign as any)?.daily_send_limit ?? 30}
      />

      <form
        action="/panel/marketing/prospectos"
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Prioridad</label>
          <select
            name="prioridad"
            defaultValue={searchParams.prioridad ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Estado</label>
          <select
            name="estado"
            defaultValue={searchParams.estado ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Todos</option>
            <option value="sin_contactar">Sin contactar</option>
            <option value="contactado">Contactado (sin respuesta)</option>
            <option value="respondio">Respondió</option>
            <option value="repesca">En seguimiento</option>
            <option value="cerrado">Cerrado</option>
            <option value="no_interesado">No interesado</option>
            <option value="baja">Dado de baja</option>
          </select>
        </div>
        <button type="submit" className="btn-gold">
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/panel/marketing/prospectos" className="pb-2 text-sm text-slate-500 hover:underline">
            Limpiar filtros
          </Link>
        )}
      </form>

      <LeadList
        leads={(leads ?? []) as unknown as LeadRow[]}
        mode="prospectos"
        emptyText="Todavía no hay prospectos. Hacé una búsqueda en Captación y se analizan solos."
      />
    </div>
  );
}
