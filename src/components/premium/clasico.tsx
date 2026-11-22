import type { ReactNode } from "react";
import "@/app/premium-clasico.css";

/**
 * Alcance «clásico» de los componentes premium (22/11): los pinta con el fondo, los colores y la
 * tipografía del panel (o del cerebro con `cerebro`), sin fondo vivo. Ver `premium-clasico.css`.
 */
export function Clasico({ children, cerebro = false, className }: { children: ReactNode; cerebro?: boolean; className?: string }) {
  return <div className={`pm-clasico${cerebro ? " pm-clasico--cz" : ""}${className ? ` ${className}` : ""}`}>{children}</div>;
}
