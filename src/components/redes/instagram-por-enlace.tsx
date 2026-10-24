"use client";

import { useEffect, useState } from "react";

/**
 * Instagram por enlace (24/10): sin la API de Meta vinculada, se pega la
 * dirección del perfil y se ve su vista pública acá mismo, con el acceso
 * directo. No publica nada.
 */
export function InstagramPorEnlace({ perfil }: { perfil: string }) {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/redes/instagram-enlace?perfil=${encodeURIComponent(perfil)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        setUsuario(j?.usuario ?? null);
        setEditando(!j?.usuario);
      })
      .catch(() => setEditando(true));
  }, [perfil]);

  async function guardar() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/redes/instagram-enlace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, enlace: texto }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo guardar.");
      setUsuario(j.usuario ?? null);
      setEditando(!j.usuario);
      setTexto("");
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {usuario && !editando ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-950">@{usuario}</p>
            <div className="flex gap-2">
              <a href={`https://www.instagram.com/${usuario}/`} target="_blank" rel="noreferrer" className="btn-suave-sm">
                Abrir perfil
              </a>
              <button type="button" className="btn-suave-sm" onClick={() => { setTexto(`instagram.com/${usuario}`); setEditando(true); }}>
                Cambiar
              </button>
            </div>
          </div>
          <iframe
            title={`Perfil público de @${usuario}`}
            src={`https://www.instagram.com/${usuario}/embed`}
            className="h-[480px] w-full rounded-xl border border-slate-200 bg-white"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <p className="text-xs text-slate-500">Vista pública de Instagram. Si no carga, usá «Abrir perfil».</p>
        </>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-800">
            Enlace del perfil de Instagram
            <input
              className="tactil mt-1 w-full rounded-lg border border-slate-300 bg-white px-2"
              placeholder="instagram.com/tu_usuario o @tu_usuario"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" className="btn-gold" disabled={busy || !texto.trim()} onClick={guardar}>
              {busy ? "Guardando…" : "Guardar enlace"}
            </button>
            {usuario ? (
              <button type="button" className="btn-suave" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">Sin vincular la API de Meta: se muestra la vista pública del perfil.</p>
        </div>
      )}
      {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
