"use client";

import { abrirAsistente } from "@/components/asistente/asistente-panel";
import { Icono } from "@/components/ui/icono-seccion";

/** Abre el asistente con un pedido ya escrito (la persona lo revisa y lo manda). */
export function BotonAsistente({ texto, children, variante = "principal" }: { texto?: string; children: React.ReactNode; variante?: "principal" | "suave" }) {
  return (
    <button type="button" onClick={() => abrirAsistente(texto)} className={variante === "principal" ? "btn-gold" : "btn-suave"}>
      <Icono nombre="asistente" className="h-4 w-4" />
      {children}
    </button>
  );
}
