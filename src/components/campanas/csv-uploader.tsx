"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSpreadsheetFile } from "@/lib/bases/parse-file";

export function CsvUploader({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Mismo parser que usa la sección de Bases: soporta tanto CSV como
      // Excel (.xlsx/.xls), así no hace falta convertir nada a mano antes de subirlo.
      const parsed = await parseSpreadsheetFile(file);
      // En Excel, si la columna de teléfono no está formateada como texto,
      // la celda llega como número de JS (no string) — de ahí que haya que
      // convertir todo con String(...) antes de mandarlo, para no romper
      // más adelante cuando se le hace .trim().
      const rows = parsed.map((r: any) => {
        const rawName = r.nombre ?? r.full_name ?? r.name ?? "";
        const rawPhone = r.telefono ?? r.phone ?? r.celular ?? "";
        return {
          full_name: rawName === "" || rawName == null ? "" : String(rawName).trim(),
          phone: rawPhone === "" || rawPhone == null ? "" : String(rawPhone).trim(),
        };
      });

      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, contacts: rows }),
      });
      if (!res.ok) {
        setError(`El servidor devolvió un error (${res.status}) al importar el archivo.`);
        return;
      }
      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch {
      setError("No se pudo leer el archivo. Verificá que sea un CSV o Excel válido.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm">
      <p className="mb-2 font-medium text-slate-700">Cargar base (CSV o Excel)</p>
      <p className="mb-3 text-xs text-slate-400">
        Debe tener columnas <code>nombre</code> y <code>telefono</code> (en formato internacional,
        ej: 5491122223333).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-xs"
      />
      {loading && <p className="mt-2 text-xs text-slate-400">Importando...</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {result && (
        <p className="mt-2 text-xs text-green-600">
          {result.imported} contactos importados · {result.skipped} filas sin teléfono omitidas.
        </p>
      )}
    </div>
  );
}
