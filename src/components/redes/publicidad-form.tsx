"use client";

import { useEffect, useState } from "react";
import { CONFIG_VACIA, OBJETIVOS_ANUNCIO, OBJETIVO_LABEL, type ConfigAnuncios } from "@/lib/redes/publicidad";

/**
 * Publicidad paga (18/10): se deja configurada y apagada. No crea anuncios
 * ni gasta nada: encenderla necesita presupuesto y autorización expresa.
 */
export function PublicidadForm({ perfil }: { perfil: string }) {
  const [config, setConfig] = useState<ConfigAnuncios>(CONFIG_VACIA);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    fetch(`/api/redes/publicidad?perfil=${encodeURIComponent(perfil)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d?.config && setConfig(d.config))
      .finally(() => setCargando(false));
  }, [perfil]);

  const set = <K extends keyof ConfigAnuncios>(k: K, v: ConfigAnuncios[K]) => setConfig((c) => ({ ...c, [k]: v }));

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/redes/publicidad", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, config }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? "No se pudo guardar.");
      setConfig(d.config);
      setAviso({ tipo: "ok", texto: "Guardado. Sigue apagada: no se gasta nada." });
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <div className="h-72 rounded-2xl skeleton-shimmer" aria-label="Cargando" />;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Anuncios en Instagram y Facebook</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Apagada · no gasta</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">Dejalo configurado: cuando haya presupuesto, se enciende desde acá y los anuncios salen con estos datos.</p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-slate-800">Objetivo</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OBJETIVOS_ANUNCIO.map((o) => (
            <label key={o} className="chip-opcion min-h-[2.5rem] cursor-pointer">
              <input type="radio" name="objetivo" className="sr-only" checked={config.objetivo === o} onChange={() => set("objetivo", o)} />
              {OBJETIVO_LABEL[o]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Tope por día (pesos)</span>
          <input inputMode="numeric" value={config.presupuesto_diario ?? ""} onChange={(e) => set("presupuesto_diario", e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Cuenta publicitaria</span>
          <input value={config.cuenta_publicitaria} placeholder="act_…" onChange={(e) => set("cuenta_publicitaria", e.target.value.trim())} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Zona</span>
          <input value={config.zona} placeholder="Ej.: CABA y GBA" onChange={(e) => set("zona", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Edades</span>
          <input value={config.edades} placeholder="Ej.: 25 a 60" onChange={(e) => set("edades", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Intereses o público</span>
          <textarea rows={3} value={config.intereses} onChange={(e) => set("intereses", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {(["instagram", "facebook"] as const).map((r) => (
          <label key={r} className="flex items-center gap-2 font-medium text-slate-800">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={config.redes.includes(r)}
              onChange={(e) => set("redes", e.target.checked ? Array.from(new Set([...config.redes, r])) : config.redes.filter((x) => x !== r))}
            />
            {r === "instagram" ? "Instagram" : "Facebook"}
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={guardando} className="btn-gold">
          {guardando ? "Guardando…" : "Guardar configuración"}
        </button>
        <button type="button" disabled className="btn-suave" title="Necesita presupuesto y autorización expresa">
          Encender (necesita autorización)
        </button>
        {aviso && <p className={`text-sm ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-700"}`}>{aviso.texto}</p>}
      </div>
    </section>
  );
}
