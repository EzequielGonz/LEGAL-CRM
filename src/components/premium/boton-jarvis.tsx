"use client";

import type { ReactNode } from "react";
import { abrirAsistente } from "@/components/asistente/asistente-panel";

/**
 * Botón que abre Jarvis (22/11). Jarvis escucha el evento del asistente (el mismo que usan «Pedile algo»
 * y el atajo), así que no hace falta tocar su estado. Con `pedido`, lo deja escrito en la entrada.
 */
export function BotonJarvis({ children, pedido, variante = "secundario" }: { children: ReactNode; pedido?: string; variante?: "primario" | "secundario" }) {
  return (
    <button type="button" className={`pm-boton pm-boton--${variante}`} onClick={() => abrirAsistente(pedido)} aria-haspopup="dialog">
      {children}
    </button>
  );
}
