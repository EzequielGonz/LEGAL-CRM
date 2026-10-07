import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeWebsite, normalizeWebsiteUrl, type WebSignals } from "./web-analysis";
import { searchGooglePlaces } from "./google-places";
import { logMarketingEvent } from "./leads";

/**
 * Análisis comercial de un negocio (sitio web + ficha de Google Maps).
 *
 * Dos capas:
 *  1) DETERMINÍSTICA: reglas fijas que detectan problemas concretos y les
 *     asignan un peso. De ahí sale el puntaje (0-100) y la prioridad — así
 *     el resultado es explicable y repetible, no depende del humor del
 *     modelo.
 *  2) IA (Gemini): redacta el "gancho" del primer mensaje, el resumen para
 *     el equipo y los servicios a proponer. Si Gemini falla, el análisis
 *     igual se completa con textos armados por reglas.
 */

export type Severity = "alta" | "media" | "baja";

export interface Finding {
  codigo: string;
  area: "web" | "google_maps" | "conversion";
  severidad: Severity;
  peso: number;
  problema: string;
  impacto: string;
  mejora: string;
  /** Frase corta que completa "notamos que ..." en el primer mensaje. */
  gancho: string;
}

export interface MapsData {
  rating: number | null;
  ratingCount: number | null;
  photosCount: number | null;
  verified: boolean | null;
  hasHours: boolean | null;
  businessStatus: string | null;
  categories: string[];
  address: string | null;
  description: string | null;
  facebook: string | null;
  instagram: string | null;
  email: string | null;
  mapsUrl: string | null;
  rubro_buscado?: string | null;
  zona_buscada?: string | null;
}

export interface LeadAnalysis {
  version: 1;
  tiene_sitio_web: boolean;
  web: WebSignals | null;
  hallazgos: Finding[];
  puntos_clave: string[];
  servicios_sugeridos: string[];
  generado_con_ia: boolean;
}

export const PRIORITY_HIGH_MIN = 60;
export const PRIORITY_MEDIUM_MIN = 35;

export function priorityForScore(score: number): Severity {
  if (score >= PRIORITY_HIGH_MIN) return "alta";
  if (score >= PRIORITY_MEDIUM_MIN) return "media";
  return "baja";
}

function severityForWeight(weight: number): Severity {
  if (weight >= 12) return "alta";
  if (weight >= 7) return "media";
  return "baja";
}

function finding(
  codigo: string,
  area: Finding["area"],
  peso: number,
  problema: string,
  impacto: string,
  mejora: string,
  gancho: string
): Finding {
  return { codigo, area, severidad: severityForWeight(peso), peso, problema, impacto, mejora, gancho };
}

