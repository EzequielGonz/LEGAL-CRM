"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseSpreadsheetFile } from "@/lib/bases/parse-file";
import type { ImportBaseSummary } from "@/lib/bases/import";
import { SpreadsheetPreview } from "./spreadsheet-preview";

const PREVIEW_ROW_LIMIT = 100;

export function ImportBaseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<"civil" | "penal">("civil");
  const [name, setName] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[] | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportBaseSummary | null>(null);

  async function handleFileChange(f: File | null) {
    setFile(f);
    setError(null);
    setPreviewRows(null);
    if (!f) return;

    // Apenas se elige el archivo lo parseamos y lo mostramos en pantalla tal
    // como va a quedar — así se puede revisar que sea el correcto sin tener
    // que abrirlo en Excel. Esto no importa nada todavía: es solo vista
    // previa, en memoria del browser.
    setPreviewLoading(true);
    try {
      const rows = await parseSpreadsheetFile(f);
      setPreviewTotal(rows.length);
      setPreviewRows(rows.slice(0, PREVIEW_ROW_LIMIT));
    } catch (err: any) {
      setError(`No se pudo leer el archivo: ${String(err.message ?? err)}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length === 0) {
        setError("El archivo no tiene filas para importar.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("area", area);
      form.append("name", name);
      form.append("source_label", sourceLabel);
      form.append("file_name", file.name);
      form.append("rows", JSON.stringify(rows));
      form.append("file", file);

      const res = await fetch("/api/bases", { method: "POST", body: form });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido al importar");

      setSummary(data);
      router.refresh();
    } catch (err: any) {
      setError(String(err.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  if (summary) {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-sm">
        <p className="mb-2 font-medium text-green-800">Base importada.</p>
        <ul className="space-y-1 text-green-700">
          <li>{summary.total} filas procesadas</li>
          <li>{summary.creados} contactos nuevos creados</li>
          <li>{summary.duplicados} duplicados (ya existían o se repetían en el archivo)</li>
          <li>{summary.invalidos} filas inválidas (sin teléfono interpretable)</li>
          {summary.filas_a_revisar > 0 && (
            <li className="text-amber-700">
              {summary.filas_a_revisar} teléfonos normalizados con baja confianza — convendría
              revisarlos antes de lanzar una campaña.
            </li>
          )}
        </ul>
        <button
          onClick={() => router.push(`/bases/${summary.base_id}`)}
          className="mt-3 btn-gold-sm"
        >
          Ver detalle de la base
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold">
        + Importar base
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Área</label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value as "civil" | "penal")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        >
          <option value="civil">Civil</option>
          <option value="penal">Penal</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Nombre de la base</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Base accidentes laborales septiembre"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Fuente de la base</label>
        <input
          required
          value={sourceLabel}
          onChange={(e) => setSourceLabel(e.target.value)}
          placeholder="Ej: Compra base marketing - Google Ads marzo"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Archivo (CSV o Excel)</label>
        <input
          required
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
        <p className="mt-1 text-xs text-slate-400">
          Columnas reconocidas (en cualquier orden): nombre, teléfono, email, DNI/CUIL, tipo de
          consulta, fecha de consulta, observaciones. El archivo original queda guardado sin
          modificar.
        </p>
      </div>

      {previewLoading && <p className="text-xs text-slate-400">Leyendo el archivo…</p>}

      {previewRows && previewRows.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">
            Vista previa — {previewTotal} fila{previewTotal === 1 ? "" : "s"} encontrada
            {previewTotal === 1 ? "" : "s"}
            {previewTotal > PREVIEW_ROW_LIMIT
              ? ` (mostrando las primeras ${PREVIEW_ROW_LIMIT}; se procesan todas al importar)`
              : ""}
            . Revisá que sea el archivo correcto antes de importar.
          </p>
          <SpreadsheetPreview rows={previewRows} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !file}
          className="btn-gold"
        >
          {loading ? "Importando..." : "Importar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">
          Cancelar
        </button>
      </div>
    </form>
  );
}
