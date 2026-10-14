import { FollowupPanel } from "@/components/seguimiento/followup-panel";
import { RUBRO_IDS } from "@/lib/rubros";

export const dynamic = "force-dynamic";

/** Etapa 2 · Bloque 2.3 — Seguimiento general del perfil. */
export default function SeguimientoPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Seguimiento</h1>
      <FollowupPanel rubroId={RUBRO_IDS.coberturas_medicas} />
    </div>
  );
}
