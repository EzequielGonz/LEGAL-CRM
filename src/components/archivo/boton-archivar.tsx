"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Archiva a una persona con un clic (19/11): sale de las listas de trabajo y queda
 * en Descartados → Archivados. No se borra nada y se puede desarchivar.
 */
export function BotonArchivar({ oportunidadId, nombre, motivo, className = "btn-suave-sm" }: { oportunidadId: string; nombre?: string | null; motivo?: string; className?: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"listo" | "enviando" | "error">("listo");

  async function archivar() {
    setEstado("enviando");
    try {
      const res = await fetch(`/api/oportunidades/${oportunidadId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "archivar", motivo: motivo ?? "Archivado desde el panel" }) });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setEstado("error");
    }
  }

  return (
    <button type="button" onClick={archivar} disabled={estado === "enviando"} aria-label={nombre ? `Archivar a ${nombre}` : "Archivar"} title="Archivar: sale de esta lista y queda en Descartados → Archivados" className={className}>
      {estado === "enviando" ? "Archivando…" : estado === "error" ? "Reintentar" : "Archivar"}
    </button>
  );
}
