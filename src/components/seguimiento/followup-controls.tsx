"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Etapa 2 · Bloque 2.3 — Activar o apagar el seguimiento automático de un
 * perfil (pide el PIN) y fijar el valor objetivo (48 a 72 h).
 */
export function FollowupConfigControl({
  rubroId,
  enabledSince,
  targetHours,
  outboundPaused,
}: {
  rubroId: string;
  enabledSince: string | null;
  targetHours: number;
  outboundPaused: boolean;
}) {
  const router = useRouter();
  const [hours, setHours] = useState(String(targetHours));
  const [pin, setPin] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const enabled = !!enabledSince;

  async function send(payload: Record<string, unknown>, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/seguimiento/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubro_id: rubroId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo guardar." });
      else {
        setMsg({ ok: true, text: okText });
        setAsking(false);
        router.refresh();
      }
    } finally {
      setPin("");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
        <div>
          <p className="font-medium text-slate-800">Seguimiento automático</p>
          <p className="text-xs text-slate-500">
            {enabled
              ? `Activo desde el ${new Date(enabledSince!).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23", dateStyle: "short", timeStyle: "short" })}. Solo entran las conversaciones interrumpidas después de esa fecha.`
              : "Apagado: no se programa ni se envía ningún seguimiento. Al activarlo, las conversaciones anteriores no entran solas."}
            {outboundPaused && " Mientras la pausa general de envíos esté activa, no se programa ni se envía nada."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
            {enabled ? "Activo" : "Apagado"}
          </span>
          <button
            type="button"
            onClick={() => {
              setAsking(true);
              setMsg(null);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {enabled ? "Apagar…" : "Activar…"}
          </button>
        </div>
      </div>

      {asking && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p>
            {enabled
              ? "Al apagarlo se cancelan los seguimientos programados de este perfil."
              : "Al activarlo, los contactos 2 y 3 salen solos con la plantilla de seguimiento asignada a la línea, dentro del horario permitido. Confirmá con el PIN."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              disabled={busy || pin.length !== 6}
              onClick={() => send({ enabled: !enabled, pin }, enabled ? "Seguimiento apagado." : "Seguimiento activado.")}
              className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Guardando…" : enabled ? "Apagar" : "Activar"}
            </button>
            <button type="button" onClick={() => setAsking(false)} className="text-xs underline">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        <label htmlFor={`seguimiento-horas-${rubroId}`}>Valor objetivo entre contactos:</label>
        <input
          id={`seguimiento-horas-${rubroId}`}
          type="number"
          min={48}
          max={72}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          aria-describedby={`seguimiento-horas-ayuda-${rubroId}`}
          className="tactil w-24 rounded-lg border border-slate-300 px-2 py-1"
        />
        <span id={`seguimiento-horas-ayuda-${rubroId}`}>horas (de 48 a 72)</span>
        <button
          type="button"
          disabled={busy || hours === String(targetHours)}
          onClick={() => send({ target_hours: Number(hours) }, "Valor objetivo guardado.")}
          className="tactil rounded-lg border border-slate-300 px-3 font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-green-700" : "font-medium text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}

/** Acciones de revisión sobre una tarea (conflicto, pendiente, incierta o fallida). */
export function FollowupReviewActions({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDouble, setConfirmDouble] = useState(false);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/seguimiento/tareas/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(data.error ?? "No se pudo.");
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {status === "a_revisar" ? (
        <>
          <button disabled={busy} onClick={() => act("marcar_enviado")} className="rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50">
            Le llegó: marcar enviado
          </button>
          {!confirmDouble ? (
            <button disabled={busy} onClick={() => setConfirmDouble(true)} className="rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50">
              Reintentar…
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => act("reintentar", { confirm_uncertain: true })}
              className="rounded border border-amber-400 bg-amber-50 px-2 py-0.5 text-amber-900"
            >
              Confirmo: podría llegarle dos veces
            </button>
          )}
        </>
      ) : (
        <button disabled={busy} onClick={() => act("reintentar")} className="rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50">
          Reintentar
        </button>
      )}
      <button disabled={busy} onClick={() => act("descartar")} className="rounded border border-slate-300 px-2 py-0.5 hover:bg-slate-50">
        Descartar
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}

/** Genera la base para campaña manual (no envía nada). */
export function RepescaBaseButton({ rubroId, count }: { rubroId: string; count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function generate() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/seguimiento/repesca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rubro_id: rubroId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo generar." });
    else {
      const total = (data.bases ?? []).reduce((n: number, b: any) => n + (b.filas ?? 0), 0);
      setMsg({ ok: true, text: `Base generada con ${total} contacto(s). Está en Bases; la campaña se arma aparte, a mano.` });
      router.refresh();
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy || count === 0}
        onClick={generate}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? "Generando…" : `Generar base para campaña manual (${count})`}
      </button>
      {msg && <p className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
