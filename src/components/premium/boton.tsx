import Link from "next/link";
import type { ReactNode } from "react";

export interface BotonProps {
  children?: ReactNode;
  /** Con `href` es un enlace; sin `href`, un <button>. */
  href?: string;
  /** primario: acento del rubro; secundario: superficie neutra. */
  variante?: "primario" | "secundario";
  /** Ícono (SVG) antes del texto. */
  icono?: ReactNode;
  /** Botón de solo ícono, cuadrado de 44 px: exige `etiqueta`. */
  soloIcono?: boolean;
  /** Nombre accesible (obligatorio en solo ícono). */
  etiqueta?: string;
  /** Estado «hundido» (por ejemplo un filtro encendido). */
  presionado?: boolean;
  deshabilitado?: boolean;
  tipo?: "button" | "submit";
  className?: string;
}

/**
 * Botón neumórfico sobrio (versión oscura): sale de la superficie con luz arriba a la izquierda y
 * sombra abajo a la derecha; al presionar se hunde. Solo para botones de acción e íconos, no para tarjetas.
 * Objetivo táctil de 44 px, foco visible del acento y nombre accesible.
 */
export function Boton({ children, href, variante = "secundario", icono, soloIcono = false, etiqueta, presionado, deshabilitado, tipo = "button", className }: BotonProps) {
  const clases = `pm-boton pm-boton--${variante}${soloIcono ? " pm-boton--icono" : ""}${className ? ` ${className}` : ""}`;
  const contenido = (
    <>
      {icono ? (
        <span className="pm-boton__icono" aria-hidden="true">
          {icono}
        </span>
      ) : null}
      {soloIcono ? null : children}
    </>
  );
  if (href && !deshabilitado) {
    return (
      <Link href={href} className={clases} aria-label={etiqueta} aria-pressed={presionado}>
        {contenido}
      </Link>
    );
  }
  return (
    <button type={tipo} className={clases} aria-label={etiqueta} aria-pressed={presionado} disabled={deshabilitado}>
      {contenido}
    </button>
  );
}
