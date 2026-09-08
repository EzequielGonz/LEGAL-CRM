"use client";

import { useState } from "react";

export function AdminPhoneForm({ initialPhone }: { initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    await fetch("/api/profile/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        Teléfono del administrador (recibe la notificación de WhatsApp al cerrar/agendar)
      </label>
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="5491122223333"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
        <button
          onClick={save}
          disabled={saving}
          className="btn-gold"
        >
          Guardar
        </button>
      </div>
      {savedAt && <span className="text-xs text-green-600">Guardado ✓</span>}
    </div>
  );
}
