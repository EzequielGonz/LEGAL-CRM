import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deviceSummary, logAccessEvent, originHash } from "@/lib/acceso/pin";
import { SESSION_COOKIE, readSignedSession } from "@/lib/acceso/session";

export const dynamic = "force-dynamic";

/** Cierre manual de la sesión de este dispositivo. */
export async function POST(request: Request) {
  const session = await readSignedSession(cookies().get(SESSION_COOKIE)?.value);
  await logAccessEvent("salida", {
    origin: await originHash(request),
    device: deviceSummary(request),
    detail: session ? { sesion: session.sid.slice(0, 8) } : {},
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
