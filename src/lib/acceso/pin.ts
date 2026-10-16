import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createAdminClient } from "@/lib/supabase/admin";
import { hmacBase64Url, invalidateSessionVersionCache } from "@/lib/acceso/session";

/**
 * PIN general compartido (6 dígitos). Solo para código de servidor (Node).
 *
 * Configuración privada (variables de entorno en Vercel):
 * - ACCESS_PIN: PIN inicial. Se usa una única vez, cuando todavía no hay PIN
 *   guardado. Después manda el PIN que se cambie desde el panel.
 * - ACCESS_PIN_RESET: recuperación. Si se carga un valor nuevo, se aplica una
 *   sola vez como PIN vigente (aunque quede cargado, no vuelve a pisar un
 *   cambio posterior). Para recuperar otra vez, cargar un valor distinto.
 */

const scrypt = promisify(scryptCb) as unknown as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };

export const PIN_LENGTH = 6;

export function isValidPinFormat(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{6}$/.test(pin);
}

/** PINs demasiado fáciles de adivinar (se rechazan al cambiarlo desde el panel). */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true; // 000000, 111111…
  const digits = pin.split("").map(Number);
  const asc = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 1) % 10);
  const desc = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 9) % 10);
  if (asc || desc) return true; // 123456, 654321, 890123…
  if (/^(\d\d)\1\1$/.test(pin) || /^(\d\d\d)\1$/.test(pin)) return true; // 121212, 123123
  return false;
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pin, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 64 * 1024 * 1024,
  });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(pin, Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------
// Origen (para la pausa de 15 minutos tras 5 fallos). Se guarda con hash.
// ---------------------------------------------------------------------
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "desconocido";
}

export async function originHash(request: Request): Promise<string> {
  return hmacBase64Url("origen", clientIp(request));
}

export function deviceSummary(request: Request): string {
  const ua = request.headers.get("user-agent") ?? "";
  const mobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Otro";
  return `${mobile ? "Teléfono" : "Computadora"} · ${browser}`;
}

export async function lockedUntil(origin: string): Promise<Date | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("access_origin_limits")
    .select("locked_until")
    .eq("origin_hash", origin)
    .maybeSingle();
  const until = data?.locked_until ? new Date(data.locked_until) : null;
  return until && until.getTime() > Date.now() ? until : null;
}

/** Suma un fallo; devuelve la fecha de fin de la pausa si este fallo la activó (o ya estaba). */
export async function registerFailure(origin: string): Promise<Date | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("access_register_failure", { p_origin: origin });
  if (error) {
    console.error("[acceso] No se pudo registrar el intento fallido:", error.message);
    return null;
  }
  return data ? new Date(data as string) : null;
}

export async function clearFailures(origin: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("access_origin_limits")
    .update({ failures: 0, locked_until: null, updated_at: new Date().toISOString() })
    .eq("origin_hash", origin);
}

export type AccessEventKind =
  | "ingreso"
  | "ingreso_fallido"
  | "bloqueo_origen"
  | "intento_bloqueado"
  | "salida"
  | "cambio_pin"
  | "cambio_pin_fallido"
  | "recuperacion_pin"
  | "pin_inicial"
  | "cierre_todas_sesiones"
  | "pausa_general"
  | "seguimiento_automatico"
  | "atencion_entrante_24h"
  | "biblioteca_agentes"
  | "politica_publicacion"
  | "asignacion_agente"
  | "ajuste_autorizado"
  | "ejecutor_tareas";

export async function logAccessEvent(
  kind: AccessEventKind,
  opts: { origin?: string | null; device?: string | null; detail?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("access_events").insert({
      kind,
      origin_hash: opts.origin ?? null,
      device: opts.device ?? null,
      detail: opts.detail ?? {},
    });
  } catch (err) {
    console.error("[acceso] No se pudo registrar el evento:", err);
  }
}

// ---------------------------------------------------------------------
// Estado del PIN (aplica PIN inicial / recuperación desde la configuración
// privada del servidor).
// ---------------------------------------------------------------------
export interface PinState {
  configured: boolean;
  pinHash: string | null;
  sessionVersion: number;
  source: string | null;
  updatedAt: string | null;
  /** Avisos para mostrar en Configuración (nunca incluyen el PIN). */
  warnings: string[];
}

