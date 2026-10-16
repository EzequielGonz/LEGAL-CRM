/**
 * Identidad visual de cada perfil (16/10). Datos públicos de marca, sin
 * secretos: nombre, logo y colores principales. El panel toma la paleta de
 * `data-tema="<slug>"` (ver globals.css) y el logo de acá; si la base tiene
 * un logo propio en `brand_briefs.logo_ref`, se puede pasar como reemplazo.
 */
export const SLUGS_PERFIL = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
export type SlugPerfil = (typeof SLUGS_PERFIL)[number];

export interface Marca {
  slug: SlugPerfil;
  nombre: string;
  bajada: string;
  logo: string;
  /** Colores de la paleta entregada, del más oscuro al más claro. */
  paleta: string[];
  acento: string;
}

export const MARCAS: Record<SlugPerfil, Marca> = {
  juridico: {
    slug: "juridico",
    nombre: "Estudio Jurídico VITA",
    bajada: "Civil y Penal",
    logo: "https://images.hostinger.com/bc3f1cef-f13c-432a-99e4-ec494e9da23f.png",
    paleta: ["#112250", "#3B507D", "#BEB7A7", "#E7E2CE", "#F5F4F0"],
    acento: "#C9A85A",
  },
  coberturas_medicas: {
    slug: "coberturas_medicas",
    nombre: "Compara tu Obra Social",
    bajada: "Coberturas médicas",
    logo: "https://horizons-cdn.hostinger.com/151eeb22-3829-49b1-ac75-b50202e69fd3/7a57f98a8bf0d1bd90419ea1ea9eb502.png",
    paleta: ["#051F20", "#0B2B26", "#163832", "#235347", "#8EB69B", "#DAF1DE"],
    acento: "#8EB69B",
  },
  agencia_0km: {
    slug: "agencia_0km",
    nombre: "Automotores Kocos",
    bajada: "Autos 0 km",
    logo: "https://horizons-cdn.hostinger.com/36f43b4e-b629-4797-867e-b3697140c643/dd63ce66f2d8ee5fafde6d7ed609128a.png",
    paleta: ["#000521", "#020C47", "#011F65", "#0E4EB2", "#2078CF"],
    acento: "#2078CF",
  },
  marketing: {
    slug: "marketing",
    nombre: "Kocos Marketing",
    bajada: "Agencia de marketing",
    logo: "https://horizons-cdn.hostinger.com/275ad696-7806-4d8b-9e1a-0ca4a8f99744/ee6bb9c676fd6486656c51b85c38eeb3.png",
    paleta: ["#1B1B1B", "#323232", "#FFE7D0", "#FC6E20"],
    acento: "#FC6E20",
  },
};

export function esSlugPerfil(v: unknown): v is SlugPerfil {
  return typeof v === "string" && (SLUGS_PERFIL as readonly string[]).includes(v);
}

/** Tema a aplicar: el perfil pedido o Jurídico (valor por defecto del panel). */
export function temaDe(slug: unknown): SlugPerfil {
  return esSlugPerfil(slug) ? slug : "juridico";
}

export function marcaDe(slug: unknown): Marca {
  return MARCAS[temaDe(slug)];
}
