"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Edición de nombre y objetivo de un agente de la biblioteca (pide el PIN).
 * Solo dice «Guardado» cuando el servidor lo confirma. No activa nada.
 */
export function BibliotecaEditor({ clave, nombre, objetivo }: { clave: string; nombre: string; objetivo: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [n, setN] = useState(nombre);
  const [o, setO] = useState(objetivo);
  const [motivo, setMotivo] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/agentes/biblioteca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, cambios: { nombre: n, objetivo: o }, motivo, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data?.error ?? `No se pudo guardar (error ${res.status}).` });
        return;
      }
      setMsg({ ok: true, text: `Guardado como versión ${data?.agente?.version ?? ""}. Sigue apagado.` });
      setPin("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "No se pudo guardar: sin conexión. No se registró nada." });
    } finally {
      setBusy(false);
    }
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="tactil rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50">
        Editar nombre y objetivo
      </button>
    );
  }
  return (
    <form onSubmit={guardar} className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
      <label className="block">
        <span className="text-xs font-medium text-slate-700">Nombre</span>
        <input value={n} onChange={(e) => setN(e.target.value)} maxLength={80} required className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-700">Objetivo</span>
        <textarea value={o} onChange={(e) => setO(e.target.value)} maxLength={600} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-700">Motivo del cambio (opcional)</span>
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-700">PIN</span>
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" required className="tactil mt-1 w-40 rounded-lg border border-slate-300 px-2" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : "Guardar versión"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="tactil rounded-lg px-3 text-sm text-slate-700 hover:underline">
          Cancelar
        </button>
        <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-sm text-emerald-700" : "text-sm font-medium text-red-700") : "sr-only"}>
          {msg?.text ?? ""}
        </p>
      </div>
    </form>
  );
}
