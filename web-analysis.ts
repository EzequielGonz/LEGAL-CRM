import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Análisis técnico del sitio web de un negocio.
 *
 * Seguridad (SSRF): el sitio lo publica el negocio en Google Maps, o lo
 * escribe un prospecto en el chat — o sea que es una URL que no controlamos.
 * Antes de pedirla se resuelve el dominio y se rechaza cualquier IP
 * privada/local (127.x, 10.x, 192.168.x, 169.254.x metadata de la nube,
 * etc.). Los redirects se siguen a mano (máx. 3) y se vuelve a validar cada
 * destino. Solo http/https en los puertos 80/443, con tope de tiempo y de
 * tamaño de descarga.
 */

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 600_000;
const MAX_REDIRECTS = 3;

/**
 * Por qué no se pudo analizar el sitio. Solo 'sitio_caido' y 'certificado' son
 * problemas REALES del negocio que se pueden afirmar; el resto (bloqueo anti-bots,
 * demora, error de red nuestro) no prueba nada, así que no se informa como falla.
 */
export type WebErrorKind = "sitio_caido" | "certificado" | "bloqueado" | "demora" | "indeterminado" | "invalida";

export interface WebSignals {
  reachable: boolean;
  error: string | null;
  errorKind: WebErrorKind | null;
  finalUrl: string | null;
  status: number | null;
  https: boolean;
  responseMs: number | null;
  htmlKb: number | null;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  hasViewport: boolean;
  hasWhatsappLink: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasForm: boolean;
  hasBookingOrShop: boolean;
  social: { facebook: boolean; instagram: boolean; tiktok: boolean; youtube: boolean; linkedin: boolean };
  hasAnalytics: boolean;
  hasMetaPixel: boolean;
  platform: string | null;
  imageCount: number;
  imagesWithoutAlt: number;
  lastCopyrightYear: number | null;
}

export function emptyWebSignals(error: string | null, errorKind: WebErrorKind | null = null): WebSignals {
  return {
    reachable: false,
    error,
    errorKind,
    finalUrl: null,
    status: null,
    https: false,
    responseMs: null,
    htmlKb: null,
    title: null,
    metaDescription: null,
    h1Count: 0,
    hasViewport: false,
    hasWhatsappLink: false,
    hasPhoneLink: false,
    hasEmailLink: false,
    hasForm: false,
    hasBookingOrShop: false,
    social: { facebook: false, instagram: false, tiktok: false, youtube: false, linkedin: false },
    hasAnalytics: false,
    hasMetaPixel: false,
    platform: null,
    imageCount: 0,
    imagesWithoutAlt: 0,
    lastCopyrightYear: null,
  };
}

/** Normaliza lo que haya escrito alguien como "sitio web" a una URL https válida, o null. */
export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value || value.length > 300 || /\s/.test(value)) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true; // fe80::/10
  }
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Host no permitido");
  }
  if (net.isIP(hostname)) {
    const bad = net.isIPv6(hostname) ? isPrivateIPv6(hostname) : isPrivateIPv4(hostname);
    if (bad) throw new Error("Host no permitido");
    return;
  }
  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0) throw new Error("El dominio no resuelve");
  for (const addr of addresses) {
    const bad = addr.family === 6 ? isPrivateIPv6(addr.address) : isPrivateIPv4(addr.address);
    if (bad) throw new Error("Host no permitido");
  }
}

