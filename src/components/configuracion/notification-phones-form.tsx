"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface NotificationPhone {
  id: string;
  phone: string;
  label: string | null;
}

export function NotificationPhonesForm({ phones }: { phones: NotificationPhone[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/notification-phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, label }),
    });
    setSaving(false);
    setPhone("");
    setLabel("");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/notification-phones/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <ul className="mb-2 divide-y divide-slate-100">
        {phones.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-700">
              {p.phone}
              {p.label && <span className="ml-2 text-xs text-slate-400">({p.label})</span>}
            </span>
            <button
              onClick={() => handleDelete(p.id)}
              disabled={deletingId === p.id}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              {deletingId === p.id ? "Quitando..." : "Quitar"}
            </button>
          </li>
        ))}
        {phones.length === 0 && (
          <li className="py-2 text-sm text-slate-400">Sin números adicionales cargados.</li>
        )}
      </ul>

      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">
          + Agregar número
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
          <input
            required
            placeholder="Teléfono (ej: 5491139435473)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
          <input
            placeholder="Etiqueta (opcional, ej: Leonardo)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-gold-sm">
              Guardar
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
