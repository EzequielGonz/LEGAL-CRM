/**
 * Resumen de la semana del asistente general (15/11). Funciones puras: la
 * comparación con la semana anterior y los totales de los cuatro perfiles.
 */

export const CIFRAS_SEMANA = [
  { clave: "enviados", titulo: "Mensajes enviados", ayuda: "Mensajes de campaña que salieron." },
  { clave: "respondieron", titulo: "Personas que respondieron", ayuda: "Personas distintas que escribieron." },
  { clave: "captados", titulo: "Captados", ayuda: "Personas que dejaron sus datos." },
  { clave: "citas", titulo: "Citas", ayuda: "Citas nuevas (sin las canceladas)." },
  { clave: "derivados", titulo: "Derivados", ayuda: "Captados que pasaron al equipo." },
  { clave: "campanas", titulo: "Campañas en curso", ayuda: "Ahora mismo." },
  { clave: "piden", titulo: "Chats que piden una persona", ayuda: "Ahora mismo." },
] as const;

export type ClaveSemana = (typeof CIFRAS_SEMANA)[number]["clave"];

/** Cifra de un perfil: la semana actual y, si se puede comparar, la anterior. null = no se pudo leer. */
export interface CifraSemana {
  actual: number | null;
  anterior: number | null;
}

export type CifrasPerfilSemana = Record<ClaveSemana, CifraSemana>;

export interface Variacion {
  flecha: "sube" | "baja" | "igual" | "sin_dato";
  /** Texto corto: «+25 %», «−10 %», «igual», «nuevo» o «». */
  texto: string;
  /** Para lectores de pantalla. */
  largo: string;
}

/** Cómo cambió una cifra contra la semana anterior. */
export function variacion(actual: number | null, anterior: number | null): Variacion {
  if (actual == null || anterior == null) return { flecha: "sin_dato", texto: "", largo: "sin comparación con la semana anterior" };
  if (actual === anterior) return { flecha: "igual", texto: "igual", largo: "igual que la semana anterior" };
  if (anterior === 0) return { flecha: "sube", texto: "nuevo", largo: `la semana anterior fue 0` };
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  if (pct === 0) return { flecha: actual > anterior ? "sube" : "baja", texto: actual > anterior ? "+<1 %" : "−<1 %", largo: `casi igual que la semana anterior (${anterior})` };
  return {
    flecha: pct > 0 ? "sube" : "baja",
    texto: `${pct > 0 ? "+" : "−"}${Math.abs(pct)} %`,
    largo: `${pct > 0 ? "subió" : "bajó"} ${Math.abs(pct)} % contra la semana anterior (${anterior})`,
  };
}

/** Suma de los perfiles. Si algún perfil no se pudo leer, el total queda sin dato (no se muestra un total engañoso). */
export function totalSemana(perfiles: CifrasPerfilSemana[]): CifrasPerfilSemana {
  const suma = (vals: (number | null)[]) => (vals.some((v) => v == null) ? null : vals.reduce<number>((a, v) => a + (v as number), 0));
  return Object.fromEntries(
    CIFRAS_SEMANA.map(({ clave }) => [clave, { actual: suma(perfiles.map((p) => p[clave].actual)), anterior: suma(perfiles.map((p) => p[clave].anterior)) }])
  ) as CifrasPerfilSemana;
}

/** Largo de cada barra (0–100) respecto de la cifra más alta de la fila. */
export function proporciones(valores: (number | null)[]): number[] {
  const max = Math.max(0, ...valores.map((v) => v ?? 0));
  return valores.map((v) => (max > 0 && v ? Math.max(2, Math.round((v / max) * 100)) : 0));
}
