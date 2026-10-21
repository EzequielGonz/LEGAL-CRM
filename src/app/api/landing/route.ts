import { NextResponse } from "next/server";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { createAdminClient } from "@/lib/supabase/admin";
import { originHash } from "@/lib/acceso/pin";
import { normalizarLead, origenPermitido } from "@/lib/landing-lead";
import { ensureOpportunity } from "@/lib/opportunities";
import { normalizePhoneAR } from "@/lib/phone";

export const dynamic = "force-dynamic";

/** CORS: solo los dominios propios de las landings (más LANDING_ORIGINS, separados por coma). */
function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const extra = (process.env.LANDING_ORIGINS ?? "").split(",");
  if (!origenPermitido(origin, extra)) return {};
  return {
    "Access-Control-Allow-Origin": origin as string,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/** Formulario público: como máximo 5 envíos por origen por hora. */
const MAX_PER_HOUR = 5;

export async function POST(request: Request) {
  const cors = corsHeaders(request);
  const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: cors });
  const body = await request.json().catch(() => null);
  const perfilParam = new URL(request.url).searchParams.get("perfil");
  const lead = normalizarLead(body as Record<string, unknown> | null, perfilParam);
  if ("error" in lead) return json({ error: lead.error }, 400);
  const { area, nombre: full_name, email, pagina } = lead;
  // 21/10: el teléfono queda en el formato de WhatsApp (549…), así la respuesta
  // por WhatsApp cae en la misma ficha y el primer mensaje a los 5 min sale bien.
  const phone = normalizePhoneAR(lead.telefono).phone ?? lead.telefono;
  const consulta = pagina ? `Consulta desde la web (${pagina}):\n${lead.consulta}` : lead.consulta;

  const supabase = createAdminClient();

  const origin = await originHash(request);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("landing_submissions")
    .select("id", { count: "exact", head: true })
    .eq("origin_hash", origin)
    .gte("at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return json({ error: "Recibimos varias consultas desde esta conexión. Probá de nuevo más tarde." }, 429);
  }
  await supabase.from("landing_submissions").insert({ origin_hash: origin, area });

  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("area", area)
    .eq("type", "landing")
    .single();

  const { contact } = await findOrCreateContact({
    area,
    channelType: "landing",
    externalUserId: phone, // dedup por teléfono como identidad de landing
    phone,
    email,
    fullName: full_name,
    source: "landing",
    channelId: channel?.id ?? null,
  });

  await supabase
    .from("contacts")
    .update({
      notes: contact.notes ? `${contact.notes}\n\n[Landing] ${consulta}` : `[Landing] ${consulta}`,
    })
    .eq("id", contact.id);

  if (channel) {
    const conversation = await findOrCreateConversation({
      contactId: contact.id,
      channelId: channel.id,
      area,
    });

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "prospecto",
      direction: "entrante",
      body: consulta,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // Fuente acreditada: el formulario del sitio (nunca pisa una fuente anterior).
    try {
      const opp = await ensureOpportunity({ contactId: contact.id, conversationId: conversation.id });
      await supabase
        .from("opportunities")
        .update({ first_source: "landing", first_source_detail: [pagina ? `formulario ${pagina}` : "formulario", lead.llegada ? `llegó desde ${lead.llegada}` : null].filter(Boolean).join(" · "), first_source_at: new Date().toISOString() })
        .eq("id", opp.id)
        .is("first_source", null);
    } catch (err) {
      console.error("[landing] No se pudo registrar la fuente:", err);
    }
  }

  // 21/10: el primer mensaje por WhatsApp sale a los 5 minutos desde el
  // latido (src/lib/landing-seguimiento.ts), con la plantilla aprobada del rubro.

  return json({ ok: true });
}
