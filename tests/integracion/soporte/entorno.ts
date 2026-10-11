/**
 * Entorno de las pruebas de integración.
 *
 * - La base es la de pruebas (PostgreSQL + PostgREST, ver docker-compose.yml):
 *   se crea vacía y solo tiene datos inventados.
 * - Toda la red está simulada: la API de Supabase se redirige a la base de
 *   pruebas, Storage se guarda en memoria y Meta (WhatsApp, Instagram,
 *   Facebook) responde lo que cada prueba indique. Cualquier otra dirección
 *   externa hace fallar la prueba: ninguna prueba puede enviar un mensaje
 *   real ni tocar producción.
 */
import { execFileSync } from "node:child_process";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const REST_URL = (process.env.PRUEBAS_REST_URL ?? "http://127.0.0.1:54331").replace(/\/$/, "");
const JWT_SECRET = process.env.PRUEBAS_JWT_SECRET ?? "secreto-de-pruebas-locales-con-al-menos-32-caracteres";
/** Dirección ficticia de "Supabase": la red simulada la redirige a la base de pruebas. */
export const SUPABASE_URL = "http://supabase.pruebas.invalid";

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");
function jwt(payload: Record<string, unknown>): string {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

// Variables como en Vercel, pero apuntando a la red simulada.
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = jwt({ role: "service_role", iss: "pruebas", exp: Math.floor(Date.now() / 1000) + 6 * 3600 });
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = jwt({ role: "anon", iss: "pruebas", exp: Math.floor(Date.now() / 1000) + 6 * 3600 });
// Credenciales de WhatsApp de prueba (solo existen para la red simulada).
process.env.WHATSAPP_CIVIL_PHONE_NUMBER_ID = "100000000000001";
process.env.WHATSAPP_CIVIL_ACCESS_TOKEN = "token-civil-de-prueba";
process.env.WHATSAPP_PENAL_PHONE_NUMBER_ID = "100000000000002";
process.env.WHATSAPP_PENAL_ACCESS_TOKEN = "token-penal-de-prueba";

/**
 * SQL directo en la base de pruebas, solo para lo que la API no permite
 * (un valor JSON nulo, mover una fecha al pasado). PRUEBAS_PSQL indica el
 * comando; por defecto, el psql del contenedor de docker-compose.yml.
 */
export function sql(query: string): string {
  const cmd = (
    process.env.PRUEBAS_PSQL ?? "docker compose -f tests/integracion/docker-compose.yml exec -T db psql -U postgres -d crm_pruebas"
  ).split(/\s+/);
  return execFileSync(cmd[0], [...cmd.slice(1), "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
}

/** Cliente con la clave de servicio de la base de pruebas (para preparar y revisar datos). */
export function db() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Red simulada
// ---------------------------------------------------------------------------

/** Copia en un ArrayBuffer propio (lo que acepta Response en todas las versiones de tipos). */
function cuerpoBinario(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

export type RespuestaMeta =
  | { status: number; body: unknown; demoraMs?: number }
  /** sin respuesta: se corta la conexión (o vence el tiempo) antes de saber qué pasó */
  | { red: "sin_respuesta" | "tiempo_vencido"; demoraMs?: number };

export interface EnvioMeta {
  phoneNumberId: string;
  to: string;
  type: string;
  body: any;
  authorization: string | null;
}

export interface Medio {
  bytes: Uint8Array;
  mime: string;
  /** huella informada por Meta: por defecto la real (hex) */
  sha256?: string;
  /** respuesta de error de Meta al pedir el enlace */
  errorInfo?: { status: number; body: unknown };
  /** tamaño informado por Meta (por defecto el real) */
  fileSize?: number;
  /** contenido que devuelve la descarga (por defecto el archivo) */
  descarga?: { status: number; contentType: string; body: string };
  /** demora de la descarga (para provocar guardados simultáneos) */
  demoraMs?: number;
}

export interface ObjetoGuardado {
  bytes: Uint8Array;
  contentType: string | null;
  upsert: string | null;
}

export class RedSimulada {
  envios: EnvioMeta[] = [];
  /** respuestas en cola por número de destino (se consumen en orden) */
  respuestas = new Map<string, RespuestaMeta[]>();
  medios = new Map<string, Medio>();
  /** descargas de medios hechas (por identificador o enlace) */
  descargas: string[] = [];
  /** archivos de Instagram/Facebook por enlace */
  cdn = new Map<string, { bytes: Uint8Array; mime: string }>();
  storage = new Map<string, ObjetoGuardado>();
  /** cantidad de fallas a simular por función de la base (rpc) */
  fallasRpc = new Map<string, number>();
  /** demora de Meta para responder cada envío (para provocar ejecuciones simultáneas) */
  demoraEnvioMs = 0;
  /** se llama cuando Meta recibe un envío, antes de responder (para revisar la base en ese instante) */
  alRecibirEnvio: ((envio: EnvioMeta) => Promise<void> | void) | null = null;
  private anterior: typeof fetch;
  private contador = 0;

  constructor() {
    this.anterior = globalThis.fetch;
    globalThis.fetch = this.fetch.bind(this) as typeof fetch;
  }

  restaurar() {
    globalThis.fetch = this.anterior;
  }

  responder(to: string, ...r: RespuestaMeta[]) {
    this.respuestas.set(to, [...(this.respuestas.get(to) ?? []), ...r]);
  }

  enviosA(to: string) {
    return this.envios.filter((e) => e.to === to);
  }

  private async fetch(input: any, init?: any): Promise<Response> {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = String(init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")).toUpperCase();
    const headers = new Headers(init?.headers ?? (typeof input === "object" && "headers" in input ? input.headers : undefined));

    // La API de pruebas en sí (por ejemplo, para esperar a que levante).
    if (url.origin === new URL(REST_URL).origin) return this.anterior(input, init);
    if (url.origin === SUPABASE_URL) {
      if (url.pathname.startsWith("/rest/v1/")) return this.rest(url, method, headers, init);
      if (url.pathname.startsWith("/storage/v1/")) return this.storageApi(url, method, headers, init);
      throw new Error(`Ruta de Supabase no simulada: ${url.pathname}`);
    }
    if (url.hostname === "graph.facebook.com") return this.meta(url, method, headers, init);
    if (url.hostname === "lookaside.pruebas.invalid") return this.descargaWhatsApp(url, headers);
    if (url.hostname === "cdn.pruebas.invalid") return this.descargaCdn(url, headers);
    throw new Error(`Llamada externa bloqueada en las pruebas: ${url.hostname}`);
  }

  private async rest(url: URL, method: string, headers: Headers, init: any): Promise<Response> {
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z0-9_]+)$/)?.[1];
    if (rpc && (this.fallasRpc.get(rpc) ?? 0) > 0) {
      this.fallasRpc.set(rpc, this.fallasRpc.get(rpc)! - 1);
      return new Response(JSON.stringify({ message: `Falla simulada de la base (${rpc})`, code: "PRUEBA" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    const target = `${REST_URL}${url.pathname.replace(/^\/rest\/v1/, "")}${url.search}`;
    return this.anterior(target, { method, headers, body: init?.body });
  }

  private async cuerpo(body: any): Promise<Uint8Array> {
    if (body == null) return new Uint8Array();
    if (typeof body === "string") return new TextEncoder().encode(body);
    if (body instanceof Uint8Array) return new Uint8Array(body);
    if (body instanceof ArrayBuffer) return new Uint8Array(body);
    if (ArrayBuffer.isView(body)) return new Uint8Array(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
    if (typeof Blob !== "undefined" && body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      for (const [, v] of body.entries()) if (typeof v !== "string") return new Uint8Array(await (v as Blob).arrayBuffer());
    }
    throw new Error("Cuerpo de subida no reconocido en la simulación de Storage");
  }

  private async storageApi(url: URL, method: string, headers: Headers, init: any): Promise<Response> {
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    const sign = url.pathname.match(/^\/storage\/v1\/object\/sign\/(.+)$/);
    if (sign && method === "POST") {
      const key = decodeURIComponent(sign[1]);
      if (!this.storage.has(key)) return json(400, { statusCode: "404", error: "not_found", message: "Object not found" });
      return json(200, { signedURL: `/object/sign/${encodeURI(key)}?token=token-de-prueba` });
    }
    const obj = url.pathname.match(/^\/storage\/v1\/object\/(.+)$/);
    if (obj && (method === "POST" || method === "PUT")) {
      const key = decodeURIComponent(obj[1]);
      this.storage.set(key, {
        bytes: await this.cuerpo(init?.body),
        contentType: headers.get("content-type"),
        upsert: headers.get("x-upsert"),
      });
      return json(200, { Key: key, Id: randomUUID() });
    }
    throw new Error(`Ruta de Storage no simulada: ${method} ${url.pathname}`);
  }

  private async meta(url: URL, method: string, headers: Headers, init: any): Promise<Response> {
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    const send = url.pathname.match(/^\/v21\.0\/(\d+)\/messages$/);
    if (send && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const envio: EnvioMeta = {
        phoneNumberId: send[1],
        to: body.to,
        type: body.type,
        body,
        authorization: headers.get("authorization"),
      };
      this.envios.push(envio);
      if (this.alRecibirEnvio) await this.alRecibirEnvio(envio);
      const r = this.respuestas.get(body.to)?.shift() ?? null;
      const demora = r?.demoraMs ?? this.demoraEnvioMs;
      if (demora) await new Promise((ok) => setTimeout(ok, demora));
      if (r && "red" in r) {
        if (r.red === "tiempo_vencido") throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
        throw new TypeError("fetch failed");
      }
      if (r) return json(r.status, r.body);
      this.contador++;
      // Identificador único en toda la base de pruebas (no solo en esta prueba).
      const wamid = `wamid.PRUEBA.${this.contador}.${randomUUID()}`;
      return json(200, { messaging_product: "whatsapp", contacts: [{ input: body.to, wa_id: body.to }], messages: [{ id: wamid }] });
    }
    const media = url.pathname.match(/^\/v21\.0\/([A-Za-z0-9._-]+)$/);
    if (media && method === "GET") {
      const m = this.medios.get(decodeURIComponent(media[1]));
      if (!m) return json(400, { error: { message: "Unsupported get request.", type: "GraphMethodException", code: 100, error_subcode: 33 } });
      if (!headers.get("authorization")?.startsWith("Bearer ")) return json(401, { error: { message: "Falta el token", code: 190 } });
      if (m.errorInfo) return json(m.errorInfo.status, m.errorInfo.body);
      return json(200, {
        messaging_product: "whatsapp",
        url: `https://lookaside.pruebas.invalid/whatsapp/${encodeURIComponent(media[1])}`,
        mime_type: m.mime,
        sha256: m.sha256 ?? createHash("sha256").update(m.bytes).digest("hex"),
        file_size: m.fileSize ?? m.bytes.byteLength,
        id: media[1],
      });
    }
    throw new Error(`Ruta de Meta no simulada: ${method} ${url.pathname}`);
  }

  private async descargaWhatsApp(url: URL, headers: Headers): Promise<Response> {
    const id = decodeURIComponent(url.pathname.replace(/^\/whatsapp\//, ""));
    this.descargas.push(id);
    const m = this.medios.get(id);
    if (!m) return new Response("not found", { status: 404 });
    if (!headers.get("authorization")?.startsWith("Bearer ")) return new Response("Falta el token", { status: 401 });
    if (m.demoraMs) await new Promise((ok) => setTimeout(ok, m.demoraMs));
    if (m.descarga) return new Response(m.descarga.body, { status: m.descarga.status, headers: { "content-type": m.descarga.contentType } });
    return new Response(cuerpoBinario(m.bytes), { status: 200, headers: { "content-type": m.mime, "content-length": String(m.bytes.byteLength) } });
  }

  private async descargaCdn(url: URL, headers: Headers): Promise<Response> {
    this.descargas.push(url.href);
    if (headers.get("authorization")) throw new Error("No se debe mandar el token de WhatsApp a un enlace de Instagram/Facebook");
    const f = this.cdn.get(url.href);
    if (!f) return new Response("not found", { status: 404 });
    return new Response(cuerpoBinario(f.bytes), { status: 200, headers: { "content-type": f.mime } });
  }
}

// ---------------------------------------------------------------------------
// Datos inventados
// ---------------------------------------------------------------------------

let secuencia = 0;
/** Teléfono ficticio (54 9 11 00 + 6 cifras): distinto en cada llamada de esta ejecución. */
export function telefonoFicticio(): string {
  secuencia++;
  const proceso = String(process.pid % 100).padStart(2, "0");
  return `5491100${proceso}${String(secuencia % 10000).padStart(4, "0")}`;
}

export async function canalId(area: string, type = "whatsapp"): Promise<string> {
  const { data, error } = await db().from("channels").select("id").eq("area", area).eq("type", type).limit(1).maybeSingle();
  if (error || !data) throw new Error(`Falta el canal ${area}/${type} en la base de pruebas`);
  return data.id as string;
}

export async function crearContacto(opts: { area?: string; nombre?: string | null; telefono?: string; rubroId?: string } = {}) {
  const area = opts.area ?? "civil";
  for (let intento = 0; ; intento++) {
    const { data, error } = await db()
      .from("contacts")
      .insert({
        area,
        full_name: opts.nombre === undefined ? "Persona De Prueba" : opts.nombre,
        phone: opts.telefono ?? telefonoFicticio(),
        source: "base_de_datos",
        ...(opts.rubroId ? { rubro_id: opts.rubroId } : {}),
      })
      .select("id, phone")
      .single();
    // Si el número inventado ya existía (otra ejecución sobre la misma base), se prueba con otro.
    if (error && (error as any).code === "23505" && !opts.telefono && intento < 20) continue;
    if (error || !data) throw new Error(`No se pudo crear el contacto de prueba: ${error?.message}`);
    return { id: data.id as string, phone: data.phone as string };
  }
}

export async function crearConversacion(contactId: string, opts: { area?: string; type?: string; aiEnabled?: boolean } = {}) {
  const area = opts.area ?? "civil";
  const { data, error } = await db()
    .from("conversations")
    .insert({ contact_id: contactId, channel_id: await canalId(area, opts.type ?? "whatsapp"), area, ai_enabled: opts.aiEnabled ?? true })
    .select("id")
    .single();
  if (error || !data) throw new Error(`No se pudo crear la conversación de prueba: ${error?.message}`);
  return data.id as string;
}

/** Valor de la pausa general en la base de pruebas ("sin_fila" la quita). */
export async function fijarPausa(valor: Record<string, unknown> | null | "sin_fila") {
  const s = db();
  if (valor === "sin_fila") {
    const { error } = await s.from("system_settings").delete().eq("key", "automation_pause");
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await s.from("system_settings").upsert({ key: "automation_pause", value: valor }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export const SIN_PAUSA = { ai_replies_paused: false, outbound_automations_paused: false };
export const CON_PAUSA = { ai_replies_paused: true, outbound_automations_paused: true };

/** Espera hasta que la API de pruebas responda (la base se acaba de crear). */
export async function esperarApi(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${REST_URL}/`);
      if (res.ok) return;
    } catch {
      // todavía no levantó
    }
    await new Promise((ok) => setTimeout(ok, 1000));
  }
  throw new Error(`La API de pruebas no responde en ${REST_URL}`);
}
