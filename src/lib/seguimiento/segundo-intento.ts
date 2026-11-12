/**
 * Segundo intento a quien nunca respondió (decisión de la responsable del 12/11).
 *
 * Hasta el 12/11 la regla era: «un frío que nunca respondió no recibe segundo
 * contacto automático». Con Meta cada mensaje costaba y tenía tope; por
 * Wasender se habilita UN solo segundo intento, con otro texto.
 *
 * Reglas (puras, se prueban solas):
 *  - Solo por Wasender. Por Meta sigue valiendo la regla anterior.
 *  - Solo si el primer mensaje se entregó: a un número que falló o que no tiene
 *    WhatsApp no se le vuelve a escribir.
 *  - Solo si nunca respondió y no está detenido.
 *  - Uno solo, entre 5 y 7 días después del primero (cada persona tiene su día,
 *    siempre el mismo, para que no salgan todos juntos).
 *  - Si pasaron más de 10 días sin que saliera, ya no sale.
 * El horario, los días de contacto, el límite del día y el calentamiento de la
 * línea los aplica quien envía: esto solo dice si corresponde y desde cuándo.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

export const SEGUNDO_INTENTO = { minDias: 5, maxDias: 7, venceDias: 10 } as const;

export type PlanSegundoIntento =
  | { accion: "enviar"; desde: Date }
  | { accion: "esperar"; desde: Date }
  | { accion: "nada"; motivo: "no_es_wasender" | "sin_primer_envio" | "no_entregado" | "respondio" | "detenido" | "ya_se_hizo" | "vencido" };

/** Día que le toca a esta persona dentro del rango (siempre el mismo para la misma semilla). */
export function diasDeEspera(semilla: string): number {
  let h = 0;
  for (let i = 0; i < semilla.length; i++) h = (h * 31 + semilla.charCodeAt(i)) >>> 0;
  return SEGUNDO_INTENTO.minDias + (h % (SEGUNDO_INTENTO.maxDias - SEGUNDO_INTENTO.minDias + 1));
}

export function planSegundoIntento(
  d: {
    porWasender: boolean;
    primerEnvioAt: string | Date | null;
    /** Estado del primer envío: solo «entregado» o «leido» habilitan el segundo. */
    estadoPrimerEnvio: string | null;
    respondio: boolean;
    detenido: boolean;
    segundosHechos: number;
    semilla: string;
  },
  ahora: Date = new Date()
): PlanSegundoIntento {
  if (!d.porWasender) return { accion: "nada", motivo: "no_es_wasender" };
  if (d.detenido) return { accion: "nada", motivo: "detenido" };
  if (d.respondio) return { accion: "nada", motivo: "respondio" };
  if (d.segundosHechos > 0) return { accion: "nada", motivo: "ya_se_hizo" };
  const primero = d.primerEnvioAt ? new Date(d.primerEnvioAt).getTime() : NaN;
  if (Number.isNaN(primero)) return { accion: "nada", motivo: "sin_primer_envio" };
  if (!["entregado", "leido"].includes(d.estadoPrimerEnvio ?? "")) return { accion: "nada", motivo: "no_entregado" };
  if (ahora.getTime() > primero + SEGUNDO_INTENTO.venceDias * DIA_MS) return { accion: "nada", motivo: "vencido" };
  const desde = new Date(primero + diasDeEspera(d.semilla) * DIA_MS);
  return ahora.getTime() >= desde.getTime() ? { accion: "enviar", desde } : { accion: "esperar", desde };
}
