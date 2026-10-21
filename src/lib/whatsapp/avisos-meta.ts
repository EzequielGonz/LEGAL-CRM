/**
 * Avisos de Meta por línea (21/10).
 *
 * Problema real: las líneas de Agencia 0 km, Coberturas y Marketing mandaban
 * campañas pero nunca recibieron un solo aviso de Meta (ni mensajes entrantes
 * ni estados de entrega). Sin avisos el agente no se entera de que le
 * escribieron y no responde.
 *
 * Meta solo manda los avisos de una cuenta de WhatsApp Business (WABA) a la
 * app suscripta a esa cuenta. Este módulo:
 *  - detecta, con datos propios, las líneas que envían y no reciben avisos;
 *  - consulta qué apps están suscriptas a la cuenta (solo lectura);
 *  - suscribe la cuenta con `override_callback_uri` apuntando al webhook del
 *    panel, así los avisos llegan acá aunque la app tenga otra dirección.
 *
 * No envía mensajes a personas. Nunca devuelve ni registra el token; los
 * textos son propios.
 */
import { META_GRAPH_VERSION } from "@/lib/plantillas/meta";

type Fetcher = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; cache?: RequestCache; signal?: AbortSignal }
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface OpcionesAvisos {
  env?: Record<string, string | undefined>;
  fetchImpl?: Fetcher;
  timeoutMs?: number;
}

export interface ResultadoAvisos {
  ok: boolean;
  mensaje: string;
  apps?: string[];
  http?: number;
}

// --- Reglas puras -------------------------------------------------------------

export interface ActividadLinea {
  /** Salientes con más de 15 minutos, en la ventana mirada. */
  salientesViejos: number;
  /** Salientes con estado devuelto por Meta (entregado, leído o fallido). */
  conEstado: number;
  entrantes: number;
}

/**
 * Una línea «no recibe avisos» cuando mandó varios mensajes hace rato y Meta
 * no devolvió ni un estado ni un mensaje entrante.
 */
export function lineaSinAvisos(a: ActividadLinea): boolean {
  return a.salientesViejos >= 3 && a.conEstado === 0 && a.entrantes === 0;
}

/** Dirección pública del webhook de WhatsApp del panel. */
export function urlWebhook(env: Record<string, string | undefined> = process.env): string | null {
  const base = (env.PANEL_PUBLIC_URL ?? "").trim() || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL.trim()}` : "");
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/api/webhooks/whatsapp`;
}

export function interpretarErrorAvisos(httpStatus: number, codigo: number | null): string {
  if (codigo === 190 || httpStatus === 401) return "Meta rechazó el token de esta línea (inválido o vencido). Generá uno nuevo y cargalo en Vercel.";
  if (codigo === 10 || codigo === 200 || httpStatus === 403)
    return "El token de esta línea no tiene permiso para administrar la cuenta de WhatsApp (falta whatsapp_business_management).";
  if (codigo === 100) return "Meta no encuentra la cuenta de WhatsApp de esta línea: revisá el WABA_ID cargado en Vercel.";
  if (codigo === 2200) return "Meta no pudo validar la dirección del webhook (el token de verificación no coincide).";
  if (codigo === 4 || codigo === 80007 || httpStatus === 429) return "Meta pide esperar antes de volver a intentar.";
  return `Meta no respondió como se esperaba (código ${codigo ?? httpStatus}).`;
}

// --- Llamadas a Meta ------------------------------------------------------------

async function llamar(fetchImpl: Fetcher, url: string, token: string, metodo: "GET" | "POST", cuerpo: Record<string, unknown> | null, timeoutMs: number) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (cuerpo) headers["Content-Type"] = "application/json";
  const res = await fetchImpl(url, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  const texto = await res.text();
  let json: any = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null;
  }
  return { res, json };
}

function acceso(clave: string, env: Record<string, string | undefined>) {
  return { waba: env[`${clave}_WABA_ID`]?.trim(), token: env[`${clave}_ACCESS_TOKEN`]?.trim() };
}

/** Apps suscriptas a la cuenta de la línea (solo lectura). */
export async function appsSuscriptas(clave: string, opciones: OpcionesAvisos = {}): Promise<ResultadoAvisos> {
  const env = opciones.env ?? process.env;
  const { waba, token } = acceso(clave, env);
  if (!waba || !token) return { ok: false, mensaje: `Faltan ${clave}_WABA_ID o ${clave}_ACCESS_TOKEN en Vercel.` };
  const fetchImpl: Fetcher = opciones.fetchImpl ?? ((u, i) => fetch(u, i));
  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(waba)}/subscribed_apps`;
    const { res, json } = await llamar(fetchImpl, url, token, "GET", null, opciones.timeoutMs ?? 8000);
    if (!res.ok || json?.error) {
      const e = json?.error ?? {};
      return { ok: false, http: res.status, mensaje: interpretarErrorAvisos(res.status, typeof e.code === "number" ? e.code : null) };
    }
    const apps = (Array.isArray(json?.data) ? json.data : [])
      .map((d: any) => String(d?.whatsapp_business_api_data?.name ?? d?.whatsapp_business_api_data?.id ?? "").slice(0, 80))
      .filter(Boolean);
    return { ok: true, http: res.status, apps, mensaje: apps.length ? `Apps suscriptas: ${apps.join(", ")}.` : "Ninguna app suscripta a la cuenta." };
  } catch {
    return { ok: false, mensaje: "No hubo respuesta de Meta a tiempo." };
  }
}

/**
 * Suscribe la cuenta de la línea y le pide a Meta que mande los avisos al
 * webhook del panel. Meta valida la dirección con el token de verificación.
 */
export async function suscribirAvisos(clave: string, opciones: OpcionesAvisos = {}): Promise<ResultadoAvisos> {
  const env = opciones.env ?? process.env;
  const { waba, token } = acceso(clave, env);
  if (!waba || !token) return { ok: false, mensaje: `Faltan ${clave}_WABA_ID o ${clave}_ACCESS_TOKEN en Vercel.` };
  const callback = urlWebhook(env);
  const verify = env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (!callback || !verify) return { ok: false, mensaje: "Falta la dirección pública del panel o WHATSAPP_VERIFY_TOKEN en Vercel." };
  const fetchImpl: Fetcher = opciones.fetchImpl ?? ((u, i) => fetch(u, i));
  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(waba)}/subscribed_apps`;
    const { res, json } = await llamar(fetchImpl, url, token, "POST", { override_callback_uri: callback, verify_token: verify }, opciones.timeoutMs ?? 15000);
    if (!res.ok || json?.error || json?.success === false) {
      const e = json?.error ?? {};
      return { ok: false, http: res.status, mensaje: interpretarErrorAvisos(res.status, typeof e.code === "number" ? e.code : null) };
    }
    return { ok: true, http: res.status, mensaje: "Cuenta suscripta: Meta va a mandar los mensajes y estados de esta línea al panel." };
  } catch {
    return { ok: false, mensaje: "No hubo respuesta de Meta a tiempo." };
  }
}
