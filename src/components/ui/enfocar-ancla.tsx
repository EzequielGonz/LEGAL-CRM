"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNivel } from "@/components/nivel/nivel";

/**
 * Al llegar a una dirección con `#ancla` (o al cambiar el ancla), lleva la
 * vista a esa sección y le pasa el foco, así el teclado y el lector de
 * pantalla siguen desde ahí. Si la sección es de Avanzado, pasa a Avanzado
 * (solo presentación) y abre las secciones plegadas que la contienen. Si
 * el ancla no existe, no hace nada.
 */
export function EnfocarAncla() {
  const ruta = usePathname();
  const { cambiar } = useNivel();
  useEffect(() => {
    function ir() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const destino = document.getElementById(id);
      if (!destino) return;
      const oculto = !!destino.closest(".solo-avanzado") && !!destino.closest('[data-nivel="simple"]');
      if (oculto) cambiar("avanzado");
      for (let p = destino.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
      if (!destino.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(destino.tagName)) {
        destino.setAttribute("tabindex", "-1");
      }
      // Si recién pasó a Avanzado, se espera a que la sección se muestre.
      window.setTimeout(() => {
        const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        destino.scrollIntoView({ block: "start", behavior: reducir ? "auto" : "smooth" });
        destino.focus({ preventScroll: true });
      }, oculto ? 60 : 0);
    }
    // Después del primer pintado, para que la sección ya exista.
    const t = window.setTimeout(ir, 80);
    window.addEventListener("hashchange", ir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", ir);
    };
  }, [ruta, cambiar]);
  return null;
}
