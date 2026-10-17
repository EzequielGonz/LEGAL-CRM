"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  ausente: "No asistió",
  cancelada: "Cancelada",
};

/** Resultado de una cita, desde la misma fila de la Agenda (bloque 1.8). No envía mensajes. */
export function AppointmentActions({ appointmentId, status }: { appointmentId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [nota, setNota] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: value, nota }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "No se pudo guardar");
      else {
        setMsg(data.sin_cambios ? "Sin cambios" : "Guardado");
        setNota("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus-gold"
      >
        {Object.entries(LABEL).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      {value !== status && (
        <>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-36 rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus-gold"
          />
          <button type="button" onClick={save} disabled={busy} className="btn-gold px-2.5 py-1 text-xs">
            {busy ? "…" : "Guardar"}
          </button>
        </>
      )}
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </div>
  );
}
