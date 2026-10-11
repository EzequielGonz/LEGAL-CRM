import { NextResponse } from "next/server";
import { quarantineWebhook, readRawJson, verifyMetaSignature } from "@/lib/webhooks/security";
import { processWhatsAppPayload } from "@/lib/webhooks/process";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------
// Verificación del webhook (paso único al configurarlo en Meta Developer:
// WhatsApp -> Configuration -> Webhook -> Verify and save).
// ---------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------
// Mensajes entrantes y estados de entrega. Referencia del formato:
// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
// Siempre se responde 200 (si no, Meta reintenta y puede desactivar el
// webhook). Sin firma válida no se procesa nada: el evento se conserva en
// "Mensajes retenidos" (Revisión) para que una persona decida.
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  const { raw, json: payload } = await readRawJson(request);
  const signature = verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"));

  if (signature !== "ok") {
    await quarantineWebhook({
      source: "whatsapp",
      reason: signature === "ausente" ? "firma_ausente" : "firma_invalida",
      accountId: payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? null,
      payload: payload ?? { raw: raw.toString("utf8").slice(0, 100000) },
      detail:
        signature === "sin_secreto"
          ? "No hay secreto de la app configurado (META_APP_SECRET)."
          : "La firma X-Hub-Signature-256 no coincide con ningún secreto configurado.",
    });
    return NextResponse.json({ ok: true });
  }

  try {
    await processWhatsAppPayload(payload);
  } catch (err) {
    console.error("Error procesando webhook de WhatsApp:", err);
  }
  return NextResponse.json({ ok: true });
}
