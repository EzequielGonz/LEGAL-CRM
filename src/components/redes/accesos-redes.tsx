"use client";

import { useState } from "react";
import type { Acceso } from "@/lib/redes/accesos";

type Item = Acceso & { url: string | null };

/** Abre la red en una ventana propia, del tamaño de un celular, al lado del panel. */
function abrir(item: Item) {
  if (!item.url) return;
  const ancho = item.clave === "whatsapp_web" || item.clave === "facebook_mensajes" || item.clave === "metricool" || item.clave === "whatsapp_business" ? 1100 : 480;
  const alto = Math.min(900, window.screen.availHeight - 60);
  const izquierda = Math.max(0, window.screen.availWidth - ancho - 20);
  // El mismo nombre de ventana: si ya está abierta, vuelve a ella en vez de abrir otra.
  const w = window.open(item.url, `kocos-${item.clave}`, `popup=yes,width=${ancho},height=${alto},left=${izquierda},top=20,noopener=no`);
  if (w) w.focus();
  else window.open(item.url, "_blank", "noopener");
}

export function AccesosRedes({ perfil, inicial }: { perfil: string; inicial: Item[] }) {
  const [items, setItems] = useState(inicial);
  const [editando, setEditando] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState<{ clave: string; texto: string; ok: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(item: Item) {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/redes/accesos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, clave: item.clave, url: valor }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "No se pudo guardar.");
      setItems((prev) => prev.map((x) => (x.clave === item.clave ? { ...x, url: j.guardados?.[item.clave] ?? null } : x)));
      setEditando(null);
      setAviso({ clave: item.clave, texto: valor.trim() ? "Dirección guardada." : "Dirección quitada.", ok: true });
    } catch (err: any) {
      setAviso({ clave: item.clave, texto: String(err?.message ?? err), ok: false });
    }
    setGuardando(false);
  }

  const grupos = ["Instagram", "Facebook", "WhatsApp", "Otros"] as const;
  return (
    <div className="space-y-6">
      {grupos.map((g) => (
        <section key={g} aria-labelledby={`accesos-${g}`}>
          <h2 id={`accesos-${g}`} className="mb-2 text-base font-semibold text-slate-950">
            {g}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items
              .filter((i) => i.grupo === g)
              .map((i) => (
                <li key={i.clave} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">{i.titulo}</p>
                  <p className="mt-0.5 text-[13px] text-slate-600">{i.detalle}</p>
                  {editando === i.clave ? (
                    <div className="mt-3 space-y-2">
                      <label className="block text-[13px] font-medium text-slate-800" htmlFor={`url-${i.clave}`}>
                        Dirección (copiala de la barra del navegador)
                      </label>
                      <input
                        id={`url-${i.clave}`}
                        type="url"
                        inputMode="url"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder={i.ejemplo}
                        className="tactil w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={guardando} onClick={() => guardar(i)} className="btn-gold-sm">
                          {guardando ? "Guardando…" : "Guardar dirección"}
                        </button>
                        <button type="button" onClick={() => setEditando(null)} className="btn-suave-sm">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {i.url ? (
                        <button type="button" onClick={() => abrir(i)} className="btn-gold-sm">
                          Abrir {i.titulo}
                        </button>
                      ) : (
                        <span className="text-[13px] text-slate-600">Falta cargar la dirección.</span>
                      )}
                      {!i.fija && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(i.clave);
                            setValor(i.url ?? "");
                            setAviso(null);
                          }}
                          className="btn-suave-sm"
                        >
                          {i.url ? "Cambiar dirección" : "Cargar dirección"}
                        </button>
                      )}
                    </div>
                  )}
                  {i.url && !i.fija && editando !== i.clave ? <p className="mt-2 truncate text-[13px] text-slate-500">{i.url.replace(/^https:\/\/(www\.)?/, "")}</p> : null}
                  {aviso?.clave === i.clave ? (
                    <p role="status" className={`mt-2 text-[13px] ${aviso.ok ? "text-emerald-700" : "text-red-700"}`}>
                      {aviso.texto}
                    </p>
                  ) : null}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
