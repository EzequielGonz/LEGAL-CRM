/**
 * Etiqueta de gravedad y prioridad por perfil (22/11, hallazgos 15 §3 ítem 8). Pura.
 *
 * Solo en Jurídico la lesión ordena el envío (fractura, fallecimiento y amputación primero, las tres al mismo
 * nivel). Las bases «GRAVES/fracturas» traen mucho que no es grave: por eso se muestra la etiqueta de lo que
 * dice el diagnóstico de cada fila, en lugar de suponerla por el nombre de la base. Para Coberturas, Autos y
 * Marketing la prioridad es siempre la normal: «fractura» no significa nada en esos rubros.
 *
 * NO está conectada a la creación de campañas (`campaign-recipients.ts` sigue usando
 * `computeCampaignPriority` para todos): se deja lista y probada para que el dueño decida si se activa, sin
 * tocar las campañas en curso (la prioridad queda guardada en cada destinatario al crear la campaña).
 */
import type { SlugPerfil } from "@/lib/marca";
import { computeCampaignPriority } from "@/lib/bases/priority";

export type Gravedad = "fractura" | "fallecimiento" | "amputacion";

export const GRAVEDAD_LABEL: Record<Gravedad, string> = {
  fractura: "Fractura",
  fallecimiento: "Fallecimiento",
  amputacion: "Amputación",
};

const SENALES: { gravedad: Gravedad; re: RegExp }[] = [
  { gravedad: "amputacion", re: /amputac/i },
  { gravedad: "fallecimiento", re: /muerte|fallec|falleci|óbito|obito/i },
  { gravedad: "fractura", re: /fractura|fracturad/i },
];

/** La gravedad que dicen los textos de la fila (diagnóstico, tipo de consulta), o null si no dicen ninguna. */
export function gravedadDeFila(...textos: (string | null | undefined)[]): Gravedad | null {
  const t = textos.filter((x): x is string => Boolean(x)).join(" ");
  if (!t.trim()) return null;
  return SENALES.find((s) => s.re.test(t))?.gravedad ?? null;
}

/** Etiqueta para mostrar (solo en bases de Jurídico). */
export function etiquetaDeGravedad(slug: SlugPerfil, ...textos: (string | null | undefined)[]): string | null {
  if (slug !== "juridico") return null;
  const g = gravedadDeFila(...textos);
  return g ? GRAVEDAD_LABEL[g] : null;
}

/** 0 = prioritaria, 1 = normal. Fuera de Jurídico, siempre normal. Coincide con `computeCampaignPriority` en Jurídico. */
export function prioridadParaPerfil(slug: SlugPerfil, ...textos: (string | null | undefined)[]): number {
  return slug === "juridico" ? computeCampaignPriority(...textos) : 1;
}
