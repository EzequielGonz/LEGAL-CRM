"use client";

import { useEffect } from "react";
import { duracionCuenta, numeroDeCifra, textoDeCuenta } from "@/lib/cifras-animadas";

/**
 * Movimiento del panel que no se puede hacer solo con estilos (13/11):
 *  - las cifras grandes cuentan desde cero al aparecer;
 *  - las tarjetas de cifras se inclinan unos grados siguiendo el cursor.
 * No dibuja nada. Con «reducir movimiento» del sistema no hace nada, y en
 * pantallas táctiles no hay inclinación.
 */
const CIFRAS = ".cifra-premium, [data-contar]";
const INCLINABLES = ".kpi-hoy, [data-inclinar]";
const GRADOS = 5;

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
      const fin = numeroDeCifra(el.textContent ?? "");
      if (fin === null) return;
      // 22/11: no se agrega ningún nodo dentro de lo que maneja React. Antes se metía un
      // <span> adentro de la cifra; si React todavía no había hidratado ese bloque
      // (las tarjetas que llegan por Suspense), el HTML ya no coincidía con el del
      // servidor y saltaba el error #418. Ahora solo se tocan atributos: el valor real
      // queda en su lugar (transparente mientras cuenta, así el lector de pantalla lo lee
      // completo) y el número que sube se dibuja con ::after desde `data-cuenta`.
      const estilo = getComputedStyle(el);
      el.style.setProperty("--cifra-color", estilo.color);
      el.setAttribute("data-cuenta", "0");
      const posicionPrevia = el.style.position;
      if (estilo.position === "static") el.style.position = "relative";
      el.classList.add("cifra-contando");
      const terminar = () => {
        el.removeAttribute("data-cuenta");
        el.style.removeProperty("--cifra-color");
        el.classList.remove("cifra-contando");
        el.style.position = posicionPrevia;
      };
      const ms = duracionCuenta(fin);
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const p = Math.min(1, (ahora - inicio) / ms);
        const suave = 1 - Math.pow(1 - p, 3);
        if (p >= 1 || !el.isConnected) return terminar();
        el.setAttribute("data-cuenta", textoDeCuenta(fin, suave));
        enCurso.add(requestAnimationFrame(paso));
      };
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
