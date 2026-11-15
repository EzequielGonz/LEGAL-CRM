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
  attemptOk,
  tryAttempt,
  verifyPin,
} from "@/lib/acceso/pin";
import { DEVICE_COOKIE, SESSION_COOKIE, deviceCookieOptions, dispositivoConocido, firmarDispositivo, randomId, sessionCookieOptions, signSession } from "@/lib/acceso/session";
import { cookies } from "next/headers";
import { ReservaNoDisponible } from "@/lib/acceso/pin";

export const dynamic = "force-dynamic";

function horaArgentina(d: Date): string {
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23",
  });
}

/**
 * Ingreso con el PIN general. 5 intentos desde un origen => pausa de 15 minutos
 * para ese origen; 30 fallos en total (todas las redes) => pausa general de 15
 * minutos. 15/11: el intento se reserva antes de comprobar el código (atómico).
 */
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
          "El PIN todavía no está configurado. Hay que cargar ACCESS_PIN (8 dígitos) en la configuración privada del servidor.",
      },
      { status: 503 }
    );
  }

  // 15/11: reserva atómica del intento. Sin la función en la base, la lectura anterior.
  // Revisión 15/11: un dispositivo que ya ingresó bien no queda frenado por la pausa general.
  const confiable = await dispositivoConocido((await cookies()).get(DEVICE_COOKIE)?.value);
  let intento: Awaited<ReturnType<typeof tryAttempt>>;
  try {
    intento = await tryAttempt(origin, confiable);
  } catch (err) {
    if (err instanceof ReservaNoDisponible) return NextResponse.json({ error: err.message }, { status: 503 });
    throw err;
  }
  const locked = intento ? (intento.permitido ? null : intento.hasta) : await lockedUntil(origin);
  if (locked) {
    await logAccessEvent("intento_bloqueado", { origin, device, detail: intento?.general ? { general: true } : {} });
    return NextResponse.json(
      {
        error: intento?.general
          ? `Hubo demasiados intentos fallidos. Por seguridad, el ingreso se pausó hasta las ${horaArgentina(locked)}.`
          : `Demasiados intentos desde este dispositivo o red. Podés volver a probar a las ${horaArgentina(locked)}.`,
      },
      { status: 429 }
    );
  }

  const ok = isValidPinFormat(pin) && (await verifyPin(pin, state.pinHash));
  if (!ok) {
    const until = intento ? intento.hasta : await registerFailure(origin);
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

  if (intento) await attemptOk(origin, confiable);
  else await clearFailures(origin);
  const sid = randomId();
  const token = await signSession({ v: state.sessionVersion, iat: Math.floor(Date.now() / 1000), ini: Math.floor(Date.now() / 1000), sid, ...(pin.length === 6 ? { c6: true } : {}) });
  await logAccessEvent("ingreso", { origin, device, detail: { sesion: sid.slice(0, 8) } });

  const response = NextResponse.json({ ok: true, next: safeNextPath(body?.next) });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  if (!confiable) response.cookies.set(DEVICE_COOKIE, await firmarDispositivo(), deviceCookieOptions());
  return response;
}
