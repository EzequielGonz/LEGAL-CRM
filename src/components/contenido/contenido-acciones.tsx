"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function enviar(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, status: res.status };
}

function Estado({ msg }: { msg: { ok: boolean; text: string } | null }) {
  return (
    <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-sm text-emerald-700" : "text-sm font-medium text-red-700") : "sr-only"}>
      {msg?.text ?? ""}
    </p>
  );
}

/** «Mejorá el contenido», cambiar objetivos o pedir una mejora SEO, en lenguaje natural. */
export function PedidoContenido({ perfil }: { perfil: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState("mejorar_contenido");
  const [pedido, setPedido] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const r = await enviar("/api/contenido", "POST", { perfil, tipo, pedido });
          if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? `No se pudo guardar (error ${r.status}).` });
          setMsg({ ok: true, text: "Pedido guardado. Se resuelve en el próximo bloque de trabajo." });
          setPedido("");
          router.refresh();
        } catch {
          setMsg({ ok: false, text: "Sin conexión: no se guardó." });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Qué querés</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2 sm:w-auto">
          <option value="mejorar_contenido">Mejorá el contenido</option>
          <option value="cambiar_objetivos">Cambiar objetivos</option>
          <option value="mejora_seo">Mejora de la web (SEO)</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-700">Pedido</span>
        <textarea value={pedido} onChange={(e) => setPedido(e.target.value)} rows={3} maxLength={2000} required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : "Enviar pedido"}
        </button>
        <Estado msg={msg} />
      </div>
    </form>
  );
}

/** Pausar el calendario (sin PIN) o reanudarlo (con PIN; exige cuenta y CTA). */
export function CalendarioControl({ perfil, pausado }: { perfil: string; pausado: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function cambiar(pausar: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await enviar("/api/contenido/politica", "PATCH", { perfil, canal: "todos", cambios: { calendario_pausado: pausar }, pin: pausar ? undefined : pin });
      if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? `No se pudo cambiar (error ${r.status}).` });
      setMsg({ ok: true, text: pausar ? "Calendario en pausa." : "Calendario reanudado." });
      setPin("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Sin conexión: no cambió nada." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-end gap-3">
      {pausado ? (
        <>
          <label className="text-sm">
            <span className="block text-xs font-medium text-slate-700">PIN para reanudar</span>
            <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" className="tactil mt-1 w-36 rounded-lg border border-slate-300 px-2" />
          </label>
          <button type="button" disabled={busy || !pin} onClick={() => cambiar(false)} className="tactil rounded-lg border border-slate-300 px-4 text-sm disabled:opacity-60">
            Reanudar calendario
          </button>
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => cambiar(true)} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          Pausar calendario
        </button>
      )}
      <Estado msg={msg} />
    </div>
  );
}
