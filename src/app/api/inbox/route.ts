import { NextResponse } from "next/server";
import { TRATAMIENTO_ATENCION } from "@/lib/captacion/reglas";
import { createAdminClient } from "@/lib/supabase/admin";
import { detainedContactIds } from "@/lib/detention";
import { requireSession } from "@/lib/acceso/autorizacion";
import { textoBusquedaSeguro } from "@/lib/busqueda";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

/**
 * Lista del Inbox (bloques 1.5 y 1.8): filtros, búsqueda, total y páginas
 * en el servidor, con el último mensaje y la atención de cada conversación.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Number(sp.get("pagina")) || 1);
  const area = sp.get("area");
  const canal = sp.get("canal");
  const atencion = sp.get("atencion");
  const q = textoBusquedaSeguro(sp.get("q"));
  // 21/10: cada perfil ve solo sus chats (antes se mezclaban en Jurídico).
  const perfil = sp.get("perfil") || "juridico";
  const areasPerfil = AREAS_DE_PERFIL[perfil] ?? AREAS_DE_PERFIL.juridico;
  const base = sp.get("base");
  const respuesta = sp.get("respuesta");

  const supabase = createAdminClient();

  // Opciones de los filtros: las bases cargadas del perfil.
  if (sp.get("opciones") === "1") {
    const { data: bases } = await supabase
      .from("imported_bases")
      .select("id, name, created_at")
      .in("area", areasPerfil)
      .is("archived_at", null)
      .gt("created_rows", 0)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ bases: (bases ?? []).map((b: any) => ({ id: b.id, nombre: b.name, fecha: b.created_at })) });
  }

  const contactsSel = q || base ? "contacts!inner(full_name, phone, imported_base_id)" : "contacts(full_name, phone, imported_base_id)";
  const channelsSel = canal ? "channels!inner(type)" : "channels(type)";
  const oppInner = (atencion && atencion !== "detenidos") || !!respuesta;
  const oppSel = `opportunities${oppInner ? "!inner" : ""}(attention_state, capture_state, contact_state, attention_reason, attention_category)`;

  let query = supabase
    .from("conversations")
    .select(`id, area, status, last_message_at, ai_enabled, contact_id, ${contactsSel}, ${channelsSel}, ${oppSel}`, { count: "exact" })
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  query = area && areasPerfil.includes(area) ? query.eq("area", area) : query.in("area", areasPerfil);
  if (base) query = query.eq("contacts.imported_base_id", base);
  if (respuesta === "respondieron") query = query.eq("opportunities.contact_state", "respondio");
  else if (respuesta === "sin_respuesta") query = query.neq("opportunities.contact_state", "respondio");
  if (canal) query = query.eq("channels.type", canal);
  if (atencion === "detenidos") {
    // Vista secundaria (Etapa 3): conversaciones de contactos con detención vigente.
    const { data: det } = await supabase.from("contact_detentions").select("contact_id").eq("status", "vigente").not("contact_id", "is", null).limit(2000);
    const ids = Array.from(new Set((det ?? []).map((d: any) => d.contact_id as string)));
    query = ids.length ? query.in("contact_id", ids) : query.eq("id", "00000000-0000-0000-0000-000000000000");
  } else if (atencion) query = query.eq("opportunities.attention_state", atencion);
  // Nombre, teléfono y valores de las columnas importadas de sus bases (0204).
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,base_text.ilike.%${q}%`, { referencedTable: "contacts" });

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
        // Etapa 3: la cola humana muestra el motivo en palabras (12.2).
        attention_reason: opp?.attention_reason ? (TRATAMIENTO_ATENCION as any)[opp.attention_reason]?.label ?? opp.attention_reason : null,
        detained: det ? (det.motive === "motivo_no_confirmado" ? "retenido" : "detenido") : null,
      };
    }),
  });
}
