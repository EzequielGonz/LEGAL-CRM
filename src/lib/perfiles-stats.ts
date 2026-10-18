import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileMetrics } from "@/lib/metrics";

/**
 * Vista previa de cada perfil (pantalla de perfiles y teléfono). Usa el
 * cálculo único de cifras (bloque 1.5): lo que se ve acá coincide con
 * Estadísticas y con Casos. Además (18/10): mensajes que llegaron en las
 * últimas 24 h, la campaña más reciente y las publicaciones programadas.
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
  /** Qué requiere acción de una persona (atención humana, captados sin derivar, revisión). */
  accion: { humano: number; sin_derivar: number; revision: number };
  casos: { id: string; full_name: string | null; phone: string | null }[];
  /** Mensajes recibidos en las últimas 24 h (null = no se pudo leer). */
  recibidos24h: number | null;
  /** Campaña más reciente sin archivar. */
  campana: { id: string; nombre: string; estado: string } | null;
  /** Publicaciones programadas que todavía no salieron. */
  programadas: number | null;
};

const CASOS_PREVIEW_LIMIT = 8;

const AREAS: Record<string, string[]> = {
  juridico: ["civil", "penal"],
  agencia_0km: ["agencia_0km"],
  coberturas_medicas: ["coberturas_medicas"],
  marketing: ["marketing"],
};

export async function loadPerfiles(): Promise<PerfilStats[]> {
  const supabase = createAdminClient();
  const { data: rubros } = await supabase
    .from("rubros")
    .select("id, slug, name, emoji, description")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  return Promise.all(
    ((rubros ?? []) as RubroRow[]).map(async (r) => {
      const areas = AREAS[r.slug] ?? [r.slug];
      const [metrics, { data: ultimos }, recibidos, { data: camp }, programadas] = await Promise.all([
        getProfileMetrics(r.id),
        supabase
          .from("opportunities")
          .select("contact_id, contacts(full_name, phone)")
          .eq("rubro_id", r.id)
          .eq("capture_state", "captado")
          .order("captured_at", { ascending: false, nullsFirst: false })
          .limit(CASOS_PREVIEW_LIMIT),
        supabase
          .from("messages")
          .select("id, conversations!inner(area)", { count: "exact", head: true })
          .eq("direction", "entrante")
          .gte("created_at", desde)
          .in("conversations.area", areas),
        supabase.from("campaigns").select("id, name, status").in("area", areas).is("archived_at", null).order("created_at", { ascending: false }).limit(1),
        supabase.from("content_pieces").select("id", { count: "exact", head: true }).eq("rubro_id", r.id).eq("estado", "programada"),
      ]);
      const c: any = (camp ?? [])[0];
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
        recibidos24h: recibidos.error ? null : recibidos.count ?? 0,
        campana: c ? { id: c.id, nombre: c.name, estado: c.status } : null,
        programadas: programadas.error ? null : programadas.count ?? 0,
      };
    })
  );
}
