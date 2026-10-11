import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { CsvUploader } from "@/components/campanas/csv-uploader";
import { CampaignControls } from "@/components/campanas/campaign-controls";
import { DeleteCampaignButton } from "@/components/campanas/delete-campaign-button";
import { CampaignSetupSection } from "@/components/campanas/campaign-setup-section";
import { CampaignMetricsPanel } from "@/components/campanas/campaign-metrics-panel";
import { RecipientReview } from "@/components/campanas/recipient-review";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { getCampaignMetrics } from "@/lib/campaign-metrics";
import { effectiveSendHours } from "@/lib/horario";
import { statusLabel } from "@/lib/plantillas/catalogo";

const PAGE_SIZE = 100;

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  enviando: "En envío",
  revisar: "A revisar",
  enviado: "Enviado",
  entregado: "Entregado",
  leido: "Leído",
  respondio: "Respondió",
  fallo: "Falló",
  opt_out: "Pidió la baja",
};

const FILTERS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: "todos", label: "Todos", statuses: null },
  { key: "pendientes", label: "Pendientes", statuses: ["pendiente"] },
  { key: "enviados", label: "Con envío", statuses: ["enviado", "entregado", "leido", "respondio", "opt_out"] },
  { key: "respondieron", label: "Respondieron", statuses: ["respondio"] },
  { key: "fallidos", label: "Fallidos", statuses: ["fallo"] },
  { key: "revisar", label: "A revisar", statuses: ["revisar"] },
];

/**
 * Detalle de una campaña, igual para todos los perfiles: configuración
 * (línea y días), cifras con denominador (mismo cálculo que el teléfono),
 * carga de archivo por el flujo único y destinatarios paginados en el
 * servidor (sin el tope de 1.000 filas).
 */
export async function CampaignDetailView({
  campaignId,
  areas,
  backHref,
  basesPath,
  searchParams,
}: {
  campaignId: string;
  /** áreas que puede ver este panel (aislamiento entre perfiles) */
  areas: string[];
  backHref: string;
  basesPath: string | null;
  searchParams: { pagina?: string; estado?: string };
}) {
  const supabase = createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, channels(label)")
    .eq("id", campaignId)
    .in("area", areas)
    .maybeSingle();
  if (!campaign) notFound();

  const filter = FILTERS.find((f) => f.key === searchParams.estado) ?? FILTERS[0];
  const page = pageFromParam(searchParams.pagina);
  let recipientsQuery = supabase
    .from("campaign_contacts")
    .select("id, status, sent_at, error, review_reason, send_uncertain, contact_id, contacts(full_name, phone)", { count: "exact" })
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false, nullsFirst: true })
    .order("priority", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filter.statuses) recipientsQuery = recipientsQuery.in("status", filter.statuses);

  const [{ data: recipients, count }, metrics, { data: line }, { data: template }] = await Promise.all([
    recipientsQuery,
    getCampaignMetrics(campaignId),
    campaign.line_id
      ? supabase.from("profile_lines").select("label, phone_display").eq("id", campaign.line_id).maybeSingle()
      : Promise.resolve({ data: null as any }),
    campaign.template_id
      ? supabase.from("whatsapp_templates").select("name, language, status").eq("id", campaign.template_id).maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);
  const hours = effectiveSendHours(campaign);
  const detailPath = `${backHref}/${campaignId}`;

  return (
    <div>
      <Link href={backHref} className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Volver a campañas
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{campaign.name}</h1>
          <p className="text-sm text-slate-500">
            {(campaign as any).channels?.label} · línea {line ? `${line.label}${line.phone_display ? ` (${line.phone_display})` : ""}` : "sin asignar"} ·
            {template
              ? `plantilla ${template.name} (${template.language}, ${statusLabel(template.status)})`
              : campaign.message_template_name
              ? `plantilla sin elegir del catálogo (escrita antes: ${campaign.message_template_name})`
              : "plantilla sin elegir"}{" "}
            · {campaign.min_send_delay_seconds}-{campaign.max_send_delay_seconds}s entre
            mensajes (variable) · lotes de {campaign.batch_size} · pausa de {Math.round(campaign.batch_pause_seconds / 60)}min entre lotes
            {campaign.daily_send_limit ? ` · máx. ${campaign.daily_send_limit}/día` : ""}
            {" · "}envía de lunes a sábado, de {hours.start} a {hours.end}hs (Arg.)
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CampaignControls campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />
          <DeleteCampaignButton
            campaignId={campaign.id}
            campaignName={campaign.name}
            archived={!!campaign.archived_at}
            redirectTo={backHref}
          />
        </div>
      </div>

      <div className="mb-6">
        <CampaignSetupSection campaignId={campaign.id} />
      </div>

      <div className="mb-6">
        <CampaignMetricsPanel m={metrics} />
      </div>

      {!campaign.archived_at && (
        <div className="mb-6">
          <CsvUploader campaignId={campaign.id} area={campaign.area} basesPath={basesPath} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "todos" ? detailPath : `${detailPath}?estado=${f.key}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium",
              filter.key === f.key ? "border-gold-400 bg-slate-900 text-gold-100" : "border-slate-200 bg-white text-slate-600 hover:border-gold-300"
            )}
          >
            {f.label}
          </Link>
        ))}
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
                <td className="px-4 py-3">
                  {STATUS_LABEL[r.status] ?? r.status}
                  {r.status === "fallo" && r.error ? <span className="block text-[11px] text-red-500">{String(r.error).slice(0, 160)}</span> : null}
                  {r.status === "pendiente" && r.error ? <span className="block text-[11px] text-slate-500">{String(r.error).slice(0, 160)}</span> : null}
                  {r.status === "revisar" ? (
                    <>
                      <span className="block text-[11px] text-amber-800">{String(r.review_reason ?? r.error ?? "").slice(0, 240)}</span>
                      {!campaign.archived_at && <RecipientReview campaignId={campaign.id} recipientId={r.id} uncertain={!!r.send_uncertain} />}
                    </>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-400">{r.sent_at ? new Date(r.sent_at).toLocaleString("es-AR") : "—"}</td>
              </tr>
            ))}
            {(recipients ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  {filter.key === "todos" ? "Todavía no cargaste destinatarios." : "No hay destinatarios en este estado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pager
          basePath={detailPath}
          params={{ estado: filter.key === "todos" ? undefined : filter.key }}
          page={page}
          pageSize={PAGE_SIZE}
          total={count ?? 0}
          unit="destinatarios"
        />
      </div>
    </div>
  );
}
