import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, LeadList, type LeadRow } from "@/components/marketing/lead-list";

export const dynamic = "force-dynamic";

/**
 * Consultas directas: gente que nos escribió por su cuenta (Instagram,
 * Facebook, WhatsApp, landing, anuncios). Se reconoce la fuente, el mismo
 * asesor arma la propuesta y califica; al cerrar se avisa la derivación
 * al equipo técnico.
 */
export default async function ConsultasDirectasPage() {
  const supabase = createClient();

  const { data: leads } = await supabase
    .from("marketing_leads")
    .select(LEAD_COLUMNS)
    .eq("source_kind", "directa")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Consultas directas</h1>
        <p className="text-sm text-slate-500">
          Personas que nos escribieron a nosotros. Se registra de dónde vienen, el asesor las califica, les arma la
          propuesta y hace el seguimiento. Al cerrar, se avisa la derivación al equipo técnico.
        </p>
      </div>

      <LeadList
        leads={(leads ?? []) as unknown as LeadRow[]}
        mode="directas"
        emptyText="Todavía no entró ninguna consulta directa."
      />
    </div>
  );
}
