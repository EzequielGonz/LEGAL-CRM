/**
 * Sesión del panel (PIN general compartido).
 *
 * - 15/11 (auditoría): vence a los 7 días sin uso y, aunque se use, a los 30
 *   días del ingreso. Mientras se usa, la cookie se renueva una vez por día.
 * - Cierre manual: "Cerrar sesión" borra la cookie de ese dispositivo.
 * - "Cerrar sesión en todos los dispositivos" sube `session_version` en la
 *   base y todas las cookies anteriores dejan de valer.
 *
 * Este archivo corre también en el middleware (Edge), así que usa solo Web
 * Crypto y fetch; nada de módulos de Node.
 */

export const SESSION_COOKIE = "crm_sesion";
const DIA = 24 * 60 * 60;
/** 15/11: vencimiento absoluto desde el ingreso con el PIN. */
export const SESSION_ABSOLUTE_SECONDS = 30 * DIA;
/** 15/11: vence si no se usa durante este tiempo. */
export const SESSION_IDLE_SECONDS = 7 * DIA;
/** Vida de la cookie en el navegador (igual al vencimiento absoluto). */
export const SESSION_MAX_AGE_SECONDS = SESSION_ABSOLUTE_SECONDS;
/** Se reemite la cookie cuando tiene más de esta antigüedad (así no vence por inactividad mientras se usa). */
export const SESSION_REFRESH_AFTER_SECONDS = DIA;

export type DeviceKind = "pc" | "telefono";

export interface SessionPayload {
  /** versión de sesiones vigente al ingresar */
  v: number;
  /** emitida (segundos epoch) */
  iat: number;
  /** id aleatorio de esta sesión (para el registro de accesos) */
  sid: string;
  /** 15/11: ingreso con el PIN (segundos epoch). Las cookies anteriores no lo tienen: vale `iat`. */
  ini?: number;
  /** 15/11: ingresó con el código anterior de 6 números (el panel pide cambiarlo). */
  c6?: boolean;
}

