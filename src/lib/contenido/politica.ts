/**
 * Etapa 2 · Bloque 5 — Política de autopublicación (pura, sin dependencias).
 *
 * Dentro de una política HABILITADA por la responsable, una pieza rutinaria
 * que cumple se programa y publica sin aprobación individual. Se retiene
 * SOLO la que necesita información nueva, evidencia o una decisión
 * sensible, con su motivo; las demás siguen. Sin política habilitada no se
 * supone autorización.
 */

export const CANALES = ["instagram", "facebook", "landing"] as const;
export type Canal = (typeof CANALES)[number];
export const FORMATOS = ["post", "carrusel", "historia", "video", "articulo"] as const;
export type Formato = (typeof FORMATOS)[number];

export const FORMATOS_POR_CANAL: Record<Canal, Formato[]> = {
  instagram: ["post", "carrusel", "historia", "video"],
  facebook: ["post", "carrusel", "historia", "video"],
  landing: ["articulo"],
};

/** Límites de cada destino (Instagram: 2.200 caracteres y 30 hashtags). */
export const LIMITES_CANAL: Record<Canal, { maxTexto: number; maxHashtags: number; requiereMedia: boolean }> = {
  instagram: { maxTexto: 2200, maxHashtags: 30, requiereMedia: true },
  facebook: { maxTexto: 5000, maxHashtags: 30, requiereMedia: false },
  landing: { maxTexto: 40000, maxHashtags: 0, requiereMedia: false },
};

export interface PoliticaContenido {
  habilitada: boolean;
  calendario_pausado: boolean;
  destino_ref: string | null;
  ctas: { tipo: string; url: string }[];
  hechos_autorizados?: { hecho: string; fuente?: string; revisado?: string }[];
}

export interface PiezaContenido {
  canal: Canal;
  formato: Formato;
  texto: string;
  titulo?: string | null;
  cta_url?: string | null;
  media?: { tipo: string; ref: string; alt?: string }[];
  afirmaciones?: { texto: string; evidencia?: string | null }[];
}

export type MotivoRetencion =
  | "politica_apagada"
  | "calendario_en_pausa"
  | "sin_destino"
  | "sin_cta_configurado"
  | "formato_no_admitido"
  | "texto_vacio"
  | "texto_largo"
  | "demasiados_hashtags"
  | "falta_media"
  | "media_sin_texto_alternativo"
  | "sin_cta"
  | "cta_no_autorizado"
  | "placeholder"
  | "afirmacion_sin_evidencia"
  | "contenido_sensible";

export const MOTIVO_RETENCION_TEXTO: Record<MotivoRetencion, string> = {
  politica_apagada: "La autopublicación de este perfil y canal está apagada",
  calendario_en_pausa: "El calendario está en pausa",
  sin_destino: "No hay una cuenta o página conectada para este canal",
  sin_cta_configurado: "El perfil todavía no tiene WhatsApp, formulario o landing configurados para este canal",
  formato_no_admitido: "El formato no está disponible en este canal",
  texto_vacio: "La pieza no tiene texto",
  texto_largo: "El texto supera el máximo del canal",
  demasiados_hashtags: "Tiene más hashtags de los que admite el canal",
  falta_media: "Este canal necesita una imagen o un video",
  media_sin_texto_alternativo: "Falta el texto alternativo de una imagen",
  sin_cta: "Falta el llamado a la acción (WhatsApp, formulario o landing configurados)",
  cta_no_autorizado: "El enlace no es uno de los configurados para este perfil",
  placeholder: "Tiene un texto de relleno o un dato por completar",
  afirmacion_sin_evidencia: "Incluye una afirmación sensible sin evidencia",
  contenido_sensible: "Menciona precios, resultados, plazos, financiación, testimonios o casos: necesita evidencia o una decisión",
};

/** Bloqueos de política (no son defectos de la pieza): la pieza queda lista y espera. */
export const MOTIVOS_DE_POLITICA: MotivoRetencion[] = ["politica_apagada", "calendario_en_pausa", "sin_destino", "sin_cta_configurado"];

const PLACEHOLDER = [/\{\{?[^}]*\}\}?/, /\[[^\]]*(completar|nombre|link|enlace|url|tel[eé]fono|precio)[^\]]*\]/i, /\bX{3,}\b/, /lorem ipsum/i, /\bTODO\b/, /\bcompletar\b/i, /example\.com/i, /\b0{6,}\b/];

