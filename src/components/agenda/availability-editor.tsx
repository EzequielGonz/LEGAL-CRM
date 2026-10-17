"use client";

import { useState } from "react";
import type { AvailabilityRule } from "@/lib/supabase/database.types";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface Row {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export function AvailabilityEditor({
  area,
  initialRules,
}: {
  area: "civil" | "penal";
  initialRules: AvailabilityRule[];
}) {
  const [rows, setRows] = useState<Row[]>(
    initialRules.map((r) => ({
      weekday: r.weekday,
      start_time: r.start_time.slice(0, 5),
      end_time: r.end_time.slice(0, 5),
      slot_duration_minutes: r.slot_duration_minutes,
    }))
  );
  const [saving, setSaving] = useState(false);
  const nombreArea = area === "civil" ? "Civil" : "Penal";
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  function addRow() {
    setRows((r) => [...r, { weekday: 1, start_time: "09:00", end_time: "18:00", slot_duration_minutes: 30 }]);
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true);
    setResultado(null);
    try {
      const res = await fetch("/api/agenda/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, rules: rows }),
      });
      setResultado(
        res.ok
          ? { ok: true, texto: `Disponibilidad de ${nombreArea} guardada.` }
          : { ok: false, texto: `No se pudo guardar la disponibilidad de ${nombreArea}. Reintentá.` }
      );
    } catch {
      setResultado({ ok: false, texto: `No se pudo guardar la disponibilidad de ${nombreArea} (sin conexión). Reintentá.` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          Disponibilidad — {nombreArea}
        </h3>
        <button type="button" onClick={addRow} className="tactil inline-flex items-center text-sm font-medium text-slate-800 underline">
          + Agregar bloque
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} role="group" aria-label={`Bloque ${idx + 1} de ${nombreArea}`} className="flex flex-wrap items-center gap-2 text-sm">
            <select
              aria-label={`Día del bloque ${idx + 1} (${nombreArea})`}
              value={row.weekday}
              onChange={(e) => updateRow(idx, { weekday: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
            >
              {WEEKDAYS.map((w, i) => (
                <option key={i} value={i}>
                  {w}
                </option>
              ))}
            </select>
            <input
              type="time"
              aria-label={`Desde, bloque ${idx + 1} (${nombreArea})`}
              value={row.start_time}
              onChange={(e) => updateRow(idx, { start_time: e.target.value })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
            />
            <span className="text-slate-600" aria-hidden="true">a</span>
            <input
              type="time"
              aria-label={`Hasta, bloque ${idx + 1} (${nombreArea})`}
              value={row.end_time}
              onChange={(e) => updateRow(idx, { end_time: e.target.value })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
            />
            <input
              type="number"
              aria-label={`Duración de cada turno en minutos, bloque ${idx + 1} (${nombreArea})`}
              value={row.slot_duration_minutes}
              onChange={(e) => updateRow(idx, { slot_duration_minutes: Number(e.target.value) })}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
              min={10}
              step={5}
            />
            <span className="text-sm text-slate-600" aria-hidden="true">min/turno</span>
            <button type="button" onClick={() => removeRow(idx)} aria-label={`Quitar bloque ${idx + 1} (${nombreArea})`} className="tactil ml-auto inline-flex items-center text-sm text-red-700 hover:underline">
              Quitar
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-600">Sin bloques configurados.</p>}
      </div>

      <button type="button" onClick={save} disabled={saving} className="mt-4 btn-gold">
        {saving ? "Guardando..." : "Guardar disponibilidad"}
      </button>
      <span role="status" className={`ml-3 text-sm ${resultado?.ok === false ? "font-medium text-red-700" : "text-green-700"}`}>
        {resultado?.texto ?? ""}
      </span>
    </div>
  );
}
