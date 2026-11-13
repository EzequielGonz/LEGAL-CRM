/**
 * Comprobaciones compartidas por rutas que cambian algo (13/11, hallazgos del
 * inventario de rutas). Funciones puras: se prueban sin base ni red.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un identificador con forma válida. Lo que no la tiene no llega a la base. */
export function esUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export interface ReglaAgenda {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * Revisa los horarios de la agenda antes de guardarlos. Si algo está mal no
 * se guarda nada: antes, un dato inválido dejaba el área sin horarios.
 */
export function validarReglasDeAgenda(rules: unknown): { ok: true; reglas: ReglaAgenda[] } | { ok: false; error: string } {
  if (!Array.isArray(rules)) return { ok: false, error: "Faltan los horarios." };
  if (rules.length > 60) return { ok: false, error: "Son demasiados horarios para un área." };
  const reglas: ReglaAgenda[] = [];
  for (const r of rules as any[]) {
    const dia = Number(r?.weekday);
    if (!Number.isInteger(dia) || dia < 0 || dia > 6) return { ok: false, error: "Hay un día de la semana que no es válido." };
    const desde = String(r?.start_time ?? "");
    const hasta = String(r?.end_time ?? "");
    if (!HORA.test(desde) || !HORA.test(hasta)) return { ok: false, error: "Hay un horario con formato inválido (va como 09:00)." };
    if (desde.slice(0, 5) >= hasta.slice(0, 5)) return { ok: false, error: "En un horario, el final tiene que ser después del comienzo." };
    const duracion = r?.slot_duration_minutes === undefined || r?.slot_duration_minutes === null ? 30 : Number(r.slot_duration_minutes);
    if (!Number.isInteger(duracion) || duracion < 5 || duracion > 480) return { ok: false, error: "La duración de un turno tiene que estar entre 5 minutos y 8 horas." };
    reglas.push({ weekday: dia, start_time: desde, end_time: hasta, slot_duration_minutes: duracion });
  }
  return { ok: true, reglas };
}

/**
 * Teléfono principal de avisos: solo se quita si se pide a propósito
 * (`{ phone: null }` o vacío). Un pedido mal formado ya no lo borra.
 */
export function leerTelefonoPrincipal(body: unknown): { ok: true; telefono: string | null } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body) || !("phone" in (body as object))) return { ok: false, error: "Falta el teléfono." };
  const phone = (body as { phone: unknown }).phone;
  if (phone === null) return { ok: true, telefono: null };
  if (typeof phone !== "string") return { ok: false, error: "Teléfono inválido." };
  const limpio = phone.trim();
  if (!limpio) return { ok: true, telefono: null };
  if (!/^\+?[\d\s()-]{8,20}$/.test(limpio)) return { ok: false, error: "Ese teléfono no parece válido." };
  return { ok: true, telefono: limpio };
}

/**
 * Las vistas previas comparten las líneas con producción: desde ahí no se
 * puede cambiar a dónde llegan los mensajes entrantes.
 */
export function entornoPuedeRecibirMensajes(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv !== "preview";
}
