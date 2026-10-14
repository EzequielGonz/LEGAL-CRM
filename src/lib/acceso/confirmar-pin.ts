import {
  deviceSummary,
  ensurePinState,
  isValidPinFormat,
  lockedUntil,
  logAccessEvent,
  originHash,
  registerFailure,
  verifyPin,
  type AccessEventKind,
} from "@/lib/acceso/pin";

/**
 * Confirmación con el PIN para acciones que pueden hacer salir mensajes
 * (activar el seguimiento automático, levantar la pausa general…). Respeta
 * el bloqueo de 15 minutos por origen después de 5 intentos fallidos.
 */
export async function confirmPin(
  request: Request,
  pin: unknown,
  eventKind: AccessEventKind,
  detail: Record<string, unknown> = {}
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const origin = await originHash(request);
  if (await lockedUntil(origin)) {
    return { ok: false, status: 429, error: "Demasiados intentos fallidos. Esperá 15 minutos." };
  }
  const value = typeof pin === "string" ? pin.trim() : "";
  const state = await ensurePinState();
  if (!state.pinHash || !(isValidPinFormat(value) && (await verifyPin(value, state.pinHash)))) {
    const until = await registerFailure(origin);
    return { ok: false, status: until ? 429 : 401, error: "PIN incorrecto." };
  }
  await logAccessEvent(eventKind, { origin, device: deviceSummary(request), detail });
  return { ok: true };
}
