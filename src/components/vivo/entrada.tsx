"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Transición entre pantallas (vuelta 6): al cambiar de ruta el contenido entra de nuevo,
 * escalonado (opacidad y desplazamiento; solo transform/opacity). La clave es la ruta, así
 * que cada pantalla nueva vuelve a animarse aunque el marco no se desmonte.
 */
export function EntradaContenido({ children }: { children: ReactNode }) {
  const ruta = usePathname() ?? "/";
  return (
    <div key={ruta} className="vv-entrada">
      {children}
    </div>
  );
}
