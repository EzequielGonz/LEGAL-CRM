import { NextResponse } from "next/server";
import { handleInboundMessage } from "@/lib/inbound";
import type { Area } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------
// Verificación del webhook (Meta Developer -> tu app -> Webhooks ->
// Instagram / Messenger -> Verify and save). Se puede usar el mismo
// endpoint para Instagram y Facebook: ambos comparten el formato Graph API.
// ---------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

function resolveAreaAndPlatform(
  pageOrIgId: string
): { area: Area; platform: "instagram" | "facebook" } | null {
  if (pageOrIgId === process.env.FACEBOOK_CIVIL_PAGE_ID) return { area: "civil", platform: "facebook" };
  if (pageOrIgId === process.env.FACEBOOK_PENAL_PAGE_ID) return { area: "penal", platform: "facebook" };
  if (pageOrIgId === process.env.INSTAGRAM_CIVIL_BUSINESS_ID)
    return { area: "civil", platform: "instagram" };
  if (pageOrIgId === process.env.INSTAGRAM_PENAL_BUSINESS_ID)
    return { area: "penal", platform: "instagram" };
  return null;
}

// ---------------------------------------------------------------------
// Mensajes entrantes de Instagram/Messenger. Referencia:
// https://developers.facebook.com/docs/messenger-platform/instagram
// https://developers.facebook.com/docs/messenger-platform/webhooks
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  const payload = await request.json();

  try {
    for (const entry of payload.entry ?? []) {
      const resolved = resolveAreaAndPlatform(entry.id);
      if (!resolved) continue; // evento de una página/cuenta que no es nuestra

      for (const event of entry.messaging ?? []) {
        if (!event.message?.text) continue; // MVP: solo texto por ahora
        if (event.message.is_echo) continue; // ignorar eco de nuestros propios envíos

        await handleInboundMessage({
          area: resolved.area,
          channelType: resolved.platform,
          externalUserId: event.sender.id,
          body: event.message.text,
          externalMessageId: event.message.mid,
        });
      }
    }
  } catch (err) {
    console.error("Error procesando webhook de Meta:", err);
  }

  return NextResponse.json({ ok: true });
}
