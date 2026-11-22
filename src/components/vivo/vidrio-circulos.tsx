import type { ReactNode } from "react";

/**
 * Tarjeta de vidrio esmerilado apoyada sobre círculos de color (vuelta 6, «Tu plan Pro» del video).
 * Los círculos están DENTRO del componente, detrás del vidrio, y se mueven lento. No es el fondo de la página.
 */
export function VidrioCirculos({ children, className, etiqueta }: { children: ReactNode; className?: string; etiqueta?: string }) {
  return (
    <div className={`vv-vidrio${className ? ` ${className}` : ""}`} role={etiqueta ? "group" : undefined} aria-label={etiqueta}>
      <span className="vv-vidrio__c vv-vidrio__c--rosa" aria-hidden="true" />
      <span className="vv-vidrio__c vv-vidrio__c--violeta" aria-hidden="true" />
      <span className="vv-vidrio__c vv-vidrio__c--amarillo" aria-hidden="true" />
      <div className="vv-vidrio__panel">{children}</div>
    </div>
  );
}
