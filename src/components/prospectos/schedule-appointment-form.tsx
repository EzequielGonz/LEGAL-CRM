"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { mensajeDeError } from "@/lib/errores-ui";

/** Agenda una cita manualmente desde la ficha del prospecto (ej. se coordinó
 *  por teléfono y hay que dejarla registrada), sin pasar por el agente IA. */
export function ScheduleAppointmentForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  // 15/11: cada etiqueta queda asociada a su campo.
  const idCampos = useId();
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/contacts/${contactId}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: new Date(startsAt).toISOString(),
          duration_minutes: duration,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "No se pudo agendar la cita.");
        return;
      }

      setStartsAt("");
      router.refresh();
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo agendar la cita. Probá de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor={`${idCampos}-1`} className="mb-1 block text-xs font-medium text-slate-600">Fecha y hora</label>
        <input id={`${idCampos}-1`}
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label htmlFor={`${idCampos}-2`} className="mb-1 block text-xs font-medium text-slate-600">Duración (min)</label>
        <input id={`${idCampos}-2`}
          type="number"
          min={10}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="btn-gold"
      >
        {saving ? "Agendando..." : "Agendar cita manual"}
      </button>
      {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
