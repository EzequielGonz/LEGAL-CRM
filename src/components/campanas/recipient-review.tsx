"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Acciones sobre un destinatario "a revisar": volver a la cola o descartar.
 * Si no se sabe si Meta aceptó el envío anterior, volver a la cola pide una
 * confirmación expresa (podría llegarle dos veces).
 */
export function RecipientReview({
  campaignId,
  recipientId,
  uncertain,
}: {
  campaignId: string;
  recipientId: string;
  uncertain: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(accion: "reintentar" | "descartar") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/destinatarios/${recipientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, confirmar_incierto: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "No se pudo.");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      {uncertain && (
        <label className="flex items-center gap-1 text-amber-800">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          Entiendo que podría llegarle dos veces
        </label>
      )}
      <button
        type="button"
        disabled={busy || (uncertain && !confirm)}
        onClick={() => act("reintentar")}
        className="rounded border border-slate-300 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Volver a la cola
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => act("descartar")}
        className="rounded border border-slate-300 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Descartar
      </button>
      {msg && <span className="text-red-600">{msg}</span>}
    </div>
  );
}
