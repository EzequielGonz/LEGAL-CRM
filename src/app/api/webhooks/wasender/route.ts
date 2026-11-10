import { NextResponse } from "next/server";
import { procesarWebhook } from "@/lib/wasender/entrada";

export const dynamic = "force-dynamic";
// El turno del bot (herramientas + IA) puede pasar los 10 s, igual que en el webhook de Meta.
export const maxDuration = 60;

/**
 * Webhook de Wasender (10/11). Cada línea tiene su dirección (?linea=<id>) y
 * su secreto: sin la firma correcta no se procesa nada y el evento queda
 * retenido. Siempre se responde 200 para que Wasender no reintente en vano.
 * La dirección completa nunca se registra (en la Preview lleva el acceso de
 * Vercel).
 */
export async function POST(request: Request) {
  const lineaId = new URL(request.url).searchParams.get("linea") ?? "";
  const raw = await request.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = { contenido_no_json: raw.slice(0, 2000) };
  }
  try {
    await procesarWebhook({ lineaId, firma: request.headers.get("x-webhook-signature"), payload });
  } catch (err) {
    console.error("[wasender] Error procesando el webhook:", err);
  }
  return NextResponse.json({ ok: true });
}
