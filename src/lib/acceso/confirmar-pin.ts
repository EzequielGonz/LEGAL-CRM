import { comprobarPinConTope, deviceSummary, logAccessEvent, type AccessEventKind } from "@/lib/acceso/pin";

/**
 * Confirmación con el PIN para acciones que pueden hacer salir mensajes
 * (activar el seguimiento automático, levantar la pausa general…). Revisión
 * 15/11: el intento se reserva antes de comprobar el código (5 por origen en
 * 15 minutos); como hay sesión, no la frena la pausa general.
 */
export async function confirmPin(
  request: Request,
  pin: unknown,
  eventKind: AccessEventKind,
  detail: Record<string, unknown> = {}
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const r = await comprobarPinConTope(request, pin, { confiable: true });
  if (!r.ok) return { ok: false, status: r.status, error: r.status === 429 ? "Demasiados intentos fallidos. Esperá 15 minutos." : r.error };
  const origin = r.origin;
  await logAccessEvent(eventKind, { origin, device: deviceSummary(request), detail });
  return { ok: true };
}
