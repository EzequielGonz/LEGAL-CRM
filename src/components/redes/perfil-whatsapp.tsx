"use client";

import { useEffect, useState } from "react";
import { VERTICALES, VERTICAL_LABEL, type PerfilWhatsApp } from "@/lib/redes/whatsapp-perfil";

interface LineaPerfil {
  id: string;
  label: string;
  telefono: string | null;
  perfil: PerfilWhatsApp | null;
  error: string | null;
}

const VACIO: PerfilWhatsApp = { about: "", description: "", address: "", email: "", websites: [], vertical: "UNDEFINED", profile_picture_url: null };

function FormLinea({ perfil, linea }: { perfil: string; linea: LineaPerfil }) {
  const [datos, setDatos] = useState<PerfilWhatsApp>(linea.perfil ?? VACIO);
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(linea.perfil?.profile_picture_url ?? null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const set = (k: keyof PerfilWhatsApp, v: unknown) => setDatos((d) => ({ ...d, [k]: v }));

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    const form = new FormData();
    form.set("perfil", perfil);
    form.set("line_id", linea.id);
    form.set("datos", JSON.stringify({ ...datos, websites: datos.websites.filter(Boolean) }));
    if (foto) form.set("foto", foto);
    try {
      const res = await fetch("/api/redes/whatsapp", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar.");
      if (data.perfil) {
        setDatos(data.perfil);
        setVista(data.perfil.profile_picture_url ?? vista);
      }
      setFoto(null);
      setAviso({ tipo: "ok", texto: "Guardado en WhatsApp. Puede tardar unos minutos en verse en los teléfonos." });
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <label className="group relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-full bg-slate-100 text-xs text-slate-500 ring-1 ring-slate-200">
          {vista ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vista} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <span>Sin foto</span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-slate-950/60 py-0.5 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Cambiar</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFoto(f);
              if (f) setVista(URL.createObjectURL(f));
            }}
          />
        </label>
        <div>
          <p className="text-base font-semibold text-slate-950">{linea.label}</p>
          <p className="text-sm text-slate-600">{linea.telefono ?? "Línea de WhatsApp"}</p>
          {foto && <p className="mt-1 text-xs text-amber-800">Foto nueva elegida: se sube al guardar.</p>}
        </div>
      </div>

      {linea.error && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No se pudo leer el perfil actual: {linea.error}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Info (frase corta)</span>
          <input value={datos.about} maxLength={139} onChange={(e) => set("about", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <span className="mt-1 block text-right text-xs text-slate-500">{datos.about.length}/139</span>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Descripción</span>
          <textarea value={datos.description} maxLength={512} rows={4} onChange={(e) => set("description", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <span className="mt-1 block text-right text-xs text-slate-500">{datos.description.length}/512</span>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Mail</span>
          <input type="email" value={datos.email} onChange={(e) => set("email", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Rubro</span>
          <select value={datos.vertical} onChange={(e) => set("vertical", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {VERTICALES.map((v) => (
              <option key={v} value={v}>
                {VERTICAL_LABEL[v]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Dirección</span>
          <input value={datos.address} maxLength={256} onChange={(e) => set("address", e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        {[0, 1].map((i) => (
          <label key={i} className="block text-sm">
            <span className="font-medium text-slate-800">Web {i + 1}</span>
            <input
              value={datos.websites[i] ?? ""}
              placeholder="https://"
              onChange={(e) => {
                const w = [...datos.websites];
                w[i] = e.target.value;
                set("websites", w);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={guardando} className="btn-gold">
          {guardando ? "Guardando…" : "Guardar en WhatsApp"}
        </button>
        {aviso && <p className={`text-sm ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-700"}`}>{aviso.texto}</p>}
      </div>
    </section>
  );
}

/** Perfil de empresa de WhatsApp de cada línea del perfil (18/10). */
export function PerfilesWhatsApp({ perfil }: { perfil: string }) {
  const [lineas, setLineas] = useState<LineaPerfil[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/redes/whatsapp?perfil=${encodeURIComponent(perfil)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error ?? "No se pudo leer.");
        setLineas(d.lineas ?? []);
      })
      .catch((e) => setError((e as Error).message));
  }, [perfil]);
  if (error) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!lineas) return <div className="h-64 rounded-2xl skeleton-shimmer" aria-label="Cargando" />;
  if (lineas.length === 0) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-700">Este perfil no tiene líneas de WhatsApp activas.</p>;
  return (
    <div className="space-y-6">
      {lineas.map((l) => (
        <FormLinea key={l.id} perfil={perfil} linea={l} />
      ))}
    </div>
  );
}
