"use client";

import { useEffect } from "react";

/**
 * Motor de profundidad del panel (16/10, experiencia inmersiva).
 * Un único listener para toda la app, sin dependencias:
 * - `[data-3d]`: la tarjeta se inclina hacia el puntero y su luz lo sigue
 *   (variables --rx, --ry, --mx, --my). Valor: "fuerte" | "suave" | "".
 * - `.escena-3d`: paralaje de la escena completa (variables --px, --py).
 * Solo con mouse o lápiz y sin «reducir movimiento»: en teléfonos y para
 * quien prefiere menos movimiento, todo queda quieto y legible.
 */
const ANGULO: Record<string, number> = { fuerte: 9, suave: 3 };

export function Efectos3D() {
  useEffect(() => {
    const finoYMovil = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!finoYMovil.matches) return;

    let actual: HTMLElement | null = null;
    let raf = 0;
    let ultimo: PointerEvent | null = null;

    const soltar = (el: HTMLElement) => {
      el.classList.remove("en-3d");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    const pintar = () => {
      raf = 0;
      const e = ultimo;
      if (!e) return;
      const destino = (e.target as Element | null)?.closest?.("[data-3d]") as HTMLElement | null;
      if (actual && actual !== destino) soltar(actual);
      actual = destino;
      if (destino) {
        const r = destino.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const max = ANGULO[destino.dataset["3d"] ?? ""] ?? 6;
        destino.classList.add("en-3d");
        destino.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
        destino.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
        destino.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        destino.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      }
      const escena = document.querySelector<HTMLElement>(".escena-3d");
      if (escena) {
        escena.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        escena.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }
    };

    const mover = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ultimo = e;
      if (!raf) raf = requestAnimationFrame(pintar);
    };
    const salir = () => {
      if (actual) soltar(actual);
      actual = null;
    };

    document.addEventListener("pointermove", mover, { passive: true });
    document.documentElement.addEventListener("pointerleave", salir);
    return () => {
      document.removeEventListener("pointermove", mover);
      document.documentElement.removeEventListener("pointerleave", salir);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
