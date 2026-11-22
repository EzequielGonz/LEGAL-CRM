/**
 * Jarvis · qué puede y qué no puede hacer (22/11). Funciones puras.
 *
 * Reglas del dueño: Jarvis nunca lanza campañas ni publica (eso lo hacen los
 * dueños) y no le escribe a nadie por su cuenta: como mucho deja borradores.
 * Todo lo que cambia algo lleva tarjeta de confirmación («¿Lo hago?»).
 */
import { nivelDeAccion, type NivelAccion } from "@/lib/asistente/permisos";

/** Herramientas del asistente que Jarvis no tiene. */
export const HERRAMIENTAS_VEDADAS: readonly string[] = ["proponer_lanzamiento", "proponer_publicaciones", "proponer_respuesta_chat", "proponer_plan_campanas"];

/** Tipos de propuesta que Jarvis nunca muestra ni confirma. */
export const TIPOS_VEDADOS: readonly string[] = ["lanzar_campana", "publicaciones", "responder_chat"];

/** Claves de operación del panel que publican, lanzan o envían: no se ofrecen desde Jarvis. */
// 22/11 (revisión): también lo que hace salir mensajes o los habilita sin lanzar una campaña con ese nombre:
// ejecutar una base de Marketing, activar la prospección, encender bots/seguimientos/recontactos, programar
// piezas, volver a contactar a una persona y cambiar días de envío de una campaña.
const OPERACION_VEDADA = /(lanzar|reanudar|publicar|enviar_a_revision|publicacion_automatica|enviar|ejecutar_base|prospeccion_activar|encender|programar|volver_a_contactar|dias_y_wasender)/;

/** ¿Esta clave de operación del panel queda fuera de Jarvis? */
export function esOperacionVedada(clave: string): boolean {
  return OPERACION_VEDADA.test(clave);
}

export interface PropuestaMinima {
  tipo: string;
  detalle?: unknown;
}

/** ¿Esta propuesta queda fuera de Jarvis? (lanzar, publicar, escribirle a alguien) */
export function esPropuestaVedada(p: PropuestaMinima): boolean {
  if (TIPOS_VEDADOS.includes(p.tipo)) return true;
  const d = (p.detalle ?? {}) as Record<string, unknown>;
  if (p.tipo === "plan_campanas") return d.lanzar === true;
  if (p.tipo === "operacion_panel") return OPERACION_VEDADA.test(String(d.clave ?? ""));
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
  if (esPropuestaVedada(p)) {
    return { mostrar: false, nivel: "contacto", extra: "reforzada", motivo: "Eso lo hacen los dueños: lanzar campañas, publicar o escribirle a una persona no se hace desde Jarvis." };
  }
  const nivel = nivelDeAccion(p.tipo, (p.detalle ?? {}) as Record<string, unknown>);
  return { mostrar: true, nivel, extra: nivel === "pin" ? "codigo" : nivel === "contacto" ? "reforzada" : "ninguno" };
}
