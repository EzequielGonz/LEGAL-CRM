import { NextResponse } from "next/server";
import {
  bumpSessionVersion,
  deviceSummary,
  ensurePinState,
  isValidPinFormat,
  lockedUntil,
  logAccessEvent,
  originHash,
  registerFailure,
  verifyPin,
} from "@/lib/acceso/pin";
import { SESSION_COOKIE, randomId, sessionCookieOptions, signSession } from "@/lib/acceso/session";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Cierra la sesión en todos los demás dispositivos (pide el PIN). Este
 * dispositivo queda con una sesión nueva. Tarda hasta 30 segundos en
 * aplicarse en los otros.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const origin = await originHash(request);
  const device = deviceSummary(request);

  if (await lockedUntil(origin)) {
    return NextResponse.json({ error: "Demasiados intentos fallidos. Esperá 15 minutos." }, { status: 429 });
  }
  const state = await ensurePinState();
  if (!state.pinHash || !(isValidPinFormat(pin) && (await verifyPin(pin, state.pinHash)))) {
    const until = await registerFailure(origin);
    if (until) await logAccessEvent("bloqueo_origen", { origin, device, detail: { hasta: until.toISOString() } });
    return NextResponse.json({ error: "PIN incorrecto." }, { status: until ? 429 : 401 });
  }

  const version = await bumpSessionVersion(state.sessionVersion);
  const sid = randomId();
  const token = await signSession({ v: version, iat: Math.floor(Date.now() / 1000), sid });
  await logAccessEvent("cierre_todas_sesiones", { origin, device, detail: { version } });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
