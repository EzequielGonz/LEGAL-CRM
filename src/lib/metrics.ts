import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cifras del perfil (bloque 1.5): un solo cálculo en la base
 * (`profile_metrics`) que leen todas las pantallas, en PC y en teléfono.
 * Cada tasa declara su conjunto, su unidad y su denominador; con
 * denominador cero no se inventa un porcentaje: se muestra "Sin datos".
 */
export interface ProfileMetrics {
  oportunidades: number;
  contactos: number;
  contacto: { sin_contactar: number; contactado_sin_respuesta: number; respondio: number; error_contacto: number };
  captacion: { nuevo: number; en_conversacion: number; en_seguimiento: number; captado: number; perdido: number };
  seguimiento: { activo: number; completado: number; caido: number };
  atencion: { ia: number; requiere_humano: number; humano_en_curso: number };
  derivacion: { derivado: number; no_derivado: number };
  detenidos: number;
  retenidos_revision: number;
  detenidos_por_motivo: Record<string, number>;
  revision_pendiente: number;
  mensajes: { enviados: number; recibidos: number };
  citas: Record<string, number>;
  incidencias_abiertas: number;
  calculado_en: string;
}

export interface Rate {
  label: string;
  numerator: number;
  denominator: number;
  /** null cuando el denominador es 0 */
  value: number | null;
  /** qué se cuenta arriba y abajo */
  definition: string;
}

export async function getProfileMetrics(rubroId: string): Promise<ProfileMetrics | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("profile_metrics", { p_rubro: rubroId });
  if (error) {
    console.error("[métricas] No se pudieron calcular:", error.message);
    return null;
  }
  return data as ProfileMetrics;
}

export function rate(label: string, numerator: number, denominator: number, definition: string): Rate {
  return { label, numerator, denominator, value: denominator > 0 ? numerator / denominator : null, definition };
}

export function formatRate(r: Rate): string {
  if (r.value === null) return "Sin datos";
  return `${(r.value * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("es-AR");
}

/** Tasas principales con su denominador explícito. */
export function headlineRates(m: ProfileMetrics): Rate[] {
  const contactadas = m.contacto.contactado_sin_respuesta + m.contacto.respondio;
  return [
    rate(
      "Tasa de respuesta",
      m.contacto.respondio,
      contactadas,
      "Oportunidades que respondieron ÷ oportunidades contactadas (con o sin respuesta)"
    ),
    rate(
      "Tasa de captación",
      m.captacion.captado,
      m.oportunidades,
      "Oportunidades captadas ÷ total de oportunidades del perfil"
    ),
    rate(
      "Derivados",
      m.derivacion.derivado,
      m.captacion.captado,
      "Captadas marcadas como Derivado ÷ captadas"
    ),
  ];
}
