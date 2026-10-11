import { NextResponse } from "next/server";
import {
  clearFailures,
  deviceSummary,
  ensurePinState,
  isValidPinFormat,
  lockedUntil,
  logAccessEvent,
  originHash,
  registerFailure,
  safeNextPath,
  verifyPin,
} from "@/lib/acceso/pin";
import { SESSION_COOKIE, randomId, sessionCookieOptions, signSession } from "@/lib/acceso/session";

export const dynamic = "force-dynamic";

function horaArgentina(d: Date): string {
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

/** Ingreso con el PIN general. 5 fallos desde un origen => pausa de 15 minutos solo para ese origen. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const origin = await originHash(request);
  const device = deviceSummary(request);

  let state;
  try {
    state = await ensurePinState();
  } catch (err: any) {
    console.error("[acceso] Estado del PIN:", err);
    return NextResponse.json({ error: "No se pudo verificar el acceso. Probá de nuevo en un momento." }, { status: 503 });
  }

  if (!state.configured || !state.pinHash) {
    return NextResponse.json(
      {
        error:
          "El PIN todavía no está configurado. Hay que cargar ACCESS_PIN (6 dígitos) en la configuración privada del servidor.",
      },
      { status: 503 }
    );
  }

  const locked = await lockedUntil(origin);
  if (locked) {
    await logAccessEvent("intento_bloqueado", { origin, device });
    return NextResponse.json(
      { error: `Demasiados intentos desde este dispositivo o red. Podés volver a probar a las ${horaArgentina(locked)}.` },
      { status: 429 }
    );
  }

  const ok = isValidPinFormat(pin) && (await verifyPin(pin, state.pinHash));
  if (!ok) {
    const until = await registerFailure(origin);
    await logAccessEvent("ingreso_fallido", { origin, device });
    if (until) {
      await logAccessEvent("bloqueo_origen", { origin, device, detail: { hasta: until.toISOString() } });
      return NextResponse.json(
        { error: `PIN incorrecto. Por seguridad, desde este dispositivo o red se podrá volver a intentar a las ${horaArgentina(until)}.` },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  await clearFailures(origin);
  const sid = randomId();
  const token = await signSession({ v: state.sessionVersion, iat: Math.floor(Date.now() / 1000), sid });
  await logAccessEvent("ingreso", { origin, device, detail: { sesion: sid.slice(0, 8) } });

  const response = NextResponse.json({ ok: true, next: safeNextPath(body?.next) });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
