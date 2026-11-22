import type { ReactNode } from "react";

/**
 * Tarjeta con gradient mesh (vuelta 6, «Tu marca aquí» del video): colores que se mezclan como nubes
 * y se mueven lento. Es una tarjeta, no el fondo del panel. Lleva la marca de cada perfil abajo.
 */
export function TarjetaMesh({ children, className, tono = "violeta" }: { children?: ReactNode; className?: string; tono?: "violeta" | "dorado" | "azul" | "verde" | "naranja" }) {
  return (
    <div className={`vv-mesh vv-mesh--${tono}${className ? ` ${className}` : ""}`}>
      <span className="vv-mesh__nube vv-mesh__nube--1" aria-hidden="true" />
      <span className="vv-mesh__nube vv-mesh__nube--2" aria-hidden="true" />
      <span className="vv-mesh__nube vv-mesh__nube--3" aria-hidden="true" />
      <div className="vv-mesh__texto">{children}</div>
    </div>
  );
}
