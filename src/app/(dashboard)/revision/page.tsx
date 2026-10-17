import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { INCIDENCE_LABEL, QUARANTINE_REASON_LABEL, summarizeQuarantine } from "@/lib/revision";
import { DETENTION_LABEL, type DetentionMotive } from "@/lib/detention";
import { ReviewAction } from "@/components/revision/review-action";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { AdjuntosLista } from "@/components/adjuntos/adjuntos-lista";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Tab = "incidencias" | "detenciones" | "retenidos" | "adjuntos";

/**
 * Revisión: incidencias de la migración y de la operación, detenciones
 * vigentes, mensajes retenidos por seguridad y archivos recibidos que
 * todavía no se guardaron. Todo se resuelve con una nota; nada se borra.
 */
export default async function RevisionPage({
  searchParams,
}: {
  searchParams: { vista?: string; estado?: string; tipo?: string; pagina?: string };
}) {
  const tab: Tab =
    searchParams.vista === "detenciones" || searchParams.vista === "retenidos" || searchParams.vista === "adjuntos"
      ? searchParams.vista
      : "incidencias";
  const page = pageFromParam(searchParams.pagina);
  const supabase = createClient();

  const [{ count: openIncidences }, { count: activeDetentions }, { count: pendingQuarantine }, { count: unsavedAttachments }] =
    await Promise.all([
      supabase.from("incidences").select("id", { count: "exact", head: true }).eq("status", "abierta"),
      supabase.from("contact_detentions").select("id", { count: "exact", head: true }).eq("status", "vigente"),
      supabase.from("webhook_quarantine").select("id", { count: "exact", head: true }).is("reviewed_at", null),
      supabase.from("message_attachments").select("id", { count: "exact", head: true }).in("status", ["pendiente", "error"]),
    ]);

  const tabs: { key: Tab; label: string; count: number | null }[] = [
    { key: "incidencias", label: "Incidencias abiertas", count: openIncidences },
    { key: "detenciones", label: "Detenciones vigentes", count: activeDetentions },
    { key: "retenidos", label: "Mensajes retenidos", count: pendingQuarantine },
    { key: "adjuntos", label: "Archivos sin guardar", count: unsavedAttachments },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Revisión</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lo que necesita la decisión de una persona. Cada acción pide una nota y queda registrada.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/revision?vista=${t.key}`}
            className={clsx(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-gold-400 bg-slate-900 text-gold-100"
                : "border-slate-200 bg-white text-slate-600 hover:border-gold-300"
            )}
          >
            {t.label} <span className="ml-1 opacity-70">{(t.count ?? 0).toLocaleString("es-AR")}</span>
          </Link>
        ))}
      </div>

      {tab === "incidencias" && <Incidencias searchParams={searchParams} page={page} />}
      {tab === "detenciones" && <Detenciones searchParams={searchParams} page={page} />}
      {tab === "retenidos" && <Retenidos searchParams={searchParams} page={page} />}
      {tab === "adjuntos" && <Adjuntos searchParams={searchParams} page={page} />}
    </div>
  );
}

async function Incidencias({
  searchParams,
  page,
}: {
  searchParams: { estado?: string; tipo?: string };
  page: number;
}) {
  const supabase = createClient();
  const estado = searchParams.estado === "todas" ? null : searchParams.estado === "cerradas" ? "cerradas" : "abierta";

  let query = supabase
    .from("incidences")
    .select("id, kind, status, detail, affected_count, created_at, created_by, resolution_note, resolved_at, conversation_id, contact_id, contacts(full_name, phone)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (estado === "abierta") query = query.eq("status", "abierta");
  if (estado === "cerradas") query = query.neq("status", "abierta");
  if (searchParams.tipo && INCIDENCE_LABEL[searchParams.tipo]) query = query.eq("kind", searchParams.tipo);

  const { data: rows, count } = await query;

  return (
    <div>
      <form action="/revision" method="GET" className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input type="hidden" name="vista" value="incidencias" />
        <div>
          <label htmlFor="revision-estado" className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
          <select id="revision-estado" name="estado" defaultValue={searchParams.estado ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold">
            <option value="">Abiertas</option>
            <option value="cerradas">Resueltas o descartadas</option>
            <option value="todas">Todas</option>
          </select>
        </div>
        <div>
          <label htmlFor="revision-tipo" className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select id="revision-tipo" name="tipo" defaultValue={searchParams.tipo ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold">
            <option value="">Todos</option>
            {Object.entries(INCIDENCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-gold">
          Filtrar
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {(rows ?? []).map((r: any) => (
            <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {INCIDENCE_LABEL[r.kind] ?? r.kind}
                  {r.affected_count != null && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {Number(r.affected_count).toLocaleString("es-AR")} contactos
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{r.detail?.texto ?? ""}</p>
                {r.contacts && (
                  <p className="mt-1 text-xs text-slate-500">
                    {r.contact_id ? (
                      <EnlaceDetalle href={`/prospectos/${r.contact_id}`} className="font-medium text-slate-700 hover:underline">
                        {r.contacts.full_name ?? "Sin nombre"}
                      </EnlaceDetalle>
                    ) : null}{" "}
                    · {r.contacts.phone ?? "—"}
                    {r.conversation_id && (
                      <>
                        {" · "}
                        <EnlaceDetalle href={`/inbox/${r.conversation_id}`} className="text-slate-700 hover:underline">
                          Ver conversación
                        </EnlaceDetalle>
                      </>
                    )}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  {new Date(r.created_at).toLocaleString("es-AR")} · origen: {r.created_by}
                  {r.status !== "abierta" && r.resolution_note ? ` · ${r.status}: ${r.resolution_note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-xs">
                {r.status === "abierta" ? (
                  <>
                    <ReviewAction endpoint={`/api/revision/incidencias/${r.id}`} extra={{ accion: "resolver" }} label="Resuelta" />
                    <ReviewAction endpoint={`/api/revision/incidencias/${r.id}`} extra={{ accion: "descartar" }} label="Descartar" tone="plain" />
                  </>
                ) : (
                  <ReviewAction
                    endpoint={`/api/revision/incidencias/${r.id}`}
                    extra={{ accion: "reabrir" }}
                    label="Reabrir"
                    tone="plain"
                    noteRequired={false}
                    notePlaceholder="Motivo (opcional)"
                  />
                )}
              </div>
            </li>
          ))}
          {(rows ?? []).length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">No hay incidencias con estos filtros.</li>}
        </ul>
        <Pager basePath="/revision" params={{ vista: "incidencias", estado: searchParams.estado, tipo: searchParams.tipo }} page={page} pageSize={PAGE_SIZE} total={count ?? 0} unit="incidencias" />
      </div>
    </div>
  );
}

