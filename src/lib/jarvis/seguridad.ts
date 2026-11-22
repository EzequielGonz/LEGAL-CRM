/**
 * Jarvis · cómo confirma lo que hace (22/11). Funciones puras.
 *
 * Orden del dueño (22/11, segunda vuelta): «que Jarvis pueda hacer TODO, preguntándome antes siempre».
 * Ya no hay acciones prohibidas: lanzar, reanudar, publicar o escribirle a alguien se puede, pero
 * SIEMPRE con tarjeta «¿Lo hago?» y confirmación reforzada (marcar que se entendió) o código si el
 * permiso lo pide. Nada se ejecuta sin el Sí del dueño.
 */
import { nivelDeAccion, type NivelAccion } from "@/lib/asistente/permisos";

/** Herramientas del asistente que Jarvis no tiene. */
export const HERRAMIENTAS_VEDADAS: readonly string[] = [];

/** Herramientas que hacen salir mensajes o publican: Jarvis las tiene, pero su propuesta pide confirmación reforzada. */
export const HERRAMIENTAS_SENSIBLES: readonly string[] = ["proponer_lanzamiento", "proponer_publicaciones", "proponer_respuesta_chat", "proponer_plan_campanas"];

/** Tipos de propuesta que hacen salir mensajes o publican: confirmación reforzada. */
export const TIPOS_SENSIBLES: readonly string[] = ["lanzar_campana", "publicaciones", "responder_chat"];

/** Claves de operación del panel que publican, lanzan o envían: confirmación reforzada. */
// 22/11 (revisión): también lo que hace salir mensajes o los habilita sin lanzar una campaña con ese nombre:
// ejecutar una base de Marketing, activar la prospección, encender bots/seguimientos/recontactos, programar
// piezas, volver a contactar a una persona y cambiar días de envío de una campaña.
const OPERACION_SENSIBLE = /(lanzar|reanudar|publicar|enviar_a_revision|publicacion_automatica|enviar|ejecutar_base|prospeccion_activar|encender|programar|volver_a_contactar|dias_y_wasender)/;

/** ¿Esta operación del panel hace salir mensajes, publica o lo habilita? */
export function esOperacionSensible(clave: string): boolean {
  return OPERACION_SENSIBLE.test(clave);
}

export interface PropuestaMinima {
  tipo: string;
  detalle?: unknown;
}

/** ¿Esta propuesta lanza, publica o le escribe a alguien? Se puede, con confirmación reforzada. */
export function esPropuestaSensible(p: PropuestaMinima): boolean {
  if (TIPOS_SENSIBLES.includes(p.tipo)) return true;
  const d = (p.detalle ?? {}) as Record<string, unknown>;
  if (p.tipo === "plan_campanas") return d.lanzar === true;
  if (p.tipo === "operacion_panel") return OPERACION_SENSIBLE.test(String(d.clave ?? ""));
  return false;
}

/** Desde el 22/11 no hay propuestas vedadas: se mantiene por compatibilidad y siempre devuelve false. */
export function esPropuestaVedada(_p: PropuestaMinima): boolean {
  return false;
}

export function sinVedadas<T extends PropuestaMinima>(propuestas: T[]): { visibles: T[]; vedadas: T[] } {
  const visibles: T[] = [];
  const vedadas: T[] = [];
  for (const p of propuestas) (esPropuestaVedada(p) ? vedadas : visibles).push(p);
  return { visibles, vedadas };
}

export interface DecisionConfirmar {
  /** ¿Se muestra la tarjeta «¿Lo hago?»? */
  mostrar: boolean;
  nivel: NivelAccion;
  /** Qué hay que hacer además del Sí: nada, marcar que se entendió, o poner el código. */
  extra: "ninguno" | "reforzada" | "codigo";
  /** Cuando no se muestra, por qué. */
  motivo?: string;
}

/** Decide cómo se confirma una propuesta dentro de Jarvis. Siempre hay tarjeta salvo lo vedado. */
export function decisionConfirmar(p: PropuestaMinima): DecisionConfirmar {
  const nivelBase = nivelDeAccion(p.tipo, (p.detalle ?? {}) as Record<string, unknown>);
  // Lo que hace salir mensajes o publica nunca baja de «contacto»: siempre confirmación reforzada.
  const nivel: NivelAccion = esPropuestaSensible(p) && nivelBase === "cambio" ? "contacto" : nivelBase;
  const extra = nivel === "pin" ? "codigo" : nivel === "contacto" ? "reforzada" : "ninguno";
  if (esPropuestaSensible(p)) return { mostrar: true, nivel, extra, motivo: "Esto hace salir mensajes o publica: confirmalo solo si estás seguro." };
  return { mostrar: true, nivel, extra };
}
