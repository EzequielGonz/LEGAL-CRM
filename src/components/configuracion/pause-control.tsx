"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pausa general (pregunta 38). Cambiarla es una decisión expresa: pide el
 * PIN. Reanudar no activa por sí solo ningún agente ni ninguna campaña.
 */
export function PauseControl({
  aiPaused,
  outboundPaused,
  since,
  reason,
  configProblem = null,
}: {
  aiPaused: boolean;
  outboundPaused: boolean;
  since: string | null;
  reason: string | null;
  /** configuración ausente, vacía o incompleta (se asume todo en pausa) */
  configProblem?: string | null;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [target, setTarget] = useState<null | { ai_replies_paused?: boolean; outbound_automations_paused?: boolean; label: string }>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function aplicar() {
    if (!target) return;
    setBusy(true);
    setMsg(null);
    try {
      const { label, ...cambios } = target;
      const res = await fetch("/api/acceso/pausa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, ...cambios }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo cambiar." });
      else {
        setMsg({
          ok: true,
          text: data.cron_error ? `${label}. Atención: ${data.cron_error}` : `${label}.`,
        });
        setTarget(null);
        router.refresh();
      }
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  const row = (title: string, paused: boolean, detail: string, toggle: { ai_replies_paused?: boolean; outbound_automations_paused?: boolean; label: string }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paused ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-700"}`}>
          {paused ? "En pausa" : "Activas"}
        </span>
        <button
          type="button"
          onClick={() => {
            setTarget(toggle);
            setMsg(null);
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {paused ? "Reanudar…" : "Pausar…"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {configProblem && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <p className="font-semibold">Problema de configuración de la pausa general</p>
          <p>{configProblem}</p>
          <p className="mt-1">Al guardar cualquiera de las dos opciones con el PIN, la configuración queda completa.</p>
        </div>
      )}
      {(aiPaused || outboundPaused) && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Pausa general activa{since ? ` desde ${new Date(since).toLocaleString("es-AR")}` : ""}. {reason ?? ""} Los mensajes
          entrantes se siguen guardando y aparecen en el Inbox para atención manual.
        </p>
      )}
      {row(
        "Respuestas automáticas de la IA",
        aiPaused,
        "Reanudar no activa ningún agente: cada uno se activa aparte, desde Agentes IA.",
        { ai_replies_paused: !aiPaused, label: aiPaused ? "Respuestas de la IA reanudadas" : "Respuestas de la IA en pausa" }
      )}
      {row(
        "Envíos automáticos (campañas, seguimientos, plantillas)",
        outboundPaused,
        "Reanudar no lanza campañas: cada una se reanuda aparte. Los mensajes escritos a mano nunca se bloquean.",
        {
          outbound_automations_paused: !outboundPaused,
          label: outboundPaused ? "Envíos automáticos reanudados" : "Envíos automáticos en pausa",
        }
      )}

      {target && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <label htmlFor="pin-pausa" className="text-sm text-slate-700">Confirmá con el PIN:</label>
          <input
            id="pin-pausa"
            autoComplete="off"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-center font-mono text-sm tracking-widest outline-none focus-gold"
          />
          <button type="button" onClick={aplicar} disabled={busy || pin.length !== 6} className="btn-gold px-3 py-1.5 text-xs">
            {busy ? "Aplicando..." : "Confirmar"}
          </button>
          <button type="button" onClick={() => setTarget(null)} className="text-xs text-slate-500 hover:underline">
            Cancelar
          </button>
        </div>
      )}
      <p role="status" className={`text-sm ${msg?.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg?.text ?? ""}</p>
    </div>
  );
}