/** Reglas de detección. Los datos que no se conocen (null) NO generan hallazgo. */
export function buildFindings(
  maps: Partial<MapsData>,
  web: WebSignals | null,
  hasWebsite: boolean,
  socialOnlyUrl: string | null = null
): Finding[] {
  const out: Finding[] = [];
  const currentYear = new Date().getFullYear();

  if (!hasWebsite) {
    out.push(
      finding(
        "sin_web",
        "web",
        45,
        socialOnlyUrl
          ? `No tiene sitio web propio: en Google figura solo una red social o link (${socialOnlyUrl}).`
          : "No tiene sitio web propio publicado.",
        "Quien lo busca en Google no puede ver servicios, precios ni contactarlo fuera de la ficha. Pierde consultas frente a competidores que sí tienen web.",
        "Sitio web profesional, rápido y adaptado a celulares, con botón de WhatsApp.",
        "no tienen página web propia"
      )
    );
  } else if (web) {
    if (!web.reachable) {
      // Solo se afirma lo que está comprobado: un bloqueo anti-bots, una demora o un
      // error de red nuestro NO prueban que el sitio tenga un problema, así que no generan hallazgo.
      if (web.errorKind === "sitio_caido") {
        out.push(
          finding(
            "web_caida",
            "web",
            40,
            `El sitio web no abre (${web.error ?? "sin respuesta"}).`,
            "Los clientes que llegan desde Google encuentran un error y se van con la competencia.",
            "Recuperar o rehacer el sitio web y dejarlo funcionando.",
            "su página web no está abriendo"
          )
        );
      } else if (web.errorKind === "certificado") {
        out.push(
          finding(
            "certificado_invalido",
            "web",
            14,
            "El certificado de seguridad del sitio es inválido o está vencido.",
            "Los navegadores muestran una advertencia de 'sitio peligroso' y casi nadie se anima a entrar.",
            "Renovar o instalar el certificado de seguridad.",
            "su página web muestra una advertencia de seguridad en el navegador"
          )
        );
      }
    } else {
      if (!web.https) {
        out.push(
          finding(
            "sin_https",
            "web",
            10,
            "El sitio no usa conexión segura (https).",
            "Los navegadores muestran un cartel de 'sitio no seguro' que ahuyenta clientes y Google lo posiciona peor.",
            "Instalar certificado de seguridad.",
            "su página web figura como 'no segura' en el navegador"
          )
        );
      }
      if (!web.hasViewport) {
        out.push(
          finding(
            "no_movil",
            "web",
            12,
            "El sitio no está adaptado para celulares.",
            "La mayoría de las búsquedas locales se hacen desde el celular: se ve mal y la gente se va.",
            "Rediseño adaptable (responsive).",
            "su página web no está adaptada para celulares"
          )
        );
      }
      if (!web.hasWhatsappLink) {
        out.push(
          finding(
            "web_sin_whatsapp",
            "conversion",
            8,
            "El sitio no tiene botón de WhatsApp.",
            "Cada paso extra para contactar al negocio hace perder consultas.",
            "Botón de WhatsApp visible en todo el sitio.",
            "su página web no tiene un botón de WhatsApp para que los clientes escriban"
          )
        );
      }
      if (!web.title || !web.metaDescription) {
        out.push(
          finding(
            "seo_basico",
            "web",
            7,
            "Faltan el título o la descripción que Google muestra en los resultados.",
            "El negocio aparece poco o con un texto pobre en las búsquedas.",
            "Optimización SEO básica (títulos, descripciones, estructura).",
            "su página web casi no aparece en Google por falta de datos básicos"
          )
        );
      }
      if (!web.hasAnalytics && !web.hasMetaPixel) {
        out.push(
          finding(
            "sin_medicion",
            "conversion",
            6,
            "No tiene herramientas de medición (Google Analytics / Pixel de Meta).",
            "No se sabe cuántas visitas ni de dónde vienen, y no se puede hacer publicidad inteligente.",
            "Instalar métricas y pixel para medir y re-impactar visitantes.",
            "su página web no mide cuántas personas la visitan"
          )
        );
      }
      if (!web.hasForm && !web.hasBookingOrShop) {
        out.push(
          finding(
            "sin_captacion",
            "conversion",
            5,
            "El sitio no tiene formulario ni reservas/ventas online.",
            "Solo convierte a quien se anima a llamar.",
            "Formulario de contacto y, según el rubro, reservas o tienda online.",
            "su página web no permite reservar ni consultar online"
          )
        );
      }
      if ((web.responseMs ?? 0) > 3500 || (web.htmlKb ?? 0) > 1500) {
        out.push(
          finding(
            "web_lenta",
            "web",
            6,
            "El sitio carga lento o es muy pesado.",
            "Más de la mitad de la gente abandona un sitio que tarda en cargar.",
            "Optimización de velocidad.",
            "su página web carga muy lento"
          )
        );
      }
      if (web.lastCopyrightYear && web.lastCopyrightYear <= currentYear - 3) {
        out.push(
          finding(
            "web_vieja",
            "web",
            6,
            `El sitio parece desactualizado (último año publicado: ${web.lastCopyrightYear}).`,
            "Transmite descuido y el cliente duda de que el negocio siga activo.",
            "Actualización de diseño y contenido.",
            "su página web se ve desactualizada"
          )
        );
      }
      if (!Object.values(web.social).some(Boolean)) {
        out.push(
          finding(
            "web_sin_redes",
            "conversion",
            4,
            "El sitio no enlaza a redes sociales.",
            "No hay forma de que el visitante vea trabajos reales ni siga al negocio.",
            "Vincular redes y mostrar contenido real.",
            "su página web no está conectada con sus redes sociales"
          )
        );
      }
    }
  }

  // --- Ficha de Google Maps ---
  if (maps.photosCount != null && maps.photosCount < 10) {
    out.push(
      finding(
        "pocas_fotos",
        "google_maps",
        8,
        `La ficha de Google tiene muy pocas fotos (${maps.photosCount}).`,
        "Las fichas con fotos reciben muchas más visitas y llamadas.",
        "Sesión de fotos y carga ordenada en Google Maps.",
        "su ficha de Google tiene muy pocas fotos"
      )
    );
  }
  if (maps.rating != null && maps.ratingCount != null && maps.ratingCount >= 5 && maps.rating < 4.0) {
    out.push(
      finding(
        "rating_bajo",
        "google_maps",
        9,
        `Puntaje bajo en Google (${maps.rating} con ${maps.ratingCount} reseñas).`,
        "Debajo de 4 estrellas, muchos clientes ni siquiera consideran al negocio.",
        "Plan de reputación: pedir reseñas a clientes satisfechos y responder las críticas.",
        `su puntaje en Google es de ${maps.rating} estrellas`
      )
    );
  }
  if (maps.ratingCount != null && maps.ratingCount < 20) {
    out.push(
      finding(
        "pocas_resenas",
        "google_maps",
        8,
        `Pocas reseñas en Google (${maps.ratingCount}).`,
        "Los competidores con más reseñas aparecen primero y generan más confianza.",
        "Sistema para pedir reseñas a cada cliente.",
        "tienen muy pocas reseñas en Google"
      )
    );
  }
  if (maps.hasHours === false) {
    out.push(
      finding(
        "sin_horarios",
        "google_maps",
        5,
        "La ficha no tiene horarios de atención cargados.",
        "Google lo muestra con menos prioridad y el cliente no sabe cuándo ir.",
        "Cargar horarios y datos completos.",
        "su ficha de Google no muestra los horarios de atención"
      )
    );
  }
  if (maps.verified === false) {
    out.push(
      finding(
        "ficha_sin_verificar",
        "google_maps",
        5,
        "La ficha de Google no está verificada por el dueño.",
        "No se pueden responder reseñas ni controlar la información que ven los clientes.",
        "Verificar y optimizar la ficha.",
        "su ficha de Google no está verificada"
      )
    );
  }
  return out.sort((a, b) => b.peso - a.peso);
}

