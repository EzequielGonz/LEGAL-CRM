"use client";

import { ImportFlow } from "@/components/bases/import-flow";
import { AddBaseToCampaign } from "./add-base-to-campaign";

/**
 * Cargar un archivo desde una campaña (bloque 1.6: un solo flujo de
 * importación). El archivo se guarda como una base con la misma validación
 * que Bases y el teléfono; después, como confirmación aparte, se eligen
 * cuántos de sus contactos entran a esta campaña. Ni guardar ni agregar
 * lanza la campaña.
 */
export function CsvUploader({
  campaignId,
  area,
  basesPath = null,
}: {
  campaignId: string;
  area: string;
  /** listado de bases del perfil, para enlazar el detalle (si existe) */
  basesPath?: string | null;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm">
      <p className="mb-1 font-medium text-slate-700">Cargar base (CSV o Excel)</p>
      <p className="mb-3 text-xs text-slate-400">
        El archivo se guarda como una base del perfil (con su validación y su calidad). Después confirmás aparte cuántos
        de sus contactos se suman a esta campaña. Nada se envía hasta lanzar la campaña.
      </p>
      <ImportFlow
        areas={[{ value: area, label: area }]}
        basesPath={basesPath}
        openLabel="Elegir archivo"
        after={(summary) => <AddBaseToCampaign baseId={summary.base_id} campaignId={campaignId} />}
      />
    </div>
  );
}
