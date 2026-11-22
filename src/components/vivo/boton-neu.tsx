import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Botón neumórfico (vuelta 6, «botones que salen de la pantalla»): sale con sombra doble suave
 * (luz arriba a la izquierda, sombra abajo a la derecha) y al presionarlo se hunde.
 */
export function BotonNeu({ href, children, icono, etiqueta, className }: { href: string; children?: ReactNode; icono: ReactNode; etiqueta?: string; className?: string }) {
  return (
    <Link prefetch={false} href={href} aria-label={etiqueta} className={`vv-neu${children ? "" : " vv-neu--solo"}${className ? ` ${className}` : ""}`}>
      <span className="vv-neu__icono" aria-hidden="true">
        {icono}
      </span>
      {children ? <span className="vv-neu__texto">{children}</span> : null}
    </Link>
  );
}

/** Íconos SVG de los botones neumórficos (trazos, nítidos a cualquier tamaño). */
export const IconoNeu = {
  play: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false">
      <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.2-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" />
    </svg>
  ),
  corazon: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false">
      <path d="M12 20.3s-7.6-4.6-7.6-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.6 2.5c0 5.6-7.6 10.2-7.6 10.2Z" />
    </svg>
  ),
  personas: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" focusable="false">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
      <path d="M16 4.8a3.2 3.2 0 0 1 0 6.2M18.4 14.6c1.5.7 2.4 2.4 2.6 4.9" />
    </svg>
  ),
  calendario: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" focusable="false">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  ),
  seguimiento: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4.5V9h4.5" />
      <path d="M12 8v4.3l2.8 1.7" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" focusable="false">
      <path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5v-3.5h-1A1.5 1.5 0 0 1 3 16V7a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  ),
};
