"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CalendarExceptionItem {
  id: string;
  day: string;
  closed: boolean;
  start_hour: number | null;
  end_hour: number | null;
  note: string | null;
  archived_at?: string | null;
  archive_reason?: string | null;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DIAS[weekday]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function ruleLabel(e: CalendarExceptionItem): string {
  if (e.closed) return "Cerrado: no sale ningún envío automático";
  return `Solo de ${e.start_hour} a ${e.end_hour}`;
}

/**
 * Etapa 2 · Bloque 2.0 — Horario de contacto y excepciones del calendario.
 * El horario general es fijo (lunes a sábado de 8 a 21, hora de Argentina,
 * aunque sea feriado; domingos no). Las excepciones solo restringen.
 */
export function CalendarSettings({
  upcoming,
  archived,
  loadError,
}: {
  upcoming: CalendarExceptionItem[];
  archived: CalendarExceptionItem[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("");
  const [closed, setClosed] = useState(true);
  const [startHour, setStartHour] = useState("8");
  const [endHour, setEndHour] = useState("13");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/calendario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, closed, start_hour: startHour, end_hour: endHour, note }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar la excepción.");
      return;
    }
    setDay("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  async function archive(id: string) {
    setArchivingId(id);
    setError(null);
    const res = await fetch(`/api/calendario/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: true }),
    });
    const data = await res.json().catch(() => ({}));
    setArchivingId(null);
    if (!res.ok) setError(data.error ?? "No se pudo archivar.");
    router.refresh();
  }

  const hours = Array.from({ length: 14 }, (_, i) => 8 + i); // 8 … 21

  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-600">
        Los envíos automáticos (campañas, seguimientos y reagendamientos) salen de <strong>lunes a sábado de 8 a 21</strong>,
        hora de Argentina, aunque sea feriado. Los domingos no sale nada. Un seguimiento se programa entre 48 y 72 horas
        después, en la franja válida más cercana a las 60 horas; si no hay ninguna, queda como conflicto para revisar y no se envía.
      </p>
      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          No se pudo leer el calendario ({loadError}). Mientras tanto no sale ningún envío automático.
        </p>
      )}

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Excepciones cargadas</h3>
        <ul className="divide-y divide-slate-100">
          {upcoming.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium text-slate-800">{dayLabel(e.day)}</p>
                <p className="text-xs text-slate-500">
                  {ruleLabel(e)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => archive(e.id)}
                disabled={archivingId === e.id}
                aria-label={`Archivar la excepción del ${dayLabel(e.day)}`}
                className="tactil inline-flex shrink-0 items-center text-sm text-slate-700 hover:underline disabled:opacity-50"
              >
                {archivingId === e.id ? "Archivando…" : "Archivar"}
              </button>
            </li>
          ))}
          {upcoming.length === 0 && <li className="py-2 text-slate-400">Sin excepciones: rige el horario general.</li>}
        </ul>
      </div>

      <p role="alert" className={error ? "text-sm font-medium text-red-700" : "sr-only"}>{error ?? ""}</p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">
          + Agregar excepción
        </button>
      ) : (
        <form onSubmit={add} className="space-y-2 rounded-lg border border-slate-200 p-3">
          <label className="block text-sm font-medium text-slate-700">
            Día
            <input
              type="date"
              required
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
          </label>
          <fieldset className="flex flex-wrap gap-4 text-sm text-slate-700">
            <legend className="sr-only">Tipo de excepción</legend>
            <label className="tactil flex items-center gap-2">
              <input type="radio" name="tipo-excepcion" className="h-4 w-4" checked={closed} onChange={() => setClosed(true)} /> Cerrado todo el día
            </label>
            <label className="tactil flex items-center gap-2">
              <input type="radio" name="tipo-excepcion" className="h-4 w-4" checked={!closed} onChange={() => setClosed(false)} /> Horario más corto
            </label>
          </fieldset>
          {!closed && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span aria-hidden="true">De</span>
              <select aria-label="Desde la hora" value={startHour} onChange={(e) => setStartHour(e.target.value)} className="rounded border border-slate-300 px-2 py-1">
                {hours.slice(0, -1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">a</span>
              <select aria-label="Hasta la hora" value={endHour} onChange={(e) => setEndHour(e.target.value)} className="rounded border border-slate-300 px-2 py-1">
                {hours.slice(1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              hs
            </div>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Motivo (opcional)
            <input
              placeholder="Ej.: cierre del estudio"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-gold text-xs disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar excepción"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:underline">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {archived.length > 0 && (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer">Archivadas recientes ({archived.length})</summary>
          <ul className="mt-1 space-y-1">
            {archived.map((e) => (
              <li key={e.id}>
                {dayLabel(e.day)} · {ruleLabel(e)}
                {e.note ? ` · ${e.note}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
