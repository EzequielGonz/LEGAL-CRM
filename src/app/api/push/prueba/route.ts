import { NextResponse } from "next/server";
import { sendToDevices } from "@/lib/push";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Aviso de prueba a un dispositivo (o a todos los activos). No toca ningún
 * contacto ni oportunidad. Body: { dispositivo_id? }
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const deviceId = typeof body?.dispositivo_id === "string" ? body.dispositivo_id : null;
  const { results, missing } = await sendToDevices({
    kind: "prueba",
    title: "Aviso de prueba",
    body: "Si ves esto, los avisos del panel llegan a este dispositivo.",
    url: "/perfiles",
    tag: "prueba",
    deviceId,
  });
  if (missing.length) {
    return NextResponse.json({ error: `Faltan en la configuración privada: ${missing.join(", ")}`, faltantes: missing }, { status: 409 });
  }
  if (results.length === 0) {
    return NextResponse.json({ error: "No hay dispositivos activos para avisar." }, { status: 404 });
  }
  return NextResponse.json({ ok: results.every((r) => r.status === "enviado"), resultados: results });
}
