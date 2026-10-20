import { NextResponse } from "next/server";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { isApprovedInCatalog } from "@/lib/plantillas";
import { getAutomationPause } from "@/lib/automation-pause";
import { originHash } from "@/lib/acceso/pin";
import { contactBlockReason } from "@/lib/detention";
import { normalizarLead, origenPermitido } from "@/lib/landing-lead";
import { armarCorreoLanding, enviarCorreoLanding } from "@/lib/landing-email";
import { ensureOpportunity } from "@/lib/opportunities";

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
  const { area, nombre: full_name, telefono: phone, email, pagina } = lead;
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

  // Aviso por correo a la casilla del rubro (20/10). Es solo un aviso: la consulta
  // ya quedó guardada. Sin RESEND_API_KEY o LANDING_EMAIL_FROM no se envía; un fallo
  // nunca bloquea la respuesta ni registra datos del contacto.
  try {
    const correo = armarCorreoLanding({
      area,
      nombre: full_name,
      telefono: phone,
      email,
      consulta: lead.consulta,
      pagina,
      llegada: lead.llegada ?? null,
    });
    if (correo) {
      const r = await enviarCorreoLanding(correo, {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.LANDING_EMAIL_FROM,
      });
      if (!r.enviado) console.warn(`[landing] Aviso por correo no enviado (${area}): ${r.motivo}`);
    }
  } catch (err) {
    console.error("[landing] Falló el aviso por correo:", err instanceof Error ? err.name : "error");
  }

  // Best-effort: plantilla de continuidad por WhatsApp. No sale con la pausa
  // general activa ni a un contacto detenido; nunca bloquea la respuesta.
  if (process.env.LANDING_WHATSAPP_TEMPLATE) {
    try {
      const pause = await getAutomationPause();
      const blocked = await contactBlockReason(contact.id);
      // Pregunta 22: solo si la plantilla figura aprobada en el catálogo leído de Meta.
      const approved = !pause.outboundPaused && !blocked && (await isApprovedInCatalog(process.env.LANDING_WHATSAPP_TEMPLATE, "es_AR"));
      if (approved) {
        await sendWhatsAppTemplate(area, phone, process.env.LANDING_WHATSAPP_TEMPLATE, "es_AR", [full_name]);
      } else if (!pause.outboundPaused && !blocked) {
        console.warn("Plantilla de la landing no confirmada como aprobada en el catálogo: no se envió.");
      }
    } catch (err) {
      console.error("No se pudo enviar la plantilla de continuidad de la landing:", err);
    }
  }

  return json({ ok: true });
}
