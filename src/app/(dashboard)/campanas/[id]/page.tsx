import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CsvUploader } from "@/components/campanas/csv-uploader";
import { CampaignControls } from "@/components/campanas/campaign-controls";

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

function buildFunnel(rows: { status: string; contacts: { status: string } | null }[]) {
  const total = rows.length;
  const enviados = rows.filter((r) =>
    ["enviado", "entregado", "leido", "respondio"].includes(r.status)
  ).length;
  const entregados = rows.filter((r) => ["entregado", "leido", "respondio"].includes(r.status)).length;
  const leidos = rows.filter((r) => ["leido", "respondio"].includes(r.status)).length;
  const respondieron = rows.filter((r) => r.status === "respondio").length;
  const fallidos = rows.filter((r) => r.status === "fallo").length;

  const contactStatuses = rows.map((r) => r.contacts?.status).filter(Boolean) as string[];
  const calificados = contactStatuses.filter((s) =>
    ["calificado", "agendado", "cerrado_ganado"].includes(s)
  ).length;
  const agendados = contactStatuses.filter((s) => ["agendado", "cerrado_ganado"].includes(s)).length;
  const noCalifica = contactStatuses.filter((s) =>
    ["no_califica", "cerrado_perdido"].includes(s)
  ).length;

  return { total, enviados, entregados, leidos, respondieron, fallidos, calificados, agendados, noCalifica };
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, channels(label)")
    .eq("id", params.id)
    .single();

  if (!campaign) notFound();

  const [{ data: recipients }, { data: allForFunnel }] = await Promise.all([
    supabase
      .from("campaign_contacts")
      .select("*, contacts(full_name, phone)")
      .eq("campaign_id", params.id)
      .order("sent_at", { ascending: false, nullsFirst: true })
      .limit(200),
    supabase
      .from("campaign_contacts")
      .select("status, contacts(status)")
      .eq("campaign_id", params.id)
      .limit(20000),
  ]);

  const funnel = buildFunnel((allForFunnel ?? []) as any);

  return (
    <div>
      <Link href="/campanas" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Volver a campañas
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{campaign.name}</h1>
          <p className="text-sm text-slate-500">
            {(campaign as any).channels?.label} · plantilla {campaign.message_template_name} ·{" "}
            {campaign.send_delay_seconds}s entre envíos
            {campaign.daily_send_limit ? ` · máx. ${campaign.daily_send_limit}/día` : ""}
          </p>
        </div>
        <CampaignControls campaignId={campaign.id} status={campaign.status} />
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
          <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
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