async function readLimited(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  try {
    await reader.cancel();
  } catch {
    // nada: ya leímos lo necesario
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

interface FetchedPage {
  html: string;
  finalUrl: string;
  status: number;
  ms: number;
}

async function fetchPageSafely(startUrl: string): Promise<FetchedPage> {
  let current = startUrl;
  const started = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = new URL(current);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Protocolo no permitido");
    if (url.port && url.port !== "80" && url.port !== "443") throw new Error("Puerto no permitido");
    await assertPublicHost(url.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; KocosMarketingBot/1.0; +analisis-comercial)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-AR,es;q=0.9",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) throw new Error("Redirect sin destino");
        current = new URL(location, url).toString();
        continue;
      }

      const html = await readLimited(res);
      return { html, finalUrl: url.toString(), status: res.status, ms: Date.now() - started };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Demasiados redirects");
}

function firstMatch(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  return m && m[1] ? m[1].replace(/\s+/g, " ").trim() : null;
}

function detectPlatform(html: string): string | null {
  const lower = html.toLowerCase();
  if (lower.includes("wixstatic.com") || lower.includes("wix.com")) return "Wix";
  if (lower.includes("/wp-content/") || lower.includes("wp-includes")) return "WordPress";
  if (lower.includes("cdn.shopify.com")) return "Shopify";
  if (lower.includes("tiendanube") || lower.includes("nuvemshop")) return "Tienda Nube";
  if (lower.includes("squarespace")) return "Squarespace";
  if (lower.includes("webflow")) return "Webflow";
  if (lower.includes("godaddy") || lower.includes("websitebuilder")) return "GoDaddy";
  if (lower.includes("jimdo")) return "Jimdo";
  if (lower.includes("blogspot.com") || lower.includes("blogger.com")) return "Blogger";
  return null;
}

export function extractSignals(html: string, finalUrl: string, status: number, ms: number): WebSignals {
  const lower = html.toLowerCase();
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithoutAlt = imgTags.filter((t) => !/\balt\s*=\s*["'][^"']+["']/i.test(t)).length;
  const years = Array.from(html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,30}((?:19|20)\d{2})/gi)).map((m) =>
    Number(m[1])
  );

  return {
    reachable: status >= 200 && status < 400,
    error: status >= 400 ? `El sitio respondió con error ${status}` : null,
    errorKind:
      status < 400
        ? null
        : [401, 403, 406, 429, 503].includes(status)
          ? "bloqueado"
          : [404, 410, 500, 502, 504].includes(status)
            ? "sitio_caido"
            : "indeterminado",
    finalUrl,
    status,
    https: finalUrl.startsWith("https://"),
    responseMs: ms,
    htmlKb: Math.round(html.length / 1024),
    title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    h1Count: (html.match(/<h1\b/gi) ?? []).length,
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    hasWhatsappLink: /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com/i.test(html),
    hasPhoneLink: /href=["']tel:/i.test(html),
    hasEmailLink: /href=["']mailto:/i.test(html),
    hasForm: /<form\b/i.test(html),
    hasBookingOrShop:
      /(reserv|turnos?\b|agendar|agenda tu|carrito|add[-_ ]to[-_ ]cart|comprar ahora|mercadopago|tienda online)/i.test(
        html
      ),
    social: {
      facebook: /facebook\.com\//i.test(html),
      instagram: /instagram\.com\//i.test(html),
      tiktok: /tiktok\.com\//i.test(html),
      youtube: /youtube\.com\/|youtu\.be\//i.test(html),
      linkedin: /linkedin\.com\//i.test(html),
    },
    hasAnalytics: /googletagmanager\.com|google-analytics\.com|gtag\(|ga\(['"]create/i.test(html),
    hasMetaPixel: /connect\.facebook\.net|fbq\(/i.test(lower),
    platform: detectPlatform(html),
    imageCount: imgTags.length,
    imagesWithoutAlt,
    lastCopyrightYear: years.length > 0 ? Math.max(...years) : null,
  };
}

/** Analiza un sitio web. Nunca tira error: si no se puede abrir, lo informa en `error`. */
export async function analyzeWebsite(rawUrl: string): Promise<WebSignals> {
  const url = normalizeWebsiteUrl(rawUrl);
  if (!url) return emptyWebSignals("URL inválida");

  const hadScheme = /^https?:\/\//i.test(rawUrl.trim());

  async function attempt(target: string): Promise<WebSignals> {
    try {
      const page = await fetchPageSafely(target);
      return extractSignals(page.html, page.finalUrl, page.status, page.ms);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return emptyWebSignals("El sitio tardó demasiado en responder", "demora");
      }
      const code = String(err?.cause?.code ?? err?.code ?? "");
      const message = String(err?.message ?? err);
      if (/no permitido|Protocolo|Puerto|Redirect|redirects/i.test(message)) {
        return emptyWebSignals(message, "invalida");
      }
      if (code === "ENOTFOUND" || code === "ECONNREFUSED") {
        return emptyWebSignals("El dominio no responde o no existe", "sitio_caido");
      }
      if (/^(CERT_|ERR_TLS|DEPTH_ZERO|SELF_SIGNED|UNABLE_TO_VERIFY|ERR_SSL)/.test(code) || /certificate/i.test(message)) {
        return emptyWebSignals("El certificado de seguridad del sitio es inválido o está vencido", "certificado");
      }
      return emptyWebSignals(message, "indeterminado");
    }
  }

  const first = await attempt(url);
  // Muchos sitios viejos no tienen certificado: si no se escribió el
  // protocolo y https falló por conexión, se prueba una vez con http.
  if (
    !first.reachable &&
    !hadScheme &&
    url.startsWith("https://") &&
    ["certificado", "indeterminado", "sitio_caido"].includes(first.errorKind ?? "")
  ) {
    const second = await attempt(url.replace("https://", "http://"));
    if (second.reachable) return second;
  }
  return first;
}
