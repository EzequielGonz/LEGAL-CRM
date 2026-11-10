/**
 * Cliente de la API de Wasender (10/11). Solo llamadas HTTP, sin base de datos.
 *
 * - Token de la cuenta (WASENDER_PAT, configuración privada): crear, ver,
 *   conectar y desconectar líneas («sesiones» en Wasender).
 * - Clave de cada línea (se guarda cifrada en la base): enviar mensajes,
 *   consultar el estado y descifrar los archivos recibidos.
 *
 * Documentación: https://wasenderapi.com/api-docs (leída el 10/11/2026).
 * Ninguna clave se escribe en mensajes de error ni en registros.
 */

export const WASENDER_API = "https://www.wasenderapi.com/api";
/** Tiempo máximo de una llamada. Si vence, el resultado es incierto. */
export const WASENDER_TIMEOUT_MS = 20_000;
/** Si Wasender pide esperar hasta esto (protección de cuenta: 1 mensaje cada 5 s), se reintenta una vez. */
export const ESPERA_MAXIMA_REINTENTO_MS = 6_000;

/** Eventos que el panel pide al crear la línea. */
export const EVENTOS_WEBHOOK = [
  "messages.received",
  "messages.upsert",
  "message.sent",
  "messages.update",
  "session.status",
  "qrcode.updated",
] as const;

type Env = Record<string, string | undefined>;

export interface RespuestaHttp {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type FetchWasender = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal }
) => Promise<RespuestaHttp>;

export interface ClienteDeps {
  fetchImpl?: FetchWasender;
  env?: Env;
  /** Solo pruebas: espera entre reintentos. */
  esperar?: (ms: number) => Promise<void>;
}

/** Wasender respondió con error: el pedido no se hizo. */
export class WasenderError extends Error {
  status: number | null;
  esperarMs: number | null;
  constructor(message: string, status: number | null, esperarMs: number | null = null) {
    super(message);
    this.name = "WasenderError";
    this.status = status;
    this.esperarMs = esperarMs;
  }
}

function tokenDeCuenta(env: Env): string {
  const t = (env.WASENDER_PAT ?? "").trim();
  if (!t) throw new Error("Falta el token de la cuenta de Wasender (WASENDER_PAT) en la configuración privada del servidor.");
  return t;
}

function resumenError(json: any, raw: string): string {
  const msg = typeof json?.message === "string" ? json.message : "";
  const errores = json?.errors && typeof json.errors === "object" ? Object.values(json.errors).flat().filter((x) => typeof x === "string") : [];
  const texto = [msg, ...(errores as string[])].filter(Boolean).join(" ") || raw.slice(0, 300);
  return texto.slice(0, 500);
}