/** 15/11: ¿la sesión venció por inactividad o por antigüedad? Pura. */
export function sesionVencida(p: Pick<SessionPayload, "iat" | "ini">, ahoraSeg = Math.floor(Date.now() / 1000)): boolean {
  if (ahoraSeg - p.iat > SESSION_IDLE_SECONDS) return true;
  return ahoraSeg - (p.ini ?? p.iat) > SESSION_ABSOLUTE_SECONDS;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Material secreto del servidor para firmar. Si existe SESSION_SECRET se usa
 * esa; si no, se deriva de la clave de servicio de Supabase (que ya es
 * privada y existe en producción). Nunca se expone al navegador.
 */
function secretMaterial(): string {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta la clave privada del servidor para firmar sesiones.");
  return s;
}

let cachedKey: { material: string; key: CryptoKey } | null = null;

async function hmacKey(): Promise<CryptoKey> {
  const material = secretMaterial();
  if (cachedKey && cachedKey.material === material) return cachedKey.key;
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(material),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  // Clave derivada para este uso puntual (no se firma con la clave cruda).
  const derived = new Uint8Array(
    await crypto.subtle.sign("HMAC", base, encoder.encode("legal-crm:sesion:v1"))
  );
  const key = await crypto.subtle.importKey(
    "raw",
    derived,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  cachedKey = { material, key };
  return key;
}

/** HMAC-SHA256 en base64url con la clave derivada (también sirve para hashear orígenes). */
export async function hmacBase64Url(purpose: string, value: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${purpose}:${value}`));
  return toBase64Url(new Uint8Array(sig));
}

export function randomId(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toBase64Url(buf);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`sesion:${body}`)));
  return `${body}.${toBase64Url(sig)}`;
}

/** Verifica la firma y la forma. No consulta la versión vigente (ver isSessionCurrent). */
export async function readSignedSession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sig),
      encoder.encode(`sesion:${body}`)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (
      typeof payload?.v !== "number" ||
      typeof payload?.iat !== "number" ||
      typeof payload?.sid !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Versión vigente de sesiones (para "cerrar en todos los dispositivos").
// Se lee de la base con la clave de servicio y se guarda 30 s en memoria.
// Bloque 1.12: si la base no responde y la copia en memoria ya venció, la
// sesión NO se acepta por las dudas. Se devuelve "no_comprobable", que el
// middleware y las rutas traducen en un error recuperable (503) sin borrar
// la cookie: cuando la base vuelve, la misma sesión sigue valiendo.
// ---------------------------------------------------------------------
let versionCache: { value: number | null; at: number } | null = null;
const VERSION_TTL_MS = 30_000;

export function invalidateSessionVersionCache() {
  versionCache = null;
}

export type SessionVersionResult = { ok: true; value: number | null } | { ok: false; reason: string };

/**
 * Versión de sesiones vigente. `value` nulo = no hay PIN configurado (no
 * existe la fila), así que ninguna cookie vale. `ok: false` = no se pudo
 * comprobar (base sin responder, sin configuración o respuesta inválida).
 */
export async function currentSessionVersion(): Promise<SessionVersionResult> {
  const now = Date.now();
  if (versionCache && now - versionCache.at < VERSION_TTL_MS) return { ok: true, value: versionCache.value };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, reason: "sin_configuracion" };
  try {
    const res = await fetch(`${url}/rest/v1/access_pin?select=session_version&id=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      // 27/11 (auditoría): si la base tarda más de 3 s, cae en el catch → «no comprobable»
      // (503 recuperable, sin borrar la cookie) en vez de colgar cada pedido.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, reason: `respuesta_${res.status}` };
    const rows = (await res.json()) as { session_version: number }[];
    if (!Array.isArray(rows)) return { ok: false, reason: "respuesta_invalida" };
    const raw = rows[0]?.session_version;
    const value = typeof raw === "number" ? raw : null;
    versionCache = { value, at: now };
    return { ok: true, value };
  } catch {
    return { ok: false, reason: "sin_respuesta" };
  }
}

export type SessionCheck =
  | { status: "valida"; session: SessionPayload }
  /** no hay cookie */
  | { status: "ausente" }
  /** cookie mal formada, alterada o firmada con otra clave */
  | { status: "invalida" }
  /** firma correcta pero las sesiones se cerraron en todos los dispositivos (o no hay PIN) */
  | { status: "revocada" }
  /** 15/11: firma correcta pero venció (7 días sin uso o 30 desde el ingreso) */
  | { status: "vencida" }
  /** firma correcta pero la vigencia no se pudo comprobar: error recuperable, la cookie se conserva */
  | { status: "no_comprobable"; reason: string; session: SessionPayload };

/** Sesión válida = firma correcta + versión vigente comprobada. */
export async function validateSession(cookieValue: string | undefined | null): Promise<SessionCheck> {
  if (!cookieValue) return { status: "ausente" };
  const payload = await readSignedSession(cookieValue);
  if (!payload) return { status: "invalida" };
  if (sesionVencida(payload)) return { status: "vencida" };
  const version = await currentSessionVersion();
  if (!version.ok) return { status: "no_comprobable", reason: version.reason, session: payload };
  if (version.value === null || payload.v !== version.value) return { status: "revocada" };
  return { status: "valida", session: payload };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Revisión 15/11: «dispositivo conocido». Se emite al ingresar bien con el PIN
 * y dura 90 días. Solo sirve para que la pausa general de intentos (ataques
 * desde muchas redes) no deje afuera a quien ya entró desde ese dispositivo:
 * igual hay que poner el PIN y vale el tope de 5 intentos por origen.
 */
export const DEVICE_COOKIE = "crm_dispositivo";
export const DEVICE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export async function firmarDispositivo(): Promise<string> {
  const id = randomId(12);
  return `${id}.${await hmacBase64Url("dispositivo", id)}`;
}

export async function dispositivoConocido(valor: string | undefined | null): Promise<boolean> {
  if (!valor) return false;
  const [id, firma] = valor.split(".");
  if (!id || !firma) return false;
  try {
    return (await hmacBase64Url("dispositivo", id)) === firma;
  } catch {
    return false;
  }
}

export function deviceCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: DEVICE_MAX_AGE_SECONDS };
}
