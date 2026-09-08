"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConversationStatus } from "@/lib/supabase/database.types";
import { STATUS_LABEL } from "@/components/ui/badge";

export interface EditableContact {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  dni_cuil: string | null;
  notes: string | null;
  status: ConversationStatus;
  assigned_studio_id: string | null;
}

/**
 * Ficha editable del prospecto (Fase 4 — CRM completo): permite corregir
 * datos de contacto, forzar manualmente el estado (ej. cerrarlo como
 * ganado/perdido si se resolvió por fuera del sistema) y derivarlo a un
 * estudio jurídico. Antes de esto la ficha era de solo lectura.
 */
export function ContactEditForm({
  contact,
  studios,
}: {
  contact: EditableContact;
  studios: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(contact.full_name ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [dniCuil, setDniCuil] = useState(contact.dni_cuil ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [status, setStatus] = useState<ConversationStatus>(contact.status);
  const [studioId, setStudioId] = useState(contact.assigned_studio_id ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    setSavedAt(null);
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        email,
        dni_cuil: dniCuil,
        notes,
        status,
        assigned_studio_id: studioId,
      }),
    });
    setSaving(false);
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">DNI/CUIL</label>
          <input
            value={dniCuil}
            onChange={(e) => setDniCuil(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ConversationStatus)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Derivar a estudio jurídico
          </label>
          <select
            value={studioId}
            onChange={(e) => setStudioId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Sin asignar</option>
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notas internas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          placeholder="Notas para el equipo (no las ve el prospecto)."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="btn-gold"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {savedAt && <span className="text-xs text-green-600">Guardado ✓</span>}
      </div>
    </div>
  );
}
