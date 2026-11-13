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
 * 13/11 («dale permisos a TODO», y después «el asistente dejalo así», con la
 * confirmación): el asistente puede proponer cualquier operación del panel.
 * Los tres niveles se conservan tal cual.
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
  "guardar_rol",
  "asignar_rol_base",
  // 24/10: chats.
  "responder_chat",
  "tomar_chat",
  "soltar_chat",
  "marcar_captado",
  "marcar_derivado",
  // 13/11: cualquier operación del panel (catálogo en src/lib/asistente/catalogo.ts) y el menú del perfil.
  "operacion_panel",
  "personalizar_menu",
] as const;
export type TipoAccion = (typeof TIPOS_ACCION)[number];

/** Acciones que gastan plata (siempre con PIN). Hoy el asistente no tiene ninguna. */
export const TIPOS_QUE_GASTAN: string[] = [];

export function nivelDeAccion(tipo: string, payload: Record<string, unknown> = {}): NivelAccion {
  if (TIPOS_QUE_GASTAN.includes(tipo)) return "pin";
  // Operación del panel: el nivel se calculó con el catálogo al armar la propuesta y el
  // servidor lo vuelve a calcular al confirmar. Sin dato válido, el más exigente.
  if (tipo === "operacion_panel") return payload.nivel === "cambio" || payload.nivel === "contacto" ? payload.nivel : "pin";
  // Lanzar una campaña o responder un chat le escriben a personas reales.
  if (tipo === "lanzar_campana" || tipo === "responder_chat") return "contacto";
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
