import type { MetaTemplate } from "@/lib/plantillas/catalogo";

/**
 * Lectura del catálogo de plantillas en Meta (WhatsApp Business Management
 * API). Solo lee: no crea, no modifica ni envía nada.
 *
 * Accesos por configuración privada del servidor, por línea:
 *   <PREFIJO>_ACCESS_TOKEN  (ya existe para enviar)
 *   <PREFIJO>_WABA_ID       (identificador de la cuenta de WhatsApp Business)
 * El token nunca se guarda en la base ni se muestra.
 */
export const META_GRAPH_VERSION = "v21.0";
const GRAPH_HOST = "graph.facebook.com";
const MAX_PAGES = 50;

export class MetaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: number | null,
    public subcode: number | null = null
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

type FetchLike = (input: string, init?: { headers?: Record<string, string>; method?: string }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

function graphUrl(path: string, params: Record<string, string> = {}): string {
  const u = new URL(`https://${GRAPH_HOST}/${META_GRAPH_VERSION}/${path.replace(/^\/+/, "")}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

async function graphGet(url: string, token: string, fetchImpl: FetchLike): Promise<any> {
  const parsed = new URL(url);
  // Solo se siguen direcciones de la API de Meta (también en la paginación).
  if (parsed.protocol !== "https:" || parsed.hostname !== GRAPH_HOST) {
    throw new MetaApiError("Dirección de paginación inesperada", 0, null);
  }
  const res = await fetchImpl(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  if (!res.ok || data?.error) {
    const err = data?.error ?? {};
    const code = typeof err.code === "number" ? err.code : null;
    const sub = typeof err.error_subcode === "number" ? err.error_subcode : null;
    const msg = typeof err.message === "string" ? err.message : `Respuesta ${res.status} de Meta`;
    throw new MetaApiError(msg, res.status, code, sub);
  }
  return data;
}

/** Todas las plantillas de la cuenta (sigue la paginación). */
export async function listWabaTemplates(wabaId: string, token: string, fetchImpl: FetchLike = fetch as any): Promise<MetaTemplate[]> {
  const out: MetaTemplate[] = [];
  let url: string | null = graphUrl(`${encodeURIComponent(wabaId)}/message_templates`, { limit: "100" });
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data: any = await graphGet(url, token, fetchImpl);
    for (const t of Array.isArray(data?.data) ? data.data : []) {
      if (t && typeof t.name === "string" && typeof t.language === "string") out.push(t as MetaTemplate);
    }
    url = typeof data?.paging?.next === "string" ? data.paging.next : null;
  }
  return out;
}

/** Una plantilla por nombre e idioma (para confirmar su estado antes de lanzar). */
export async function findWabaTemplate(
  wabaId: string,
  token: string,
  name: string,
  language: string,
  fetchImpl: FetchLike = fetch as any
): Promise<MetaTemplate | null> {
  let url: string | null = graphUrl(`${encodeURIComponent(wabaId)}/message_templates`, { name, limit: "100" });
  for (let page = 0; url && page < 5; page++) {
    const data: any = await graphGet(url, token, fetchImpl);
    const hit = (Array.isArray(data?.data) ? data.data : []).find((t: any) => t?.name === name && t?.language === language);
    if (hit) return hit as MetaTemplate;
    url = typeof data?.paging?.next === "string" ? data.paging.next : null;
  }
  return null;
}

/** Números de la cuenta: sirve para comprobar que la línea pertenece a esa cuenta. */
export async function listWabaPhoneNumberIds(wabaId: string, token: string, fetchImpl: FetchLike = fetch as any): Promise<string[]> {
  const ids: string[] = [];
  let url: string | null = graphUrl(`${encodeURIComponent(wabaId)}/phone_numbers`, { fields: "id", limit: "100" });
  for (let page = 0; url && page < 5; page++) {
    const data: any = await graphGet(url, token, fetchImpl);
    for (const p of Array.isArray(data?.data) ? data.data : []) if (typeof p?.id === "string") ids.push(p.id);
    url = typeof data?.paging?.next === "string" ? data.paging.next : null;
  }
  return ids;
}

/** Mensaje para el panel, sin datos privados. */
export function metaErrorText(err: unknown): string {
  if (err instanceof MetaApiError) {
    const hints: Record<number, string> = {
      190: "El token de la línea no es válido o venció.",
      10: "El token no tiene permiso para leer las plantillas (whatsapp_business_management).",
      200: "El token no tiene permiso para leer las plantillas (whatsapp_business_management).",
      100: "El identificador de la cuenta de WhatsApp Business no es válido o no corresponde al token.",
    };
    const hint = err.code !== null ? hints[err.code] ?? (err.code >= 200 && err.code <= 299 ? hints[200] : null) : null;
    return `${hint ? `${hint} ` : ""}Meta respondió: ${err.message}${err.code !== null ? ` (código ${err.code})` : ""}`;
  }
  return `No se pudo consultar a Meta: ${String((err as any)?.message ?? err)}`;
}
