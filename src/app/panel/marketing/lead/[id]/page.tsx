import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationThread } from "@/components/inbox/conversation-thread";
import { ANALYSIS_LABEL, OutreachBadge, PriorityBadge } from "@/components/marketing/lead-badges";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  lead_creado: "Cargado desde Google Maps",
  consulta_directa: "Nos escribió directamente",
  analizado: "Análisis completado",
  mensaje_inicial: "Se envió el mensaje inicial",
  respondio: "Respondió",
  repesca_enviada: "Se envió un seguimiento",
  repesca_fallida: "Falló el envío de un seguimiento",
  en_duda: "Quedó en duda / lo ve más adelante",
  aprobado: "Aprobó la propuesta",
  derivado_a_equipo: "Derivado al equipo técnico",
  no_interesado: "No le interesa",
  baja: "Dado de baja (sin respuesta)",
  escalado_a_humano: "Pasado a una persona del equipo",
};

const SEVERITY_COLOR: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-slate-100 text-slate-600",
};

function fmt(date: string) {
  return new Date(date).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function LeadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: lead } = await supabase
    .from("marketing_leads")
    .select("*, contacts(*)")
    .eq("id", params.id)
    .maybeSingle();
  if (!lead) notFound();

  const contact = (lead as any).contacts;

  const [{ data: events }, { data: conversation }] = await Promise.all([
    supabase.from("marketing_events").select("*").eq("lead_id", lead.id).order("created_at", { ascending: true }),
    supabase
      .from("conversations")
      .select("id, ai_enabled")
      .eq("contact_id", contact.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: messages } = conversation
    ? await supabase.from("messages").select("*").eq("conversation_id", conversation.id).order("created_at", { ascending: true })
    : { data: [] as any[] };

  const fromProspect = (messages ?? []).filter((m: any) => m.direction === "entrante");
  const fromUs = (messages ?? []).filter((m: any) => m.direction === "saliente");
  const firstOut = fromUs[0];
  const firstIn = fromProspect[0];
  const replyMinutes =
    firstOut && firstIn && new Date(firstIn.created_at) > new Date(firstOut.created_at)
      ? Math.round((new Date(firstIn.created_at).getTime() - new Date(firstOut.created_at).getTime()) / 60000)
      : null;

  const analysis = (lead.analysis ?? {}) as any;
  const hallazgos: any[] = Array.isArray(analysis.hallazgos) ? analysis.hallazgos : [];
  const maps = (lead.maps_data ?? {}) as any;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/marketing/prospectos" className="text-xs text-slate-400 hover:underline">
          ← Volver a prospectos
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{contact.full_name ?? "Sin nombre"}</h1>
          <PriorityBadge priority={lead.priority} score={lead.lead_score} />
          <OutreachBadge status={lead.outreach_status} />
        </div>
        <p className="text-sm text-slate-500">
          {contact.phone ?? "—"} · {lead.source_kind === "directa" ? "Consulta directa" : "Dato frío"} ·{" "}
          {lead.source_detail ?? "—"}
          {lead.website ? (
            <>
              {" "}
              ·{" "}
              <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {lead.website}
              </a>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-slate-800">Análisis del negocio</h2>
            <p className="mb-3 text-xs text-slate-400">
              {ANALYSIS_LABEL[lead.analysis_status] ?? lead.analysis_status}
              {lead.analyzed_at ? ` · ${fmt(lead.analyzed_at)}` : ""}
              {lead.analysis_error ? ` · ${lead.analysis_error}` : ""}
            </p>
            {lead.summary && <p className="mb-4 text-sm text-slate-700">{lead.summary}</p>}
            {lead.hook && (
              <p className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-medium">Gancho del mensaje inicial:</span> “…notamos que {lead.hook}”
              </p>
            )}
            {hallazgos.length > 0 ? (
              <ul className="space-y-3">
                {hallazgos.map((h, i) => (
                  <li key={i} className="rounded-lg border border-slate-100 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_COLOR[h.severidad] ?? SEVERITY_COLOR.baja}`}>
                        {h.severidad}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{h.problema}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Impacto:</span> {h.impacto}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Mejora:</span> {h.mejora}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              lead.analysis_status === "listo" && <p className="text-sm text-slate-400">No se detectaron problemas importantes.</p>
            )}
            {Array.isArray(analysis.servicios_sugeridos) && analysis.servicios_sugeridos.length > 0 && (
              <p className="mt-4 text-xs text-slate-600">
                <span className="font-medium">Servicios sugeridos:</span> {analysis.servicios_sugeridos.join(", ")}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Google Maps:{" "}
              {[
                maps.rating != null ? `puntaje ${maps.rating}` : null,
                maps.ratingCount != null ? `${maps.ratingCount} reseñas` : null,
                maps.photosCount != null ? `${maps.photosCount} fotos` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "sin datos"}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Conversación</h2>
            {conversation ? (
              <div className="h-[520px] overflow-hidden rounded-lg border border-slate-200">
                <ConversationThread
                  conversationId={conversation.id}
                  aiEnabled={conversation.ai_enabled}
                  contact={{
                    id: contact.id,
                    full_name: contact.full_name,
                    phone: contact.phone,
                    email: contact.email,
                    area: contact.area,
                    status: contact.status,
                    source: contact.source,
                    qualification_data: contact.qualification_data ?? {},
                  }}
                  initialMessages={(messages ?? []) as any}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400">Todavía no hay conversación con este prospecto.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Estadísticas del prospecto</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Mensajes del prospecto</dt><dd>{fromProspect.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Mensajes nuestros</dt><dd>{fromUs.length}</dd></div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tardó en responder</dt>
                <dd>{replyMinutes == null ? "—" : replyMinutes < 90 ? `${replyMinutes} min` : `${Math.round(replyMinutes / 60)} h`}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-slate-500">Seguimientos enviados</dt><dd>{lead.followup_count} de 2</dd></div>
              {lead.next_followup_at && lead.outreach_status === "repesca" && (
                <div className="flex justify-between"><dt className="text-slate-500">Próximo seguimiento</dt><dd>{fmt(lead.next_followup_at)}</dd></div>
              )}
              {lead.closed_reason && (
                <div><dt className="text-slate-500">Motivo de cierre</dt><dd className="text-xs text-slate-700">{lead.closed_reason}</dd></div>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Historial</h2>
            <ol className="space-y-3 border-l border-slate-200 pl-4">
              {(events ?? []).map((e: any) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gold-500" />
                  <p className="text-sm text-slate-800">{EVENT_LABEL[e.event_type] ?? e.event_type}</p>
                  <p className="text-xs text-slate-400">{fmt(e.created_at)}</p>
                  {e.detail?.motivo && <p className="text-xs text-slate-500">{String(e.detail.motivo)}</p>}
                </li>
              ))}
              {(events ?? []).length === 0 && <li className="text-sm text-slate-400">Sin eventos todavía.</li>}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
