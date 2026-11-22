/**
 * Líneas por perfil (22/11, pendiente 15d y hallazgos 15 §3 ítem 2). Pura.
 *
 * - Penal es una línea y un rol de Jurídico: se rotula «Penal» y solo se ofrece para asignar dentro de
 *   Jurídico. Antes la línea PENAL figuraba como «PENAL · Civil» y se ofrecía como «asignar» en Coberturas,
 *   Autos y Marketing (rompía «cada rubro separado»).
 * - Una conexión detectada cuyo nombre es de otro perfil (`WHATSAPP_MARKETING`, `WHATSAPP_AGENCIA_0KM`…) solo
 *   se ofrece en ese perfil. Las que no tienen nombre de perfil se siguen ofreciendo como hasta ahora.
 */
import type { SlugPerfil } from "@/lib/marca";

/** A qué perfil pertenece cada nombre de conexión. */
const PERFIL_POR_CONEXION: Record<string, SlugPerfil> = {
  WHATSAPP_CIVIL: "juridico",
  WHATSAPP_PENAL: "juridico",
  WHATSAPP_AGENCIA_0KM: "agencia_0km",
  WHATSAPP_COBERTURAS_MEDICAS: "coberturas_medicas",
  WHATSAPP_MARKETING: "marketing",
};

export function perfilDeConexion(key: string): SlugPerfil | null {
  const exacta = PERFIL_POR_CONEXION[key];
  if (exacta) return exacta;
  const prefijo = Object.keys(PERFIL_POR_CONEXION).find((p) => key.startsWith(`${p}_`));
  return prefijo ? PERFIL_POR_CONEXION[prefijo] : null;
}

export function conexionesOfrecibles(keys: string[], slug: SlugPerfil): string[] {
  return keys.filter((k) => {
    const dueno = perfilDeConexion(k);
    return dueno === null || dueno === slug;
  });
}

const AREA_LABEL: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  agencia_0km: "Agencia 0KM",
  coberturas_medicas: "Coberturas médicas",
  marketing: "Marketing",
};

/** Rótulo del área de una línea: la línea PENAL de Jurídico es «Penal» aunque su área guardada sea Civil. */
export function rotuloAreaDeLinea(l: { area: string; label?: string | null; credential_key?: string | null }): string {
  const esDeJuridico = l.area === "civil" || l.area === "penal";
  if (esDeJuridico) {
    const esPenal = l.area === "penal" || /penal/i.test(l.credential_key ?? "") || /^\s*penal\b/i.test(l.label ?? "");
    return esPenal ? AREA_LABEL.penal : AREA_LABEL.civil;
  }
  return AREA_LABEL[l.area] ?? l.area;
}
