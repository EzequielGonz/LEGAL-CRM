"use client";

import { useState } from "react";
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
  basesCargadas = [],
}: {
  campaignId: string;
  area: string;
  /** listado de bases del perfil, para enlazar el detalle (si existe) */
  basesPath?: string | null;
  /** 20/10: bases ya cargadas en el perfil, para sumarlas sin volver a subir el archivo. */
  basesCargadas?: { id: string; nombre: string; filas: number | null; fecha: string }[];
}) {
  const [elegida, setElegida] = useState("");
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm">
      {basesCargadas.length > 0 && (
        <div className="mb-5 border-b border-slate-100 pb-5">
          <label htmlFor="base-cargada" className="mb-1 block font-medium text-slate-700">
            Usar una base ya cargada
          </label>
          <select id="base-cargada" value={elegida} onChange={(e) => setElegida(e.target.value)} className="block w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Elegí una base…</option>
            {basesCargadas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} · {new Date(b.fecha).toLocaleDateString("es-AR")}
                {b.filas != null ? ` · ${b.filas} contactos` : ""}
              </option>
            ))}
          </select>
          {elegida ? <div className="mt-3"><AddBaseToCampaign key={elegida} baseId={elegida} campaignId={campaignId} /></div> : null}
        </div>
      )}
      <p className="mb-1 font-medium text-slate-700">{basesCargadas.length > 0 ? "O cargar una base nueva (CSV o Excel)" : "Cargar base (CSV o Excel)"}</p>
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
