"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Agenda una cita manualmente desde la ficha del prospecto (ej. se coordinó
 *  por teléfono y hay que dejarla registrada), sin pasar por el agente IA. */
export function ScheduleAppointmentForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/contacts/${contactId}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starts_at: new Date(startsAt).toISOString(),
        duration_minutes: duration,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo agendar la cita.");
      return;
    }

    setStartsAt("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Fecha y hora</label>
        <input
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Duración (min)</label>
        <input
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
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
