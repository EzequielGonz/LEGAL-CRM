import { redDeLlegada } from "@/lib/fuente";
/**
 * Formularios de las cuatro landings → CRM (16/10).
 *
 * Funciones puras: normalizan los dos formatos que llegan al endpoint
 * público `/api/landing` y deciden el área del perfil. La fuente es siempre
 * «landing» porque la consulta se cargó en el formulario del sitio.
 */
import type { Area } from "@/lib/supabase/database.types";

export const PERFILES_LANDING = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
export type PerfilLanding = (typeof PERFILES_LANDING)[number];

/** Dominios propios desde los que se aceptan formularios (CORS). */
export const ORIGENES_LANDING = [
  "estudiojuridicovita.com",
  "comparatuobrasocial.com",
  "autoskocos.com",
  "kocosmkt.com",
];

export function origenPermitido(origin: string | null, extra: string[] = []): boolean {
  if (!origin) return false;
  let host: string;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && u.hostname === "localhost")) return false;
    host = u.hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === "localhost") return true;
  const permitidos = [...ORIGENES_LANDING, ...extra.map((d) => d.trim().toLowerCase()).filter(Boolean)];
  return permitidos.some((d) => host === d || host === `www.${d}`);
}

export interface LeadNormalizado {
  area: Area;
  nombre: string;
  telefono: string;
  email: string | null;
  consulta: string;
  pagina: string | null;
  /** Red desde la que llegó la visita (Instagram, Facebook, Google, TikTok). */
  llegada?: string | null;
}

function txt(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Acepta el formato histórico del CRM ({ full_name, phone, area, consulta })
 * y el de las landings ({ nombre, apellido, telefono, tipo, descripcion, origen }).
 * Devuelve null si faltan datos mínimos o el perfil no es válido.
 */
export function normalizarLead(body: Record<string, unknown> | null, perfilParam: string | null): LeadNormalizado | { error: string } {
  if (!body || typeof body !== "object") return { error: "Faltan campos requeridos" };

  // Formato histórico (Jurídico Civil/Penal).
  if (typeof body.area === "string") {
    const area = body.area;
    if (area !== "civil" && area !== "penal") return { error: "Área inválida" };
    const nombre = txt(body.full_name, 200);
    const telefono = txt(body.phone, 40);
    const consulta = txt(body.consulta, 5000);
    if (!nombre || !telefono || !consulta) return { error: "Faltan campos requeridos" };
    return { area, nombre, telefono, email: txt(body.email, 200) || null, consulta, pagina: null };
  }

  const perfil = (perfilParam ?? txt(body.perfil, 40)) as PerfilLanding;
  if (!(PERFILES_LANDING as readonly string[]).includes(perfil)) return { error: "Perfil inválido" };
  // Landing de Marketing: { full_name, whatsapp, business, industry, instagram, need, budget, message }.
  const extrasMarketing = [
    ["Negocio", body.business],
    ["Rubro", body.industry],
    ["Instagram", body.instagram],
    ["Necesidad", body.need],
    ["Inversión estimada", body.budget],
  ]
    .map(([k, v]) => [k, txt(v, 300)] as const)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  const nombre = [txt(body.nombre, 100), txt(body.apellido, 100)].filter(Boolean).join(" ") || txt(body.full_name, 200);
  const telefono = txt(body.telefono, 40) || txt(body.whatsapp, 40);
  const tipo = txt(body.tipo, 200);
  const descripcion = [...extrasMarketing, txt(body.descripcion ?? body.mensaje ?? body.message, 5000)].filter(Boolean).join("\n");
  if (!nombre || !telefono || (!tipo && !descripcion)) return { error: "Faltan campos requeridos" };
  const pagina = txt(body.origen, 300) || null;
  const area: Area =
    perfil === "juridico" ? (/penal/i.test(`${tipo} ${descripcion}`) ? "penal" : "civil") : (perfil as Area);
  const consulta = [tipo ? `Tipo: ${tipo}` : null, descripcion || null].filter(Boolean).join("\n");
  return { area, nombre, telefono, email: txt(body.email, 200) || null, consulta, pagina, llegada: redDeLlegada(body.llegada) };
}
