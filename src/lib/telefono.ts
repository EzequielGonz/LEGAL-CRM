import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";

/**
 * Datos fijos de cada perfil para el modo teléfono (bloque 1.9): qué áreas
 * internas tiene y dónde están sus pantallas de PC. El nombre y la foto se
 * leen de la base (se editan en Configuración).
 */
export interface PhoneProfile {
  slug: RubroSlug;
  rubroId: string;
  areas: { value: string; label: string }[];
  basesPath: string;
  campaignsPath: string;
}

export const PHONE_PROFILES: Record<RubroSlug, PhoneProfile> = {
  juridico: {
    slug: "juridico",
    rubroId: RUBRO_IDS.juridico,
    areas: [
      { value: "civil", label: "Civil" },
      { value: "penal", label: "Penal" },
    ],
    basesPath: "/bases",
    campaignsPath: "/campanas",
  },
  agencia_0km: {
    slug: "agencia_0km",
    rubroId: RUBRO_IDS.agencia_0km,
    areas: [{ value: "agencia_0km", label: "Agencia 0KM" }],
    basesPath: "/panel/agencia_0km/bases",
    campaignsPath: "/panel/agencia_0km/campanas",
  },
  coberturas_medicas: {
    slug: "coberturas_medicas",
    rubroId: RUBRO_IDS.coberturas_medicas,
    areas: [{ value: "coberturas_medicas", label: "Coberturas médicas" }],
    basesPath: "/panel/coberturas_medicas/bases",
    campaignsPath: "/panel/coberturas_medicas/campanas",
  },
  marketing: {
    slug: "marketing",
    rubroId: RUBRO_IDS.marketing,
    areas: [{ value: "marketing", label: "Marketing" }],
    basesPath: "/panel/marketing/bases",
    campaignsPath: "/panel/marketing/campanas",
  },
};

export function phoneProfile(slug: string): PhoneProfile | null {
  return (PHONE_PROFILES as Record<string, PhoneProfile>)[slug] ?? null;
}
