/**
 * Reglas puras de los elementos de la vuelta 6 (carteles y barras chicas). Sin React, para probarlas sueltas.
 */

/** Parte un texto con [marcas] en palabras; cada una sabe si va resaltada (itálica serif recuadrada). */
export function palabrasDeCartel(texto: string): { palabra: string; marcada: boolean }[] {
  const salida: { palabra: string; marcada: boolean }[] = [];
  const re = /\[([^\]]+)\]|([^\s[\]]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m[1] !== undefined) salida.push({ palabra: m[1], marcada: true });
    else salida.push({ palabra: m[2], marcada: false });
  }
  return salida;
}

/** «Buenas tardes» → «Buenas [tardes.]»: la última palabra del saludo va recuadrada. */
export function saludoCartel(saludo: string): string {
  const ps = `${saludo}.`.split(" ").filter(Boolean);
  if (ps.length < 2) return ps.join(" ");
  return `${ps.slice(0, -1).join(" ")} [${ps[ps.length - 1]}]`;
}

/**
 * Alto (en %) de una barra chica. Raíz cuadrada para que las cifras chicas del embudo se sigan viendo al lado
 * de las grandes (el número exacto va escrito arriba). Sin dato: un rastro de 4 %, nunca una barra de cero que parezca dato.
 */
export function altoDeBarra(valor: number | null, maximo: number): number {
  if (valor === null || !Number.isFinite(valor)) return 4;
  const max = Math.max(1, maximo);
  return Math.max(6, Math.min(100, Math.round(Math.sqrt(Math.max(0, valor) / max) * 100)));
}
