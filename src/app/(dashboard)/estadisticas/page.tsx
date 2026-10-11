import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { MetricsPanel } from "@/components/ui/metrics-panel";
import { getProfileMetrics } from "@/lib/metrics";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

/**
 * Estadísticas del perfil (bloque 1.5): las cifras salen del cálculo único
 * de la base (las mismas que ve el teléfono); cada tasa muestra su
 * denominador. Antes se contaban filas descargadas y algunas se cortaban
 * en 1.000.
 */
export default async function EstadisticasPage() {
  const supabase = createClient();
  const [metrics, { count: civil }, { count: penal }, { data: proximasCitas }] = await Promise.all([
    getProfileMetrics(RUBRO_IDS.juridico),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", RUBRO_IDS.juridico).eq("area", "civil"),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", RUBRO_IDS.juridico).eq("area", "penal"),
    supabase
      .from("appointments")
      .select("id, starts_at, area, contacts(full_name)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Estadísticas</h1>
        <p className="text-sm text-slate-500">
          Civil: {(civil ?? 0).toLocaleString("es-AR")} · Penal: {(penal ?? 0).toLocaleString("es-AR")} oportunidades
        </p>
      </div>

      <MetricsPanel metrics={metrics} />

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Próximas citas</h2>
        {(proximasCitas ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">No hay citas próximas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(proximasCitas ?? []).map((c: any) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <AreaBadge area={c.area} />
                  <span className="text-slate-700">{c.contacts?.full_name ?? "Sin nombre"}</span>
                </span>
                <span className="text-xs text-slate-500">{new Date(c.starts_at).toLocaleString("es-AR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
