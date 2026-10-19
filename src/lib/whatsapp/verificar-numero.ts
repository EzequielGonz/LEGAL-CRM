/**
 * Verificar y registrar el número de una línea desde el panel (19/10).
 *
 * Caso: un número se agregó a la cuenta de WhatsApp Business pero quedó
 * «Pendiente» y en el Administrador de Meta no aparece dónde verificarlo. La
 * API de Meta permite hacerlo por pasos: pedir el código (SMS o llamada al
 * propio número), confirmarlo y registrar el número con un PIN de 6 dígitos.
 *
 * Solo actúa sobre números de la cuenta (WABA) que tiene cargada la línea: se
 * lista primero lo que Meta informa para esa cuenta y el número pedido tiene
 * que figurar ahí. No envía mensajes a personas: el código llega al número que
 * se está verificando. Nunca devuelve ni registra el token, el código ni el PIN;
 * los textos son propios, no se copian mensajes de Meta.
 */
import { META_GRAPH_VERSION } from "@/lib/plantillas/meta";

export type AccionNumero = "pedir_codigo" | "verificar" | "registrar";
export type MetodoCodigo = "SMS" | "VOICE";

export interface NumeroCuenta {
  id: string;
  telefono: string | null;
  nombreVerificado: string | null;
  /** Estado del número según Meta (CONNECTED, PENDING…), en mayúsculas. */
  estado: string | null;
  /** Estado del código de verificación (VERIFIED, NOT_VERIFIED, EXPIRED…). */
  codigo: string | null;
  calidad: string | null;
}

export interface ResultadoNumero<T = undefined> {
  ok: boolean;
  /** Texto propio para mostrar en el panel. */
  mensaje: string;
  datos?: T;
  /** Solo para el registro de cambios: sin códigos ni PIN. */
  http?: number;
}

type Fetcher = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; cache?: RequestCache; signal?: AbortSignal }
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

interface Opciones {
  env?: Record<string, string | undefined>;
  fetchImpl?: Fetcher;
  timeoutMs?: number;
}

const CAMPOS = "id,display_phone_number,verified_name,status,code_verification_status,quality_rating";

// --- Validaciones (puras) ---------------------------------------------------

export function validarCodigo(v: unknown): string | null {
  const s = typeof v === "string" ? v.replace(/[\s-]/g, "") : typeof v === "number" ? String(v) : "";
  return /^\d{6}$/.test(s) ? s : null;
}

export function validarPin(v: unknown): string | null {
  return validarCodigo(v);
}

export function validarMetodo(v: unknown): MetodoCodigo | null {
  return v === "SMS" || v === "VOICE" ? v : null;
}

export function esAccionNumero(v: unknown): v is AccionNumero {
  return v === "pedir_codigo" || v === "verificar" || v === "registrar";
}

/** Un identificador de número de Meta: solo dígitos. */
export function esIdNumero(v: unknown): v is string {
  return typeof v === "string" && /^\d{8,25}$/.test(v);
}

// --- Interpretación (pura) --------------------------------------------------

const CALIDAD: Record<string, string> = { GREEN: "alta", YELLOW: "media", RED: "baja", UNKNOWN: "sin calificar" };

export function filaANumero(f: any): NumeroCuenta | null {
  if (!f || !esIdNumero(String(f.id ?? ""))) return null;
  return {
    id: String(f.id),
    telefono: typeof f.display_phone_number === "string" ? f.display_phone_number : null,
    nombreVerificado: typeof f.verified_name === "string" && f.verified_name ? f.verified_name : null,
    estado: typeof f.status === "string" ? f.status.toUpperCase() : null,
    codigo: typeof f.code_verification_status === "string" ? f.code_verification_status.toUpperCase() : null,
    calidad: typeof f.quality_rating === "string" ? CALIDAD[f.quality_rating.toUpperCase()] ?? null : null,
  };
}

/** Texto para mostrar del estado de un número. */
export function etiquetaEstadoNumero(n: Pick<NumeroCuenta, "estado" | "codigo">): string {
  if (n.estado === "CONNECTED") return "Conectado";
  if (n.estado === "PENDING" || n.estado === "UNVERIFIED") {
    if (n.codigo === "VERIFIED") return "Pendiente: código confirmado, falta registrarlo";
    return "Pendiente: falta confirmar el código y registrarlo";
  }
  return n.estado ? `Estado en Meta: ${n.estado.toLowerCase()}` : "Sin estado informado";
}

/** Qué paso sigue para un número, según lo que informa Meta. */
export function pasoSiguiente(n: Pick<NumeroCuenta, "estado" | "codigo">): AccionNumero | null {
  if (n.estado === "CONNECTED") return null;
  if (n.codigo === "VERIFIED") return "registrar";
  return "pedir_codigo";
}

export function interpretarErrorNumero(accion: AccionNumero, httpStatus: number, codigo: number | null, subcodigo: number | null): string {
  if (codigo === 190 || httpStatus === 401) return "Meta rechazó el token de acceso de esta línea (inválido, vencido o revocado). Generá uno nuevo y cargalo en Vercel.";
  if (codigo === 10 || codigo === 200 || httpStatus === 403) {
    return "El token de esta línea no tiene permiso para administrar el número (hace falta el permiso de administración de WhatsApp Business sobre la cuenta).";
  }
  if (codigo === 100 && accion === "verificar") return "Meta no aceptó ese código. Revisalo (6 dígitos) o pedí uno nuevo.";
  if (codigo === 100 && accion === "registrar") return "Meta no aceptó el registro. Revisá que el PIN tenga 6 dígitos y que el código ya esté confirmado.";
  if (codigo === 100) return "Meta no encuentra ese número en la cuenta de esta línea.";
  if (codigo === 80007 || codigo === 4 || codigo === 613 || httpStatus === 429) return "Meta pide esperar antes de volver a intentar (límite de pedidos). Probá de nuevo en un rato.";
  if (subcodigo === 2388093 || subcodigo === 2388091) return "Meta no deja pedir otro código todavía. Esperá unos minutos y volvé a pedirlo.";
  return `Meta no respondió como se esperaba (código ${codigo ?? httpStatus}). Probá de nuevo en unos minutos.`;
}

