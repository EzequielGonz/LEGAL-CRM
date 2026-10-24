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
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { agruparErrores, explicarError, leerErrorGuardado, lineaError } from "@/lib/envios/explicacion";

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

  const [{ data: recipients, count }, metrics, { data: line }, { data: template }, { data: conError }] = await Promise.all([
    recipientsQuery,
    getCampaignMetrics(campaignId),
    campaign.line_id
      ? supabase.from("profile_lines").select("label, phone_display").eq("id", campaign.line_id).maybeSingle()
      : Promise.resolve({ data: null as any }),
    campaign.template_id
      ? supabase.from("whatsapp_templates").select("name, language, status").eq("id", campaign.template_id).maybeSingle()
      : Promise.resolve({ data: null as any }),
    // 23/10: por qué fallaron (o quedaron pendientes por un error de Meta), agrupado por número de error.
    supabase
      .from("campaign_contacts")
      .select("error")
      .eq("campaign_id", campaignId)
      .in("status", ["fallo", "pendiente", "revisar"])
      .not("error", "is", null)
      .limit(5000),
  ]);
  // Solo los que traen número de error de Meta (las pausas internas no son errores de envío).
  const gruposError = agruparErrores(((conError ?? []) as any[]).map((r) => r.error).filter((e) => typeof e === "string" && leerErrorGuardado(e).codigo !== null));
  const hours = effectiveSendHours(campaign);
  const detailPath = `${backHref}/${campaignId}`;
  // 20/10: desde cada destinatario se entra a su ficha y a su chat.
  const idsContacto = ((recipients ?? []) as any[]).map((r) => r.contact_id).filter(Boolean);
  const { data: convs } = idsContacto.length
    ? await supabase.from("conversations").select("id, contact_id, updated_at").in("contact_id", idsContacto).order("updated_at", { ascending: false })
    : { data: [] as any[] };
  const chatDe = new Map<string, string>();
  for (const c of (convs ?? []) as any[]) if (!chatDe.has(c.contact_id)) chatDe.set(c.contact_id, c.id);
  const { data: basesCargadas } = await supabase
    .from("imported_bases")
    .select("id, name, file_name, created_rows, total_rows, created_at")
    .eq("area", campaign.area)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  const enlaceChat = (convId: string) => (backHref === "/campanas" ? `/inbox/${convId}` : `/conversacion/${convId}`);

  return (
    <div>
      <Link href={backHref} className="tactil mb-2 inline-flex items-center text-sm font-medium text-slate-700 underline-offset-2 hover:underline">
        ← Volver a campañas
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 [overflow-wrap:anywhere]">{campaign.name}</h1>
          <p className="mt-1 text-sm text-slate-700">
            Estado: <strong className="font-semibold">{CAMPAIGN_STATUS_LABEL[campaign.status] ?? campaign.status}</strong>
            {campaign.status === "borrador" || campaign.status === "pausada" ? " — no envía nada hasta que la lances y lo confirmes." : ""}
          </p>
          {/* 24/10: el motivo real de la pausa, arriba de todo. */}
          {campaign.status === "pausada" && (campaign as any).pause_reason ? (
            <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">Motivo de la pausa: {(campaign as any).pause_reason}</p>
          ) : null}
          {campaign.status === "finalizada" && metrics && metrics.pendientes + (metrics.a_revisar ?? 0) > 0 ? (
            <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              Terminada con {(metrics.pendientes + (metrics.a_revisar ?? 0)).toLocaleString("es-AR")} destinatario(s) sin enviar: no se envían solos.
            </p>
          ) : null}
          {/* Simple: lo que hace falta para poder enviar, en una lista corta. */}
          <ul className="solo-simple mt-2 space-y-1 text-sm text-slate-800" aria-label="Antes de enviar">
            <li><Marca ok={!!line} /> Línea que envía: {line ? `${line.label}${line.phone_display ? ` (${line.phone_display})` : ""}` : "sin asignar"}</li>
            <li><Marca ok={!!template} /> Plantilla: {template ? `${template.name} (${statusLabel(template.status)})` : "sin elegir del catálogo"}</li>
            <li>
              <Marca ok={!!metrics && metrics.prospectos > 0} /> Destinatarios: <span className="tabular-nums">{metrics?.prospectos ?? 0}</span> ·{" "}
              envía de lunes a sábado, de {hours.start} a {hours.end} h
            </li>
          </ul>
          <p className="solo-simple mt-1 text-sm">
            <EnlaceAvanzado href="#campana-config" className="font-medium text-slate-700 underline underline-offset-2">
              Ver ritmo y configuración completa
            </EnlaceAvanzado>
          </p>
          <p className="solo-avanzado mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">
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
        <div className="flex flex-wrap items-start gap-2">
          <CampaignControls campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />
          <span className="solo-avanzado">
          <DeleteCampaignButton
            campaignId={campaign.id}
            campaignName={campaign.name}
            archived={!!campaign.archived_at}
            redirectTo={backHref}
          />
          </span>
        </div>
      </div>

      {/* 24/10: los motivos de falla, antes de la configuración. */}
      {gruposError.length > 0 && (
        <section className="mb-6 rounded-xl border border-red-200 bg-white p-4" aria-labelledby="por-que-fallaron">
          <h2 id="por-que-fallaron" className="text-base font-semibold text-slate-900">Por qué fallaron los envíos</h2>
          <p className="mt-1 text-sm text-slate-600">Agrupado por número de error de Meta (WhatsApp). Incluye los que quedaron pendientes por un problema de la cuenta.</p>
          <ul className="mt-3 space-y-3">
            {gruposError.map((g) => (
              <li key={g.codigo ?? g.titulo} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">
                  {g.codigo !== null ? `Error ${g.codigo} · ` : ""}{g.titulo}{" "}
                  <span className="tabular-nums font-normal text-slate-600">({g.cantidad} {g.cantidad === 1 ? "envío" : "envíos"})</span>
                </p>
                <p className="mt-1 text-slate-700"><strong className="font-semibold">Por qué ocurre:</strong> {g.porque}</p>
                <p className="mt-1 text-slate-700"><strong className="font-semibold">Qué hacer:</strong> {g.queHacer}</p>
                {(g.origen === "cuenta" || g.origen === "plantilla") && (
                  <p className="mt-1 text-xs font-medium text-red-800">Es un problema de la {g.origen === "cuenta" ? "cuenta o la línea" : "plantilla"}, no de los destinatarios.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div id="campana-config" tabIndex={-1} className="mb-6">
        <CampaignSetupSection campaignId={campaign.id} />
      </div>

      <div className="mb-6">
        <CampaignMetricsPanel m={metrics} enlaceRespondieron={`${detailPath}?estado=respondieron#destinatarios`} />
      </div>

      {!campaign.archived_at && (
        <div className="mb-6">
          <CsvUploader
            campaignId={campaign.id}
            area={campaign.area}
            basesPath={basesPath}
            basesCargadas={((basesCargadas ?? []) as any[]).map((b) => ({ id: b.id, nombre: b.name || b.file_name || "Base sin nombre", filas: b.total_rows ?? b.created_rows ?? null, fecha: b.created_at }))}
          />
        </div>
      )}

      <div id="destinatarios" className="mb-3 flex scroll-mt-24 flex-wrap gap-2">
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Enviado</th>
              <th className="px-4 py-3">Abrir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(recipients ?? []).map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.contacts?.full_name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.contacts?.phone}</td>
                <td className="px-4 py-3">
                  {STATUS_LABEL[r.status] ?? r.status}
                  {r.status === "fallo" && r.error ? (
                    <span className="block text-xs text-red-700">
                      <strong className="font-semibold">{lineaError(r.error)}.</strong> {explicarError(r.error).porque}
                    </span>
                  ) : null}
                  {r.status === "pendiente" && r.error ? (
                    <span className="block text-xs text-slate-600">
                      {explicarError(r.error).codigo !== null ? <><strong className="font-semibold">{lineaError(r.error)}.</strong> {explicarError(r.error).queHacer}</> : String(r.error).slice(0, 200)}
                    </span>
                  ) : null}
                  {r.status === "revisar" ? (
                    <>
                      <span className="block text-xs text-amber-900">{String(r.review_reason ?? r.error ?? "").slice(0, 240)}</span>
                      {!campaign.archived_at && <RecipientReview campaignId={campaign.id} recipientId={r.id} uncertain={!!r.send_uncertain} />}
                    </>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600">{r.sent_at ? new Date(r.sent_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23" }) : "—"}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-2">
                    {r.contact_id && (
                      <Link href={`/ficha/${r.contact_id}?volver=${encodeURIComponent(detailPath)}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300">
                        Ficha
                      </Link>
                    )}
                    {r.contact_id && chatDe.get(r.contact_id) && (
                      <Link href={enlaceChat(chatDe.get(r.contact_id)!)} className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white">
                        Chat
                      </Link>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {(recipients ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-600">
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

/** Marca de lista: visible como ✓/✗ y leída como «Listo» / «Falta». */
function Marca({ ok }: { ok: boolean }) {
  return (
    <>
      <span aria-hidden="true" className={ok ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
        {ok ? "✓" : "✗"}
      </span>
      <span className="sr-only">{ok ? "Listo:" : "Falta:"}</span>
    </>
  );
}
