"use client";

import { useEffect, useState } from "react";
import { previewBody, sourceLabel } from "@/lib/plantillas/catalogo";

interface Option {
  assignment_id: string;
  template_id: string;
  name: string;
  language: string;
  status_label: string;
  variables: string[];
  sources: string[];
  body_text: string | null;
  usable: boolean;
  problems: string[];
}

/**
 * Elegir la plantilla de una campaña entre las del catálogo asignadas a la
 * línea para campañas (pregunta 22). Solo se pueden elegir las que están en
 * condiciones; las demás se muestran con el motivo. "Elegir después" deja la
 * campaña en borrador.
 */
export function TemplatePicker({
  lineId,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  lineId: string | null;
  value: string;
  onChange: (templateId: string) => void;
  className?: string;
  /** Nombre accesible; por defecto coincide con la etiqueta visible de los formularios. */
  ariaLabel?: string;
}) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOptions(null);
    setError(null);
    if (!lineId) return;
    fetch(`/api/plantillas/opciones?line_id=${encodeURIComponent(lineId)}&purpose=campana`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setOptions(Array.isArray(d?.opciones) ? d.opciones : []);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron leer las plantillas de la línea.");
      });
    return () => {
      cancelled = true;
    };
  }, [lineId]);

  const selected = options?.find((o) => o.template_id === value) ?? null;

  return (
    <div>
      <select
        aria-label={ariaLabel ?? "Plantilla (catálogo de la línea)"}
        value={lineId ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={!lineId || options === null}
        className={className ?? "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"}
      >
        <option value="">{!lineId ? "Elegí primero la línea" : options === null ? "Cargando…" : "Elegir después"}</option>
        {(options ?? []).map((o) => (
          <option key={o.assignment_id} value={o.template_id} disabled={!o.usable}>
            {o.name} ({o.language}){o.usable ? "" : ` — no disponible: ${o.problems[0] ?? ""}`}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {lineId && options && options.length === 0 && (
        <p className="mt-1 text-xs text-amber-700">
          Esta línea no tiene plantillas asignadas para campañas. Se leen de Meta y se asignan en Configuración → Plantillas de
          WhatsApp. Sin plantilla la campaña queda en borrador.
        </p>
      )}
      {selected && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
          <p className="font-medium text-slate-700">
            {selected.name} · {selected.status_label}
          </p>
          {selected.body_text && (
            <p className="mt-1 whitespace-pre-line">
              {previewBody({ bodyText: selected.body_text, bodyVariables: selected.variables }, (_v, i) =>
                i >= 0 && selected.sources[i] ? `[${sourceLabel(selected.sources[i])}]` : "[sin fuente]"
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
