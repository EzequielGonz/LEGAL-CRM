/**
 * Etapa 2 · Bloque 2.8 — Fuente de un mensaje entrante (pura, sin dependencias).
 *
 * Solo se acredita lo que el mensaje permite comprobar:
 *  - Referencia de Meta de un anuncio («clic a WhatsApp», anuncio de
 *    Instagram o Facebook) → «anuncio».
 *  - Referencia de una publicación orgánica → «instagram» o «facebook»
 *    según la dirección de origen.
 *  - Mensaje directo por Instagram o Facebook → esa red.
 *  - Texto identificador de un mensaje prearmado (configurado por perfil)
 *    → la fuente configurada (por ejemplo, la landing).
 *  - Contacto que vino de una base importada → «base_importada».
 *  - Sin referencia → «no_informada». Nunca se supone pago u orgánico.
 */

export const FUENTES = ["landing", "facebook", "instagram", "anuncio", "base_importada", "no_informada"] as const;
export type Fuente = (typeof FUENTES)[number];

export const FUENTE_LABEL: Record<Fuente, string> = {
  landing: "Landing",
  facebook: "Facebook",
  instagram: "Instagram",
  anuncio: "Anuncio",
  base_importada: "Base importada",
  no_informada: "No informada",
};

/** Redes desde las que puede llegar una visita a la landing. */
export const NOMBRE_RED: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", google: "Google", tiktok: "TikTok" };

/** Red de llegada informada por el formulario de la landing (lo demás se ignora). */
export function redDeLlegada(v: unknown): string | null {
  const k = typeof v === "string" ? v.trim().toLowerCase() : "";
  return NOMBRE_RED[k] ?? null;
}

export interface IdentificadorFuente {
  texto: string;
  fuente: Fuente;
}

export function esFuente(v: unknown): v is Fuente {
  return typeof v === "string" && (FUENTES as readonly string[]).includes(v);
}

/** Normaliza para comparar textos prearmados (sin tildes, espacios ni mayúsculas). */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Identificadores válidos de la configuración del perfil (lo demás se ignora). */
export function identificadoresValidos(v: unknown): IdentificadorFuente[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x.texto === "string" && normalizarTexto(x.texto).length >= 6 && esFuente(x.fuente) && x.fuente !== "no_informada")
    .map((x) => ({ texto: String(x.texto), fuente: x.fuente as Fuente }));
}

function host(url: unknown): string {
  if (typeof url !== "string") return "";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function detectarFuente(input: {
  channelType: string;
  metadata?: Record<string, unknown> | null;
  body?: string | null;
  identificadores?: IdentificadorFuente[];
  /** Origen del contacto (por ejemplo, base_de_datos si vino de una base). */
  contactSource?: string | null;
}): { fuente: Fuente; detalle: string | null } {
  const ref = (input.metadata?.referral ?? null) as Record<string, any> | null;
  if (ref && typeof ref === "object") {
    const tipo = String(ref.source_type ?? ref.source ?? ref.type ?? "").toLowerCase();
    const adId = ref.source_id ?? ref.ad_id ?? null;
    const titulo = typeof ref.headline === "string" ? ref.headline.slice(0, 120) : null;
    if (tipo === "ad" || tipo === "ads" || adId) {
      return { fuente: "anuncio", detalle: [adId ? `anuncio ${adId}` : null, titulo].filter(Boolean).join(" · ") || "anuncio" };
    }
    const h = host(ref.source_url);
    if (h.endsWith("instagram.com")) return { fuente: "instagram", detalle: "publicación de Instagram" };
    if (h.endsWith("facebook.com") || h.endsWith("fb.com") || h.endsWith("fb.me")) return { fuente: "facebook", detalle: "publicación de Facebook" };
  }
  if (input.channelType === "instagram") return { fuente: "instagram", detalle: "mensaje directo" };
  if (input.channelType === "facebook") return { fuente: "facebook", detalle: "mensaje directo" };
  const body = input.body ? normalizarTexto(input.body) : "";
  if (body) {
    for (const id of input.identificadores ?? []) {
      if (body.includes(normalizarTexto(id.texto))) {
        // Landings (16/10): «(llegué desde Instagram)» si la visita vino de una red.
        const red = /llegue desde (instagram|facebook|google|tiktok)/.exec(body)?.[1];
        return { fuente: id.fuente, detalle: red ? `mensaje prearmado · llegó desde ${NOMBRE_RED[red]}` : "mensaje prearmado" };
      }
    }
  }
  if (input.contactSource === "base_de_datos") return { fuente: "base_importada", detalle: null };
  return { fuente: "no_informada", detalle: null };
}

/** 24/10: cada audio o archivo recibe el pedido de que lo escriba (como mucho uno cada 30 minutos; antes 12 h y el segundo audio quedaba sin respuesta). */
export const PEDIDO_TEXTO_HORAS = 0.5;
export const TEXTO_PEDIDO_TEXTO =
  "Recibí tu mensaje, pero por ahora no puedo escuchar audios ni abrir archivos. ¿Me lo podés escribir en un mensaje de texto?";

export function correspondePedidoTexto(ultimoPedidoAt: Date | null, now: Date): boolean {
  return !ultimoPedidoAt || now.getTime() - ultimoPedidoAt.getTime() >= PEDIDO_TEXTO_HORAS * 3_600_000;
}