async function llamar(
  ruta: string,
  { metodo, token, cuerpo }: { metodo: "GET" | "POST" | "PUT" | "DELETE"; token: string; cuerpo?: unknown },
  deps: ClienteDeps
): Promise<any> {
  const fetchImpl: FetchWasender = deps.fetchImpl ?? ((url, init) => fetch(url, init) as unknown as Promise<RespuestaHttp>);
  const res = await fetchImpl(`${WASENDER_API}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(WASENDER_TIMEOUT_MS),
  });
  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = null;
  }
  if (!res.ok || json?.success === false) {
    const espera = Number(json?.retry_after);
    throw new WasenderError(
      `Wasender respondió ${res.status}: ${resumenError(json, raw)}`,
      res.status,
      Number.isFinite(espera) && espera > 0 ? espera * 1000 : null
    );
  }
  if (json === null) throw new WasenderError(`Wasender respondió ${res.status} con un contenido que no se pudo leer.`, res.status);
  return json;
}

/** Número en formato internacional con «+», a partir de cualquier escritura (solo dígitos). */
export function numeroInternacional(telefono: string): string {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  return digitos ? `+${digitos}` : "";
}

/** Normaliza el estado de una línea («NEED_SCAN» y «need_scan» son lo mismo). */
export function normalizarEstado(estado: unknown): string {
  return typeof estado === "string" && estado.trim() ? estado.trim().toLowerCase() : "desconocido";
}

export interface DatosNuevaLinea {
  nombre: string;
  telefono: string;
  webhookUrl: string;
}

/**
 * Cuerpo para crear la línea. Protección de cuenta activada (1 mensaje cada
 * 5 s), sin guardar mensajes en Wasender, sin marcar como leído solo y sin
 * grupos, canales ni difusiones.
 */
export function cuerpoCrearLinea(d: DatosNuevaLinea) {
  return {
    name: d.nombre.slice(0, 80),
    phone_number: numeroInternacional(d.telefono),
    account_protection: true,
    log_messages: false,
    webhook_url: d.webhookUrl,
    webhook_enabled: true,
    webhook_events: [...EVENTOS_WEBHOOK],
    read_incoming_messages: false,
    auto_reject_calls: false,
    ignore_groups: true,
    ignore_channels: true,
    ignore_broadcasts: true,
    always_online: false,
  };
}

export interface LineaCreada {
  sesionId: string;
  estado: string;
  apiKey: string | null;
  webhookSecret: string | null;
}

export async function crearLinea(d: DatosNuevaLinea, deps: ClienteDeps = {}): Promise<LineaCreada> {
  const json = await llamar("/whatsapp-sessions", { metodo: "POST", token: tokenDeCuenta(deps.env ?? process.env), cuerpo: cuerpoCrearLinea(d) }, deps);
  const data = json?.data ?? json;
  if (data?.id === undefined || data?.id === null) throw new WasenderError("Wasender no devolvió el identificador de la línea.", null);
  return {
    sesionId: String(data.id),
    estado: normalizarEstado(data.status),
    apiKey: typeof data.api_key === "string" ? data.api_key : null,
    webhookSecret: typeof data.webhook_secret === "string" ? data.webhook_secret : null,
  };
}

export interface DetalleLinea {
  estado: string;
  apiKey: string | null;
  webhookSecret: string | null;
  telefono: string | null;
  /** Dirección a la que la línea avisa. Puede llevar el bypass de la Preview: nunca sale del servidor. */
  webhookUrl: string | null;
}

export async function verLinea(sesionId: string, deps: ClienteDeps = {}): Promise<DetalleLinea> {
  const json = await llamar(`/whatsapp-sessions/${encodeURIComponent(sesionId)}`, { metodo: "GET", token: tokenDeCuenta(deps.env ?? process.env) }, deps);
  const data = json?.data ?? json;
  return {
    estado: normalizarEstado(data?.status),
    apiKey: typeof data?.api_key === "string" ? data.api_key : null,
    webhookSecret: typeof data?.webhook_secret === "string" ? data.webhook_secret : null,
    telefono: typeof data?.phone_number === "string" ? data.phone_number : null,
    webhookUrl: typeof data?.webhook_url === "string" ? data.webhook_url : null,
  };
}

/** Cambia la dirección a la que la línea avisa (por ejemplo, de la Preview a producción). No toca la conexión. */
export async function actualizarWebhook(sesionId: string, webhookUrl: string, deps: ClienteDeps = {}): Promise<void> {
  await llamar(
    `/whatsapp-sessions/${encodeURIComponent(sesionId)}`,
    {
      metodo: "PUT",
      token: tokenDeCuenta(deps.env ?? process.env),
      cuerpo: { webhook_url: webhookUrl, webhook_enabled: true, webhook_events: [...EVENTOS_WEBHOOK] },
    },
    deps
  );
}

/** Pide conectar la línea por QR. Devuelve el estado y, si hace falta escanear, el texto del QR. */
export async function conectarLinea(sesionId: string, deps: ClienteDeps = {}): Promise<{ estado: string; qr: string | null }> {
  const json = await llamar(
    `/whatsapp-sessions/${encodeURIComponent(sesionId)}/connect`,
    { metodo: "POST", token: tokenDeCuenta(deps.env ?? process.env), cuerpo: { linkMethod: "qr" } },
    deps
  );
  const data = json?.data ?? json;
  return { estado: normalizarEstado(data?.status), qr: typeof data?.qrCode === "string" ? data.qrCode : null };
}

export async function obtenerQr(sesionId: string, deps: ClienteDeps = {}): Promise<string | null> {
  const json = await llamar(`/whatsapp-sessions/${encodeURIComponent(sesionId)}/qrcode`, { metodo: "GET", token: tokenDeCuenta(deps.env ?? process.env) }, deps);
  const data = json?.data ?? json;
  return typeof data?.qrCode === "string" ? data.qrCode : null;
}

export async function desconectarLinea(sesionId: string, deps: ClienteDeps = {}): Promise<void> {
  await llamar(`/whatsapp-sessions/${encodeURIComponent(sesionId)}/disconnect`, { metodo: "POST", token: tokenDeCuenta(deps.env ?? process.env) }, deps);
}

/** Estado de la línea con su propia clave. */
export async function estadoLinea(apiKey: string, deps: ClienteDeps = {}): Promise<string> {
  const json = await llamar("/status", { metodo: "GET", token: apiKey }, deps);
  return normalizarEstado(json?.status ?? json?.data?.status);
}

export interface MensajeSaliente {
  to: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  fileName?: string;
  audioUrl?: string;
}

/** Arma el cuerpo de envío: texto, o archivo por enlace con el texto como epígrafe. */
export function cuerpoMensaje(m: {
  to: string;
  body: string;
  media?: { kind: "image" | "video" | "document"; link: string; filename?: string } | null;
}): MensajeSaliente {
  const cuerpo: MensajeSaliente = { to: numeroInternacional(m.to) };
  const texto = (m.body ?? "").trim();
  if (texto) cuerpo.text = m.body;
  if (m.media) {
    if (m.media.kind === "image") cuerpo.imageUrl = m.media.link;
    else if (m.media.kind === "video") cuerpo.videoUrl = m.media.link;
    else {
      cuerpo.documentUrl = m.media.link;
      if (m.media.filename) cuerpo.fileName = m.media.filename.slice(0, 200);
    }
  }
  return cuerpo;
}

/**
 * Envía un mensaje por la línea. Si Wasender pide esperar poco (protección de
 * cuenta), espera y reintenta una sola vez. Devuelve el msgId de Wasender.
 */
export async function enviarMensaje(apiKey: string, mensaje: MensajeSaliente, deps: ClienteDeps = {}): Promise<{ msgId: string | null; estado: string | null }> {
  if (!mensaje.to) throw new WasenderError("Falta el número de destino.", null);
  if (!mensaje.text && !mensaje.imageUrl && !mensaje.videoUrl && !mensaje.documentUrl && !mensaje.audioUrl) {
    throw new WasenderError("Falta el texto o el archivo del mensaje.", null);
  }
  const esperar = deps.esperar ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let json: any;
  try {
    json = await llamar("/send-message", { metodo: "POST", token: apiKey, cuerpo: mensaje }, deps);
  } catch (err) {
    if (err instanceof WasenderError && err.status === 429 && err.esperarMs !== null && err.esperarMs <= ESPERA_MAXIMA_REINTENTO_MS) {
      await esperar(err.esperarMs);
      json = await llamar("/send-message", { metodo: "POST", token: apiKey, cuerpo: mensaje }, deps);
    } else {
      throw err;
    }
  }
  const data = json?.data ?? json;
  const msgId = data?.msgId ?? data?.messageId ?? null;
  return { msgId: msgId === null || msgId === undefined ? null : String(msgId), estado: typeof data?.status === "string" ? data.status : null };
}

/** Pide a Wasender el enlace temporal (1 hora) de un archivo recibido. */
export async function descifrarArchivo(apiKey: string, mensaje: { claveId: string; contenido: Record<string, unknown> }, deps: ClienteDeps = {}): Promise<string> {
  const json = await llamar(
    "/decrypt-media",
    { metodo: "POST", token: apiKey, cuerpo: { data: { messages: { key: { id: mensaje.claveId }, message: mensaje.contenido } } } },
    deps
  );
  const url = json?.publicUrl ?? json?.data?.publicUrl;
  if (typeof url !== "string" || !/^https:\/\//i.test(url)) throw new WasenderError("Wasender no devolvió el enlace del archivo.", null);
  return url;
}
