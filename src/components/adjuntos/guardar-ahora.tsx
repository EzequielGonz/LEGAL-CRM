"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Guardar ahora": descarga de Meta el original que todavía no se guardó y
 * lo deja en el almacenamiento privado. No envía nada a nadie.
 */
export function GuardarAhora({ attachmentId }: { attachmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/adjuntos/${attachmentId}/guardar`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, text: data.texto ?? data.error ?? (res.ok ? "Guardado" : "No se pudo guardar") });
      if (res.ok) router.refresh();
    } catch {
      setMsg({ ok: false, text: "No se pudo conectar. Probá de nuevo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:border-gold-300 disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar ahora"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</span>}
    </span>
  );
}
