/**
 * Niveles de permiso del asistente (19/10). El asistente nunca ejecuta solo:
 * todo lo que cambia algo queda como propuesta y se ejecuta al confirmar.
 *
 *  - cambio:   un clic en «Confirmar».
 *  - contacto: puede hacer salir mensajes a personas. Confirmación
 *              reforzada: hay que marcar que se entendió qué se envía, a
 *              cuántas personas y desde qué línea. Además de las
 *              condiciones propias del panel (línea conectada en Meta,
 *              plantilla aprobada, pausa general).
 *  - pin:      además pide el PIN. Es el caso de todo lo que gasta plata y
 *              de activar un agente (control que ya existía en el panel).
 *
 * Función pura: la usan la ruta de confirmación, el panel y las pruebas.
 */
export type NivelAccion = "cambio" | "contacto" | "pin";

export const TIPOS_ACCION = [
  "publicaciones",
  "cambio_agente",
  "pausar_campana",
  "crear_campana",
  "lanzar_campana",
  "asignar_linea_campana",
  "asignar_agente",
  "limite_campana",
] as const;
export type TipoAccion = (typeof TIPOS_ACCION)[number];

/** Acciones que gastan plata (siempre con PIN). Hoy el asistente no tiene ninguna. */
export const TIPOS_QUE_GASTAN: string[] = [];

export function nivelDeAccion(tipo: string, payload: Record<string, unknown> = {}): NivelAccion {
  if (TIPOS_QUE_GASTAN.includes(tipo)) return "pin";
  if (tipo === "lanzar_campana") return "contacto";
  // Activar un agente ya exigía PIN en el panel; apagar o pausar, no.
  if (tipo === "asignar_agente") return payload.estado === "activa" ? "pin" : "cambio";
  return "cambio";
}

export interface ConfirmacionRecibida {
  confirmar_envio?: unknown;
  pin?: unknown;
}

/** ¿Falta algo para poder ejecutar? Devuelve el motivo o null si se puede seguir. */
export function faltaParaConfirmar(nivel: NivelAccion, body: ConfirmacionRecibida): { codigo: "envio" | "pin"; mensaje: string } | null {
  if (nivel === "contacto" && body.confirmar_envio !== true) {
    return { codigo: "envio", mensaje: "Esta acción puede enviar mensajes a personas. Marcá que revisaste a quién, cuántos y desde qué línea." };
  }
  if (nivel === "pin" && !(typeof body.pin === "string" && body.pin.trim())) {
    return { codigo: "pin", mensaje: "Esta acción pide el PIN." };
  }
  return null;
}
