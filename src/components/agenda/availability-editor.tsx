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
  const [savedAt, setSavedAt] = useState<number | null>(null);

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
    await fetch("/api/agenda/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, rules: rows }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Disponibilidad — {area === "civil" ? "Civil" : "Penal"}
        </h2>
        <button onClick={addRow} className="text-xs font-medium text-blue-600 hover:underline">
          + Agregar bloque
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <select
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
              value={row.start_time}
              onChange={(e) => updateRow(idx, { start_time: e.target.value })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
            />
            <span className="text-slate-400">a</span>
            <input
              type="time"
              value={row.end_time}
              onChange={(e) => updateRow(idx, { end_time: e.target.value })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
            />
            <input
              type="number"
              value={row.slot_duration_minutes}
              onChange={(e) => updateRow(idx, { slot_duration_minutes: Number(e.target.value) })}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus-gold"
              min={10}
              step={5}
            />
            <span className="text-xs text-slate-400">min/turno</span>
            <button onClick={() => removeRow(idx)} className="ml-auto text-xs text-red-500 hover:underline">
              Quitar
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-400">Sin bloques configurados.</p>}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 btn-gold"
      >
        {saving ? "Guardando..." : "Guardar disponibilidad"}
      </button>
      {savedAt && <span className="ml-3 text-xs text-green-600">Guardado ✓</span>}
    </div>
  );
}
