/**
 * Auditoría 27/11: mensajes de error de la interfaz en castellano.
 * Función pura: traduce los errores de red típicos del navegador («Failed to
 * fetch», «NetworkError…», «Load failed») a un texto claro. Cualquier otro
 * error técnico tampoco se muestra crudo: se usa el texto de respaldo.
 */
export const MENSAJE_SIN_CONEXION = "No hay conexión o el servidor no respondió. Probá de nuevo.";

const PATRON_RED = /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_network|err_internet|timeout|timed out|aborted|econnreset|enotfound/i;

export function mensajeDeError(e: unknown, respaldo: string = MENSAJE_SIN_CONEXION): string {
  const msg = typeof e === "string" ? e : e instanceof Error ? e.message : typeof (e as any)?.message === "string" ? (e as any).message : "";
  const nombre = e instanceof Error ? e.name : "";
  if (nombre === "TypeError" && PATRON_RED.test(msg)) return MENSAJE_SIN_CONEXION;
  if (PATRON_RED.test(msg)) return MENSAJE_SIN_CONEXION;
  // Un texto ya escrito en castellano para la persona (sin jerga técnica) se conserva.
  if (msg && /[áéíóúñ¿¡]/i.test(msg) && !/^(TypeError|SyntaxError|ReferenceError|Error):/.test(msg) && !/JSON|undefined|null|unexpected token/i.test(msg)) return msg;
  return respaldo;
}
