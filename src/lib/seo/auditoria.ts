/**
 * Etapa 3 · Auditoría de landings (solo lectura). Descarga UNA página pública
 * del propio sitio y revisa lo básico de SEO y conversión: título, descripción,
 * H1 único, viewport, canonical, imágenes sin alt, enlaces a WhatsApp visibles,
 * formularios, tamaño, HTTPS. No cambia nada, no sigue redirecciones a otros
 * dominios y rechaza direcciones privadas o no permitidas.
 */

export interface ProblemaAuditoria {
  clave: string;
  gravedad: "alta" | "media" | "baja";
  detalle: string;
  mejora: string;
}

export interface ResultadoAuditoria {
  url: string;
  status: number | null;
  titulo: string | null;
  descripcion: string | null;
  h1: string[];
  canonical: string | null;
  viewport: boolean;
  imagenesSinAlt: number;
  imagenes: number;
  enlacesWhatsapp: number;
  formularios: number;
  bytes: number;
  https: boolean;
  problemas: ProblemaAuditoria[];
  puntaje: number;
}

const BLOQUEADOS = [/^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^169\.254\./, /^\[?::1\]?$/, /\.local$/i, /^\d+\.\d+\.\d+\.\d+$/];

/** Solo http(s) a un host público; con `hostsPermitidos` se limita a los dominios propios. */
export function validarUrlAuditoria(url: string, hostsPermitidos: string[] = []): { ok: true; url: URL } | { ok: false; error: string } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, error: "La dirección no es válida." };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, error: "Solo se auditan direcciones http(s)." };
  if (u.username || u.password) return { ok: false, error: "La dirección no puede llevar usuario ni contraseña." };
  if (BLOQUEADOS.some((re) => re.test(u.hostname))) return { ok: false, error: "No se auditan direcciones privadas o numéricas." };
  if (hostsPermitidos.length && !hostsPermitidos.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))) {
    return { ok: false, error: "Solo se auditan los dominios propios configurados." };
  }
  return { ok: true, url: u };
}

function meta(html: string, nombre: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${nombre}["'][^>]*>`, "i");
  const m = html.match(re);
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1].trim() : null;
}

/** Análisis puro del HTML (sin red), para probar sin descargar. */
export function analizarHtml(url: string, html: string, status: number | null = 200): ResultadoAuditoria {
  const titulo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
  const descripcion = meta(html, "description");
  const h1 = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1] ?? null;
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const imgs = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
  const imagenesSinAlt = imgs.filter((i) => !/\balt=["'][^"']+["']/i.test(i)).length;
  const enlacesWhatsapp = (html.match(/href=["'](?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)[^"']*["']/gi) ?? []).length;
  const formularios = (html.match(/<form\b/gi) ?? []).length;
  const bytes = Buffer.byteLength(html, "utf8");
  const https = url.startsWith("https://");
  const problemas: ProblemaAuditoria[] = [];
  if (status && status >= 400) problemas.push({ clave: "estado", gravedad: "alta", detalle: `La página respondió ${status}.`, mejora: "Revisá que la dirección exista y responda 200." });
  if (!https) problemas.push({ clave: "https", gravedad: "alta", detalle: "La página no usa HTTPS.", mejora: "Publicá la landing con certificado y redirigí http → https." });
  if (!titulo) problemas.push({ clave: "titulo", gravedad: "alta", detalle: "Sin etiqueta <title>.", mejora: "Agregá un título de 30 a 60 caracteres con el servicio y la zona." });
  else if (titulo.length < 20 || titulo.length > 65) problemas.push({ clave: "titulo_largo", gravedad: "media", detalle: `El título tiene ${titulo.length} caracteres.`, mejora: "Apuntá a 30–60 caracteres." });
  if (!descripcion) problemas.push({ clave: "descripcion", gravedad: "media", detalle: "Sin meta descripción.", mejora: "Agregá una descripción de 70 a 155 caracteres con una invitación clara." });
  else if (descripcion.length < 50 || descripcion.length > 160) problemas.push({ clave: "descripcion_largo", gravedad: "baja", detalle: `La descripción tiene ${descripcion.length} caracteres.`, mejora: "Apuntá a 70–155 caracteres." });
  if (h1.length === 0) problemas.push({ clave: "h1", gravedad: "media", detalle: "Sin H1.", mejora: "Un único H1 que diga qué hacés y para quién." });
  if (h1.length > 1) problemas.push({ clave: "h1_multiple", gravedad: "baja", detalle: `${h1.length} H1 en la página.`, mejora: "Dejá un solo H1; el resto como H2." });
  if (!viewport) problemas.push({ clave: "viewport", gravedad: "alta", detalle: "Sin meta viewport: se ve mal en el celular.", mejora: "Agregá <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." });
  if (!canonical) problemas.push({ clave: "canonical", gravedad: "baja", detalle: "Sin enlace canónico.", mejora: "Agregá <link rel=\"canonical\"> con la dirección definitiva." });
  if (imagenesSinAlt > 0) problemas.push({ clave: "alt", gravedad: "media", detalle: `${imagenesSinAlt} de ${imgs.length} imágenes sin texto alternativo.`, mejora: "Describí cada imagen en el atributo alt." });
  if (enlacesWhatsapp === 0 && formularios === 0) problemas.push({ clave: "contacto", gravedad: "alta", detalle: "No se encontró un enlace a WhatsApp ni un formulario.", mejora: "Poné un botón de WhatsApp visible arriba y abajo de la página." });
  if (bytes > 1_500_000) problemas.push({ clave: "peso", gravedad: "media", detalle: `El HTML pesa ${(bytes / 1024).toFixed(0)} KB.`, mejora: "Reducí scripts y contenido incrustado." });
  const penal = problemas.reduce((a, p) => a + (p.gravedad === "alta" ? 20 : p.gravedad === "media" ? 10 : 4), 0);
  return { url, status, titulo, descripcion, h1, canonical, viewport, imagenesSinAlt, imagenes: imgs.length, enlacesWhatsapp, formularios, bytes, https, problemas, puntaje: Math.max(0, 100 - penal) };
}

/** Descarga con límite de tamaño y tiempo; sin seguir redirecciones a otro dominio. */
export async function auditarUrl(url: string, opts: { hostsPermitidos?: string[]; timeoutMs?: number; maxBytes?: number; fetchImpl?: typeof fetch } = {}): Promise<ResultadoAuditoria> {
  const v = validarUrlAuditoria(url, opts.hostsPermitidos ?? []);
  if (!v.ok) throw new Error(v.error);
  const f = opts.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
  try {
    const res = await f(v.url.toString(), { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": "CRM-auditoria-landing/1.0 (solo lectura)", accept: "text/html" } });
    if (res.status >= 300 && res.status < 400) {
      const destino = res.headers.get("location") ?? "";
      let mismoHost = false;
      try {
        mismoHost = new URL(destino, v.url).hostname === v.url.hostname;
      } catch {}
      if (!mismoHost) return analizarHtml(url, "", res.status);
      const res2 = await f(new URL(destino, v.url).toString(), { redirect: "manual", signal: ctrl.signal, headers: { accept: "text/html" } });
      const html2 = (await res2.text()).slice(0, opts.maxBytes ?? 2_000_000);
      return analizarHtml(url, html2, res2.status);
    }
    const html = (await res.text()).slice(0, opts.maxBytes ?? 2_000_000);
    return analizarHtml(url, html, res.status);
  } finally {
    clearTimeout(t);
  }
}
