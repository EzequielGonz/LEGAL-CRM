/**
 * ¿Esta pantalla lleva la estética premium de «Más»? (22/11). Puro.
 * Sí: las secciones del grupo «Más» del menú (Bot IA, WhatsApp oficial, Wasender, Redes, Ajustes), la
 * pestaña Seguimiento de Contactos y las pantallas Bandeja, Descartados e Incidencias. Contactos y Citas
 * tienen su propio diseño y no entran acá.
 */
export function esPantallaMas(grupo: "trabajo" | "mas" | null | undefined, clave: string | null | undefined, tab: string | null | undefined, pathname: string): boolean {
  if (/^\/(bandeja|descartados|incidencias)(\/|$)/.test(pathname)) return true;
  if (grupo !== "mas") return false;
  if (clave === "contactos") return /\/seguimiento(\/|$)/.test(pathname) || tab === "Seguimiento";
  return true;
}
