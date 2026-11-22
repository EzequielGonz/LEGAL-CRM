"use client";

import { useEffect, type RefObject } from "react";
import { sePuedeContar, textoDePaso } from "@/lib/premium/conteo";

/**
 * Animación de la fundación visual. Regla de hidratación: acá nunca se agrega,
 * quita ni reescribe un nodo de texto que maneja React. Solo se tocan atributos
 * (`data-fase`, `data-cuenta`) y el número que sube se dibuja con ::after
 * (ver `premium.css`). El HTML del servidor ya trae el valor final.
 */

const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Llama a `hacer` una sola vez, cuando el elemento entra en pantalla (o enseguida si no hay IntersectionObserver). */
function alEntrar(el: Element, hacer: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    hacer();
    return () => {};
  }
  const o = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        o.disconnect();
        hacer();
      }
    },
    { threshold: 0.4 },
  );
  o.observe(el);
  return () => o.disconnect();
}

/**
 * Llenado de un arco: el servidor entrega `data-fase="previa"` (arco vacío, listo para animar);
 * al entrar en pantalla pasa a «llenar» (transición CSS de 900 ms) y con movimiento reducido
 * va directo a «listo» (valor final, sin animación).
 */
export function useRelleno(ref: RefObject<HTMLElement | null>, animar: boolean, retrasoMs = 0) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!animar || sinMovimiento()) {
      el.dataset.fase = "listo";
      return;
    }
    let t: ReturnType<typeof setTimeout> | undefined;
    const quitar = alEntrar(el, () => {
      t = setTimeout(() => {
        el.dataset.fase = "llenar";
      }, retrasoMs);
    });
    return () => {
      quitar();
      clearTimeout(t);
    };
  }, [ref, animar, retrasoMs]);
}

/** Cuenta de 0 a `fin` en `ms` milisegundos una sola vez al entrar en pantalla, dibujada por `data-cuenta` + ::after. */
export function useConteo(ref: RefObject<HTMLElement | null>, fin: number, animar: boolean, ms: number, retrasoMs = 0) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !animar || !sePuedeContar(fin) || sinMovimiento()) return;
    let raf = 0;
    let t: ReturnType<typeof setTimeout> | undefined;
    // El valor real sigue en su lugar (transparente mientras cuenta): el lector de pantalla lo lee entero.
    el.setAttribute("data-cuenta", "0");
    el.classList.add("pm-contando");
    const terminar = () => {
      el.removeAttribute("data-cuenta");
      el.classList.remove("pm-contando");
    };
    const quitar = alEntrar(el, () => {
      t = setTimeout(() => {
        const inicio = performance.now();
        const paso = (ahora: number) => {
          const p = Math.min(1, (ahora - inicio) / ms);
          if (p >= 1 || !el.isConnected) return terminar();
          el.setAttribute("data-cuenta", textoDePaso(fin, p));
          raf = requestAnimationFrame(paso);
        };
        raf = requestAnimationFrame(paso);
      }, retrasoMs);
    });
    return () => {
      quitar();
      clearTimeout(t);
      cancelAnimationFrame(raf);
      terminar();
    };
  }, [ref, fin, animar, ms, retrasoMs]);
}
