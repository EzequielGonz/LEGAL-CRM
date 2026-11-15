"use client";

import { useEffect, useRef, useState } from "react";
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
  // 15/11: al pedir confirmación el foco pasa a «Sí, archivar»; al cancelar vuelve a «Archivar».
  const confirmarRef = useRef<HTMLButtonElement | null>(null);
  const archivarRef = useRef<HTMLButtonElement | null>(null);
  const devolverFoco = useRef(false);
  useEffect(() => {
    if (confirming) confirmarRef.current?.focus();
    else if (devolverFoco.current) {
      devolverFoco.current = false;
      archivarRef.current?.focus();
    }
  }, [confirming]);
  const cancelarConfirmacion = () => {
    devolverFoco.current = true;
    setConfirming(false);
  };

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
        <button type="button" onClick={run} disabled={busy} className={base} title={`Recuperar ${kind}`}>
          {busy ? "Recuperando..." : "Recuperar"}
        </button>
        {error && (
          <span role="alert" className="text-xs text-red-700">
            {error}
          </span>
        )}
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        ref={archivarRef}
        type="button"
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
      role="group"
      aria-label={`Confirmar archivo de «${name}»`}
      className="flex max-w-xs flex-col items-end gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-right"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          cancelarConfirmacion();
        }
      }}
    >
      <span className="text-xs leading-snug text-slate-600">
        ¿Archivar {kind === "base" ? "la base" : "la campaña"} «{name}»? No se borra nada
        {kind === "campaña" ? "; si está en curso queda pausada y al recuperarla sigue pausada." : "; se puede recuperar cuando quieras."}
      </span>
      <span className="flex gap-2">
        <button ref={confirmarRef} type="button" onClick={run} disabled={busy} className="btn-gold px-3 py-1 text-xs">
          {busy ? "Archivando..." : "Sí, archivar"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            cancelarConfirmacion();
          }}
          className="px-2 py-1 text-xs text-slate-600 hover:underline"
        >
          Cancelar
        </button>
      </span>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
