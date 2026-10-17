/**
 * Nivel de detalle de la interfaz (rediseño 17/10, bloque 3): «Simple» para
 * la operación cotidiana y «Avanzado» con toda la configuración. Es una
 * preferencia de presentación de este navegador (cookie), separada de la
 * configuración del negocio: no se guarda en la base, no cambia datos,
 * permisos, validaciones ni reglas, y no dispara envíos ni gastos.
 */
export type Nivel = "simple" | "avanzado";
export const COOKIE_NIVEL = "crm_nivel";
/** Un año: la elección se recuerda en este navegador. */
export const DURACION_NIVEL_S = 60 * 60 * 24 * 365;

/** La primera entrada abre en Simple; cualquier valor desconocido también. */
export function nivelDe(valor: unknown): Nivel {
  return valor === "avanzado" ? "avanzado" : "simple";
}

export const NIVEL_LABEL: Record<Nivel, string> = { simple: "Simple", avanzado: "Avanzado" };
export const NIVEL_AYUDA: Record<Nivel, string> = {
  simple: "Vista simple: lo que necesita atención y las acciones de todos los días.",
  avanzado: "Vista avanzada: todas las opciones, filtros y configuración completa.",
};
