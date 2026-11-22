"use client";

import { useEffect, type RefObject } from "react";
import { calcularParalaje } from "@/lib/premium/paralaje";

export interface OpcionesParalaje {
  /** Seguir al puntero (solo mouse). */
  puntero?: boolean;
  /** Seguir el desplazamiento de la página. */
  scroll?: boolean;
  activo?: boolean;
}

/**
 * Parallax sutil: escribe `--pm-px`, `--pm-py` (puntero, -1 a 1) y `--pm-sy` (scroll en centenas de px)
 * en el elemento. Cada capa decide cuánto se mueve con su propia distancia (`--pm-k`) en `premium.css`;
 * solo se anima `transform`. Un único requestAnimationFrame por tanda de eventos. No hace nada con
 * «reducir movimiento» ni en pantallas táctiles (para el puntero); el scroll sí sigue en táctil, pero acotado.
 */
export function useParalaje(ref: RefObject<HTMLElement | null>, { puntero = true, scroll = true, activo = true }: OpcionesParalaje = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !activo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    const aplicar = () => {
      raf = 0;
      const v = calcularParalaje({ x, y, ancho: window.innerWidth, alto: window.innerHeight, scroll: scroll ? window.scrollY : 0 });
      el.style.setProperty("--pm-px", String(puntero && conMouse ? v.px : 0));
      el.style.setProperty("--pm-py", String(puntero && conMouse ? v.py : 0));
      el.style.setProperty("--pm-sy", String(v.sy));
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(aplicar);
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      pedir();
    };
    if (puntero && conMouse) window.addEventListener("pointermove", mover, { passive: true });
    if (scroll) window.addEventListener("scroll", pedir, { passive: true });
    aplicar();
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("scroll", pedir);
      if (raf) cancelAnimationFrame(raf);
      for (const v of ["--pm-px", "--pm-py", "--pm-sy"]) el.style.removeProperty(v);
    };
  }, [ref, puntero, scroll, activo]);
}
