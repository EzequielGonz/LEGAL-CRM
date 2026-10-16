import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, LeadList, type LeadRow } from "@/components/marketing/lead-list";
import { AutoOutreachControl } from "@/components/marketing/auto-outreach-control";
import { AUTO_CAMPAIGN_NAME } from "@/lib/marketing/outreach";
import { ETAPA_LABEL } from "@/lib/marketing/venta";

export const dynamic = "force-dynamic";

/**
 * Prospectos prioritarios: los datos fríos del scraper ya analizados,
 * ordenados de mejor a peor oportunidad. Desde acá también se prende o
 * apaga el envío automático del primer mensaje a los mejor calificados.
 */
export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: { prioridad?: string; estado?: string; etapa?: string };
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
  // Venta consultiva (16/10): etapa de cada negocio de las bases extraídas.
  if (searchParams.etapa && searchParams.etapa in ETAPA_LABEL) query = query.eq("sale_stage", searchParams.etapa);

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

  const hasFilters = Boolean(searchParams.prioridad || searchParams.estado || searchParams.etapa);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Prospectos prioritarios</h1>
        <p className="text-sm text-slate-500">
          Negocios de Google Maps ya analizados (web + ficha de Google), ordenados por oportunidad. Los de prioridad alta
          y media reciben el primer mensaje; los de prioridad baja no se contactan.
          {pendientes ? ` Hay ${pendientes} negocio(s) en cola de análisis.` : ""}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Las bases de «Extraer negocios» reciben la apertura genérica y se analizan recién cuando aceptan escuchar la propuesta.
        </p>
        <nav aria-label="Etapa de venta" className="mt-2 flex flex-wrap gap-1 text-xs">
          <Link href="/panel/marketing/prospectos" className={`rounded px-2 py-1 ${!searchParams.etapa ? "bg-slate-900 text-gold-100" : "border border-slate-300"}`}>Todas las etapas</Link>
          {Object.entries(ETAPA_LABEL).map(([k, v]) => (
            <Link key={k} href={`/panel/marketing/prospectos?etapa=${k}`} className={`rounded px-2 py-1 ${searchParams.etapa === k ? "bg-slate-900 text-gold-100" : "border border-slate-300"}`}>{v}</Link>
          ))}
        </nav>
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
