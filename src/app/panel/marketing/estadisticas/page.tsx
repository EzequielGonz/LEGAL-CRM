import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";

export const dynamic = "force-dynamic";

function pct(part: number, total: number) {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "—";
}

/**
 * Estadísticas del pipeline de Marketing: del dato frío al cierre.
 * Se calculan con conteos directos sobre marketing_leads y marketing_events.
 */
export default async function EstadisticasMarketingPage() {
  const supabase = createClient();

  const leads = () => supabase.from("marketing_leads").select("*", { count: "exact", head: true });
  const events = (type: string) =>
    supabase.from("marketing_events").select("*", { count: "exact", head: true }).eq("event_type", type);

  const [
    total,
    analizados,
    alta,
    media,
    baja,
    contactados,
    respondieron,
    enSeguimiento,
    dadosDeBaja,
    aprobadosFrios,
    noInteresadosFrios,
    directasTotal,
    directasAprobadas,
    directasNoInteresadas,
    repescasEnviadas,
    respuestasTrasRepesca,
    escalados,
  ] = await Promise.all([
    leads().eq("source_kind", "scraper"),
    leads().eq("source_kind", "scraper").eq("analysis_status", "listo"),
    leads().eq("source_kind", "scraper").eq("priority", "alta"),
    leads().eq("source_kind", "scraper").eq("priority", "media"),
    leads().eq("source_kind", "scraper").eq("priority", "baja"),
    leads().eq("source_kind", "scraper").not("first_contacted_at", "is", null),
    leads().eq("source_kind", "scraper").not("first_contacted_at", "is", null).not("last_inbound_at", "is", null),
    leads().eq("source_kind", "scraper").eq("outreach_status", "repesca"),
    leads().eq("source_kind", "scraper").eq("outreach_status", "baja"),
    leads().eq("source_kind", "scraper").eq("outreach_status", "cerrado"),
    leads().eq("source_kind", "scraper").eq("outreach_status", "no_interesado"),
    leads().eq("source_kind", "directa"),
    leads().eq("source_kind", "directa").eq("outreach_status", "cerrado"),
    leads().eq("source_kind", "directa").eq("outreach_status", "no_interesado"),
    events("repesca_enviada"),
    supabase
      .from("marketing_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "respondio")
      .eq("detail->>estado_previo", "repesca"),
    events("escalado_a_humano"),
  ]);

  const n = (r: { count: number | null }) => r.count ?? 0;
  const sinRespuesta = n(contactados) - n(respondieron);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Estadísticas de Marketing</h1>
        <p className="text-sm text-slate-500">
          Del negocio encontrado en Google Maps hasta el proyecto aprobado. El detalle de cada prospecto está en su ficha.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Datos fríos (scraper)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Negocios cargados" value={n(total)} />
          <StatCard label="Analizados" value={n(analizados)} hint={pct(n(analizados), n(total))} />
          <StatCard label="Prioridad alta" value={n(alta)} />
          <StatCard label="Prioridad media" value={n(media)} hint={`${n(baja)} de prioridad baja (no se contactan)`} />
          <StatCard label="Mensaje inicial enviado" value={n(contactados)} />
          <StatCard label="Respondieron" value={n(respondieron)} hint={`${pct(n(respondieron), n(contactados))} de los contactados`} />
          <StatCard label="Sin respuesta (no se les escribe más)" value={sinRespuesta} />
          <StatCard label="Derivaron a un humano" value={n(escalados)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Resultado</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Proyectos aprobados" value={n(aprobadosFrios)} hint={`${pct(n(aprobadosFrios), n(respondieron))} de los que respondieron`} />
          <StatCard label="No interesados" value={n(noInteresadosFrios)} />
          <StatCard label="En seguimiento ahora" value={n(enSeguimiento)} />
          <StatCard label="Dados de baja" value={n(dadosDeBaja)} />
          <StatCard label="Seguimientos enviados" value={n(repescasEnviadas)} />
          <StatCard
            label="Respondieron a un seguimiento"
            value={n(respuestasTrasRepesca)}
            hint={`${pct(n(respuestasTrasRepesca), n(repescasEnviadas))} de los seguimientos`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Consultas directas</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Consultas recibidas" value={n(directasTotal)} />
          <StatCard label="Proyectos aprobados" value={n(directasAprobadas)} hint={`${pct(n(directasAprobadas), n(directasTotal))} de las consultas`} />
          <StatCard label="No interesadas" value={n(directasNoInteresadas)} />
        </div>
      </section>
    </div>
  );
}
