import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, LeadList, type LeadRow } from "@/components/marketing/lead-list";
import { FollowupPanel } from "@/components/seguimiento/followup-panel";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

/**
 * Seguimiento de Marketing. Etapa 2 (bloque 2.3): pasó al circuito general
 * de los cuatro perfiles. El sistema anterior ("repesca") dejó de enviar; su
 * historial se conserva y se muestra abajo, sin acciones.
 */
export default async function SeguimientoPage() {
  const supabase = createClient();
  const [{ data: anteriores }, { data: bajas }] = await Promise.all([
    supabase.from("marketing_leads").select(LEAD_COLUMNS).eq("outreach_status", "repesca").order("updated_at", { ascending: false }).limit(300),
    supabase.from("marketing_leads").select(LEAD_COLUMNS).eq("outreach_status", "baja").order("updated_at", { ascending: false }).limit(100),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Seguimiento</h1>
      <FollowupPanel rubroId={RUBRO_IDS.marketing} />

      <details className="rounded-xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Historial del sistema anterior (solo consulta)</summary>
        <p className="my-2 text-xs text-slate-500">
          Antes de la Etapa 2, Marketing tenía su propia repesca. Ya no envía nada: estos registros se conservan como historial.
          Las conversaciones anteriores no entran solas al circuito nuevo.
        </p>
        <h2 className="mb-2 mt-4 text-sm font-semibold text-slate-700">Marcados «en duda» ({anteriores?.length ?? 0})</h2>
        <LeadList leads={(anteriores ?? []) as unknown as LeadRow[]} mode="seguimiento" emptyText="Ninguno." />
        <h2 className="mb-2 mt-4 text-sm font-semibold text-slate-700">Dados de baja por el sistema anterior ({bajas?.length ?? 0})</h2>
        <LeadList leads={(bajas ?? []) as unknown as LeadRow[]} mode="seguimiento" emptyText="Ninguno." />
      </details>
    </div>
  );
}
