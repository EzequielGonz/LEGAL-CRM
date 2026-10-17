import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { EstadisticasPerfil } from "@/components/estadisticas/estadisticas-perfil";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas" };

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

  // Misma estructura que los otros perfiles (bloque 3) y, aparte, los dos
  // circuitos propios de Marketing: Simple ve el resultado de cada uno;
  // Avanzado, el embudo completo.
  const extra = (
    <section aria-labelledby="mkt-circuitos" className="space-y-4">
      <h2 id="mkt-circuitos" className="text-base font-semibold text-slate-900">Los dos circuitos de Marketing</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Captación saliente (negocios encontrados)</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            <span className="tabular-nums">{n(respondieron)}</span> respondieron de <span className="tabular-nums">{n(contactados)}</span> contactados
          </p>
          <p className="mt-1 text-sm text-slate-700">
            <span className="tabular-nums">{n(aprobadosFrios)}</span> proyectos aprobados ({pct(n(aprobadosFrios), n(respondieron))} de los que respondieron).
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Consultas directas (escriben ellos)</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            <span className="tabular-nums">{n(directasTotal)}</span> consultas recibidas
          </p>
          <p className="mt-1 text-sm text-slate-700">
            <span className="tabular-nums">{n(directasAprobadas)}</span> proyectos aprobados ({pct(n(directasAprobadas), n(directasTotal))} de las consultas).
          </p>
        </div>
      </div>
      <div className="solo-avanzado space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Datos fríos (negocios encontrados)</h3>
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
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Resultado de la captación saliente</h3>
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
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Consultas directas</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Consultas recibidas" value={n(directasTotal)} />
          <StatCard label="Proyectos aprobados" value={n(directasAprobadas)} hint={`${pct(n(directasAprobadas), n(directasTotal))} de las consultas`} />
          <StatCard label="No interesadas" value={n(directasNoInteresadas)} />
        </div>
      </section>
      </div>
    </section>
  );
  return <EstadisticasPerfil slug="marketing" ruta="/panel/marketing/estadisticas" extra={extra} />;
}
