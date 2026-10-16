import { NextResponse } from "next/server";
import {
  clearFailures,
  deviceSummary,
  ensurePinState,
  isValidPinFormat,
  isWeakPin,
  lockedUntil,
  logAccessEvent,
  originHash,
  registerFailure,
  updatePin,
  verifyPin,
} from "@/lib/acceso/pin";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Cambio del PIN desde el panel: pide el PIN actual. Las sesiones abiertas
 * siguen abiertas (para cerrarlas está "Cerrar sesión en los demás dispositivos").
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const actual = typeof body?.actual === "string" ? body.actual.trim() : "";
  const nuevo = typeof body?.nuevo === "string" ? body.nuevo.trim() : "";
  const confirmacion = typeof body?.confirmacion === "string" ? body.confirmacion.trim() : "";
  const origin = await originHash(request);
  const device = deviceSummary(request);

  const locked = await lockedUntil(origin);
  if (locked) {
    return NextResponse.json(
      { error: "Demasiados intentos fallidos desde este dispositivo o red. Esperá 15 minutos." },
      { status: 429 }
    );
  }

  const state = await ensurePinState();
  if (!state.configured || !state.pinHash) {
    return NextResponse.json({ error: "El PIN todavía no está configurado." }, { status: 503 });
  }

  if (!(isValidPinFormat(actual) && (await verifyPin(actual, state.pinHash)))) {
    const until = await registerFailure(origin);
    await logAccessEvent("cambio_pin_fallido", { origin, device });
    if (until) await logAccessEvent("bloqueo_origen", { origin, device, detail: { hasta: until.toISOString() } });
    return NextResponse.json({ error: "El PIN actual no es correcto." }, { status: until ? 429 : 401 });
  }

  if (!isValidPinFormat(nuevo)) {
    return NextResponse.json({ error: "El PIN nuevo tiene que tener exactamente 6 números." }, { status: 400 });
  }
  if (nuevo !== confirmacion) {
    return NextResponse.json({ error: "La confirmación no coincide con el PIN nuevo." }, { status: 400 });
  }
  if (nuevo === actual) {
    return NextResponse.json({ error: "El PIN nuevo tiene que ser distinto del actual." }, { status: 400 });
  }
  if (isWeakPin(nuevo)) {
    return NextResponse.json(
      { error: "Ese PIN es muy fácil de adivinar (números repetidos o seguidos). Elegí otro." },
      { status: 400 }
    );
  }

  await clearFailures(origin);
  await updatePin(nuevo);
  await logAccessEvent("cambio_pin", { origin, device });
  return NextResponse.json({ ok: true });
}
