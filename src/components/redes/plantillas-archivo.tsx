"use client";

import { useState } from "react";
import { parseSpreadsheetFile } from "@/lib/bases/parse-file";

interface Envio {
  rubro: string;
  linea: string | null;
  error?: string;
  resultados: { nombre: string; categoria: string; estado: string; detalle?: string }[];
}

const RUBRO: Record<string, string> = { juridico: "Estudio Jurídico", coberturas_medicas: "Coberturas médicas", agencia_0km: "Autos 0 km", marketing: "Marketing" };
const ESTADO: Record<string, string> = { "se_enviaría": "Se envía", enviada_a_revision: "Enviada a Meta", ya_existe: "Ya estaba", error: "Error" };

async function leerArchivo(f: File): Promise<unknown[]> {
  const nombre = f.name.toLowerCase();
  if (nombre.endsWith(".json")) {
    const j = JSON.parse(await f.text());
    return Array.isArray(j) ? j : Array.isArray(j?.plantillas) ? j.plantillas : [];
  }
  return parseSpreadsheetFile(f);
}

/**
 * Plantillas desde un archivo (18/10): subís un CSV, Excel o JSON, el panel
 * reconoce el perfil de cada plantilla y las manda a revisión de Meta en la
 * línea que corresponde. Primero muestra qué va a hacer; nada se envía hasta
 * tocar «Enviar a Meta». No manda mensajes a nadie.
 */
export function PlantillasArchivo({ perfil }: { perfil: string }) {
  const [filas, setFilas] = useState<unknown[] | null>(null);
  const [archivo, setArchivo] = useState<string | null>(null);
  const [vista, setVista] = useState<{ envios: Envio[]; errores: { fila: number; nombre: string | null; motivo: string }[]; confirmar: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revisar(lista: unknown[], confirmar: boolean) {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch("/api/plantillas/archivo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filas: lista, confirmar }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVista(data?.errores ? { envios: [], errores: data.errores, confirmar } : null);
        throw new Error(data?.error ?? "No se pudo revisar el archivo.");
      }
      setVista({ envios: data.envios ?? [], errores: data.errores ?? [], confirmar });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Cargar plantillas desde un archivo</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">CSV, Excel o JSON con las columnas perfil, nombre, categoria, cuerpo y botones. Si falta la columna perfil, se reconoce por el nombre (jur_, cob_, autos_, mkt_). Cada plantilla va a la línea de su perfil.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/plantillas/propuestas?perfil=${encodeURIComponent(perfil)}`} className="btn-suave">
            Descargar las de este perfil
          </a>
          <a href="/api/plantillas/propuestas" className="btn-suave">
            Descargar todas
          </a>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-slate-400">
        <span className="text-sm font-semibold text-slate-900">{archivo ?? "Elegí el archivo"}</span>
        <span className="mt-1 text-xs text-slate-500">.csv, .xlsx o .json</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json,text/csv,application/json"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setArchivo(f.name);
            setVista(null);
            try {
              const lista = await leerArchivo(f);
              setFilas(lista);
              await revisar(lista, false);
            } catch {
              setError("No se pudo leer el archivo. Revisá que sea CSV, Excel o JSON.");
            }
          }}
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {vista && (
        <div className="mt-5 space-y-4">
          {vista.envios.map((e) => (
            <div key={e.rubro} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{RUBRO[e.rubro] ?? e.rubro}</p>
              {e.error ? (
                <p className="mt-1 text-sm text-red-700">{e.error}</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 text-sm">
                  {e.resultados.map((r) => (
                    <li key={r.nombre} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                      <span className="font-mono text-xs text-slate-800">{r.nombre}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.estado === "error" ? "bg-red-50 text-red-800" : r.estado === "ya_existe" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-800"}`}>
                        {ESTADO[r.estado] ?? r.estado}
                      </span>
                      {r.detalle && <span className="w-full text-xs text-red-700">{r.detalle}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {vista.errores.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Filas que no se pueden usar</p>
              <ul className="mt-1 list-disc pl-5">
                {vista.errores.map((e) => (
                  <li key={e.fila}>
                    Fila {e.fila}
                    {e.nombre ? ` (${e.nombre})` : ""}: {e.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!vista.confirmar && filas && vista.envios.some((e) => e.resultados.some((r) => r.estado === "se_enviaría")) && (
            <button type="button" disabled={ocupado} onClick={() => revisar(filas, true)} className="btn-gold">
              {ocupado ? "Enviando…" : "Enviar a Meta para revisión"}
            </button>
          )}
          {vista.confirmar && <p className="text-sm text-emerald-700">Listo. Meta revisa cada plantilla (de minutos a 24 h); el estado se ve abajo.</p>}
        </div>
      )}
    </section>
  );
}
