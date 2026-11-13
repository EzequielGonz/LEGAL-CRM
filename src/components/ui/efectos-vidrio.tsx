"use client";

import { useEffect } from "react";

/**
 * Movimiento del panel que no se puede hacer solo con estilos (13/11):
 *  - las cifras grandes cuentan desde cero al aparecer;
 *  - las tarjetas de cifras se inclinan unos grados siguiendo el cursor.
 * No dibuja nada. Con «reducir movimiento» del sistema no hace nada, y en
 * pantallas táctiles no hay inclinación.
 */
const CIFRAS = ".cifra-premium";
const INCLINABLES = ".kpi-hoy, [data-inclinar]";
const GRADOS = 5;

function soloNumero(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d{1,3}(\.\d{3})*$|^\d+$/.test(t)) return null;
  const n = Number(t.replace(/\./g, ""));
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? n : null;
}

export function EfectosVidrio() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vistos = new WeakSet<Element>();
    const enCurso = new Set<number>();

    const contar = (el: HTMLElement) => {
      if (vistos.has(el)) return;
      vistos.add(el);
      // Solo cifras "limpias": un texto con algo más (un «—», una unidad) no se toca.
      if (el.childElementCount > 0) return;
      const fin = soloNumero(el.textContent ?? "");
      if (fin === null) return;
      const final = el.textContent ?? "";
      const ms = Math.min(900, 420 + Math.log10(fin + 1) * 160);
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const p = Math.min(1, (ahora - inicio) / ms);
        const suave = 1 - Math.pow(1 - p, 3);
        el.textContent = p >= 1 ? final : Math.round(fin * suave).toLocaleString("es-AR");
        if (p < 1) enCurso.add(requestAnimationFrame(paso));
      };
      el.textContent = "0";
      enCurso.add(requestAnimationFrame(paso));
    };

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          observador.unobserve(e.target);
          contar(e.target as HTMLElement);
        }
      },
      { threshold: 0.4 }
    );
    const anotados = new WeakSet<Element>();
    const revisar = () => {
      document.querySelectorAll<HTMLElement>(CIFRAS).forEach((el) => {
        if (anotados.has(el)) return;
        anotados.add(el);
        observador.observe(el);
      });
    };
    revisar();
    // El contenido llega por partes: se vuelve a mirar cuando aparece algo nuevo.
    let espera: ReturnType<typeof setTimeout> | undefined;
    const mutaciones = new MutationObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(revisar, 120);
    });
    mutaciones.observe(document.body, { childList: true, subtree: true });

    // Inclinación: un solo oyente para todas las tarjetas.
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let actual: HTMLElement | null = null;
    const soltar = () => {
      if (!actual) return;
      actual.style.removeProperty("--rx");
      actual.style.removeProperty("--ry");
      actual = null;
    };
    const mover = (ev: PointerEvent) => {
      const t = (ev.target as Element | null)?.closest?.<HTMLElement>(INCLINABLES) ?? null;
      if (t !== actual) soltar();
      if (!t) return;
      actual = t;
      const r = t.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width;
      const y = (ev.clientY - r.top) / r.height;
      t.style.setProperty("--ry", `${((x - 0.5) * 2 * GRADOS).toFixed(2)}deg`);
      t.style.setProperty("--rx", `${((0.5 - y) * 2 * GRADOS).toFixed(2)}deg`);
      t.style.setProperty("--bx", `${(x * 100).toFixed(1)}%`);
      t.style.setProperty("--by", `${(y * 100).toFixed(1)}%`);
    };
    if (fino) {
      document.addEventListener("pointermove", mover, { passive: true });
      document.addEventListener("pointerleave", soltar);
    }

    return () => {
      observador.disconnect();
      mutaciones.disconnect();
      clearTimeout(espera);
      enCurso.forEach((id) => cancelAnimationFrame(id));
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerleave", soltar);
      soltar();
    };
  }, []);
  return null;
}