const OK_MENSAJE: Record<AccionNumero, string> = {
  pedir_codigo: "Pedido enviado: Meta manda el código de 6 dígitos al propio número (por SMS o llamada). Puede demorar un par de minutos.",
  verificar: "Código confirmado. El paso que sigue es registrar el número con un PIN de 6 dígitos.",
  registrar: "Número registrado. Volvé a comprobar con Meta: tendría que figurar como conectado.",
};

// --- Llamadas a Meta --------------------------------------------------------

function acceso(clave: string, env: Record<string, string | undefined>) {
  const waba = env[`${clave}_WABA_ID`]?.trim();
  const token = env[`${clave}_ACCESS_TOKEN`]?.trim();
  return { waba, token };
}

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

/** Los números que Meta informa para la cuenta de la línea (solo lectura). */
export async function listarNumerosDeCuenta(clave: string, opciones: Opciones = {}): Promise<ResultadoNumero<NumeroCuenta[]>> {
  const env = opciones.env ?? process.env;
  const { waba, token } = acceso(clave, env);
  if (!waba || !token) {
    return { ok: false, mensaje: `Faltan ${!waba ? `${clave}_WABA_ID` : ""}${!waba && !token ? " y " : ""}${!token ? `${clave}_ACCESS_TOKEN` : ""} en Vercel.` };
  }
  const fetchImpl: Fetcher = opciones.fetchImpl ?? ((u, i) => fetch(u, i));
  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(waba)}/phone_numbers?fields=${CAMPOS}&limit=50`;
    const { res, json } = await llamar(fetchImpl, url, token, "GET", null, opciones.timeoutMs ?? 8000);
    if (!res.ok || json?.error) {
      const e = json?.error ?? {};
      return { ok: false, http: res.status, mensaje: interpretarErrorNumero("pedir_codigo", res.status, typeof e.code === "number" ? e.code : null, typeof e.error_subcode === "number" ? e.error_subcode : null) };
    }
    const numeros = (Array.isArray(json?.data) ? json.data : []).map(filaANumero).filter((n: NumeroCuenta | null): n is NumeroCuenta => !!n);
    return { ok: true, mensaje: numeros.length ? "Números de la cuenta según Meta." : "Meta no informa ningún número en la cuenta de esta línea.", datos: numeros, http: res.status };
  } catch {
    return { ok: false, mensaje: "No hubo respuesta de Meta a tiempo. Probá de nuevo en unos minutos." };
  }
}

export interface PedidoNumero {
  accion: AccionNumero;
  numeroId: string;
  metodo?: unknown;
  codigo?: unknown;
  pin?: unknown;
}

/**
 * Ejecuta un paso sobre un número de la cuenta de la línea. Antes lista los
 * números de la cuenta y exige que el pedido sea uno de ellos.
 */
export async function ejecutarPasoNumero(clave: string, pedido: PedidoNumero, opciones: Opciones = {}): Promise<ResultadoNumero> {
  if (!esAccionNumero(pedido.accion) || !esIdNumero(pedido.numeroId)) return { ok: false, mensaje: "Pedido no válido." };
  let cuerpo: Record<string, unknown>;
  let ruta: string;
  if (pedido.accion === "pedir_codigo") {
    const metodo = validarMetodo(pedido.metodo ?? "SMS");
    if (!metodo) return { ok: false, mensaje: "Elegí cómo recibir el código: SMS o llamada." };
    ruta = "request_code";
    cuerpo = { code_method: metodo, language: "es_AR" };
  } else if (pedido.accion === "verificar") {
    const codigo = validarCodigo(pedido.codigo);
    if (!codigo) return { ok: false, mensaje: "El código tiene que ser de 6 dígitos." };
    ruta = "verify_code";
    cuerpo = { code: codigo };
  } else {
    const pin = validarPin(pedido.pin);
    if (!pin) return { ok: false, mensaje: "El PIN tiene que ser de 6 dígitos." };
    ruta = "register";
    cuerpo = { messaging_product: "whatsapp", pin };
  }

  const env = opciones.env ?? process.env;
  const { token } = acceso(clave, env);
  const lista = await listarNumerosDeCuenta(clave, opciones);
  if (!lista.ok) return { ok: false, mensaje: lista.mensaje, http: lista.http };
  if (!lista.datos?.some((n) => n.id === pedido.numeroId)) return { ok: false, mensaje: "Ese número no figura en la cuenta de WhatsApp Business de esta línea." };

  const fetchImpl: Fetcher = opciones.fetchImpl ?? ((u, i) => fetch(u, i));
  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(pedido.numeroId)}/${ruta}`;
    const { res, json } = await llamar(fetchImpl, url, token as string, "POST", cuerpo, opciones.timeoutMs ?? 10000);
    if (!res.ok || json?.error || json?.success === false) {
      const e = json?.error ?? {};
      return { ok: false, http: res.status, mensaje: interpretarErrorNumero(pedido.accion, res.status, typeof e.code === "number" ? e.code : null, typeof e.error_subcode === "number" ? e.error_subcode : null) };
    }
    return { ok: true, http: res.status, mensaje: OK_MENSAJE[pedido.accion] };
  } catch {
    return { ok: false, mensaje: "No hubo respuesta de Meta a tiempo. Probá de nuevo en unos minutos." };
  }
}
