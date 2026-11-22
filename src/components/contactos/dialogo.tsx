"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Diálogo modal con el <dialog> nativo: foco atrapado, Escape cierra y el foco vuelve a quien lo abrió.
 * Entra con fundido y 8 px (sin movimiento con «reducir movimiento»).
 */
export function Dialogo({ abierto, titulo, onCerrar, children, ancho = "30rem" }: { abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      className="ct-dialogo"
      style={{ maxWidth: `min(${ancho}, calc(100vw - 2rem))` }}
      aria-labelledby="ct-dialogo-titulo"
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
    >
      {abierto ? (
        <div className="ct-dialogo__cuerpo">
          <h2 id="ct-dialogo-titulo" className="ct-dialogo__titulo">
            {titulo}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
