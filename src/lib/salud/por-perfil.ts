import type { ItemSalud } from "./reglas";

/** Nombre con que la salud nombra a cada perfil (ver PERFILES en salud/index.ts). */
const NOMBRE: Record<string, string> = {
  juridico: "Jurídico",
  coberturas_medicas: "Coberturas",
  agencia_0km: "Autos 0 km",
  marketing: "Marketing",
};

/** Avisos de todo el sistema: se ven en todos los perfiles. */
const GLOBALES = new Set(["latido", "pausa", "secreto_meta", "cuarentena", "entrantes"]);

/**
 * Lo de la barra de salud que corresponde a un perfil (24/10): lo global y
 * lo propio. Antes el error de la IA de un perfil aparecía en los cuatro.
 * Pura.
 */
export function itemsDelPerfil(items: ItemSalud[], slug: string): ItemSalud[] {
  const nombre = NOMBRE[slug] ?? slug;
  return items.filter((i) => {
    if (GLOBALES.has(i.clave)) return true;
    if (i.clave.startsWith("whatsapp_") || i.clave.startsWith("agente_") || i.clave.startsWith("calidad_")) return i.clave.endsWith(`_${slug}`);
    if (i.clave === "presupuestos") return slug === "marketing";
    if (i.clave === "errores_ia") return !/\(([^)]+)\)/.test(i.detalle) || i.detalle.includes(`(${nombre})`);
    return true;
  });
}
