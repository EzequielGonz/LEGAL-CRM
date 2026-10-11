import { CasosList } from "@/components/casos/casos-list";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

/** Casos del perfil: captados (No derivado / Derivado), en seguimiento, caídos y perdidos. */
export default function CasosPage({ searchParams }: { searchParams: { vista?: string; q?: string; pagina?: string } }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Casos</h1>
        <p className="text-sm text-slate-500">Las acciones (derivar, tomar, detener) se hacen en la ficha de cada caso.</p>
      </div>
      <CasosList rubroId={RUBRO_IDS.agencia_0km} basePath="/panel/agencia_0km/casos-cerrados" searchParams={searchParams} fichaBase="/ficha" />
    </div>
  );
}
