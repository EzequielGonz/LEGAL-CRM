"use client";

import { useState } from "react";
import type { AiAgent } from "@/lib/supabase/database.types";

export function AgentEditor({ agent }: { agent: AiAgent }) {
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);
  const [criteria, setCriteria] = useState(agent.qualification_criteria.join("\n"));
  const [fields, setFields] = useState(agent.required_fields.join(", "));
  const [active, setActive] = useState(agent.active);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    await fetch(`/api/agents/${agent.area}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_prompt: systemPrompt,
        qualification_criteria: criteria.split("\n").map((s) => s.trim()).filter(Boolean),
        required_fields: fields.split(",").map((s) => s.trim()).filter(Boolean),
        active,
      }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{agent.display_name}</h2>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Activo
        </label>
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-600">
        Prompt del sistema (personalidad e instrucciones)
      </label>
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={5}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />

      <label className="mb-1 block text-xs font-medium text-slate-600">
        Criterios de calificación comercial (uno por línea)
      </label>
      <textarea
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
        rows={4}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />

      <label className="mb-1 block text-xs font-medium text-slate-600">
        Datos que debe recolectar (separados por coma)
      </label>
      <input
        value={fields}
        onChange={(e) => setFields(e.target.value)}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />

      <button
        onClick={save}
        disabled={saving}
        className="btn-gold"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
      {savedAt && <span className="ml-3 text-xs text-green-600">Guardado ✓</span>}
    </div>
  );
}
