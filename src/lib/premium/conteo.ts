/**
 * Conteo de cifras (anillos y cifras sueltas): matemática pura. El DOM lo toca
 * `src/components/premium/animacion.ts`, y solo por atributos (nunca reescribe
 * los nodos de texto de React).
 */
import { formatoNumero } from "./anillo";

/** Ease-out exponencial normalizado (llega exacto a 1): parecido a cubic-bezier(0.16, 1, 0.3, 1). */
export function suavizado(avance: number): number {
  if (!(avance > 0)) return 0;
  if (avance >= 1) return 1;
  return (1 - Math.pow(2, -10 * avance)) / (1 - Math.pow(2, -10));
}

/** El texto de un paso de la cuenta (`avance` de 0 a 1). Al final es idéntico al texto del servidor. */
export function textoDePaso(fin: number, avance: number): string {
  return formatoNumero(fin * suavizado(avance));
}

/** True si vale la pena contar: hay un número positivo razonable que subir. */
export function sePuedeContar(fin: number): boolean {
  return Number.isFinite(fin) && fin > 0 && fin < 10_000_000;
}
