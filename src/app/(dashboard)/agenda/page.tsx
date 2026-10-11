import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/agenda/availability-editor";
import { AgendaSupervision } from "@/components/agenda/agenda-supervision";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

/**
 * Agenda de Jurídico (bloque 1.8): supervisión de citas, captados sin
 * derivar, seguimientos y atención humana, gestionados desde acá mismo con
 * la ficha al costado; abajo, la disponibilidad horaria de cada área.
 */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { tab?: string; ficha?: string; pagina?: string };
}) {
  const supabase = createClient();
  const [{ data: civilRules }, { data: penalRules }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("area", "civil").order("weekday"),
    supabase.from("availability_rules").select("*").eq("area", "penal").order("weekday"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agenda</h1>
      <p className="mb-6 text-sm text-slate-500">
        Pendientes del perfil para supervisar y resolver sin salir de esta pantalla. Las acciones son las mismas que en la
        ficha de Prospectos, Inbox y Casos.
      </p>

      <div className="mb-8">
        <AgendaSupervision
          rubroId={RUBRO_IDS.juridico}
          areas={["civil", "penal"]}
          basePath="/agenda"
          searchParams={searchParams ?? {}}
          fichaHref="/prospectos"
          conversationHref="/inbox"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Disponibilidad para citas</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AvailabilityEditor area="civil" initialRules={civilRules ?? []} />
        <AvailabilityEditor area="penal" initialRules={penalRules ?? []} />
      </div>
    </div>
  );
}
