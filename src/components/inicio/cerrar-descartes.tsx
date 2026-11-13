"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Cierra como perdidos los descartes reconocidos en «Hoy». Pide confirmación en la misma pantalla. */
export function CerrarDescartes({ perfil, cantidad }: { perfil: string; cantidad: number }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"inicio" | "confirmar" | "enviando">("inicio");
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cerrar() {
    setPaso("enviando");
    setMensaje(null);
    try {
      const res = await fetch("/api/hoy/descartar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "No se pudieron cerrar.");
      setMensaje(j.cerrados === 1 ? "Se cerró 1 como perdido." : `Se cerraron ${j.cerrados} como perdidos.`);
      router.refresh();
    } catch (err: any) {
      setMensaje(`${String(err?.message ?? err)} No se cambió nada: probá de nuevo.`);
    }
    setPaso("inicio");
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {paso === "confirmar" ? (
        <>
          <span className="text-[13px] text-slate-700">Quedan como perdidos, con su motivo. No se borra nada.</span>
          <button type="button" onClick={cerrar} className="btn-gold-sm">
            Sí, cerrar {cantidad === 1 ? "1" : `los ${cantidad}`}
          </button>
          <button type="button" onClick={() => setPaso("inicio")} className="btn-suave-sm">
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" disabled={paso === "enviando"} onClick={() => setPaso("confirmar")} className="btn-suave-sm">
          {paso === "enviando" ? "Cerrando…" : "Cerrar como perdidos"}
        </button>
      )}
      {mensaje ? (
        <span role="status" className="text-[13px] text-slate-700">
          {mensaje}
        </span>
      ) : null}
    </span>
  );
}
