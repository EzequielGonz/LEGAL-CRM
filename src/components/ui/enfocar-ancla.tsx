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
    function ir(suave: boolean) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const destino = document.getElementById(id);
      if (!destino) return;
      const oculto = !!destino.closest(".solo-avanzado") && !!destino.closest('[data-nivel="simple"]');
      if (oculto) cambiar("avanzado");
      if (destino instanceof HTMLDetailsElement) destino.open = true;
      for (let p = destino.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
      if (!destino.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(destino.tagName)) {
        destino.setAttribute("tabindex", "-1");
      }
      // Si recién pasó a Avanzado, se espera a que la sección se muestre.
      // Al llegar a la página el salto es inmediato (como hace el navegador
      // con un ancla); dentro de la página se desliza salvo movimiento reducido.
      window.setTimeout(() => {
        const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        destino.scrollIntoView({ block: "start", behavior: suave && !reducir ? "smooth" : "auto" });
        destino.focus({ preventScroll: true });
        // Si algo de arriba cambió de alto después (datos, imágenes), se corrige.
        if (!suave) {
          window.setTimeout(() => {
            const top = destino.getBoundingClientRect().top;
            if (top < -4 || top > window.innerHeight * 0.5) destino.scrollIntoView({ block: "start", behavior: "auto" });
          }, 300);
        }
      }, oculto ? 60 : 0);
    }
    const alCambiar = () => ir(true);
    // Después del primer pintado, para que la sección ya exista.
    const t = window.setTimeout(() => ir(false), 80);
    window.addEventListener("hashchange", alCambiar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", alCambiar);
    };
  }, [ruta, cambiar]);
  return null;
}
