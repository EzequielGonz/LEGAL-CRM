import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import Link from "next/link";
import { ANALYSIS_LABEL, OutreachBadge, PriorityBadge } from "./lead-badges";
import { ETAPA_LABEL, type EtapaVenta } from "@/lib/marketing/venta";

export interface LeadRow {
  id: string;
  source_kind: string;
  source_detail: string | null;
  analysis_status: string;
  lead_score: number | null;
  priority: string | null;
  hook: string | null;
  summary: string | null;
  outreach_status: string;
  followup_count: number;
  next_followup_at: string | null;
  last_inbound_at: string | null;
  created_at: string;
  contacts: { full_name: string | null; phone: string | null } | null;
  /** Desde la migración 0311 (venta consultiva). */
  sale_stage?: string | null;
  contact_id?: string;
}

function fmt(date: string | null) {
  return date
    ? new Date(date).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";
}

/** Tabla de leads de Marketing. `mode` cambia las columnas que se muestran. */
export function LeadList({
  leads,
  mode,
  emptyText,
}: {
  leads: LeadRow[];
  mode: "prospectos" | "seguimiento" | "directas";
  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Negocio</th>
            <th className="px-4 py-3">Oportunidad</th>
            <th className="px-4 py-3">{mode === "directas" ? "Origen" : "Lo que detectó el análisis"}</th>
            <th className="px-4 py-3">Estado</th>
            {mode === "seguimiento" && <th className="px-4 py-3">Seguimiento</th>}
            <th className="px-4 py-3">Última respuesta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 align-top">
                <Link href={`/panel/marketing/lead/${l.id}`} className="font-medium text-slate-900 hover:underline">
                  {l.contacts?.full_name ?? "Sin nombre"}
                </Link>
                <p className="text-xs text-slate-400">{l.contacts?.phone ?? "—"}</p>
              </td>
              <td className="px-4 py-3 align-top">
                {l.analysis_status === "listo" ? (
                  <PriorityBadge priority={l.priority} score={l.lead_score} />
                ) : (
                  <span className="text-xs text-slate-400">{ANALYSIS_LABEL[l.analysis_status] ?? l.analysis_status}</span>
                )}
              </td>
              <td className="max-w-sm px-4 py-3 align-top text-xs text-slate-600">
                {mode === "directas" ? (
                  <span className="font-medium text-slate-700">{l.source_detail ?? "—"}</span>
                ) : l.hook ? (
                  <>Detectamos que {l.hook}.</>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <OutreachBadge status={l.outreach_status} />
                {l.sale_stage && l.sale_stage !== "apertura" && (
                  <span className="mt-1 block text-xs font-medium text-slate-700">{ETAPA_LABEL[l.sale_stage as EtapaVenta] ?? l.sale_stage}</span>
                )}
                {l.contact_id && (
                  <EnlaceDetalle href={`/ficha/${l.contact_id}`} className="mt-1 block text-xs text-slate-600 underline">
                    Ficha y conversación
                  </EnlaceDetalle>
                )}
              </td>
              {mode === "seguimiento" && (
                <td className="px-4 py-3 align-top text-xs text-slate-600">
                  {/* Sistema anterior (antes de la Etapa 2): solo historial, ya no envía. */}
                  {l.outreach_status === "repesca" ? (
                    <>Sistema anterior: {l.followup_count} de 2 enviados. Ya no envía: sigue el circuito general.</>
                  ) : (
                    "Cerrado por el sistema anterior"
                  )}
                </td>
              )}
              <td className="px-4 py-3 align-top text-xs text-slate-400">{fmt(l.last_inbound_at)}</td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={mode === "seguimiento" ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// «*» y no una lista fija: así la pantalla funciona antes y después de la
// migración 0311 (etapa de venta).
export const LEAD_COLUMNS = "*, contacts(full_name, phone)";
