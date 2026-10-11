import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ATTENTION_STATE_LABEL,
  CAPTURE_STATE_LABEL,
  CONTACT_STATE_LABEL,
  DERIVATION_STATE_LABEL,
  FOLLOWUP_STATE_LABEL,
} from "@/lib/opportunities";
import { contactBlockReason } from "@/lib/detention";
import { findBarrio, optionalShareFields } from "@/lib/ficha";
import { FichaActions } from "@/components/ficha/ficha-actions";
import { ReviewAction } from "@/components/revision/review-action";
import { AdjuntosLista } from "@/components/adjuntos/adjuntos-lista";

const ACTOR_LABEL: Record<string, string> = { ia: "IA", operador: "Operador", sistema: "Sistema", migracion: "Migración" };
const AREA_LABEL: Record<string, string> = { civil: "Civil", penal: "Penal", agencia_0km: "Agencia 0KM", coberturas_medicas: "Coberturas médicas", marketing: "Marketing" };

/**
 * Ficha interna completa de un contacto (bloque 1.7): estados que
 * coexisten, detención, acciones, texto para compartir e historial.
 * Es la misma desde cualquier vista y desde el teléfono.
 */
export async function FichaSection({
  contactId,
  compact = false,
  fullHref,
}: {
  contactId: string;
  compact?: boolean;
  /** enlace a la ficha completa (por defecto, la de Prospectos de Jurídico) */
  fullHref?: string;
}) {
  const supabase = createClient();
  const [{ data: contact }, { data: opp }, { data: baseRow }, block, { data: attachments }] = await Promise.all([
    supabase.from("contacts").select("id, full_name, phone, email, dni_cuil, area, qualification_data").eq("id", contactId).maybeSingle(),
    supabase.from("opportunities").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("imported_base_rows").select("raw_data").eq("contact_id", contactId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    contactBlockReason(contactId),
    // Originales que mandó (audios, fotos, videos, documentos): solo para ver; no se comparten solos.
    supabase
      .from("message_attachments")
      .select("id, kind, status, file_name, size_bytes, received_at, expires_at, last_error, conversation_id")
      .eq("contact_id", contactId)
      .order("received_at", { ascending: false })
      .limit(compact ? 6 : 30),
  ]);
  if (!contact) return null;

  const { data: events } = opp
    ? await supabase
        .from("opportunity_events")
        .select("id, at, actor, dimension, from_value, to_value, reason")
        .eq("opportunity_id", opp.id)
        .order("at", { ascending: false })
        .limit(compact ? 8 : 30)
    : { data: [] as any[] };

  const baseData = (baseRow?.raw_data as Record<string, unknown> | null | undefined) ?? null;
  // El barrio sale del campo "barrio" (o localidad, partido...); el domicilio
  // completo nunca se usa como barrio: queda como opción para elegir a mano.
  const barrio = findBarrio(contact.qualification_data as any, baseData);
  const optional = optionalShareFields({
    dni: contact.dni_cuil,
    email: contact.email,
    areaLabel: AREA_LABEL[contact.area] ?? contact.area,
    qualificationData: contact.qualification_data as any,
    baseRow: baseData,
  });

  const chip = (label: string, value: string | null | undefined) => (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value ?? "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {block && block.detentionId && (
        <div className={`rounded-lg p-3 text-sm ${block.hardBlock ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
          <p className="font-semibold">{block.motive === "motivo_no_confirmado" ? "Retenido para revisión" : "Contacto detenido"}: {block.label}</p>
          <p className="text-xs">
            No sale ningún mensaje automático.{block.hardBlock ? " Tampoco se puede escribir a mano salvo que la persona vuelva a escribir." : ""}
          </p>
          <div className="mt-2 max-w-md">
            <ReviewAction
              endpoint={`/api/revision/detenciones/${block.detentionId}/levantar`}
              noteField="motivo"
              notePlaceholder="Motivo para levantarla"
              label="Levantar detención"
              tone={block.hardBlock ? "danger" : "plain"}
              confirmWord={block.hardBlock ? "LEVANTAR" : undefined}
            />
          </div>
        </div>
      )}

      {opp ? (
        <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-2 md:grid-cols-5"}>
          {chip("Contacto", CONTACT_STATE_LABEL[opp.contact_state])}
          {chip("Captación", CAPTURE_STATE_LABEL[opp.capture_state] + (opp.capture_reason ? ` · ${opp.capture_reason}` : ""))}
          {chip("Seguimiento", FOLLOWUP_STATE_LABEL[opp.followup_state])}
          {chip("Atención", ATTENTION_STATE_LABEL[opp.attention_state])}
          {chip(
            "Derivación",
            opp.capture_state === "captado"
              ? DERIVATION_STATE_LABEL[opp.derivation_state] + (opp.derivation_recipient ? ` · ${opp.derivation_recipient}` : "")
              : "—"
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Este contacto todavía no tiene oportunidad registrada.</p>
      )}

      {opp?.historical_result && (
        <p className="text-xs text-slate-500">
          Resultado histórico: {opp.historical_result.replaceAll("_", " ")}
          {opp.motive_unconfirmed ? " · motivo no confirmado" : ""}
          {opp.migration_group ? ` · grupo ${opp.migration_group}` : ""}
        </p>
      )}
      {opp?.automation_hold && (
        <p className="text-xs text-slate-500">Conversación histórica: no entra sola al seguimiento automático.</p>
      )}

      <FichaActions
        opportunity={
          opp
            ? {
                id: opp.id,
                capture_state: opp.capture_state,
                attention_state: opp.attention_state,
                derivation_state: opp.derivation_state,
                review_required: opp.review_required,
                followup_state: opp.followup_state,
              }
            : null
        }
        contactId={contact.id}
        fullName={contact.full_name}
        phone={contact.phone}
        barrio={barrio}
        optionalFields={optional}
        detention={block && block.detentionId ? { id: block.detentionId, label: block.label, hard: block.hardBlock } : null}
      />

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Archivos que mandó</h3>
        <AdjuntosLista rows={(attachments ?? []) as any[]} showConversation={!compact} />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</h3>
        {(events ?? []).length === 0 ? (
          <p className="text-xs text-slate-400">Sin cambios registrados.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {(events ?? []).map((e: any) => (
              <li key={e.id} className="flex flex-wrap gap-x-2 text-slate-600">
                <span className="text-slate-400">{new Date(e.at).toLocaleString("es-AR")}</span>
                <span className="font-medium">{ACTOR_LABEL[e.actor] ?? e.actor}</span>
                <span>
                  {e.dimension}: {e.from_value ? `${e.from_value} → ` : ""}
                  {e.to_value ?? ""}
                </span>
                {e.reason && <span className="text-slate-400">({e.reason})</span>}
              </li>
            ))}
          </ul>
        )}
        {compact && opp && (
          <Link href={fullHref ?? `/prospectos/${contactId}`} className="mt-2 inline-block text-xs text-slate-500 hover:underline">
            Ver ficha completa →
          </Link>
        )}
      </div>
    </div>
  );
}
