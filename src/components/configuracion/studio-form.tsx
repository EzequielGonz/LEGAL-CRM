"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudioForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState<"civil" | "penal">("civil");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/studios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, area, contact_phone: phone, contact_email: email }),
    });
    setLoading(false);
    setOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">
        + Agregar estudio
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3">
      <input
        required
        placeholder="Nombre del estudio"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />
      <select
        value={area}
        onChange={(e) => setArea(e.target.value as "civil" | "penal")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      >
        <option value="civil">Civil</option>
        <option value="penal">Penal</option>
      </select>
      <input
        placeholder="Teléfono de contacto"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />
      <input
        placeholder="Email de contacto"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-gold-sm"
        >
          Guardar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
          Cancelar
        </button>
      </div>
    </form>
  );
}
