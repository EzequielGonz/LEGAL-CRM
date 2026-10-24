"use client";

import { useEffect, useState } from "react";

const MAX = 6000;

/**
 * Ficha del negocio (24/10). Datos reales del rubro que el bot usa en cada
 * respuesta: qué se ofrece y qué no, zonas, horarios, cómo sigue la gestión,
 * qué nunca se promete y respuestas a objeciones. Guardar no envía nada.
 */
export function FichaNegocio({ perfil }: { perfil: string }) {
  const [ficha, setFicha] = useState("");
  const [original, setOriginal] = useState("");
  const [actualizada, setActualizada] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`/api/agentes/ficha?perfil=${perfil}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "No se pudo leer la ficha.");
        if (!vivo) return;
        setFicha(j.ficha ?? "");
        setOriginal(j.ficha ?? "");
        setActualizada(j.actualizada ?? null);
      } catch (e) {
        if (vivo) setMsg({ ok: false, text: String((e as Error).message) });
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [perfil]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/agentes/ficha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, ficha }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo guardar.");
      setOriginal(j.ficha ?? ficha);
      setFicha(j.ficha ?? ficha);
      setActualizada(j.actualizada ?? null);
      setMsg({ ok: true, text: "Ficha guardada. El bot la usa desde la próxima respuesta." });
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  }

  const cambio = ficha !== original;

  return (
    <section id="ficha-negocio" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="ficha-titulo">
      <h2 id="ficha-titulo" className="text-lg font-semibold text-slate-900">
        Ficha del negocio
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-700">
        Lo que el bot sabe del negocio: qué ofrecen y qué no, zonas, horarios, cómo sigue la gestión, qué nunca se promete y cómo responder las objeciones. El bot usa solo lo que figura acá; lo que falta no lo inventa.
      </p>
      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={`mt-4 rounded-lg p-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      ) : null}
      {cargando ? (
        <p className="mt-4 text-sm text-slate-600">Cargando…</p>
      ) : (
        <form onSubmit={guardar} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-800" htmlFor={`ficha-${perfil}`}>
            Texto de la ficha
          </label>
          <textarea
            id={`ficha-${perfil}`}
            className="min-h-[260px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={ficha}
            maxLength={MAX}
            onChange={(e) => setFicha(e.target.value)}
            placeholder="Qué ofrecemos, qué no, zonas, horarios, quién sigue la gestión, qué nunca prometer y respuestas a objeciones. Sin datos de personas."
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-600">
              {ficha.length}/{MAX} caracteres
              {actualizada ? ` · Última edición: ${new Date(actualizada).toLocaleString("es-AR")}` : ""}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-suave" disabled={busy || !cambio} onClick={() => setFicha(original)}>
                Descartar cambios
              </button>
              <button type="submit" className="btn-gold" disabled={busy || !cambio}>
                {busy ? "Guardando…" : "Guardar ficha"}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
