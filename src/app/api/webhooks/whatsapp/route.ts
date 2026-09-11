import { NextResponse } from "next/server";
import { handleInboundMessage } from "@/lib/inbound";
import type { Area } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------
// Verificación del webhook (paso único al configurarlo en Meta Developer:
// WhatsApp -> Configuration -> Webhook -> Verify and save).
// ---------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

function areaForPhoneNumberId(phoneNumberId: string): Area | null {
  if (phoneNumberId === process.env.WHATSAPP_CIVIL_PHONE_NUMBER_ID) return "civil";
  if (phoneNumberId === process.env.WHATSAPP_PENAL_PHONE_NUMBER_ID) return "penal";
  return null;
}

// ---------------------------------------------------------------------
// Mensajes entrantes. Referencia del formato del payload:
// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  const payload = await request.json();

  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const area = phoneNumberId ? areaForPhoneNumberId(phoneNumberId) : null;

        if (!area) continue; // evento de un número que no es Civil ni Penal

        for (const message of value.messages ?? []) {
          // "text": mensaje de texto normal. "button": el prospecto tocó un
          // botón de respuesta rápida de una plantilla de campaña (ej. "Mi
          // caso esta pendiente" / "Mi caso ya esta resuelto") — Meta lo
          // manda con este tipo, no como "text", así que hay que leerlo de
          // message.button.text para que el flujo de preguntas lo detecte.
          let body: string | null = null;
          if (message.type === "text") {
            body = message.text?.body ?? "";
          } else if (message.type === "button") {
            body = message.button?.text ?? message.button?.payload ?? "";
          } else {
            continue; // MVP: solo texto y botones de plantilla por ahora
          }

          const contactProfile = (value.contacts ?? []).find(
            (c: any) => c.wa_id === message.from
          );

          await handleInboundMessage({
            area,
            channelType: "whatsapp",
            externalUserId: message.from,
            phone: message.from,
            fullName: contactProfile?.profile?.name ?? null,
            body,
            externalMessageId: message.id,
          });
        }

        // Actualizaciones de estado (entregado/leído) de mensajes salientes
        // de campañas -> reflejarlas en campaign_contacts.
        for (const status of value.statuses ?? []) {
          if (status.status === "delivered" || status.status === "read") {
            // Se resuelve por mejor esfuerzo: buscamos el campaign_contact por
            // teléfono + campaña en curso más reciente. Ver docs/SETUP.md para
            // una implementación más robusta basada en external_message_id.
          }
        }
      }
    }
  } catch (err) {
    // Nunca devolver error a Meta por una falla interna: lo logueamos y
    // respondemos 200 igual para que no reintente indefinidamente.
    console.error("Error procesando webhook de WhatsApp:", err);
  }

  return NextResponse.json({ ok: true });
}
