"use client";

import { useState } from "react";

export function AdminPhoneForm({ initialPhone }: { initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  async function save() {
    setSaving(true);
    setResultado(null);
    try {
      const res = await fetch("/api/profile/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setResultado(res.ok ? { ok: true, texto: "Teléfono del administrador guardado." } : { ok: false, texto: "No se pudo guardar el teléfono. Reintentá." });
    } catch {
      setResultado({ ok: false, texto: "Sin conexión: no se guardó el teléfono." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label htmlFor="telefono-administrador" className="mb-1 block text-sm font-medium text-slate-700">
        Teléfono del administrador (recibe la notificación de WhatsApp al cerrar/agendar)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="telefono-administrador"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="5491122223333"
          className="w-full max-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
        <button type="button" onClick={save} disabled={saving} className="btn-gold">
          {saving ? "Guardando…" : "Guardar teléfono"}
        </button>
      </div>
      <p role="status" className={`mt-1 text-sm ${resultado?.ok === false ? "font-medium text-red-700" : "text-green-700"}`}>
        {resultado?.texto ?? ""}
      </p>
    </div>
  );
}
