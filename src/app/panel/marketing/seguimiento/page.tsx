import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, LeadList, type LeadRow } from "@/components/marketing/lead-list";

export const dynamic = "force-dynamic";

/**
 * Seguimiento o repesca: datos fríos que respondieron pero dudaron o
 * dijeron "en otro momento". Se les escribe a los ~3 días y de nuevo ~3
 * días después; si tampoco responden, se dan de baja y no se los vuelve a
 * contactar.
 */
export default async function SeguimientoPage() {
  const supabase = createClient();

  const [{ data: activos }, { data: bajas }] = await Promise.all([
    supabase
      .from("marketing_leads")
      .select(LEAD_COLUMNS)
      .eq("outreach_status", "repesca")
      .order("next_followup_at", { ascending: true })
      .limit(300),
    supabase
      .from("marketing_leads")
      .select(LEAD_COLUMNS)
      .eq("outreach_status", "baja")
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Seguimiento o repesca</h1>
        <p className="text-sm text-slate-500">
          Datos fríos que respondieron pero dudaron o pidieron verlo más adelante. El sistema les escribe a los ~3 días y
          otra vez ~3 días después. Si no responden, se dan de baja y no se los contacta más.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">En seguimiento ({activos?.length ?? 0})</h2>
        <LeadList
          leads={(activos ?? []) as unknown as LeadRow[]}
          mode="seguimiento"
          emptyText="No hay prospectos en seguimiento ahora."
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Dados de baja ({bajas?.length ?? 0})</h2>
        <LeadList
          leads={(bajas ?? []) as unknown as LeadRow[]}
          mode="seguimiento"
          emptyText="Todavía no hay prospectos dados de baja."
        />
      </section>
    </div>
  );
}
