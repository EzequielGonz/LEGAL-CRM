import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileMetrics } from "@/lib/metrics";

/**
 * Vista previa de cada perfil (pantalla de Computadora y teléfono). Usa el
 * cálculo único de cifras (bloque 1.5): lo que se ve acá coincide con
 * Estadísticas y con Casos.
 */
export type RubroRow = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
};

export type PerfilStats = RubroRow & {
  /** captados (unidad: oportunidad) */
  agendados: number;
  /** captados sin derivar */
  cerrados: number;
  /** Etapa 3: qué requiere acción de una persona (atención humana, captados sin derivar, revisión). */
  accion: { humano: number; sin_derivar: number; revision: number };
  casos: { id: string; full_name: string | null; phone: string | null }[];
};

const CASOS_PREVIEW_LIMIT = 8;

export async function loadPerfiles(): Promise<PerfilStats[]> {
  const supabase = createAdminClient();
  const { data: rubros } = await supabase
    .from("rubros")
    .select("id, slug, name, emoji, description")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return Promise.all(
    ((rubros ?? []) as RubroRow[]).map(async (r) => {
      const [metrics, { data: ultimos }] = await Promise.all([
        getProfileMetrics(r.id),
        supabase
          .from("opportunities")
          .select("contact_id, contacts(full_name, phone)")
          .eq("rubro_id", r.id)
          .eq("capture_state", "captado")
          .order("captured_at", { ascending: false, nullsFirst: false })
          .limit(CASOS_PREVIEW_LIMIT),
      ]);
      return {
        ...r,
        agendados: metrics?.captacion.captado ?? 0,
        cerrados: metrics?.derivacion.no_derivado ?? 0,
        accion: { humano: metrics?.atencion.requiere_humano ?? 0, sin_derivar: metrics?.derivacion.no_derivado ?? 0, revision: metrics?.revision_pendiente ?? 0 },
        casos: ((ultimos ?? []) as any[]).map((o) => ({
          id: o.contact_id,
          full_name: o.contacts?.full_name ?? null,
          phone: o.contacts?.phone ?? null,
        })),
      };
    })
  );
}
