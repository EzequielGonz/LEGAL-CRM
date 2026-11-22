/**
 * Avisos al teléfono por rubro (22/11, hallazgos 15 §3 ítem 2: «avisos push globales»). Pura.
 *
 * Un aviso que es de un perfil (crisis de una persona, línea de Marketing caída, calidad de una línea)
 * solo llega a los dispositivos de ese perfil. Un aviso del sistema (sin rubro) llega a todos.
 * Un dispositivo sin perfil asignado (los registrados antes de la migración 0637) sigue recibiendo todo
 * hasta que se le asigne uno: así no se pierde ningún aviso urgente.
 */
import { RUBRO_IDS } from "@/lib/rubros";

/** Rubro del perfil que manda el panel al activar los avisos (solo claves propias: no «toString»). */
export function rubroDePerfilPedido(perfil: unknown): string | null {
  if (typeof perfil !== "string" || !Object.prototype.hasOwnProperty.call(RUBRO_IDS, perfil)) return null;
  return RUBRO_IDS[perfil as keyof typeof RUBRO_IDS];
}

export function dispositivoRecibeAviso(rubroDelDispositivo: string | null | undefined, rubroDelAviso: string | null | undefined): boolean {
  if (!rubroDelAviso) return true;
  if (!rubroDelDispositivo) return true;
  return rubroDelDispositivo === rubroDelAviso;
}

export function filtrarDispositivos<T extends { rubro_id?: string | null }>(dispositivos: T[], rubroDelAviso: string | null | undefined): T[] {
  return dispositivos.filter((d) => dispositivoRecibeAviso(d.rubro_id ?? null, rubroDelAviso));
}