/** Palabras que convierten una frase en afirmación sensible (piden evidencia o decisión). */
const SENSIBLE = [
  /\$\s?\d/, /\bprecio/i, /\bcuotas?\b/i, /\bfinanciaci[oó]n/i, /\bpromo(ci[oó]n)?\b/i, /\bdescuento/i, /\d+\s?%/,
  /\bgarantiz/i, /\bindemnizaci/i, /\bresultado(s)? (asegurad|garantizad)/i, /\bcaso(s)? de [ée]xito/i, /\btestimonio/i,
  /\ben \d+ (d[ií]as|horas|semanas)\b/i, /\bplazo/i, /\bcobertura total\b/i, /\bsin carencia/i, /\bstock\b/i, /\bentrega inmediata\b/i,
];

export function tienePlaceholder(texto: string): boolean {
  return PLACEHOLDER.some((re) => re.test(texto));
}

export function frasesSensibles(texto: string): string[] {
  return texto
    .split(/(?<=[.!?¡¿\n])\s+/)
    .map((f) => f.trim())
    .filter((f) => f && SENSIBLE.some((re) => re.test(f)));
}

function normalizarUrl(u: string): string {
  try {
    const x = new URL(u);
    return `${x.protocol}//${x.host.toLowerCase()}${x.pathname.replace(/\/$/, "")}`;
  } catch {
    return "";
  }
}

export interface EvaluacionPieza {
  publicable: boolean;
  /** true si el problema es de la pieza (información, evidencia o decisión). */
  retener: boolean;
  motivos: MotivoRetencion[];
}

export function evaluarPieza(p: PiezaContenido, pol: PoliticaContenido): EvaluacionPieza {
  const m: MotivoRetencion[] = [];
  const lim = LIMITES_CANAL[p.canal];
  const texto = (p.texto ?? "").trim();
  if (!FORMATOS_POR_CANAL[p.canal]?.includes(p.formato)) m.push("formato_no_admitido");
  if (!texto) m.push("texto_vacio");
  if (texto.length > lim.maxTexto) m.push("texto_largo");
  if ((texto.match(/#[\p{L}\p{N}_]+/gu) ?? []).length > lim.maxHashtags) m.push("demasiados_hashtags");
  const media = p.media ?? [];
  if (lim.requiereMedia && media.length === 0) m.push("falta_media");
  if (media.some((x) => x.tipo === "imagen" && !(x.alt ?? "").trim())) m.push("media_sin_texto_alternativo");
  const cta = (p.cta_url ?? "").trim();
  if (!cta) m.push("sin_cta");
  else if (pol.ctas.length > 0 && !pol.ctas.some((c) => normalizarUrl(c.url) && normalizarUrl(c.url) === normalizarUrl(cta))) m.push("cta_no_autorizado");
  if (tienePlaceholder(`${p.titulo ?? ""}\n${texto}\n${cta}`)) m.push("placeholder");
  const sensibles = frasesSensibles(`${p.titulo ?? ""}\n${texto}`);
  const conEvidencia = (p.afirmaciones ?? []).filter((a) => (a.evidencia ?? "").trim());
  if ((p.afirmaciones ?? []).some((a) => !(a.evidencia ?? "").trim())) m.push("afirmacion_sin_evidencia");
  if (sensibles.some((f) => !conEvidencia.some((a) => f.includes(a.texto.trim()) || a.texto.includes(f)))) m.push("contenido_sensible");

  const retener = m.length > 0;
  if (!pol.habilitada) m.push("politica_apagada");
  if (pol.calendario_pausado) m.push("calendario_en_pausa");
  if (!pol.destino_ref) m.push("sin_destino");
  if (pol.ctas.length === 0) m.push("sin_cta_configurado");
  return { publicable: m.length === 0, retener, motivos: m };
}

/** Estado que corresponde a una pieza nueva según la evaluación. */
export function estadoInicial(ev: EvaluacionPieza, tieneFecha: boolean): "retenida" | "lista" | "programada" {
  if (ev.retener) return "retenida";
  if (!ev.publicable || !tieneFecha) return "lista";
  return "programada";
}

/** Clasificación de un fallo al publicar: reintentar, revisar o reconciliar antes de repetir. */
export function clasificarFalloPublicacion(err: { tipo?: string; status?: number } | null | undefined): "incierta" | "error" | "token_vencido" {
  if (!err) return "incierta";
  if (err.tipo === "token_vencido" || err.status === 401) return "token_vencido";
  if (err.tipo === "sin_respuesta" || err.tipo === "tiempo_vencido" || (err.status ?? 0) >= 500) return "incierta";
  return "error";
}