export function computeScore(findings: Finding[], maps: Partial<MapsData>): number {
  let score = findings.reduce((sum, f) => sum + f.peso, 0);
  // Negocios con más actividad probablemente tienen presupuesto: se suben.
  if (maps.ratingCount != null) {
    if (maps.ratingCount >= 50) score += 10;
    else if (maps.ratingCount >= 15) score += 5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Deja un texto apto para variable de plantilla de WhatsApp (una línea, corto). */
export function sanitizeTemplateVar(text: string, maxLen = 90): string {
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[.!¡]+$/g, "")
    .trim()
    .slice(0, maxLen)
    .trim();
}

function isValidHook(hook: unknown): hook is string {
  if (typeof hook !== "string") return false;
  const h = hook.trim();
  if (h.length < 12 || h.length > 100) return false;
  if (/[\r\n]/.test(h)) return false;
  if (/https?:\/\//i.test(h)) return false;
  return true;
}

/** Links que no son un sitio propio: redes sociales, links de bio, acortadores, WhatsApp. */
const NOT_OWN_SITE =
  /(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|linktr\.ee|linktree\.com|beacons\.ai|wa\.me|whatsapp\.com|tiktok\.com|twitter\.com|x\.com|youtube\.com|youtu\.be|linkedin\.com|bit\.ly|g\.page|goo\.gl|maps\.app\.goo\.gl|sites\.google\.com)$/i;

export function isNotOwnSite(url: string | null): boolean {
  if (!url) return false;
  try {
    return NOT_OWN_SITE.test(new URL(url).hostname.replace(/^www\./i, ""));
  } catch {
    return false;
  }
}

let _client: GoogleGenAI | null = null;
function gemini() {
  if (!_client) _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _client;
}

interface AiSynthesis {
  gancho?: string;
  resumen?: string;
  servicios_sugeridos?: string[];
  puntos_clave?: string[];
}

async function synthesizeWithAi(input: {
  name: string;
  maps: Partial<MapsData>;
  hasWebsite: boolean;
  web: WebSignals | null;
  findings: Finding[];
}): Promise<AiSynthesis | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const payload = {
    negocio: input.name,
    rubro: input.maps.rubro_buscado ?? input.maps.categories?.[0] ?? null,
    zona: input.maps.zona_buscada ?? input.maps.address ?? null,
    google_maps: {
      puntaje: input.maps.rating,
      resenas: input.maps.ratingCount,
      fotos: input.maps.photosCount,
      verificada: input.maps.verified,
      tiene_horarios: input.maps.hasHours,
    },
    tiene_sitio_web: input.hasWebsite,
    sitio_web: input.web
      ? {
          abre: input.web.reachable,
          https: input.web.https,
          adaptado_a_celular: input.web.hasViewport,
          boton_whatsapp: input.web.hasWhatsappLink,
          plataforma: input.web.platform,
        }
      : null,
    hallazgos: input.findings.slice(0, 8).map((f) => ({
      problema: f.problema,
      impacto: f.impacto,
      mejora: f.mejora,
    })),
  };

  const prompt = [
    "Sos analista comercial de Kocos Marketing, una agencia de marketing digital argentina.",
    "Te paso el análisis técnico de un negocio. Devolvé SOLO un JSON con estas claves:",
    '- "gancho": una frase corta en minúscula (máx. 90 caracteres, sin punto final, sin emojis, sin precios, sin nombre del negocio) que complete "notamos que ...". Debe nombrar el problema más importante y concreto, en voseo o impersonal, ej: "no tienen página web propia".',
    '- "resumen": 3 a 5 oraciones para el equipo interno: qué le pasa al negocio, qué oportunidad hay y por dónde empezar.',
    '- "servicios_sugeridos": lista de 2 a 5 servicios concretos a proponer (ej: "Sitio web", "Optimización de Google Maps", "Gestión de reseñas").',
    '- "puntos_clave": lista de 3 a 5 puntos cortos con lo más importante del análisis.',
    "No inventes datos que no estén en el análisis. Escribí en español rioplatense.",
    "",
    "ANÁLISIS:",
    JSON.stringify(payload),
  ].join("\n");

  try {
    const response = await gemini().models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    const raw = (response.text ?? "").trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "")) as AiSynthesis;
    return parsed;
  } catch (err) {
    console.error("[marketing] Falló la síntesis con IA, se usa el texto por reglas:", err);
    return null;
  }
}

