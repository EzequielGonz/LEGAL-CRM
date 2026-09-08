import { NextResponse } from "next/server";
import { findOrCreateContact, findOrCreateConversation } from "@/lib/contacts";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import type { Area } from "@/lib/supabase/database.types";

export async function POST(request: Request) {
  const body = await request.json();
  const { full_name, phone, email, area, consulta } = body as {
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

  const supabase = createAdminClient();

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

  // Best-effort: si hay una plantilla configurada para continuar por
  // WhatsApp, la disparamos para que el agente IA pueda seguir la
  // conversación ahí (la landing en sí no tiene canal de mensajería).
  // No bloquea la respuesta al formulario si falla o no está configurada.
  if (process.env.LANDING_WHATSAPP_TEMPLATE) {
    try {
      await sendWhatsAppTemplate(area, phone, process.env.LANDING_WHATSAPP_TEMPLATE, "es_AR", [
        full_name,
      ]);
    } catch (err) {
      console.error("No se pudo enviar la plantilla de continuidad de la landing:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
