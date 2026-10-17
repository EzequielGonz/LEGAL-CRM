import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewCampaignForm } from "@/components/campanas/new-campaign-form";
import { DeleteCampaignButton } from "@/components/campanas/delete-campaign-button";
import { ArchivedToggle } from "@/components/ui/archived-toggle";
import { ResumenSeccion } from "@/components/nivel/resumen-seccion";
import { getCampaignFunnelCounts } from "@/lib/campaigns";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";

/** Qué significa cada estado, en palabras simples. */
const QUE_HACE: Record<string, string> = {
  borrador: "Preparada: no envía nada hasta que la lances.",
  en_curso: "Enviando, con el ritmo configurado.",
  pausada: "Pausada: no envía nada.",
  finalizada: "Terminó: no quedan mensajes por enviar.",
};

/**
 * Campañas de un perfil (rediseño 17/10, bloque 3): una sola vista para los
 * cuatro perfiles. Simple: en qué está cada campaña y qué significa; crear
 * una campaña solo la prepara. Avanzado: además la plantilla, archivar y
 * las archivadas. Lanzar o reanudar se hace en el detalle y siempre pide
 * confirmación aparte.
 */
export async function CampanasListView({
  areas,
  channelArea,
  rubroId,
  basePath,
  perfilNombre,
  searchParams,
}: {
  areas: string[];
  channelArea: string;
  rubroId: string;
  basePath: string;
  perfilNombre: string;
  searchParams: { archivadas?: string };
}) {
  const verArchivadas = searchParams?.archivadas === "1";
  const supabase = createClient();
  const [{ data: campaigns, error }, { data: channels }, { data: campaignLines }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .filter("archived_at", verArchivadas ? "not.is" : "is", null)
      .in("area", areas)
      .order("created_at", { ascending: false }),
    supabase.from("channels").select("id, label").eq("area", channelArea).eq("type", "whatsapp"),
    supabase
      .from("profile_lines")
      .select("id, label")
      .eq("rubro_id", rubroId)
      .eq("active", true)
      .eq("use_for_campaigns", true)
      .order("created_at"),
  ]);
  const funnels = new Map(
    await Promise.all((campaigns ?? []).map(async (c: any) => [c.id, await getCampaignFunnelCounts(supabase, c.id)] as const))
  );
  const cuenta = (estado: string) => (campaigns ?? []).filter((c: any) => c.status === estado).length;
  const enCurso = cuenta("en_curso");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">Campañas</h1>
          <p className="mt-1 text-sm text-slate-600">Conversaciones que se inician con una base cargada — {perfilNombre}.</p>
        </div>
        <span className={verArchivadas ? "" : "solo-avanzado"}>
          <ArchivedToggle basePath={basePath} showing={verArchivadas} />
        </span>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          No se pudieron leer las campañas. No es que no haya: volvé a intentar.
        </p>
      ) : null}

      {!verArchivadas ? (
        <ResumenSeccion
          id="camp"
          estado={
            (campaigns ?? []).length === 0
              ? "Todavía no hay campañas"
              : enCurso
              ? `${enCurso} campaña(s) enviando ahora`
              : "Ninguna campaña está enviando"
          }
          detalle={
            <p>
              {cuenta("borrador")} preparada(s) · {cuenta("pausada")} pausada(s) · {cuenta("finalizada")} terminada(s). Crear una campaña solo la
              prepara: los mensajes salen recién cuando la lanzás y lo confirmás.
            </p>
          }
          tono={enCurso ? "atencion" : "info"}
        />
      ) : null}

      {!verArchivadas ? (
        <div>
          <NewCampaignForm channels={channels ?? []} lines={campaignLines ?? []} redirectBase={basePath} />
        </div>
      ) : null}

      <ul className="space-y-3" aria-label="Campañas">
        {(campaigns ?? []).map((c: any) => {
          const f = funnels.get(c.id);
          return (
            <li key={c.id} className="card-lift flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="min-w-0 font-medium text-slate-900 [overflow-wrap:anywhere]">
                    <Link href={`${basePath}/${c.id}`} className="underline-offset-2 hover:underline">
                      {c.name}
                    </Link>
                  </h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}</span>
                </div>
                <p className="text-sm text-slate-700">{QUE_HACE[c.status] ?? ""}</p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="tabular-nums">{f?.enviados ?? 0}</span> de <span className="tabular-nums">{f?.total ?? 0}</span> enviados ·{" "}
                  <span className="tabular-nums">{f?.respondieron ?? 0}</span> respondieron · <span className="tabular-nums">{f?.agendados ?? 0}</span> agendados
                </p>
                <p className="solo-avanzado mt-1 text-xs text-slate-600 [overflow-wrap:anywhere]">
                  Plantilla {c.message_template_name ?? "sin elegir"}
                  {c.message_template_name && !c.template_id ? " (sin confirmar en el catálogo)" : ""}
                </p>
              </div>
              <span className="solo-avanzado shrink-0">
                <DeleteCampaignButton campaignId={c.id} campaignName={c.name} archived={!!c.archived_at} />
              </span>
            </li>
          );
        })}
        {!error && (campaigns ?? []).length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-700">
            {verArchivadas ? "No hay campañas archivadas." : `Todavía no creaste ninguna campaña de ${perfilNombre}.`}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
