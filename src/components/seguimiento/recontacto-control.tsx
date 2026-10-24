"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Recontacto del bot dentro de las 24 h (24/10): encendido o apagado por
 * perfil. Encenderlo pide el PIN (hace salir mensajes); apagarlo no.
 */
export function RecontactoControl({ perfil, encendido }: { perfil: string; encendido: boolean }) {
  const router = useRouter();
  const [pidiendo, setPidiendo] = useState(false);
  const [pin, setPin] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function guardar(valor: boolean) {
    setOcupado(true);
    setMsg(null);
    try {
      const r = await fetch("/api/recontacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, encendido: valor, pin: valor ? pin : undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ ok: false, texto: d.error ?? "No se pudo guardar." });
      else {
        setMsg({ ok: true, texto: valor ? "Recontacto encendido." : "Recontacto apagado." });
        setPidiendo(false);
        router.refresh();
      }
    } finally {
      setPin("");
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${encendido ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
          {encendido ? "Encendido" : "Apagado"}
        </span>
        {encendido ? (
          <button type="button" disabled={ocupado} onClick={() => guardar(false)} className="tactil rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {ocupado ? "Guardando…" : "Apagar"}
          </button>
        ) : (
          <button type="button" onClick={() => setPidiendo(true)} className="tactil rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Encender…
          </button>
        )}
      </div>
      {pidiendo && !encendido && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <span>Al encenderlo, el bot vuelve a escribir solo a quien dejó de responder. Confirmá con el PIN.</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN"
            aria-label="PIN de confirmación"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-28 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-sm"
          />
          <button type="button" disabled={ocupado || pin.length !== 6} onClick={() => guardar(true)} className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
            {ocupado ? "Guardando…" : "Encender"}
          </button>
          <button type="button" onClick={() => setPidiendo(false)} className="text-xs underline">
            Cancelar
          </button>
        </div>
      )}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg.texto}</p>}
    </div>
  );
}
