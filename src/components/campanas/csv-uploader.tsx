"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSpreadsheetFile } from "@/lib/bases/parse-file";

export function CsvUploader({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    agregados?: number;
    yaContactados?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Mismo parser que usa la sección de Bases: soporta tanto CSV como
      // Excel (.xlsx/.xls), así no hace falta convertir nada a mano antes de subirlo.
      //
      // Antes acá mismo se buscaban las columnas a mano (r.nombre, r.telefono,
      // r.celular...) con las claves EXACTAS en minúscula — eso fallaba con
      // cualquier header real de Excel ("Teléfono", "Nombre y Apellido",
      // "Celular", con mayúsculas o tildes) y terminaba marcando TODAS las
      // filas como "sin teléfono", aunque el archivo estuviera bien. Ahora se
      // mandan las filas crudas tal cual, y el servidor las interpreta con el
      // mismo reconocimiento de columnas por alias que usa la sección de
      // Bases (que sí entiende esas variantes).
      const rows = await parseSpreadsheetFile(file);

      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, rows }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `El servidor devolvió un error (${res.status}) al importar el archivo.`);
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
        Reconoce columnas de nombre y teléfono con cualquier variante de nombre habitual (ej:
        &ldquo;Teléfono&rdquo;, &ldquo;Celular&rdquo;, &ldquo;WhatsApp&rdquo;) — no hace falta que
        se llamen exactamente así. El teléfono se normaliza automáticamente al formato que
        necesita WhatsApp.
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
          {result.agregados ?? result.imported} agregados a la cola de la campaña
          {typeof result.yaContactados === "number" && result.yaContactados > 0 && (
            <> · {result.yaContactados} ya habían recibido un mensaje de campaña antes (no se les vuelve a mandar)</>
          )}
          {" · "}
          {result.skipped} filas sin teléfono omitidas.
        </p>
      )}
    </div>
  );
}
