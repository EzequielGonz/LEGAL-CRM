import type { ReactNode } from "react";

export interface VerMasProps {
  children: ReactNode;
  /** Texto cerrado (por defecto «Ver más»). */
  cerrado?: string;
  /** Texto abierto (por defecto «Ver menos»). */
  abierto?: string;
  className?: string;
}

/**
 * Disclosure accesible: <details>/<summary> nativo (teclado, lector de pantalla y estado
 * expandido sin JavaScript, así que no hay nada que hidratar). Lo secundario va acá adentro.
 */
export function VerMas({ children, cerrado = "Ver más", abierto = "Ver menos", className }: VerMasProps) {
  return (
    <details className={`pm-vermas${className ? ` ${className}` : ""}`}>
      <summary className="pm-vermas__boton">
        <span className="pm-vermas__texto pm-vermas__texto--cerrado">{cerrado}</span>
        <span className="pm-vermas__texto pm-vermas__texto--abierto">{abierto}</span>
        <svg className="pm-vermas__flecha" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="pm-vermas__cuerpo">{children}</div>
    </details>
  );
}
