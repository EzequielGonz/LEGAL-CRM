import { AgendaSupervision } from "@/components/agenda/agenda-supervision";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

// Agenda del perfil (bloque 1.8): misma supervisión que Jurídico, con la
// ficha al costado y las mismas acciones.
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { tab?: string; ficha?: string; pagina?: string };
}) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Agenda</h1>
      <p className="mb-6 text-sm text-slate-500">
        Citas, captados sin derivar, seguimientos y atención humana del perfil, resueltos desde esta pantalla.
      </p>
      <AgendaSupervision
        rubroId={RUBRO_IDS.coberturas_medicas}
        areas={["coberturas_medicas"]}
        basePath="/panel/coberturas_medicas/agenda"
        searchParams={searchParams ?? {}}
        fichaHref="/ficha"
      />
    </div>
  );
}
