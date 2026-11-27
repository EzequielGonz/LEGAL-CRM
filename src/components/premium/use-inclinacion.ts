"use client";

import { useEffect, type RefObject } from "react";
import { INCLINACION_POR_DEFECTO, calcularInclinacion } from "@/lib/premium/inclinacion";

export interface OpcionesInclinacion {
  /** Grados máximos (hasta 6). Por defecto 5. */
  max?: number;
  /** Apagar sin sacar el hook. */
  activo?: boolean;
}

/**
 * Inclinación 3D suave que sigue al puntero. Reutilizable en cualquier elemento:
 * solo escribe variables CSS (`--pm-rx`, `--pm-ry`, `--pm-bx`, `--pm-by`) y el atributo
 * `data-inclinando`; el resto (perspective, resorte de vuelta, brillo) lo pone `premium.css`
 * con la clase `.pm-tarjeta--relieve` (o cualquier elemento que use esas variables).
 * No hace nada en pantallas táctiles ni con «reducir movimiento»; no toca texto de React.
 * Usa un solo requestAnimationFrame por movimiento: solo se anima `transform`.
 */
export function useInclinacion(ref: RefObject<HTMLElement | null>, { max = INCLINACION_POR_DEFECTO, activo = true }: OpcionesInclinacion = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !activo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let ultimo: { x: number; y: number } | null = null;

    const aplicar = () => {
      raf = 0;
      if (!ultimo) return;
      const r = el.getBoundingClientRect();
      const v = calcularInclinacion(ultimo.x - r.left, ultimo.y - r.top, r.width, r.height, max);
      el.style.setProperty("--pm-rx", `${v.rx}deg`);
      el.style.setProperty("--pm-ry", `${v.ry}deg`);
      el.style.setProperty("--pm-bx", `${v.bx}%`);
      el.style.setProperty("--pm-by", `${v.by}%`);
    };
    const entrar = () => {
      el.setAttribute("data-inclinando", "1");
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      ultimo = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(aplicar);
    };
    const salir = () => {
      ultimo = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      el.removeAttribute("data-inclinando");
      // Vuelve a 0 con el resorte de la hoja de estilos.
      el.style.setProperty("--pm-rx", "0deg");
      el.style.setProperty("--pm-ry", "0deg");
    };

    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", salir);
    return () => {
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", salir);
      if (raf) cancelAnimationFrame(raf);
      el.removeAttribute("data-inclinando");
      for (const v of ["--pm-rx", "--pm-ry", "--pm-bx", "--pm-by"]) el.style.removeProperty(v);
    };
  }, [ref, max, activo]);
}
