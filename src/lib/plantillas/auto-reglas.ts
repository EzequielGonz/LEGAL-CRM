/**
 * Asignación automática de plantillas (24/10). Regla pura: según el nombre
 * que usamos al crearlas en Meta, a qué perfil, propósito y datos va cada
 * una. Las que no siguen la convención se siguen asignando a mano.
 *
 *   jur_ | cob_ | autos_ | mkt_   →  Jurídico, Coberturas, Autos, Marketing
 *   *_base_fria_<x>              →  Primer contacto de campaña
 *                                  {{1}} = nombre del contacto, {{2}} = nombre de presentación
 *   *_seguimiento_2              →  Seguimiento: contacto 2 ({{1}} = nombre del contacto)
 *   *_seguimiento_3              →  Seguimiento: contacto 3 ({{1}} = nombre del contacto)
 */
export const PREFIJO_PERFIL = { jur: "juridico", cob: "coberturas_medicas", autos: "agencia_0km", mkt: "marketing" } as const;

export interface AsignacionAutomatica {
  perfil: (typeof PREFIJO_PERFIL)[keyof typeof PREFIJO_PERFIL];
  proposito: "campana" | "seguimiento" | "seguimiento_3";
  fuentes: string[];
}

export function asignacionPorNombre(nombre: string, cantidadVariables: number): AsignacionAutomatica | null {
  const m = /^(jur|cob|autos|mkt)_(base_fria_[a-z0-9]+|seguimiento_2|seguimiento_3)$/.exec(String(nombre ?? ""));
  if (!m) return null;
  const perfil = PREFIJO_PERFIL[m[1] as keyof typeof PREFIJO_PERFIL];
  if (m[2].startsWith("base_fria_")) {
    if (cantidadVariables === 1) return { perfil, proposito: "campana", fuentes: ["contacto.nombre"] };
    if (cantidadVariables === 2) return { perfil, proposito: "campana", fuentes: ["contacto.nombre", "perfil.presentacion"] };
    return null;
  }
  const proposito = m[2] === "seguimiento_2" ? "seguimiento" : "seguimiento_3";
  if (cantidadVariables === 0) return { perfil, proposito, fuentes: [] };
  if (cantidadVariables === 1) return { perfil, proposito, fuentes: ["contacto.nombre"] };
  return null;
}
