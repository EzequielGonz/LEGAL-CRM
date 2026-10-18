/**
 * Publicación en Instagram y Facebook a través de Metricool (18/10).
 *
 * Metricool ya tiene las cuentas de cada marca conectadas y programa aunque
 * el panel esté cerrado. El panel le manda cada pieza con su fecha y guarda
 * el identificador que devuelve. Credenciales en la configuración privada
 * del servidor (nunca en la base ni en el navegador):
 *   METRICOOL_USER_TOKEN  (Metricool › Configuración › API)
 *   METRICOOL_USER_ID
 * El identificador de la marca (blogId) de cada perfil va en
 * `content_policies.destino_ref`.
 */
import type { Canal, Formato } from "@/lib/contenido/politica";

export const METRICOOL_API = "https://app.metricool.com/api";

export interface CredencialesMetricool {
  token: string;
  userId: string;
}

export function credencialesMetricool(env: Record<string, string | undefined> = process.env): CredencialesMetricool | null {
  const token = (env.METRICOOL_USER_TOKEN ?? "").trim();
  const userId = (env.METRICOOL_USER_ID ?? "").trim();
  return token && userId ? { token, userId } : null;
}

export interface PiezaMetricool {
  canal: Canal;
  formato: Formato;
  texto: string;
  media: string[];
  alt: string[];
  /** ISO (UTC) de la publicación. */
  fecha: string;
  zonaHoraria: string;
}

/** Fecha local «YYYY-MM-DDTHH:mm:ss» en la zona pedida (formato de Metricool). */
export function fechaLocal(iso: string, zona: string): string {
  const d = new Date(iso);
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}:${v("second")}`;
}

/** Cuerpo del pedido de programación. Puro (se prueba sin red). */
export function cuerpoMetricool(p: PiezaMetricool): Record<string, unknown> {
  const historia = p.formato === "historia";
  const tipo = historia ? "STORY" : "POST";
  const cuerpo: Record<string, unknown> = {
    publicationDate: { dateTime: fechaLocal(p.fecha, p.zonaHoraria), timezone: p.zonaHoraria },
    providers: [{ network: p.canal }],
    media: p.media,
    mediaAltText: p.alt,
    autoPublish: true,
    draft: false,
    shortener: false,
    firstCommentText: "",
    descendants: [],
    hasNotReadNotes: false,
    smartLinkData: { ids: [] },
  };
  // Las historias no llevan texto propio.
  if (!historia) cuerpo.text = p.texto;
  if (p.canal === "instagram") cuerpo.instagramData = { type: tipo, isAiGenerated: true };
  if (p.canal === "facebook") cuerpo.facebookData = { type: tipo };
  return cuerpo;
}

export class MetricoolError extends Error {
  constructor(message: string, public status: number, public tipo?: string) {
    super(message);
    this.name = "MetricoolError";
  }
}

/** Programa la pieza en la marca indicada. Devuelve el identificador de Metricool. */
export async function programarEnMetricool(
  blogId: string,
  pieza: PiezaMetricool,
  cred: CredencialesMetricool | null = credencialesMetricool(),
  fetchImpl: typeof fetch = fetch
): Promise<{ id: string; url: string | null }> {
  if (!cred) throw new MetricoolError("Falta conectar Metricool en la configuración privada del servidor (METRICOOL_USER_TOKEN y METRICOOL_USER_ID).", 0, "sin_conexion");
  if (!/^\d+$/.test(blogId)) throw new MetricoolError("El identificador de la marca de Metricool no es válido.", 0, "sin_conexion");
  const qs = new URLSearchParams({ blogId, userId: cred.userId });
  let res: Response;
  try {
    res = await fetchImpl(`${METRICOOL_API}/v2/scheduler/posts?${qs.toString()}`, {
      method: "POST",
      headers: { "X-Mc-Auth": cred.token, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(cuerpoMetricool(pieza)),
    });
  } catch (err) {
    throw new MetricoolError(`Metricool no respondió: ${String((err as Error)?.message ?? err).slice(0, 160)}`, 0, "sin_respuesta");
  }
  const texto = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(texto);
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok) {
    const detalle = json?.message || json?.error || json?.detail || texto.slice(0, 200) || `HTTP ${res.status}`;
    throw new MetricoolError(`Metricool rechazó la publicación: ${detalle}`, res.status, res.status === 401 || res.status === 403 ? "token_vencido" : undefined);
  }
  const id = json?.data?.id ?? json?.id ?? json?.data?.uuid ?? null;
  if (!id) throw new MetricoolError("Metricool no devolvió identificador de la publicación.", res.status, "sin_respuesta");
  return { id: String(id), url: json?.data?.plannerUrl ?? json?.plannerUrl ?? null };
}

/** Borra una publicación programada en Metricool (antes de que salga). */
export async function borrarEnMetricool(blogId: string, postId: string, cred: CredencialesMetricool | null = credencialesMetricool(), fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!cred || !/^\d+$/.test(blogId) || !/^[\w-]{1,64}$/.test(postId)) return false;
  const qs = new URLSearchParams({ blogId, userId: cred.userId });
  try {
    const res = await fetchImpl(`${METRICOOL_API}/v2/scheduler/posts/${encodeURIComponent(postId)}?${qs.toString()}`, {
      method: "DELETE",
      headers: { "X-Mc-Auth": cred.token, Accept: "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}
