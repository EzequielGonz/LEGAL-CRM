/**
 * Comparación de versiones del conocimiento del bot (25/10). Funciones puras:
 * tasas por versión y un veredicto prudente que no declara ganador con
 * pocos datos ni con diferencias que pueden ser azar.
 */

export interface FilaEstadistica {
  version: number;
  conversaciones: number;
  turnos: number;
  siguieron: number;
  captados: number;
  escalados: number;
  detenidos: number;
  retenidos: number;
  tokens_promedio: number | null;
  latencia_promedio: number | null;
}

export interface Tasas extends FilaEstadistica {
  tasa_sigue: number;
  tasa_captacion: number;
  tasa_escalado: number;
  tasa_detencion: number;
  turnos_por_conversacion: number;
}

export const MINIMO_CONVERSACIONES = 30;

export function tasas(f: FilaEstadistica): Tasas {
  const n = f.conversaciones || 0;
  const r = (x: number) => (n > 0 ? Math.round((x / n) * 1000) / 10 : 0);
  return {
    ...f,
    tasa_sigue: r(f.siguieron),
    tasa_captacion: r(f.captados),
    tasa_escalado: r(f.escalados),
    tasa_detencion: r(f.detenidos),
    turnos_por_conversacion: n > 0 ? Math.round((f.turnos / n) * 10) / 10 : 0,
  };
}

/** Suma filas de la misma versión (por ejemplo, de varios rubros). */
export function sumar(filas: FilaEstadistica[], version: number): FilaEstadistica {
  const de = filas.filter((f) => f.version === version);
  const s = (k: keyof FilaEstadistica) => de.reduce((a, f) => a + (Number(f[k]) || 0), 0);
  const conv = s("conversaciones");
  const prom = (k: "tokens_promedio" | "latencia_promedio") =>
    conv > 0 ? Math.round(de.reduce((a, f) => a + (Number(f[k]) || 0) * f.conversaciones, 0) / conv) : null;
  return {
    version,
    conversaciones: conv,
    turnos: s("turnos"),
    siguieron: s("siguieron"),
    captados: s("captados"),
    escalados: s("escalados"),
    detenidos: s("detenidos"),
    retenidos: s("retenidos"),
    tokens_promedio: prom("tokens_promedio"),
    latencia_promedio: prom("latencia_promedio"),
  };
}

/** Prueba de dos proporciones: z del cambio de b respecto de a. */
export function zDiferencia(exitosA: number, nA: number, exitosB: number, nB: number): number {
  if (nA === 0 || nB === 0) return 0;
  const pa = exitosA / nA;
  const pb = exitosB / nB;
  const p = (exitosA + exitosB) / (nA + nB);
  const se = Math.sqrt(p * (1 - p) * (1 / nA + 1 / nB));
  return se === 0 ? 0 : (pb - pa) / se;
}

/** Veredicto en lenguaje simple, comparando b (nueva) contra a (anterior). */
export function veredicto(a: FilaEstadistica, b: FilaEstadistica): { tono: "datos" | "mejor" | "peor" | "igual"; texto: string } {
  const A = tasas(a);
  const B = tasas(b);
  if (a.conversaciones < MINIMO_CONVERSACIONES || b.conversaciones < MINIMO_CONVERSACIONES) {
    return {
      tono: "datos",
      texto: `Todavía hay pocos datos para comparar (v${a.version}: ${a.conversaciones} conversaciones; v${b.version}: ${b.conversaciones}). Hacen falta al menos ${MINIMO_CONVERSACIONES} en cada una.`,
    };
  }
  const zCapt = zDiferencia(a.captados, a.conversaciones, b.captados, b.conversaciones);
  const zSigue = zDiferencia(a.siguieron, a.conversaciones, b.siguieron, b.conversaciones);
  const zBaja = zDiferencia(a.detenidos, a.conversaciones, b.detenidos, b.conversaciones);
  const partes: string[] = [];
  const cambio = (nombre: string, x: number, y: number, z: number, masEsMejor: boolean) => {
    const dif = Math.round((y - x) * 10) / 10;
    if (Math.abs(z) < 1.96) return null;
    const mejora = masEsMejor ? dif > 0 : dif < 0;
    partes.push(`${nombre} ${dif > 0 ? "sube" : "baja"} de ${x}% a ${y}%`);
    return mejora;
  };
  const r1 = cambio("La captación", A.tasa_captacion, B.tasa_captacion, zCapt, true);
  const r2 = cambio("Las personas que siguen la charla", A.tasa_sigue, B.tasa_sigue, zSigue, true);
  const r3 = cambio("Las bajas", A.tasa_detencion, B.tasa_detencion, zBaja, false);
  const resultados = [r1, r2, r3].filter((x) => x !== null) as boolean[];
  if (!resultados.length) {
    return { tono: "igual", texto: `Con ${a.conversaciones} y ${b.conversaciones} conversaciones no hay una diferencia clara entre v${a.version} y v${b.version}: lo que cambia puede ser azar.` };
  }
  const buenas = resultados.filter(Boolean).length;
  const tono = buenas === resultados.length ? "mejor" : buenas === 0 ? "peor" : "igual";
  return { tono, texto: `${partes.join("; ")} (diferencias claras, no de azar).` };
}
