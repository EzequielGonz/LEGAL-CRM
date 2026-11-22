import type { CSSProperties, ReactNode } from "react";

export interface Escena3DProps {
  children: ReactNode;
  /** Distancia de la perspectiva en px (por defecto 1000: sutil; menos de 600 deforma). */
  perspectiva?: number;
  como?: "div" | "section" | "ul";
  className?: string;
}

/**
 * Escena 3D liviana: un contenedor con `perspective` para que las tarjetas con relieve (o cualquier
 * hijo con `translateZ` / `rotate*`) compartan el mismo punto de fuga. Es solo CSS, sin JavaScript.
 */
export function Escena3D({ children, perspectiva = 1000, como = "div", className }: Escena3DProps) {
  const Caja = como;
  const p = Math.min(2400, Math.max(600, perspectiva));
  return (
    <Caja className={`pm-escena${className ? ` ${className}` : ""}`} style={{ "--pm-persp": `${p}px` } as CSSProperties}>
      {children}
    </Caja>
  );
}
