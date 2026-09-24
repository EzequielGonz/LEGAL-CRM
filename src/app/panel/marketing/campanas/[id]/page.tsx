import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CsvUploader } from "@/components/campanas/csv-uploader";
import { CampaignControls } from "@/components/campanas/campaign-controls";
import { DeleteCampaignButton } from "@/components/campanas/delete-campaign-button";
import { getCampaignFunnelCounts } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  entregado: "Entregado",
  leido: "Leído",
  respondio: "Respondió",
  fallo: "Falló",
  opt_out: "Opt-out",
};

export default async function CampaignDetailMarketingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // eq("area", "marketing") además del id: evita que, poniendo a mano la
  // URL de una campaña de otro rubro, se pueda entrar a verla/borrarla
  // desde este panel.
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, channels(label)")
    .eq("id", params.id)
    .eq("area", "marketing")
    .single();

  if (!campaign) notFound();

  const [{ data: recipients }, funnel] = await Promise.all([
    supabase
      .from("campaign_contacts")
      .select("*, contacts(full_name, phone)")
      .eq("campaign_id", params.id)
      .order("sent_at", { ascending: false, nullsFirst: true })
      .limit(200),
    getCampaignFunnelCounts(supabase, params.id),
  ]);

  return (
    <div>
      <Link
        href="/panel/marketing/campanas"
        className="mb-4 inline-block text-sm text-slate-500 hover:underline"
      >
        ← Volver a campañas
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{campaign.name}</h1>
          <p className="text-sm text-slate-500">
            {(campaign as any).channels?.label} · plantilla {campaign.message_template_name} ·{" "}
            {campaign.min_send_delay_seconds}-{campaign.max_send_delay_seconds}s entre mensajes
            (variable) · lotes de {campaign.batch_size} · pausa de{" "}
            {Math.round(campaign.batch_pause_seconds / 60)}min entre lotes
            {campaign.daily_send_limit ? ` · máx. ${campaign.daily_send_limit}/día` : ""}
            {" · "}envía de {campaign.send_window_start_hour} a {campaign.send_window_end_hour}hs
            (Arg.)
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CampaignControls
            campaignId={campaign.id}
            campaignName={campaign.name}
            status={campaign.status}
          />
          <DeleteCampaignButton
            campaignId={campaign.id}
            campaignName={campaign.name}
            redirectTo="/panel/marketing/campanas"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-7">
        {[
          ["Total", funnel.total, "text-slate-900"],
          ["Enviados", funnel.enviados, "text-blue-600"],
          ["Entregados", funnel.entregados, "text-blue-600"],
          ["Leídos", funnel.leidos, "text-blue-600"],
          ["Respondieron", funnel.respondieron, "text-indigo-600"],
          ["Calificados", funnel.calificados, "text-teal-600"],
          ["Agendados", funnel.agendados, "text-green-600"],
        ].map(([label, value, color]) => (
          <div
            key={label as string}
            className="rounded-xl border border-slate-200 bg-white p-3 text-center"
          >
            <p className="text-[11px] uppercase text-slate-400">{label}</p>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      {(funnel.fallidos > 0 || funnel.noCalifica > 0) && (
        <p className="mb-6 text-xs text-slate-400">
          {funnel.fallidos > 0 && `${funnel.fallidos} envíos fallaron. `}
          {funnel.noCalifica > 0 && `${funnel.noCalifica} no calificaron.`}
        </p>
      )}

      <div className="mb-6">
        <CsvUploader campaignId={campaign.id} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Enviado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(recipients ?? []).map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.contacts?.full_name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.contacts?.phone}</td>
                <td className="px-4 py-3">{STATUS_LABEL[r.status]}</td>
                <td className="px-4 py-3 text-slate-400">
                  {r.sent_at ? new Date(r.sent_at).toLocaleString("es-AR") : "—"}
                </td>
              </tr>
            ))}
            {(recipients ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Todavía no cargaste destinatarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
