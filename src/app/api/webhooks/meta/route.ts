import { NextResponse } from "next/server";
import { quarantineWebhook, readRawJson, verifyMetaSignature } from "@/lib/webhooks/security";
import { processMetaPayload } from "@/lib/webhooks/process";

export const dynamic = "force-dynamic";
// El turno del agente (herramientas + IA, y en Marketing el análisis al aceptar) puede pasar los 10 s.
export const maxDuration = 60;

// ---------------------------------------------------------------------
// Verificación del webhook (Meta Developer -> tu app -> Webhooks ->
// Instagram / Messenger -> Verify and save).
// ---------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------
// Mensajes entrantes de Instagram/Messenger (misma verificación de firma).
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  const { raw, json: payload } = await readRawJson(request);
  const signature = verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"));

  if (signature !== "ok") {
    await quarantineWebhook({
      source: "meta",
      reason: signature === "ausente" ? "firma_ausente" : "firma_invalida",
      accountId: payload?.entry?.[0]?.id ?? null,
      payload: payload ?? { raw: raw.toString("utf8").slice(0, 100000) },
      detail:
        signature === "sin_secreto"
          ? "No hay secreto de la app configurado (META_APP_SECRET)."
          : "La firma X-Hub-Signature-256 no coincide con ningún secreto configurado.",
    });
    return NextResponse.json({ ok: true });
  }

  try {
    await processMetaPayload(payload);
  } catch (err) {
    console.error("Error procesando webhook de Meta:", err);
  }
  return NextResponse.json({ ok: true });
}
