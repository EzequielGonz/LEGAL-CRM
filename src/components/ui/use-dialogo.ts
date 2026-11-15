"use client";

import { useEffect, useRef } from "react";

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Pila de diálogos abiertos (15/11): solo el de arriba atiende Escape y Tab.
 * Así, una confirmación abierta encima del asistente se cierra sola con
 * Escape y no se lleva puesto al asistente.
 */
const pila: symbol[] = [];

export interface OpcionesDialogo {
  /** Al abrir, enfocá el primer control del diálogo en lugar del diálogo entero (menú del celular). */
  enfocarPrimero?: boolean;
}

/**
 * Comportamiento de diálogo modal (rediseño 17/10, bloque 1), para usar con
 * un diálogo montado en `document.body` (portal) o dentro de la página:
 * - al abrir, guarda el control que lo abrió y enfoca el diálogo (o su primer control);
 * - Tab y Mayús+Tab quedan dentro del diálogo;
 * - Escape lo cierra (solo el diálogo de más arriba, si hay varios);
 * - el resto de la página queda inerte (ni foco ni lector de pantalla); lo
 *   que lleve `data-no-inerte` (el velo que cierra al tocar) sigue operable;
 * - al cerrar, devuelve el foco al control que lo abrió.
 */
export function useDialogo<T extends HTMLElement>(abierto: boolean, alCerrar: () => void, opciones: OpcionesDialogo = {}) {
  const ref = useRef<T | null>(null);
  const cerrarRef = useRef(alCerrar);
  cerrarRef.current = alCerrar;
  const enfocarPrimero = !!opciones.enfocarPrimero;

  useEffect(() => {
    if (!abierto) return;
    const dialogo = ref.current;
    if (!dialogo) return;
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const yo = Symbol("dialogo");
    pila.push(yo);
    const esElDeArriba = () => pila[pila.length - 1] === yo;

    // Fondo inerte: los hermanos del contenedor del diálogo y de cada uno de sus
    // ancestros hasta <body>. Con portal es lo mismo que antes (los hijos de <body>);
    // sin portal (menú del celular, asistente) también deja inerte el resto del panel.
    const contenedor = dialogo.closest("[data-portal-dialogo]") ?? dialogo;
    const inertes: Element[] = [];
    let nodo: Element = contenedor;
    while (nodo !== document.body && nodo.parentElement) {
      const padre: HTMLElement = nodo.parentElement;
      for (const el of Array.from(padre.children)) {
        if (el === nodo || el.hasAttribute("inert") || el.hasAttribute("data-no-inerte")) continue;
        el.setAttribute("inert", "");
        inertes.push(el);
      }
      if (padre === document.body) break;
      nodo = padre;
    }

    const visibles = () => Array.from(dialogo.querySelectorAll<HTMLElement>(ENFOCABLES)).filter((el) => el.offsetParent !== null || el === document.activeElement);
    const primeroVisible = enfocarPrimero ? visibles()[0] : undefined;
    (primeroVisible ?? dialogo).focus({ preventScroll: true });

    function alTeclear(e: KeyboardEvent) {
      if (!esElDeArriba()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        cerrarRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogo) return;
      const lista = visibles();
      if (lista.length === 0) {
        e.preventDefault();
        dialogo.focus();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const actual = document.activeElement;
      if (e.shiftKey && (actual === primero || actual === dialogo)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && actual === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener("keydown", alTeclear);

    return () => {
      document.removeEventListener("keydown", alTeclear);
      const i = pila.indexOf(yo);
      if (i >= 0) pila.splice(i, 1);
      for (const el of inertes) el.removeAttribute("inert");
      if (previo && document.contains(previo)) previo.focus({ preventScroll: true });
    };
  }, [abierto, enfocarPrimero]);

  return ref;
}
