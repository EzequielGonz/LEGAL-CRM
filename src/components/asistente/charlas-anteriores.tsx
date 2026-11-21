"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 20/11: charlas guardadas (pedido de la Bandeja). Lista de charlas
 * anteriores del asistente general o del Laboratorio: abrir una para
 * seguirla o quitarla de la lista (no se borra, se archiva).
 * Dos formas: «recientes» (chat vacío, las últimas 5) y «completa» (todas,
 * en lugar de la conversación, con «Volver a la charla»).
 */

export interface CharlaResumen {
  id: string;
  titulo: string;
  actualizada: string;
}

const ZONA = "America/Argentina/Buenos_Aires";
const diaAr = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: ZONA });

/** «hoy 14:05», «ayer 09:10» o «lun 17 nov», en hora de Buenos Aires. */
export function fechaCharla(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hora = d.toLocaleTimeString("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  if (diaAr(d) === diaAr(ahora)) return `hoy ${hora}`;
  if (diaAr(d) === diaAr(new Date(ahora.getTime() - 86_400_000))) return `ayer ${hora}`;
  return d.toLocaleDateString("es-AR", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "").replace(",", "");
}

export function CharlasAnteriores({
  modo,
  charlas,
  actual,
  cargando,
  error,
  abriendo,
  alAbrir,
  alQuitar,
  alVerTodas,
  alVolver,
}: {
  modo: "recientes" | "completa";
  charlas: CharlaResumen[];
  actual: string | null;
  cargando: boolean;
  error: string | null;
  abriendo: string | null;
  alAbrir: (id: string) => void;
  alQuitar?: (id: string) => Promise<void>;
  alVerTodas?: () => void;
  alVolver?: () => void;
}) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const [aConfirmar, setAConfirmar] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);

  // Al abrir la lista completa, el foco va a su título.
  useEffect(() => {
    if (modo === "completa") titulo.current?.focus();
  }, [modo]);

  const lista = modo === "recientes" ? charlas.slice(0, 5) : charlas;
  // En el chat vacío no se muestra nada si no hay charlas guardadas.
  if (modo === "recientes" && !cargando && !error && lista.length === 0) return null;

  return (
    <section aria-labelledby={`charlas-${modo}`} className={modo === "recientes" ? "mt-2" : ""}>
      {modo === "completa" && alVolver && (
        <button type="button" onClick={alVolver} className="tactil mb-2 rounded-lg px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          ← Volver a la charla
        </button>
      )}
      <h3 id={`charlas-${modo}`} ref={titulo} tabIndex={-1} className="text-sm font-semibold text-slate-900 outline-none">
        Charlas anteriores
      </h3>
      {cargando && lista.length === 0 && (
        <p role="status" className="mt-1 text-sm text-slate-600">
          Buscando charlas anteriores…
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      {modo === "completa" && !cargando && !error && lista.length === 0 && <p className="mt-1 text-sm text-slate-600">Todavía no hay charlas guardadas.</p>}
      {lista.length > 0 && (
        <ul className="mt-2 space-y-2">
          {lista.map((c) => {
            const esActual = c.id === actual;
            return (
              <li key={c.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => alAbrir(c.id)}
                  disabled={abriendo !== null}
                  aria-current={esActual ? "true" : undefined}
                  className={`flex min-h-[44px] min-w-0 flex-1 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left hover:border-slate-400 disabled:opacity-60 ${esActual ? "border-slate-900 bg-white" : "border-slate-200 bg-white"}`}
                >
                  <span className="w-full truncate text-sm font-medium text-slate-900" title={c.titulo}>
                    {c.titulo}
                  </span>
                  <span className="text-xs text-slate-600">
                    {abriendo === c.id ? "Abriendo…" : `${fechaCharla(c.actualizada)}${esActual ? " · la que tenés abierta" : ""}`}
                  </span>
                </button>
                {modo === "completa" && alQuitar && (
                  <button
                    type="button"
                    disabled={quitando === c.id}
                    onClick={async () => {
                      if (aConfirmar !== c.id) return setAConfirmar(c.id);
                      setQuitando(c.id);
                      await alQuitar(c.id).finally(() => {
                        setQuitando(null);
                        setAConfirmar(null);
                      });
                    }}
                    onBlur={() => setAConfirmar((x) => (x === c.id ? null : x))}
                    aria-label={aConfirmar === c.id ? `Confirmar: quitar «${c.titulo}» de la lista` : `Quitar «${c.titulo}» de la lista`}
                    className={`tactil shrink-0 rounded-xl border px-3 text-sm font-medium disabled:opacity-60 ${aConfirmar === c.id ? "border-red-300 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
                  >
                    {quitando === c.id ? "Quitando…" : aConfirmar === c.id ? "¿Seguro? Quitar" : "Quitar"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {modo === "recientes" && charlas.length > lista.length && alVerTodas && (
        <button type="button" onClick={alVerTodas} className="tactil mt-2 rounded-lg px-2.5 text-sm font-medium text-slate-800 underline hover:bg-slate-100">
          Ver todas ({charlas.length})
        </button>
      )}
    </section>
  );
}