function fallbackSummary(name: string, findings: Finding[], score: number): string {
  if (findings.length === 0) {
    return `${name}: no se detectaron problemas importantes en su presencia online. Puntaje ${score}/100.`;
  }
  const top = findings.slice(0, 3).map((f) => f.problema.replace(/\.$/, ""));
  return `${name}: puntaje ${score}/100. Principales oportunidades: ${top.join("; ")}.`;
}

function mapsFromLead(lead: any): Partial<MapsData> {
  return (lead.maps_data ?? {}) as Partial<MapsData>;
}

export interface AnalyzeOptions {
  /** Fuerza el reanálisis aunque ya esté "listo". */
  force?: boolean;
  /** Usa este sitio web en vez del guardado (ej.: lo pasó el prospecto en el chat). */
  websiteOverride?: string | null;
  /** Busca la ficha en Google Maps con este texto (ej.: "Nombre del negocio, zona"). */
  mapsQuery?: string | null;
}

/** Analiza un lead y guarda el resultado. Devuelve el lead actualizado o null si no se pudo reclamar. */
export async function analyzeLead(leadId: string, options: AnalyzeOptions = {}) {
  const supabase = createAdminClient();

  // "Reclamar" el lead para que dos ticks seguidos no lo analicen a la vez.
  const claimFrom = options.force ? ["pendiente", "listo", "error", "omitido"] : ["pendiente"];
  const { data: claimed } = await supabase
    .from("marketing_leads")
    .update({ analysis_status: "analizando", updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .in("analysis_status", claimFrom)
    .select("*, contacts(full_name)")
    .maybeSingle();

  if (!claimed) return null;

  const lead: any = claimed;
  const name: string = lead.contacts?.full_name ?? "el negocio";

  try {
    let mapsData = mapsFromLead(lead);

    if (options.mapsQuery && process.env.OUTSCRAPER_API_KEY) {
      try {
        const found = await searchGooglePlaces({ query: options.mapsQuery, maxResults: 1 });
        if (found[0]) {
          const p = found[0];
          mapsData = {
            ...mapsData,
            rating: p.rating,
            ratingCount: p.ratingCount,
            photosCount: p.extra.photosCount,
            verified: p.extra.verified,
            hasHours: p.extra.hasHours,
            businessStatus: p.extra.businessStatus,
            categories: p.types,
            address: p.address,
            description: p.extra.description,
            facebook: p.extra.facebook,
            instagram: p.extra.instagram,
            email: p.extra.email,
            mapsUrl: p.extra.mapsUrl,
          };
          if (!lead.website && p.website) lead.website = p.website;
          if (!lead.place_id) lead.place_id = p.placeId;
        }
      } catch (err) {
        console.error("[marketing] No se pudo buscar la ficha en Google Maps:", err);
      }
    }

    const rawWebsite = normalizeWebsiteUrl(options.websiteOverride ?? lead.website);
    // Si en Google figura solo una red social o un link de bio, el negocio NO tiene web propia.
    const socialOnlyUrl = rawWebsite && isNotOwnSite(rawWebsite) ? rawWebsite : null;
    const websiteUrl = socialOnlyUrl ? null : rawWebsite;
    const hasMapsInfo = Object.values(mapsData).some((v) => v !== null && v !== undefined);

    // Un contacto de entrada directa sin sitio ni ficha conocidos: no hay nada que analizar
    // (el agente puede pedirlo después con la herramienta analizar_negocio).
    if (!websiteUrl && !hasMapsInfo && lead.source_kind === "directa") {
      await supabase
        .from("marketing_leads")
        .update({ analysis_status: "omitido", updated_at: new Date().toISOString() })
        .eq("id", leadId);
      return { ...lead, analysis_status: "omitido" };
    }

    const web = websiteUrl ? await analyzeWebsite(websiteUrl) : null;
    const hasWebsite = Boolean(websiteUrl);
    const findings = buildFindings(mapsData, web, hasWebsite, socialOnlyUrl);
    const score = computeScore(findings, mapsData);
    const priority = priorityForScore(score);

    const ai = await synthesizeWithAi({ name, maps: mapsData, hasWebsite, web, findings });

    const topFinding = findings[0];
    const aiHook = ai?.gancho ? sanitizeTemplateVar(ai.gancho) : null;
    const hook = isValidHook(aiHook)
      ? aiHook
      : topFinding
        ? sanitizeTemplateVar(topFinding.gancho)
        : "hay varias oportunidades para conseguir más clientes desde internet";

    const analysis: LeadAnalysis = {
      version: 1,
      tiene_sitio_web: hasWebsite,
      web,
      hallazgos: findings,
      puntos_clave:
        Array.isArray(ai?.puntos_clave) && ai!.puntos_clave!.length > 0
          ? ai!.puntos_clave!.slice(0, 6).map(String)
          : findings.slice(0, 4).map((f) => f.problema),
      servicios_sugeridos:
        Array.isArray(ai?.servicios_sugeridos) && ai!.servicios_sugeridos!.length > 0
          ? ai!.servicios_sugeridos!.slice(0, 6).map(String)
          : Array.from(new Set(findings.slice(0, 4).map((f) => f.mejora))),
      generado_con_ia: Boolean(ai),
    };

    const summary =
      typeof ai?.resumen === "string" && ai.resumen.trim()
        ? ai.resumen.trim()
        : fallbackSummary(name, findings, score);

    const now = new Date().toISOString();
    await supabase
      .from("marketing_leads")
      .update({
        analysis_status: "listo",
        analysis_error: null,
        analysis,
        maps_data: mapsData,
        website: websiteUrl ?? rawWebsite ?? lead.website ?? null,
        place_id: lead.place_id ?? null,
        analyzed_at: now,
        lead_score: score,
        priority,
        hook,
        summary,
        updated_at: now,
      })
      .eq("id", leadId);

    await logMarketingEvent({
      leadId,
      contactId: lead.contact_id,
      type: "analizado",
      detail: { score, priority, hallazgos: findings.length },
    });

    return { ...lead, analysis, lead_score: score, priority, hook, summary, analysis_status: "listo" };
  } catch (err: any) {
    await supabase
      .from("marketing_leads")
      .update({
        analysis_status: "error",
        analysis_error: String(err?.message ?? err).slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);
    return null;
  }
}

/** Analiza hasta `limit` leads pendientes. Lo llama el cron. */
export async function analyzePendingLeads(limit = 3): Promise<{ analyzed: number }> {
  const supabase = createAdminClient();

  // Recupera los que quedaron "analizando" por una función que se cortó.
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase
    .from("marketing_leads")
    .update({ analysis_status: "pendiente" })
    .eq("analysis_status", "analizando")
    .lt("updated_at", staleBefore);

  const { data: pending } = await supabase
    .from("marketing_leads")
    .select("id")
    .eq("analysis_status", "pendiente")
    .order("created_at", { ascending: true })
    .limit(limit);

  // En paralelo: cada análisis espera sobre todo a la red (sitio web + IA).
  const results = await Promise.all((pending ?? []).map((row) => analyzeLead(row.id)));
  const analyzed = results.filter(Boolean).length;
  return { analyzed };
}
