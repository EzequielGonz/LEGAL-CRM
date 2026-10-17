"use client";

import { useEffect, useRef } from "react";

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento de diálogo modal (rediseño 17/10, bloque 1), para usar con
 * un diálogo montado en `document.body` (portal):
 * - al abrir, guarda el control que lo abrió y enfoca el diálogo;
 * - Tab y Mayús+Tab quedan dentro del diálogo;
 * - Escape lo cierra;
 * - el resto de la página queda inerte (ni foco ni lector de pantalla);
 * - al cerrar, devuelve el foco al control que lo abrió.
 */
export function useDialogo<T extends HTMLElement>(abierto: boolean, alCerrar: () => void) {
  const ref = useRef<T | null>(null);
  const cerrarRef = useRef(alCerrar);
  cerrarRef.current = alCerrar;

  useEffect(() => {
    if (!abierto) return;
    const dialogo = ref.current;
    if (!dialogo) return;
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Fondo inerte: todo lo que cuelga de <body> salvo el contenedor del diálogo.
    const contenedor = dialogo.closest("[data-portal-dialogo]") ?? dialogo;
    const inertes: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === contenedor || el.contains(contenedor) || el.hasAttribute("inert")) continue;
      el.setAttribute("inert", "");
      inertes.push(el);
    }

    dialogo.focus({ preventScroll: true });

    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrarRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogo) return;
      const lista = Array.from(dialogo.querySelectorAll<HTMLElement>(ENFOCABLES)).filter((el) => el.offsetParent !== null || el === document.activeElement);
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
      for (const el of inertes) el.removeAttribute("inert");
      if (previo && document.contains(previo)) previo.focus({ preventScroll: true });
    };
  }, [abierto]);

  return ref;
}
