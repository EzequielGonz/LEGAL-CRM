import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PhoneHeader } from "@/components/telefono/phone-header";
import { MetricsPanel } from "@/components/ui/metrics-panel";
import { CampaignMetricsPanel } from "@/components/campanas/campaign-metrics-panel";
import { getProfileMetrics } from "@/lib/metrics";
import { getCampaignMetrics } from "@/lib/campaign-metrics";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";
import { phoneProfile } from "@/lib/telefono";

export const dynamic = "force-dynamic";

/**
 * Estadísticas en el teléfono (doc. 1, 3.3 · bloques 1.5 y 1.9): las mismas
 * cifras que en PC (mismo cálculo). Primero la campaña activa más reciente,
 * con selector; si no hay activa, la última realizada; si no hay campañas,
 * se dice así, sin cifras de ejemplo.
 */
export default async function TelefonoEstadisticasPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { campana?: string };
}) {
  const profile = phoneProfile(params.slug);
  if (!profile) notFound();
  const supabase = createClient();
  const [{ data: rubro }, { data: campaigns }, metrics] = await Promise.all([
    supabase.from("rubros").select("name").eq("id", profile.rubroId).maybeSingle(),
    supabase
      .from("campaigns")
      .select("id, name, status, line_id, created_at, started_at")
      .in("area", profile.areas.map((a) => a.value))
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    getProfileMetrics(profile.rubroId),
  ]);

  const list = (campaigns ?? []) as any[];
  const ordered = [...list.filter((c) => c.status === "en_curso"), ...list.filter((c) => c.status !== "en_curso")];
  const selected = ordered.find((c) => c.id === searchParams.campana) ?? ordered[0] ?? null;
  const [cm, { data: line }] = selected
    ? await Promise.all([
        getCampaignMetrics(selected.id),
        selected.line_id
          ? supabase.from("profile_lines").select("label, phone_display").eq("id", selected.line_id).maybeSingle()
          : Promise.resolve({ data: null as any }),
      ])
    : [null, { data: null as any }];
  const basePath = `/telefono/${params.slug}/estadisticas`;

  return (
    <div>
      <PhoneHeader eyebrow={rubro?.name ?? params.slug} title="Estadísticas" backHref="/telefono" />
      <main className="mx-auto max-w-md space-y-5 px-4 py-4">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Campañas</h2>
          {!selected ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
              Este perfil todavía no tiene campañas.
            </p>
          ) : (
            <div className="space-y-3">
              {ordered.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ordered.map((c) => (
                    <Link
                      key={c.id}
                      href={`${basePath}?campana=${c.id}`}
                      aria-current={c.id === selected.id ? "page" : undefined}
                      className="chip-filtro chip-filtro-chico shrink-0"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold text-slate-900">{selected.name}</p>
                <p className="text-xs text-slate-500">
                  {CAMPAIGN_STATUS_LABEL[selected.status] ?? selected.status} · línea{" "}
                  {line ? `${line.label}${line.phone_display ? ` (${line.phone_display})` : ""}` : "sin asignar"}
                </p>
                {!list.some((c) => c.status === "en_curso") && (
                  <p className="text-xs text-slate-400">No hay campañas activas: se muestra la última.</p>
                )}
              </div>
              <CampaignMetricsPanel m={cm} compact />
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Perfil</h2>
          <MetricsPanel metrics={metrics} compact perfil={profile.rubroId} volver={`/telefono/${params.slug}/estadisticas`} />
          {metrics && (
            <p className="mt-2 text-xs text-slate-400">Calculado {new Date(metrics.calculado_en).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23", dateStyle: "short", timeStyle: "short" })}. Mismas cifras que en la computadora.</p>
          )}
        </section>
      </main>
    </div>
  );
}
