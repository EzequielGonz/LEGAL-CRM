import { AgendaSupervision } from "@/components/agenda/agenda-supervision";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";
export const metadata = { title: "Citas" };

// Agenda del perfil (bloque 1.8): misma supervisión que Jurídico, con la
// ficha al costado y las mismas acciones.
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { tab?: string; ficha?: string; pagina?: string };
}) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-950">Citas</h1>
      <p className="mb-6 text-sm text-slate-600">Quién tiene cita y cuándo (incluidas las de Fase 2 con la IA). Elegí una persona para ver su ficha al costado.</p>
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