async function Detenciones({ searchParams, page }: { searchParams: { estado?: string }; page: number }) {
  const supabase = createClient();
  const vigentes = searchParams.estado !== "levantadas";
  const { data: rows, count } = await supabase
    .from("contact_detentions")
    .select("id, motive, motives, minor_reported, source, status, created_at, lift_reason, lifted_at, contact_id, contacts(full_name, phone)", { count: "exact" })
    .eq("status", vigentes ? "vigente" : "levantada")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        <Link href="/revision?vista=detenciones" className={clsx(vigentes ? "font-semibold text-slate-900" : "text-slate-500 hover:underline")}>
          Vigentes
        </Link>
        <Link href="/revision?vista=detenciones&estado=levantadas" className={clsx(!vigentes ? "font-semibold text-slate-900" : "text-slate-500 hover:underline")}>
          Levantadas
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {(rows ?? []).map((d: any) => {
            const others = (d.motives ?? []).filter((m: string) => m !== d.motive);
            const hard = d.motive === "no_contacto" || d.minor_reported;
            return (
              <li key={d.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {DETENTION_LABEL[d.motive as DetentionMotive] ?? d.motive}
                    {d.minor_reported && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Número de una menor</span>}
                  </p>
                  {others.length > 0 && (
                    <p className="text-xs text-slate-500">
                      También: {others.map((m: string) => DETENTION_LABEL[m as DetentionMotive] ?? m).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {d.contact_id ? (
                      <EnlaceDetalle href={`/prospectos/${d.contact_id}`} className="font-medium text-slate-700 hover:underline">
                        {d.contacts?.full_name ?? "Sin nombre"}
                      </EnlaceDetalle>
                    ) : (
                      "Contacto"
                    )}{" "}
                    · {d.contacts?.phone ?? "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(d.created_at).toLocaleString("es-AR")} · origen: {d.source}
                    {d.status === "levantada" && d.lift_reason ? ` · levantada: ${d.lift_reason}` : ""}
                  </p>
                </div>
                {d.status === "vigente" && (
                  <div className="flex shrink-0 sm:max-w-xs">
                    <ReviewAction
                      endpoint={`/api/revision/detenciones/${d.id}/levantar`}
                      noteField="motivo"
                      notePlaceholder="Motivo para levantarla"
                      label="Levantar"
                      tone={hard ? "danger" : "plain"}
                      confirmWord={hard ? "LEVANTAR" : undefined}
                    />
                  </div>
                )}
              </li>
            );
          })}
          {(rows ?? []).length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">No hay detenciones {vigentes ? "vigentes" : "levantadas"}.</li>}
        </ul>
        <Pager basePath="/revision" params={{ vista: "detenciones", estado: searchParams.estado }} page={page} pageSize={PAGE_SIZE} total={count ?? 0} unit="detenciones" />
      </div>
    </div>
  );
}

async function Retenidos({ searchParams, page }: { searchParams: { estado?: string }; page: number }) {
  const supabase = createClient();
  const pendientes = searchParams.estado !== "revisados";
  let query = supabase
    .from("webhook_quarantine")
    .select("id, received_at, source, reason, account_id, payload, detail, reviewed_at, reviewed_action, note", { count: "exact" })
    .order("received_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  query = pendientes ? query.is("reviewed_at", null) : query.not("reviewed_at", "is", null);
  const { data: rows, count } = await query;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        <Link href="/revision?vista=retenidos" className={clsx(pendientes ? "font-semibold text-slate-900" : "text-slate-500 hover:underline")}>
          Pendientes
        </Link>
        <Link href="/revision?vista=retenidos&estado=revisados" className={clsx(!pendientes ? "font-semibold text-slate-900" : "text-slate-500 hover:underline")}>
          Revisados
        </Link>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Eventos de Meta que no se procesaron solos: sin firma válida, de una línea sin perfil o con un error al guardarse.
        Reprocesar los pasa por el circuito normal (la pausa general y las detenciones siguen aplicando).
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {(rows ?? []).map((q: any) => {
            const s = summarizeQuarantine(q.source, q.payload);
            return (
              <li key={q.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {QUARANTINE_REASON_LABEL[q.reason] ?? q.reason}
                    <span className="ml-2 text-xs font-normal uppercase text-slate-400">{q.source}</span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {s.remitente ? `${s.remitente}: ` : ""}
                    {s.texto ?? "(sin texto)"}
                    {s.cantidad > 1 ? ` (+${s.cantidad - 1})` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {new Date(q.received_at).toLocaleString("es-AR")}
                    {q.account_id ? ` · cuenta ${q.account_id}` : ""}
                    {q.detail ? ` · ${q.detail}` : ""}
                    {q.reviewed_action ? ` · ${q.reviewed_action}${q.note ? `: ${q.note}` : ""}` : ""}
                  </p>
                </div>
                {!q.reviewed_at && (
                  <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-xs">
                    <ReviewAction endpoint={`/api/revision/retenidos/${q.id}`} extra={{ accion: "reprocesar" }} label="Reprocesar" />
                    <ReviewAction endpoint={`/api/revision/retenidos/${q.id}`} extra={{ accion: "descartar" }} label="Descartar" tone="plain" />
                  </div>
                )}
              </li>
            );
          })}
          {(rows ?? []).length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">No hay mensajes {pendientes ? "pendientes" : "revisados"}.</li>}
        </ul>
        <Pager basePath="/revision" params={{ vista: "retenidos", estado: searchParams.estado }} page={page} pageSize={PAGE_SIZE} total={count ?? 0} unit="eventos" />
      </div>
    </div>
  );
}

async function Adjuntos({ searchParams, page }: { searchParams: { estado?: string }; page: number }) {
  const supabase = createClient();
  const filtro = searchParams.estado === "todos" ? "todos" : searchParams.estado === "no_guardados" ? "no_guardados" : "sin_guardar";
  let query = supabase
    .from("message_attachments")
    .select("id, kind, status, file_name, size_bytes, received_at, expires_at, last_error, conversation_id, contact_id", { count: "exact" })
    .order("received_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filtro === "sin_guardar") query = query.in("status", ["pendiente", "error"]);
  if (filtro === "no_guardados") query = query.in("status", ["vencido", "demasiado_grande"]);
  const { data: rows, count } = await query;

  const link = (estado: string | null, label: string, active: boolean) => (
    <Link
      href={`/revision?vista=adjuntos${estado ? `&estado=${estado}` : ""}`}
      className={clsx(active ? "font-semibold text-slate-900" : "text-slate-500 hover:underline")}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        {link(null, "Sin guardar", filtro === "sin_guardar")}
        {link("no_guardados", "Vencidos o demasiado pesados", filtro === "no_guardados")}
        {link("todos", "Todos", filtro === "todos")}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Audios, fotos, videos y documentos que mandaron las personas. Se guardan solos al llegar; lo que quedó sin guardar se
        puede guardar desde acá mientras Meta lo permita (7 días en WhatsApp). No se transcribe ni se responde nada.
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <AdjuntosLista rows={(rows ?? []) as any[]} showConversation />
        <Pager basePath="/revision" params={{ vista: "adjuntos", estado: searchParams.estado }} page={page} pageSize={PAGE_SIZE} total={count ?? 0} unit="archivos" />
      </div>
    </div>
  );
}
