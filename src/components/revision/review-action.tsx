"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Botón de acción de Revisión con nota obligatoria (o confirmación) en
 * línea, sin ventanas emergentes. Llama a `endpoint` con { [campo]: nota, ...extra }.
 */
export function ReviewAction({
  endpoint,
  label,
  extra = {},
  noteField = "nota",
  notePlaceholder = "Nota breve (qué se hizo)",
  noteRequired = true,
  tone = "gold",
  confirmWord,
}: {
  endpoint: string;
  label: string;
  extra?: Record<string, unknown>;
  noteField?: string;
  notePlaceholder?: string;
  noteRequired?: boolean;
  tone?: "gold" | "plain" | "danger";
  /** Si se indica, además de la nota hay que escribir esta palabra para confirmar. */
  confirmWord?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (noteRequired && !note.trim()) {
      setError("Escribí la nota.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...extra, [noteField]: note.trim(), ...(confirmWord ? { confirmacion: confirm.trim() } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la acción.");
        return;
      }
      setOpen(false);
      setNote("");
      setConfirm("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    tone === "gold"
      ? "btn-gold px-3 py-1.5 text-xs"
      : tone === "danger"
      ? "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
      : "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50";

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        {label}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={notePlaceholder}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus-gold"
        autoFocus
      />
      {confirmWord && (
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={`Escribí ${confirmWord} para confirmar`}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus-gold"
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={send} disabled={busy} className={buttonClass}>
          {busy ? "Guardando..." : label}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs text-slate-500 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
