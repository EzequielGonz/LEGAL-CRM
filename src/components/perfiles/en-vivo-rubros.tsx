"use client";

import { useCallback, useEffect, useState } from "react";

type Rango = "hoy" | "todo";

interface Cifras {
  perfil: string;
  campanasEnCurso: number | null;
  enviados: number | null;
  entregados: number | null;
  leidos: number | null;
  fallidos: number | null;
  escribieron: number | null;
  respuestasBot: number | null;
  captados: number | null;
  derivados: number | null;
}

const CLAVE = "perfiles-en-vivo-rango";
const CADA_MS = 30_000;

const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("es-AR"));

/**
 * Seguimiento en vivo de los cuatro rubros (24/10), en la esquina de la
 * pantalla de perfiles: uno abajo del otro, con «Hoy» o «Base completa».
 * Se actualiza solo cada 30 segundos. Solo lectura.
 */
export function EnVivoRubros({ nombres }: { nombres: Record<string, string> }) {
  const [rango, setRango] = useState<Rango>("hoy");
  const [rubros, setRubros] = useState<Cifras[] | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(CLAVE);
      if (v === "hoy" || v === "todo") setRango(v);
    } catch {
      /* sin almacenamiento: queda «Hoy» */
    }
  }, []);

  const leer = useCallback(async (r: Rango) => {
    try {
      const res = await fetch(`/api/perfiles/en-vivo?rango=${r}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "No se pudieron leer las cifras.");
      setRubros(j.rubros);
      setAt(j.at);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message));
    }
  }, []);

  useEffect(() => {
    leer(rango);
    const t = setInterval(() => leer(rango), CADA_MS);
    return () => clearInterval(t);
  }, [rango, leer]);

  function elegir(r: Rango) {
    setRango(r);
    setRubros(null);
    try {
      localStorage.setItem(CLAVE, r);
    } catch {
      /* nada */
    }
  }

  return (
    <aside
      aria-label="Seguimiento en vivo de los rubros"
      className="z-20 mb-8 w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm lg:fixed lg:right-4 lg:top-4 lg:mb-0 lg:w-80"
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setAbierto(!abierto)} className="flex items-center gap-2 text-sm font-semibold text-slate-900" aria-expanded={abierto}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          En vivo
        </button>
        <div role="group" aria-label="Período" className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
          {(["hoy", "todo"] as Rango[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => elegir(r)}
              aria-pressed={rango === r}
              className={`rounded-md px-2.5 py-1 font-medium ${rango === r ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {r === "hoy" ? "Hoy" : "Base completa"}
            </button>
          ))}
        </div>
      </div>

      {abierto && (
        <div className="mt-3 max-h-[75vh] space-y-2 overflow-y-auto pr-0.5">
          {error && <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">{error}</p>}
          {!rubros && !error && <p className="px-1 py-2 text-xs text-slate-500">Cargando…</p>}
          {rubros?.map((c) => {
            const pctResp = c.entregados ? Math.round(((c.escribieron ?? 0) / c.entregados) * 100) : null;
            return (
              <div key={c.perfil} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{nombres[c.perfil] ?? c.perfil}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.campanasEnCurso ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                    {c.campanasEnCurso ? `${c.campanasEnCurso} enviando` : "sin campaña en curso"}
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-center">
                  {[
                    ["Enviados", c.enviados],
                    ["Entregados", c.entregados],
                    ["Leídos", c.leidos],
                    ["Escribieron", c.escribieron],
                    ["Resp. del bot", c.respuestasBot],
                    ["Fallidos", c.fallidos],
                    ["Captados", c.captados],
                    ["Derivados", c.derivados],
                  ].map(([label, v]) => (
                    <div key={label as string}>
                      <dt className="text-[10px] uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className={`text-sm font-semibold tabular-nums ${label === "Fallidos" && (v as number) > 0 ? "text-amber-700" : "text-slate-900"}`}>{n(v as number | null)}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-500">Respuesta</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-900">{pctResp === null ? "—" : `${pctResp}%`}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
          {at && (
            <p className="px-1 text-[11px] text-slate-500">
              Actualizado {new Date(at).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23" })} · se refresca cada 30 s
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
