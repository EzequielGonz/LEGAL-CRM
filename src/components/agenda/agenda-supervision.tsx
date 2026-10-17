import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { FichaSection } from "@/components/ficha/ficha-section";
import { AppointmentActions } from "@/components/agenda/appointment-actions";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { ATTENTION_STATE_LABEL, FOLLOWUP_STATE_LABEL } from "@/lib/opportunities";

const PAGE_SIZE = 50;

type Tab = "citas" | "sin_derivar" | "seguimientos" | "atencion";

const TABS: { key: Tab; label: string }[] = [
  { key: "citas", label: "Citas" },
  { key: "sin_derivar", label: "Captados sin derivar" },
  { key: "seguimientos", label: "Seguimientos" },
  { key: "atencion", label: "Atención humana" },
];

const CITA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  ausente: "No asistió",
  cancelada: "Cancelada",
};

/**
 * Supervisión desde Agenda (bloque 1.8): citas, captados sin derivar,
 * seguimientos y atención humana del perfil. Cada pendiente se gestiona acá
 * mismo: al elegirlo se abre su ficha al costado, con las mismas acciones y
 * el mismo historial que en Prospectos, Inbox, Casos y el teléfono (un solo
 * registro por acción).
 */
export async function AgendaSupervision({
  rubroId,
  areas,
  basePath,
  searchParams,
  fichaHref,
  conversationHref,
}: {
  rubroId: string;
  areas: string[];
  /** ruta de esta Agenda (para los enlaces de pestañas y páginas) */
  basePath: string;
  searchParams: { tab?: string; ficha?: string; pagina?: string };
  /** ficha completa de un contacto (ej. "/prospectos" o "/ficha") */
  fichaHref: string;
  /** conversación (Inbox) si el panel la tiene */
  conversationHref?: string | null;
}) {
  const supabase = createClient();
  const tab: Tab = (TABS.find((t) => t.key === searchParams.tab)?.key ?? "citas") as Tab;
  const page = pageFromParam(searchParams.pagina);
  const selected = searchParams.ficha && /^[0-9a-f-]{36}$/i.test(searchParams.ficha) ? searchParams.ficha : null;
  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  const desdeCitas = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const counts = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("area", areas)
      .gte("starts_at", desdeCitas)
      .in("status", ["pendiente", "confirmada"]),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("rubro_id", rubroId)
      .eq("capture_state", "captado")
      .eq("derivation_state", "no_derivado"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("rubro_id", rubroId)
      .in("followup_state", ["activo", "caido"]),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("rubro_id", rubroId)
      .in("attention_state", ["requiere_humano", "humano_en_curso"]),
  ]);
  const countByTab: Record<Tab, number> = {
    citas: counts[0].count ?? 0,
    sin_derivar: counts[1].count ?? 0,
    seguimientos: counts[2].count ?? 0,
    atencion: counts[3].count ?? 0,
  };

  type Row = { key: string; contactId: string; name: string | null; phone: string | null; detail: string; when: string | null; appointment?: { id: string; status: string } };
  let rows: Row[] = [];
  let total = 0;

  if (tab === "citas") {
    const { data, count } = await supabase
      .from("appointments")
      // «*»: incluye el tipo de cita (0203) sin fallar si todavía no existe.
      .select("*, contacts(full_name, phone)", { count: "exact" })
      .in("area", areas)
      .gte("starts_at", desdeCitas)
      .in("status", ["pendiente", "confirmada"])
      .order("starts_at", { ascending: true })
      .range(from, to);
    total = count ?? 0;
    rows = (data ?? []).map((a: any) => ({
      key: a.id,
      contactId: a.contact_id,
      name: a.contacts?.full_name ?? null,
      phone: a.contacts?.phone ?? null,
      detail:
        (a.kind === "ia" ? "Revisión con la IA (no usa turnos del equipo) · " : "") +
        (new Date(a.starts_at) < new Date() && ["pendiente", "confirmada"].includes(a.status)
          ? `${CITA_LABEL[a.status]} · ya pasó: cargar el resultado`
          : CITA_LABEL[a.status] ?? a.status),
      when: a.starts_at,
      appointment: { id: a.id, status: a.status },
    }));
  } else {
    let q = supabase
      .from("opportunities")
      .select(
        "id, contact_id, captured_at, followup_state, followup_next_at, followup_reason, attention_state, updated_at, contacts!inner(full_name, phone)",
        { count: "exact" }
      )
      .eq("rubro_id", rubroId)
      .range(from, to);
    if (tab === "sin_derivar") q = q.eq("capture_state", "captado").eq("derivation_state", "no_derivado").order("captured_at", { ascending: true, nullsFirst: false });
    if (tab === "seguimientos") q = q.in("followup_state", ["activo", "caido"]).order("followup_next_at", { ascending: true, nullsFirst: false });
    if (tab === "atencion") q = q.in("attention_state", ["requiere_humano", "humano_en_curso"]).order("updated_at", { ascending: true });
    const { data, count } = await q;
    total = count ?? 0;
    rows = (data ?? []).map((o: any) => ({
      key: o.id,
      contactId: o.contact_id,
      name: o.contacts?.full_name ?? null,
      phone: o.contacts?.phone ?? null,
      detail:
        tab === "sin_derivar"
          ? "Captado · No derivado"
          : tab === "seguimientos"
            ? `${FOLLOWUP_STATE_LABEL[o.followup_state] ?? o.followup_state}${o.followup_reason ? ` · ${o.followup_reason}` : ""}`
            : ATTENTION_STATE_LABEL[o.attention_state] ?? o.attention_state,
      when: tab === "sin_derivar" ? o.captured_at : tab === "seguimientos" ? o.followup_next_at : o.updated_at,
    }));
  }

  const href = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  let selectedContact: { full_name: string | null; phone: string | null; conversations: { id: string }[] } | null = null;
  if (selected) {
    const { data } = await supabase
      .from("contacts")
      .select("full_name, phone, rubro_id, conversations(id)")
      .eq("id", selected)
      .eq("rubro_id", rubroId)
      .maybeSingle();
    selectedContact = (data as any) ?? null;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={href({ tab: t.key === "citas" ? undefined : t.key })}
            aria-current={tab === t.key ? "page" : undefined}
            className={clsx(
              "tactil inline-flex items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
              tab === t.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            )}
          >
            {t.label} <span className="tabular-nums">({countByTab[t.key].toLocaleString("es-AR")})</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className={clsx("min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white", selectedContact ? "lg:col-span-3" : "lg:col-span-5")}>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">{tab === "citas" ? "Cita" : "Estado"}</th>
                <th className="px-4 py-3">{tab === "citas" ? "Fecha" : tab === "seguimientos" ? "Próximo" : "Desde"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.key} className={clsx(selected === r.contactId && "bg-gold-50/40")}>
                  <td className="px-4 py-2">
                    <Link
                      href={href({ tab: tab === "citas" ? undefined : tab, ficha: r.contactId, pagina: page > 1 ? String(page) : undefined })}
                      scroll={false}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {r.name ?? "Sin nombre"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 tabular-nums text-slate-700">{r.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-slate-800">
                    {r.detail}
                    {r.appointment && (
                      <div className="mt-1">
                        <AppointmentActions appointmentId={r.appointment.id} status={r.appointment.status} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm tabular-nums text-slate-700">{r.when ? new Date(r.when).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-600">
                    No hay pendientes en esta sección.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pager
            basePath={basePath}
            params={{ tab: tab === "citas" ? undefined : tab }}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            unit="pendientes"
          />
        </div>

        {selectedContact && selected && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{selectedContact.full_name ?? "Sin nombre"}</p>
                <p className="text-sm tabular-nums text-slate-700">{selectedContact.phone ?? "—"}</p>
              </div>
              <Link href={href({ tab: tab === "citas" ? undefined : tab, pagina: page > 1 ? String(page) : undefined })} scroll={false} className="tactil inline-flex items-center px-2 text-sm font-medium text-slate-700 underline-offset-2 hover:underline">
                Cerrar
              </Link>
            </div>
            {conversationHref && (selectedContact.conversations ?? []).length > 0 && (
              <Link href={`${conversationHref}/${selectedContact.conversations[0].id}`} className="tactil mb-3 inline-flex items-center text-sm font-medium text-slate-900 underline underline-offset-2">
                Ver conversación →
              </Link>
            )}
            <FichaSection contactId={selected} compact fullHref={`${fichaHref}/${selected}`} />
          </div>
        )}
      </div>
    </div>
  );
}
