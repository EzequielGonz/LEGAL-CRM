"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { parseSpreadsheetFileDetailed } from "@/lib/bases/parse-file";
import { detectColumns, type ColumnMapping } from "@/lib/bases/mapping";
import { headersOf, validateRows } from "@/lib/bases/validate";
import type { ImportBaseSummary } from "@/lib/bases/import";
import { createClient } from "@/lib/supabase/client";
import { SpreadsheetPreview } from "./spreadsheet-preview";
import { EnlaceAvanzado } from "@/components/nivel/nivel";

const PREVIEW_ROW_LIMIT = 100;
const MAX_ROWS = 5000;

export interface AreaOption {
  value: string;
  label: string;
}

interface Loaded {
  file: File;
  rows: Record<string, unknown>[];
  headers: string[];
  sheetName: string | null;
  sheetNames: string[];
}

/**
 * Flujo único de importación (bloque 1.6): lo usan Bases, la carga desde
 * una campaña y el modo teléfono. Pasos: elegir archivo → ver hoja, filas y
 * columnas propuestas (se pueden corregir) → ver la validación con motivos
 * (la misma que aplica el servidor) → guardar la base. Guardar NUNCA envía
 * mensajes ni agrega a nadie a una campaña: eso es una confirmación aparte.
 */
