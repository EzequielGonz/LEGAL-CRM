"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir los datos de la pantalla cada cierto tiempo y al volver a la
 * pestaña (13/11: las cifras de la portada de perfiles quedaban viejas hasta
 * recargar a mano). No hace nada mientras la pestaña está oculta.
 */
export function RefrescoAutomatico({ cadaMs = 30_000 }: { cadaMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let ultimo = Date.now();
    const refrescar = () => {
      if (document.visibilityState !== "visible") return;
      ultimo = Date.now();
      router.refresh();
    };
    const alVolver = () => {
      // Al volver a la pestaña, solo si pasaron más de cinco segundos desde el último pedido.
      if (document.visibilityState === "visible" && Date.now() - ultimo > 5_000) refrescar();
    };
    const t = window.setInterval(refrescar, cadaMs);
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("pageshow", alVolver);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("pageshow", alVolver);
    };
  }, [router, cadaMs]);
  return null;
}
