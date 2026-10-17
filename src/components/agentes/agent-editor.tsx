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
  const [error, setError] = useState<string | null>(null);
  const id = (s: string) => `agente-${agent.area}-${s}`;

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/agents/${agent.area}`, {
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
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar. No se cambió nada.");
      return;
    }
    setSavedAt(Date.now());
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{agent.display_name}</h3>
        <label className="tactil flex items-center gap-2 text-sm text-slate-800">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
          Activo (se aplica al guardar)
        </label>
      </div>

      <label htmlFor={id("prompt")} className="mb-1 block text-sm font-medium text-slate-700">
        Instrucciones del agente (personalidad y forma de responder)
      </label>
      <textarea
        id={id("prompt")}
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={5}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />

      <label htmlFor={id("criterios")} className="mb-1 block text-sm font-medium text-slate-700">
        Criterios de calificación comercial (uno por línea)
      </label>
      <textarea
        id={id("criterios")}
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
        rows={4}
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />

      <label htmlFor={id("datos")} className="mb-1 block text-sm font-medium text-slate-700">
        Datos que debe recolectar (separados por coma)
      </label>
      <input
        id={id("datos")}
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
      <span role="status" className="ml-3 text-sm">
        {error ? <span className="font-medium text-red-700">{error}</span> : savedAt ? <span className="text-emerald-700">Guardado</span> : null}
      </span>
    </div>
  );
}
