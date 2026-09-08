import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { AreaBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createClient();

  const [
    { count: totalProspectos },
    { count: nuevos },
    { count: agendados },
    { count: cerrados },
    { data: porArea },
    { data: porFuente },
    { data: proximasCitas },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "nuevo"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "agendado"),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("status", "cerrado_ganado"),
    supabase.from("contacts").select("area"),
    supabase.from("contacts").select("source"),
    supabase
      .from("appointments")
      .select("id, starts_at, area, contacts(full_name)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
  ]);

  const civil = (porArea ?? []).filter((c) => c.area === "civil").length;
  const penal = (porArea ?? []).filter((c) => c.area === "penal").length;

  const fuentes = (porFuente ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.source] = (acc[row.source] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalProspectos: totalProspectos ?? 0,
    nuevos: nuevos ?? 0,
    agendados: agendados ?? 0,
    cerrados: cerrados ?? 0,
    civil,
    penal,
    fuentes,
    proximasCitas: proximasCitas ?? [],
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-slate-900">Estadísticas</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <StatCard label="Prospectos totales" value={stats.totalProspectos} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <StatCard label="Nuevos sin atender" value={stats.nuevos} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <StatCard label="Agendados" value={stats.agendados} />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <StatCard label="Cerrados (ganados)" value={stats.cerrados} />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="card-lift animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5"
          style={{ animationDelay: "220ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Por área</h2>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-400">Civil</p>
              <p className="text-xl font-semibold text-civil">{stats.civil}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Penal</p>
              <p className="text-xl font-semibold text-penal">{stats.penal}</p>
            </div>
          </div>
        </div>

        <div
          className="card-lift animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5"
          style={{ animationDelay: "260ms" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Por origen</h2>
          <ul className="space-y-1 text-sm text-slate-600">
            {Object.entries(stats.fuentes).map(([fuente, cant]) => (
              <li key={fuente} className="flex justify-between">
                <span>{fuente}</span>
                <span className="font-medium text-slate-900">{cant}</span>
              </li>
            ))}
            {Object.keys(stats.fuentes).length === 0 && (
              <li className="text-slate-400">Sin datos todavía.</li>
            )}
          </ul>
        </div>
      </div>

      <div
        className="card-lift animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5"
        style={{ animationDelay: "300ms" }}
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Próximas citas</h2>
        <ul className="divide-y divide-slate-100">
          {stats.proximasCitas.map((cita: any) => (
            <li key={cita.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700">{cita.contacts?.full_name ?? "Sin nombre"}</span>
              <div className="flex items-center gap-3">
                <AreaBadge area={cita.area} />
                <span className="text-slate-400">
                  {new Date(cita.starts_at).toLocaleString("es-AR")}
                </span>
              </div>
            </li>
          ))}
          {stats.proximasCitas.length === 0 && (
            <li className="py-2 text-sm text-slate-400">No hay citas próximas.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
