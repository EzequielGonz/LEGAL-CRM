"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Deshace un movimiento de la limpieza: la persona vuelve a como estaba. */
export function BotonDeshacer({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"quieto" | "confirmar" | "enviando" | "error">("quieto");
  const [error, setError] = useState<string | null>(null);

  async function deshacer() {
    setEstado("enviando");
    setError(null);
    try {
      const res = await fetch("/api/limpieza", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "deshacer", id }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? "No se pudo deshacer.");
      router.refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setEstado("error");
    }
  }

  if (estado === "confirmar" || estado === "enviando") {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <button type="button" onClick={deshacer} disabled={estado === "enviando"} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white disabled:opacity-60">
          {estado === "enviando" ? "Deshaciendo…" : "Sí, deshacer"}
        </button>
        <button type="button" onClick={() => setEstado("quieto")} disabled={estado === "enviando"} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-800">
          Cancelar
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setEstado("confirmar")} aria-label={`Deshacer el movimiento de ${nombre}`} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
        Deshacer
      </button>
      {error ? (
        <span role="alert" className="text-sm font-medium text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
