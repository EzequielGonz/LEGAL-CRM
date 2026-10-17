"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Al llegar a una dirección con `#ancla` (o al cambiar el ancla), lleva la
 * vista a esa sección y le pasa el foco, así el teclado y el lector de
 * pantalla siguen desde ahí. Si el ancla no existe, no hace nada.
 */
export function EnfocarAncla() {
  const ruta = usePathname();
  useEffect(() => {
    function ir() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const destino = document.getElementById(id);
      if (!destino) return;
      if (!destino.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(destino.tagName)) {
        destino.setAttribute("tabindex", "-1");
      }
      const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      destino.scrollIntoView({ block: "start", behavior: reducir ? "auto" : "smooth" });
      destino.focus({ preventScroll: true });
    }
    // Después del primer pintado, para que la sección ya exista.
    const t = window.setTimeout(ir, 50);
    window.addEventListener("hashchange", ir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", ir);
    };
  }, [ruta]);
  return null;
}
