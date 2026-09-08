"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";

export function CsvUploader({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  function handleFile(file: File) {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as any[]).map((r) => ({
          full_name: r.nombre ?? r.full_name ?? r.name ?? "",
          phone: r.telefono ?? r.phone ?? r.celular ?? "",
        }));

        const res = await fetch("/api/campaigns/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign_id: campaignId, contacts: rows }),
        });
        const data = await res.json();
        setResult(data);
        setLoading(false);
        router.refresh();
      },
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm">
      <p className="mb-2 font-medium text-slate-700">Cargar base (CSV)</p>
      <p className="mb-3 text-xs text-slate-400">
        Debe tener columnas <code>nombre</code> y <code>telefono</code> (en formato internacional,
        ej: 5491122223333).
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-xs"
      />
      {loading && <p className="mt-2 text-xs text-slate-400">Importando...</p>}
      {result && (
        <p className="mt-2 text-xs text-green-600">
          {result.imported} contactos importados · {result.skipped} filas sin teléfono omitidas.
        </p>
      )}
    </div>
  );
}
