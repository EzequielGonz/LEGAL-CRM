import { NextResponse } from "next/server";
import { vapidConfig } from "@/lib/webpush";
import { listDevices } from "@/lib/push";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/** Estado de los avisos web: si están configurados, la clave pública y los dispositivos. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { config, missing } = vapidConfig();
  const dispositivos = await listDevices();
  return NextResponse.json({
    configurado: !!config,
    faltantes: missing,
    clave_publica: config?.publicKey ?? null,
    dispositivos,
  });
}
