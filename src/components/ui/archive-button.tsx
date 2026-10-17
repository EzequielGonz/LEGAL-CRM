"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Archivar / Recuperar (pregunta 20): nada se elimina. Confirmación en
 * línea, sin ventanas del navegador.
 */
export function ArchiveButton({
  endpoint,
  name,
  archived,
  kind,
  redirectTo,
}: {
  endpoint: string;
  name: string;
  archived: boolean;
  kind: "base" | "campaña";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: archived ? "recuperar" : "archivar" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar.");
        return;
      }
      setConfirming(false);
      if (redirectTo && !archived) router.push(redirectTo);
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const base =
    "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-gold-300 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50";

  if (archived) {
    return (
      <span className="flex flex-col items-end gap-1">
        <button onClick={run} disabled={busy} className={base} title={`Recuperar ${kind}`}>
          {busy ? "Recuperando..." : "Recuperar"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        className={base}
        title={`Archivar ${kind}`}
      >
        Archivar
      </button>
    );
  }

  return (
    <span
      className="flex max-w-xs flex-col items-end gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-right"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span className="text-xs leading-snug text-slate-600">
        ¿Archivar {kind === "base" ? "la base" : "la campaña"} «{name}»? No se borra nada
        {kind === "campaña" ? "; si está en curso queda pausada y al recuperarla sigue pausada." : "; se puede recuperar cuando quieras."}
      </span>
      <span className="flex gap-2">
        <button onClick={run} disabled={busy} className="btn-gold px-3 py-1 text-xs">
          {busy ? "Archivando..." : "Sí, archivar"}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
          }}
          className="text-xs text-slate-500 hover:underline"
        >
          Cancelar
        </button>
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
