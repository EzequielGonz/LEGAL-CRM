import { AreaBadge } from "@/components/ui/badge";
import { MetricsPanel } from "@/components/ui/metrics-panel";
import { ResumenSeccion, type PuntoResumen } from "@/components/nivel/resumen-seccion";
import { formatRate, getProfileMetrics, headlineRates } from "@/lib/metrics";
import { enlaceIndicador } from "@/lib/indicadores";
import { RUBRO_IDS } from "@/lib/rubros";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SlugPerfil } from "@/lib/marca";

const AREAS: Record<SlugPerfil, string[]> = {
  juridico: ["civil", "penal"],
  coberturas_medicas: ["coberturas_medicas"],
  agencia_0km: ["agencia_0km"],
  marketing: ["marketing"],
};

/**
 * Estadísticas de un perfil, con la misma estructura en los cuatro
 * (rediseño 17/10, bloque 3). Las cifras salen del cálculo único de la base
 * (`profile_metrics`, el mismo del teléfono). Simple: cómo va el perfil y
 * qué requiere atención, cada cifra abre su lista. Avanzado: todas las
 * cifras con sus denominadores y las próximas citas.
 */
export async function EstadisticasPerfil({ slug, ruta, extra }: { slug: SlugPerfil; ruta: string; extra?: React.ReactNode }) {
  const rubroId = RUBRO_IDS[slug];
  const supabase = createAdminClient();
  const [metrics, { data: proximasCitas }, ...porArea] = await Promise.all([
    getProfileMetrics(rubroId),
    supabase
      .from("appointments")
      .select("id, starts_at, area, contacts(full_name)")
      .in("area", AREAS[slug])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
    ...(slug === "juridico"
      ? AREAS.juridico.map((a) => supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("area", a))
      : []),
  ]);
  const enlace = (clave: string) => enlaceIndicador(slug, clave, ruta);
  const tasas = metrics ? headlineRates(metrics) : [];
  const puntos: PuntoResumen[] = metrics
    ? [
        { texto: "Esperan a una persona", cantidad: metrics.atencion.requiere_humano, href: enlace("requiere_humano"), tono: metrics.atencion.requiere_humano ? "atencion" : "ok" },
        { texto: "Captados sin derivar", cantidad: metrics.derivacion.no_derivado, href: enlace("captado_sin_derivar"), tono: metrics.derivacion.no_derivado ? "atencion" : "ok" },
        { texto: "Contactados sin respuesta", cantidad: metrics.contacto.contactado_sin_respuesta, href: enlace("contactado_sin_respuesta"), tono: "info" },
        { texto: "Seguimientos caídos", cantidad: metrics.seguimiento.caido, href: enlace("seguimiento_caido"), tono: metrics.seguimiento.caido ? "atencion" : "ok" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Estadísticas</h1>
        {slug === "juridico" && porArea.length === 2 ? (
          <p className="mt-1 text-sm text-slate-600">
            Civil: <span className="tabular-nums">{(porArea[0].count ?? 0).toLocaleString("es-AR")}</span> · Penal:{" "}
            <span className="tabular-nums">{(porArea[1].count ?? 0).toLocaleString("es-AR")}</span> oportunidades
          </p>
        ) : null}
      </div>

      {!metrics ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          No se pudieron calcular las cifras. No son cero: volvé a intentar en unos minutos.
        </p>
      ) : (
        <ResumenSeccion
          id="est"
          etiqueta="Cómo va el perfil"
          estado={`${metrics.oportunidades.toLocaleString("es-AR")} oportunidades · ${metrics.captacion.captado.toLocaleString("es-AR")} captadas`}
          detalle={
            <p>
              {tasas.map((t, i) => (
                <span key={t.label}>
                  {i > 0 ? " · " : ""}
                  {t.label}: <strong className="font-semibold tabular-nums">{formatRate(t)}</strong>
                </span>
              ))}
            </p>
          }
          tono={metrics.atencion.requiere_humano || metrics.derivacion.no_derivado ? "atencion" : "ok"}
          puntos={puntos}
          principal={{ texto: "Ver todas las oportunidades", href: enlace("oportunidades") }}
          personalizar={{ href: "#est-completo", texto: "Ver todas las cifras" }}
        />
      )}

      <section id="est-completo" tabIndex={-1} aria-labelledby="est-completo-titulo" className="solo-avanzado space-y-4">
        <h2 id="est-completo-titulo" className="text-base font-semibold text-slate-900">Todas las cifras</h2>
        <MetricsPanel metrics={metrics} perfil={slug} volver={ruta} />
      </section>

      {extra}

      <section aria-labelledby="est-citas" className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 id="est-citas" className="mb-3 text-base font-semibold text-slate-900">Próximas citas</h2>
        {(proximasCitas ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No hay citas próximas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(proximasCitas ?? []).map((c: any) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <AreaBadge area={c.area} />
                  <span className="min-w-0 truncate text-slate-800">{c.contacts?.full_name ?? "Sin nombre"}</span>
                </span>
                <span className="text-xs tabular-nums text-slate-600">{new Date(c.starts_at).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