export async function ensurePinState(): Promise<PinState> {
  const supabase = createAdminClient();
  const warnings: string[] = [];

  const { data: row, error } = await supabase
    .from("access_pin")
    .select("pin_hash, source, reset_fingerprint, session_version, updated_at")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el estado del PIN: ${error.message}`);

  // 1) Recuperación desde la configuración privada (se aplica una sola vez por valor).
  const resetPin = process.env.ACCESS_PIN_RESET?.trim();
  if (resetPin) {
    if (!isValidPinFormat(resetPin)) {
      warnings.push("ACCESS_PIN_RESET está cargado pero no tiene 6 dígitos: no se aplicó.");
    } else {
      const fingerprint = await hmacBase64Url("reset", resetPin);
      if (!row || row.reset_fingerprint !== fingerprint) {
        const pin_hash = await hashPin(resetPin);
        const now = new Date().toISOString();
        const { error: upErr } = await supabase.from("access_pin").upsert(
          {
            id: true,
            pin_hash,
            source: "recuperacion",
            reset_fingerprint: fingerprint,
            session_version: row?.session_version ?? 1,
            updated_at: now,
          },
          { onConflict: "id" }
        );
        if (upErr) throw new Error(`No se pudo aplicar la recuperación del PIN: ${upErr.message}`);
        await logAccessEvent("recuperacion_pin", { detail: { origen: "configuracion_privada" } });
        return {
          configured: true,
          pinHash: pin_hash,
          sessionVersion: row?.session_version ?? 1,
          source: "recuperacion",
          updatedAt: now,
          warnings,
        };
      }
    }
  }

  if (row) {
    return {
      configured: true,
      pinHash: row.pin_hash,
      sessionVersion: row.session_version,
      source: row.source,
      updatedAt: row.updated_at,
      warnings,
    };
  }

  // 2) Sin PIN guardado todavía: se toma ACCESS_PIN (una sola vez).
  const initialPin = process.env.ACCESS_PIN?.trim();
  if (!initialPin) {
    return { configured: false, pinHash: null, sessionVersion: 1, source: null, updatedAt: null, warnings };
  }
  if (!isValidPinFormat(initialPin)) {
    warnings.push("ACCESS_PIN está cargado pero no tiene 6 dígitos.");
    return { configured: false, pinHash: null, sessionVersion: 1, source: null, updatedAt: null, warnings };
  }

  const pin_hash = await hashPin(initialPin);
  const { error: insErr } = await supabase
    .from("access_pin")
    .insert({ id: true, pin_hash, source: "inicial", session_version: 1 });
  if (insErr) {
    // Otro ingreso simultáneo lo creó primero: se usa el que quedó guardado.
    const { data: again } = await supabase
      .from("access_pin")
      .select("pin_hash, source, session_version, updated_at")
      .eq("id", true)
      .maybeSingle();
    if (!again) throw new Error(`No se pudo guardar el PIN inicial: ${insErr.message}`);
    return {
      configured: true,
      pinHash: again.pin_hash,
      sessionVersion: again.session_version,
      source: again.source,
      updatedAt: again.updated_at,
      warnings,
    };
  }
  await logAccessEvent("pin_inicial", { detail: { origen: "configuracion_privada" } });
  return {
    configured: true,
    pinHash: pin_hash,
    sessionVersion: 1,
    source: "inicial",
    updatedAt: new Date().toISOString(),
    warnings,
  };
}

export async function updatePin(newPin: string): Promise<void> {
  const supabase = createAdminClient();
  const pin_hash = await hashPin(newPin);
  const { error } = await supabase
    .from("access_pin")
    .update({ pin_hash, source: "panel", updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw new Error(`No se pudo guardar el PIN: ${error.message}`);
}

/** Sube la versión de sesiones: todas las cookies anteriores dejan de valer. */
export async function bumpSessionVersion(current: number): Promise<number> {
  const supabase = createAdminClient();
  const next = current + 1;
  const { data, error } = await supabase
    .from("access_pin")
    .update({ session_version: next, updated_at: new Date().toISOString() })
    .eq("id", true)
    .eq("session_version", current)
    .select("session_version")
    .maybeSingle();
  if (error) throw new Error(`No se pudieron cerrar las sesiones: ${error.message}`);
  invalidateSessionVersionCache();
  if (!data) {
    // Alguien la cambió al mismo tiempo: se toma la vigente.
    const { data: row } = await supabase.from("access_pin").select("session_version").eq("id", true).single();
    return row?.session_version ?? next;
  }
  return data.session_version;
}

/** Solo rutas internas del panel (evita redirecciones a sitios externos). */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string") return "/inicio";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/api") || next.startsWith("/login")) {
    return "/inicio";
  }
  return next;
}
