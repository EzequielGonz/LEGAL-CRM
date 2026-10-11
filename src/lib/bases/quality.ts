import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Calidad de una base (bloque 1.6), calculada en la base de datos
 * (`base_quality`). Los problemas de calidad se miden sobre quienes
 * respondieron: es el único conjunto del que se sabe algo. Lo que no está
 * clasificado queda como desconocido, no se reparte entre las categorías.
 */
export interface BaseQuality {
  filas: number;
  contactos: number;
  contactados: number;
  respondieron: number;
  numeros_equivocados: number;
  consultas_negadas: number;
  contestadores_automaticos: number;
  sin_clasificar: number;
  detenidos: number;
}

export async function getBaseQuality(baseId: string): Promise<BaseQuality | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("base_quality", { p_base: baseId });
  if (error) {
    console.error("[bases] No se pudo calcular la calidad:", error.message);
    return null;
  }
  return data as BaseQuality;
}

export function pctText(n: number, d: number): string {
  if (d <= 0) return "Sin datos";
  return `${((n / d) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
}