export function ImportFlow({
  areas,
  basesPath,
  startOpen = false,
  compact = false,
  openLabel = "Cargar una base",
  after,
  onCancel,
}: {
  /** áreas del perfil donde se puede importar (si hay una sola, no se pregunta) */
  areas: AreaOption[];
  /** ruta del listado de bases para enlazar el detalle (ej. "/bases") */
  basesPath?: string | null;
  startOpen?: boolean;
  /** diseño de una columna para el teléfono */
  compact?: boolean;
  openLabel?: string;
  /** qué mostrar después de guardar (por ejemplo, agregar a una campaña) */
  after?: (summary: ImportBaseSummary & { area: string; name: string }) => React.ReactNode;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [area, setArea] = useState(areas[0]?.value ?? "");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reading, setReading] = useState(false);
  const [mapping, setMapping] = useState<Required<ColumnMapping>>({ phone: null, name: null, dni: null });
  const [name, setName] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repeated, setRepeated] = useState<{ id: string; name: string; created_at: string } | null>(null);
  const [summary, setSummary] = useState<(ImportBaseSummary & { area: string; name: string }) | null>(null);
  const [showProblems, setShowProblems] = useState(false);

  const validation = useMemo(
    () => (loaded ? validateRows(loaded.rows, mapping, 50) : null),
    [loaded, mapping]
  );

  function reset() {
    setLoaded(null);
    setMapping({ phone: null, name: null, dni: null });
    setName("");
    setSourceLabel("");
    setError(null);
    setRepeated(null);
    setSummary(null);
    setShowProblems(false);
  }

  async function handleFile(f: File | null) {
    reset();
    if (!f) return;
    setReading(true);
    try {
      const parsed = await parseSpreadsheetFileDetailed(f);
      const headers = headersOf(parsed.rows);
      const detected = detectColumns(headers);
      setLoaded({ file: f, rows: parsed.rows, headers, sheetName: parsed.sheetName, sheetNames: parsed.sheetNames });
      setMapping({ phone: detected.phone, name: detected.name, dni: detected.dni });
      setName(f.name.replace(/\.(csv|xlsx|xls)$/i, ""));
    } catch (err: any) {
      setError(`No se pudo leer el archivo: ${String(err?.message ?? err)}`);
    } finally {
      setReading(false);
    }
  }

  async function uploadOriginal(file: File): Promise<string | null> {
    // El archivo original se sube DIRECTO a Storage (con una URL firmada de
    // un solo uso), sin pasar por la función del servidor (límite de ~4.5MB
    // por pedido en Vercel). Es el respaldo descargable: si falla, la base
    // se guarda igual (las filas viajan aparte) y queda sin archivo.
    try {
      const urlRes = await fetch("/api/bases/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, fileName: file.name }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error ?? "No se pudo preparar la subida del archivo");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("bases-originales")
        .uploadToSignedUrl(urlData.path, urlData.token, file);
      if (uploadError) throw uploadError;
      return urlData.path as string;
    } catch (uploadErr) {
      console.warn("No se pudo subir el archivo original a Storage:", uploadErr);
      return null;
    }
  }

  async function save(allowRepeat = false) {
    if (!loaded || saving) return;
    setSaving(true);
    setError(null);
    try {
      const storagePath = await uploadOriginal(loaded.file);
      const res = await fetch("/api/bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          name,
          source_label: sourceLabel,
          file_name: loaded.file.name,
          rows: loaded.rows,
          storage_path: storagePath,
          mapping,
          allow_repeat: allowRepeat,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.code === "repetido") {
        setRepeated(data.previous);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `El servidor devolvió un error (${res.status}) al importar.`);
      setRepeated(null);
      setSummary({ ...(data as ImportBaseSummary), area, name });
      router.refresh();
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-gold">
        {openLabel}
      </button>
    );
  }

  const tooMany = (loaded?.rows.length ?? 0) > MAX_ROWS;
  const canSave = !!loaded && loaded.rows.length > 0 && !tooMany && !!name.trim() && !!sourceLabel.trim() && !saving;

  if (summary) {
    return (
      <div className="space-y-4">
        <ImportSummaryCard summary={summary} basesPath={basesPath ?? null} />
        {after?.(summary)}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              if (onCancel) onCancel();
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            {onCancel ? "Cerrar" : "Cargar otro archivo"}
          </button>
        </div>
      </div>
    );
  }

  const selectCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-gold";

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className={clsx("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        {areas.length > 1 && (
          <div>
            <label htmlFor="import-area" className="mb-1 block text-sm font-medium text-slate-700">Área del perfil</label>
            <select id="import-area" value={area} onChange={(e) => setArea(e.target.value)} className={selectCls}>
              {areas.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="import-archivo" className="mb-1 block text-sm font-medium text-slate-700">Archivo (CSV o Excel)</label>
          <input
            id="import-archivo"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs"
          />
          <p className="mt-1 text-xs text-slate-600">
            Se guardan todas las columnas del archivo, también las que el CRM no reconoce. Cargar no envía mensajes.
          </p>
        </div>
      </div>

      {reading && <p role="status" className="text-sm text-slate-700">Leyendo el archivo…</p>}

      {loaded && (
        <>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">{loaded.file.name}</span>
            {loaded.sheetName && (
              <>
                {" · "}hoja «{loaded.sheetName}»
                {loaded.sheetNames.length > 1 &&
                  ` (el archivo tiene ${loaded.sheetNames.length} hojas; se importa solo la primera)`}
              </>
            )}
            {" · "}
            {loaded.rows.length} filas · {loaded.headers.length} columnas
          </div>

          {tooMany && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              El archivo tiene {loaded.rows.length} filas: el máximo por importación es {MAX_ROWS}. Dividilo en partes más chicas.
            </p>
          )}

          {/* Simple: qué entendió el CRM, en una frase. El ajuste fino de columnas y el detalle, en Avanzado. */}
          <div className="solo-simple rounded-lg border border-slate-200 p-3 text-sm text-slate-800">
            <p>
              Columnas detectadas: teléfono = <strong className="font-semibold">{mapping.phone ?? "por el encabezado de cada fila"}</strong>
              {mapping.name ? <> · nombre = <strong className="font-semibold">{mapping.name}</strong></> : null}
              {mapping.dni ? <> · DNI = <strong className="font-semibold">{mapping.dni}</strong></> : null}.
            </p>
            {validation ? (
              <p className="mt-1">
                <span className="tabular-nums font-semibold">{validation.utilizables.toLocaleString("es-AR")}</span> de{" "}
                <span className="tabular-nums">{validation.total.toLocaleString("es-AR")}</span> filas se pueden usar para contactar
                {validation.invalidas ? <> · <span className="tabular-nums">{validation.invalidas.toLocaleString("es-AR")}</span> requieren corrección (se guardan igual con su motivo)</> : null}.
              </p>
            ) : null}
            <EnlaceAvanzado href="#import-columnas" className="tactil mt-1 inline-flex items-center text-sm font-medium text-slate-700 underline underline-offset-2">
              Corregir columnas o ver el detalle
            </EnlaceAvanzado>
          </div>

          <div id="import-columnas" tabIndex={-1} className="solo-avanzado">
            <p className="mb-2 text-sm font-medium text-slate-700">Columnas que usa el CRM (propuesta; podés corregirla)</p>
            <div className={clsx("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-3")}>
              {(
                [
                  ["phone", "Teléfono"],
                  ["name", "Nombre"],
                  ["dni", "DNI / CUIL"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={`import-col-${key}`} className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
                  <select
                    id={`import-col-${key}`}
                    value={mapping[key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value || null }))}
                    className={selectCls}
                  >
                    <option value="">{key === "phone" ? "Sin columna de teléfono" : "Ninguna"}</option>
                    {loaded.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              El resto de las columnas (localidad, diagnóstico, observaciones u otras) se guardan tal cual en cada fila.
            </p>
          </div>

          {validation && (
            <div className="solo-avanzado rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">Validación (la misma que aplica el servidor al guardar)</p>
              <div className={clsx("grid gap-2 text-center", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-5")}>
                <Stat label="Filas reconocidas" value={validation.total} />
                <Stat label="Utilizables" value={validation.utilizables} tone="green" />
                <Stat label="Repetidas en el archivo" value={validation.repetidas_en_archivo} />
                <Stat label="Requieren corrección" value={validation.invalidas} tone={validation.invalidas ? "red" : undefined} />
                <Stat label="Teléfono a revisar" value={validation.a_revisar} tone={validation.a_revisar ? "amber" : undefined} />
              </div>
              {validation.invalidas > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Las filas que requieren corrección se guardan igual con su motivo (no se inventan dígitos), pero no se pueden usar para contactar.
                </p>
              )}
              {validation.ejemplos.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowProblems((v) => !v)}
                    className="text-xs font-medium text-gold-700 hover:underline"
                  >
                    {showProblems ? "Ocultar motivos" : "Ver filas con motivos"}
                  </button>
                  {showProblems && (
                    <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-slate-600">
                      {validation.ejemplos.map((e) => (
                        <li key={`${e.rowNumber}-${e.reason}`}>
                          Fila {e.rowNumber}: {e.reason}
                        </li>
                      ))}
                      {validation.invalidas + validation.a_revisar > validation.ejemplos.length && (
                        <li className="text-slate-400">
                          … y {validation.invalidas + validation.a_revisar - validation.ejemplos.length} más (se ven todas en el detalle de la base).
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
              {!mapping.phone && (
                <p className="mt-2 text-xs text-amber-700">
                  No se eligió columna de teléfono: el CRM la busca por el nombre del encabezado en cada fila.
                </p>
              )}
            </div>
          )}

          {!compact && loaded.rows.length > 0 && (
            <div className="solo-avanzado">
              <p className="mb-2 text-xs font-medium text-slate-600">
                Vista previa{loaded.rows.length > PREVIEW_ROW_LIMIT ? ` (primeras ${PREVIEW_ROW_LIMIT} filas; se procesan todas)` : ""}
              </p>
              <SpreadsheetPreview rows={loaded.rows.slice(0, PREVIEW_ROW_LIMIT)} />
            </div>
          )}

          <div className={clsx("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
            <div>
              <label htmlFor="import-nombre" className="mb-1 block text-sm font-medium text-slate-700">Nombre de la base</label>
              <input
                id="import-nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Base accidentes laborales septiembre"
                className={selectCls}
              />
            </div>
            <div>
              <label htmlFor="import-fuente" className="mb-1 block text-sm font-medium text-slate-700">Fuente de la base</label>
              <input
                id="import-fuente"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="Ej: Compra base marketing - marzo"
                className={selectCls}
              />
            </div>
          </div>
        </>
      )}

      {repeated && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="mb-2">
            Este mismo archivo ya se importó en la base «{repeated.name}» el{" "}
            {new Date(repeated.created_at).toLocaleString("es-AR")}. No se volvió a importar.
          </p>
          <div className="flex flex-wrap gap-2">
            {basesPath && (
              <Link href={`${basesPath}/${repeated.id}`} className="btn-gold-sm">
                Ver esa base
              </Link>
            )}
            <button type="button" onClick={() => save(true)} disabled={saving} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs">
              {saving ? "Importando…" : "Importar igual como otra base"}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save(false)} disabled={!canSave} className="btn-gold">
          {saving ? "Guardando…" : "Guardar base (no envía mensajes)"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(startOpen);
            onCancel?.();
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" | "amber" }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-xs text-slate-600">{label}</p>
      <p
        className={clsx(
          "text-lg font-semibold",
          tone === "green" && "text-green-600",
          tone === "red" && "text-red-600",
          tone === "amber" && "text-amber-600",
          !tone && "text-slate-800"
        )}
      >
        {value.toLocaleString("es-AR")}
      </p>
    </div>
  );
}

/** Resultado de una importación, con la comprobación de que las filas suman el total. */
export function ImportSummaryCard({
  summary,
  basesPath,
}: {
  summary: ImportBaseSummary & { name?: string };
  basesPath: string | null;
}) {
  const suma = summary.creados + summary.duplicados + summary.invalidos;
  const cuadra = suma === summary.total;
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm">
      <p className="mb-1 font-medium text-green-800">Base guardada{summary.name ? ` · ${summary.name}` : ""}. No se envió ningún mensaje.</p>
      <p className={clsx("mb-3 text-xs", cuadra ? "text-green-700" : "text-red-700")}>
        {summary.creados} nuevos + {summary.duplicados} duplicados + {summary.invalidos} inválidos = {suma}{" "}
        {cuadra ? `(coincide con las ${summary.total} filas del archivo)` : `(no coincide con las ${summary.total} filas: revisar)`}
      </p>
      <ul className="space-y-1 text-green-800">
        <li>{summary.creados} contactos nuevos</li>
        <li>
          {summary.duplicados} duplicados: {summary.duplicados_en_archivo ?? 0} repetidos dentro del archivo y {summary.ya_existian ?? 0} que ya
          existían ({summary.en_bases_anteriores ?? 0} en bases anteriores, {summary.contactos_existentes ?? 0} por otra vía)
        </li>
        <li>{summary.invalidos} filas que requieren corrección (sin teléfono utilizable; quedaron guardadas con su motivo)</li>
        {(summary.contactados_anteriormente ?? 0) > 0 && (
          <li>{summary.contactados_anteriormente} ya habían sido contactados antes de esta carga</li>
        )}
        {(summary.detenidos ?? 0) > 0 && <li>{summary.detenidos} con teléfono detenido (no entran a campañas)</li>}
        {(summary.conflictos ?? 0) > 0 && (
          <li className="text-amber-700">{summary.conflictos} con nombre distinto al del contacto existente (no se modificó nada; para revisar)</li>
        )}
        {summary.filas_a_revisar > 0 && (
          <li className="text-amber-700">{summary.filas_a_revisar} teléfonos normalizados con baja confianza (conviene revisarlos)</li>
        )}
      </ul>
      {basesPath && (
        <Link href={`${basesPath}/${summary.base_id}`} className="mt-3 inline-block btn-gold-sm">
          Ver detalle y calidad de la base
        </Link>
      )}
    </div>
  );
}
