import { NextResponse } from "next/server";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { isApprovedInCatalog } from "@/lib/plantillas";
import { getAutomationPause } from "@/lib/automation-pause";
import { originHash } from "@/lib/acceso/pin";
import { contactBlockReason } from "@/lib/detention";
import type { Area } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/** Formulario público: como máximo 5 envíos por origen por hora. */
const MAX_PER_HOUR = 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { full_name, phone, email, area, consulta } = (body ?? {}) as {
    full_name: string;
    phone: string;
    email?: string;
    area: Area;
    consulta: string;
  };

  if (!full_name || !phone || !area || !consulta) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }
  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  if (String(full_name).length > 200 || String(phone).length > 40 || String(consulta).length > 5000) {
    return NextResponse.json({ error: "Datos demasiado largos" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const origin = await originHash(request);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("landing_submissions")
    .select("id", { count: "exact", head: true })
    .eq("origin_hash", origin)
    .gte("at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Recibimos varias consultas desde esta conexión. Probá de nuevo más tarde." },
      { status: 429 }
    );
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

  return NextResponse.json({ ok: true });
}
