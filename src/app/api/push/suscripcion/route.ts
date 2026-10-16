import { NextResponse } from "next/server";
import { registerDevice } from "@/lib/push";
import { vapidConfig } from "@/lib/webpush";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Registra este dispositivo para recibir avisos (después de que la persona
 * aceptó el permiso en el navegador). Body: { subscription, label }.
 */
export async function POST(request: Request) {
  const sesion = await requireSession(request);
  if (!sesion.ok) return sesion.response;
  if (!vapidConfig().config) {
    return NextResponse.json({ error: "Los avisos web todavía no están configurados en el servidor." }, { status: 409 });
  }
  const body = await request.json().catch(() => null);
  const sub = body?.subscription;
  const endpoint = typeof sub?.endpoint === "string" ? sub.endpoint : "";
  const p256dh = typeof sub?.keys?.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = typeof sub?.keys?.auth === "string" ? sub.keys.auth : "";
  if (!endpoint.startsWith("https://") || !p256dh || !auth || endpoint.length > 2000) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 80) || null : null;
  try {
    const id = await registerDevice({
      endpoint,
      p256dh,
      auth,
      label,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
