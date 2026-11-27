"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Tarjeta parallax en capas (vuelta 6, «Viaja lejos» del video): cielo, sol y dos cordones de montañas
 * que se mueven a distinta velocidad con el mouse (y un poco al bajar la página). El contenido va arriba.
 * Solo transform; con movimiento reducido queda quieta; en pantallas táctiles se mueve solo con el scroll.
 */
export function Paralaje({ children, className, compacta = false }: { children?: ReactNode; className?: string; compacta?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let mx = 0;
    let my = 0;
    const pintar = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const sc = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      el.style.setProperty("--px", mx.toFixed(3));
      el.style.setProperty("--py", (my + sc * 0.6).toFixed(3));
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(pintar);
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      pedir();
    };
    const salir = () => {
      mx = 0;
      my = 0;
      pedir();
    };
    el.addEventListener("pointermove", mover, { passive: true });
    el.addEventListener("pointerleave", salir);
    const scroller = el.closest("main") ?? window;
    scroller.addEventListener("scroll", pedir, { passive: true });
    pedir();
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", salir);
      scroller.removeEventListener("scroll", pedir);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={`vv-paralaje${compacta ? " vv-paralaje--compacta" : ""}${className ? ` ${className}` : ""}`}>
      <div className="vv-paralaje__escena" aria-hidden="true">
        <span className="vv-paralaje__cielo" />
        <span className="vv-paralaje__sol" />
        <svg className="vv-paralaje__capa vv-paralaje__capa--lejos" viewBox="0 0 800 200" preserveAspectRatio="none" focusable="false">
          <path d="M0 200V120l70-38 60 30 90-62 80 52 70-34 90 58 80-46 100 54 80-40 80 36v70Z" />
        </svg>
        <svg className="vv-paralaje__capa vv-paralaje__capa--medio" viewBox="0 0 800 200" preserveAspectRatio="none" focusable="false">
          <path d="M0 200v-58l90-44 80 50 110-70 100 64 90-40 120 62 90-46 120 56v26Z" />
        </svg>
        <svg className="vv-paralaje__capa vv-paralaje__capa--cerca" viewBox="0 0 800 200" preserveAspectRatio="none" focusable="false">
          <path d="M0 200v-36c80-20 160-30 260-10s200 22 300 0 170-14 240 6v40Z" />
        </svg>
      </div>
      <div className="vv-paralaje__contenido">{children}</div>
    </div>
  );
}
