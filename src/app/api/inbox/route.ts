import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detainedContactIds } from "@/lib/detention";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

/**
 * Lista del Inbox (bloques 1.5 y 1.8): filtros, búsqueda, total y páginas
 * en el servidor, con el último mensaje y la atención de cada conversación.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Number(sp.get("pagina")) || 1);
  const area = sp.get("area");
  const canal = sp.get("canal");
  const atencion = sp.get("atencion");
  const q = (sp.get("q") ?? "").replace(/[,()]/g, "").trim();

  const supabase = createAdminClient();
  const contactsSel = q ? "contacts!inner(full_name, phone)" : "contacts(full_name, phone)";
  const channelsSel = canal ? "channels!inner(type)" : "channels(type)";
  const oppSel = atencion ? "opportunities!inner(attention_state, capture_state)" : "opportunities(attention_state, capture_state)";

  let query = supabase
    .from("conversations")
    .select(`id, area, status, last_message_at, ai_enabled, contact_id, ${contactsSel}, ${channelsSel}, ${oppSel}`, { count: "exact" })
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (area) query = query.eq("area", area);
  if (canal) query = query.eq("channels.type", canal);
  if (atencion) query = query.eq("opportunities.attention_state", atencion);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`, { referencedTable: "contacts" });

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as any[];
  const ids = rows.map((r) => r.id);
  const [{ data: last }, detained] = await Promise.all([
    ids.length ? supabase.rpc("conversation_last_messages", { p_ids: ids }) : Promise.resolve({ data: [] as any[] }),
    detainedContactIds(rows.map((r) => r.contact_id)),
  ]);
  const lastById = new Map<string, any>(((last ?? []) as any[]).map((m) => [m.conversation_id, m]));

  return NextResponse.json({
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
    items: rows.map((r) => {
      const opp = Array.isArray(r.opportunities) ? r.opportunities[0] : r.opportunities;
      const lm = lastById.get(r.id);
      const det = detained.get(r.contact_id);
      return {
        id: r.id,
        area: r.area,
        status: r.status,
        last_message_at: r.last_message_at,
        ai_enabled: r.ai_enabled,
        contact_name: r.contacts?.full_name ?? null,
        phone: r.contacts?.phone ?? null,
        channel_type: r.channels?.type ?? "whatsapp",
        last_message_preview: lm ? `${lm.direction === "saliente" ? "Vos: " : ""}${(lm.body ?? "").slice(0, 90)}` : null,
        last_from_contact: lm ? lm.direction === "entrante" : false,
        attention_state: opp?.attention_state ?? null,
        detained: det ? (det.motive === "motivo_no_confirmado" ? "retenido" : "detenido") : null,
      };
    }),
  });
}
