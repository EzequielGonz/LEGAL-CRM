import type { ReactNode } from "react";

export type EstadoPastilla = "ok" | "atencion" | "error" | "info" | "neutro";

export interface PastillaProps {
  estado?: EstadoPastilla;
  children: ReactNode;
  className?: string;
}

/** Pastilla de estado: punto + texto (el estado nunca depende solo del color). Es un <span>, vale dentro de <p>. */
export function Pastilla({ estado = "neutro", children, className }: PastillaProps) {
  return (
    <span className={`pm-pastilla pm-pastilla--${estado}${className ? ` ${className}` : ""}`}>
      <span className="pm-pastilla__punto" aria-hidden="true" />
      {children}
    </span>
  );
}
