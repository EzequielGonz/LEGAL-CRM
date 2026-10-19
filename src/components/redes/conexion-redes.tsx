"use client";

import { useState } from "react";
import type { EstadoConexion } from "@/lib/redes/conexion";

/**
 * Conexión de las redes del perfil (18/10): número de la marca en Metricool
 * y si las publicaciones confirmadas salen solas. Muestra también el enlace
 * con origen para la biografía de Instagram.
 */
export function ConexionRedes({ perfil, inicial }: { perfil: string; inicial: EstadoConexion }) {
  const [estado, setEstado] = useState(inicial);
  const [blogId, setBlogId] = useState(inicial.blogId ?? "");
  const [publicarSolo, setPublicarSolo] = useState(inicial.publicarSolo);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/redes/conexion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, blogId, publicarSolo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar.");
      setEstado(data);
      setPublicarSolo(data.publicarSolo);
      setAviso({ tipo: "ok", texto: data.publicarSolo ? "Listo: lo que confirmes se programa solo en Metricool." : "Guardado. Las publicaciones quedan listas, sin salir solas." });
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message });
    } finally {
      setGuardando(false);
    }
  }

  async function copiar(texto: string, clave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      window.setTimeout(() => setCopiado(null), 1500);
    } catch {
      /* el navegador no dejó copiar */
    }
  }

  const conectado = estado.metricoolConfigurado && !!estado.blogId;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Conexión con Instagram y Facebook</h2>
          <p className="mt-1 text-sm text-slate-600">Las publicaciones se programan en Metricool, que publica aunque el panel esté cerrado.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${conectado && estado.publicarSolo ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          <span className="punto-vivo" aria-hidden="true" />
          {conectado ? (estado.publicarSolo ? "Publica solo" : "Conectado, en pausa") : "Sin conectar"}
        </span>
      </div>

      {!estado.metricoolConfigurado && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Falta un paso en el servidor: cargar <strong>METRICOOL_USER_TOKEN</strong> y <strong>METRICOOL_USER_ID</strong> en las variables privadas de Vercel (el token está en Metricool › Configuración › API). Hasta entonces, lo que confirmes queda guardado y listo.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className="block min-w-[13rem] flex-1 text-sm">
          <span className="font-medium text-slate-800">Número de la marca en Metricool</span>
          <input
            inputMode="numeric"
            value={blogId}
            onChange={(e) => setBlogId(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej.: 7242607"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-slate-500">Está en la dirección de Metricool cuando elegís la marca (blogId).</span>
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-slate-800">
          <input type="checkbox" checked={publicarSolo} onChange={(e) => setPublicarSolo(e.target.checked)} className="h-4 w-4" />
          Publicar solo lo que confirme
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={guardando} className="btn-gold">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        {aviso && <p className={`text-sm ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-700"}`}>{aviso.texto}</p>}
      </div>

      <details className="mt-5 rounded-xl bg-slate-50 p-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-800">Enlaces con origen (para saber de dónde llega cada contacto)</summary>
        <p className="mt-2 text-slate-600">Cada red usa su propio enlace a WhatsApp con un mensaje distinto: el panel reconoce de dónde vino cada persona. Pegá el de Instagram en la biografía del perfil.</p>
        <ul className="mt-3 space-y-2">
          {(["instagram", "facebook", "landing"] as const).map((r) =>
            estado.enlaces[r] ? (
              <li key={r} className="flex flex-wrap items-center gap-2">
                <span className="w-24 shrink-0 font-medium text-slate-700">{r === "landing" ? "Web" : r === "instagram" ? "Instagram" : "Facebook"}</span>
                <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-700">{estado.enlaces[r]}</code>
                <button type="button" onClick={() => copiar(estado.enlaces[r]!, r)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                  {copiado === r ? "Copiado" : "Copiar"}
                </button>
              </li>
            ) : null
          )}
          {!estado.whatsapp && <li className="text-slate-600">Falta el WhatsApp del perfil en Configuración › Marca.</li>}
        </ul>
      </details>
    </section>
  );
}
