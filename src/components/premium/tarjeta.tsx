import type { CSSProperties, ReactNode } from "react";
import type { SlugPerfil } from "@/lib/marca";
import { claseRubro } from "@/lib/premium/rubros";
import { Inclinable } from "./inclinable";

export interface TarjetaProps {
  children: ReactNode;
  /** Vidrio (blur): solo para barra lateral, Jarvis y modales. En el resto, borde fino sobre superficie sólida. */
  vidrio?: boolean;
  /** Sube 2 px y marca el borde al pasar el mouse (cuando toda la tarjeta es un enlace o abre algo). */
  interactiva?: boolean;
  /** Relieve 3D: inclinación suave (hasta 5°) que sigue al mouse y brillo en el borde. Solo con mouse y sin «reducir movimiento». */
  relieve?: boolean;
  /** Acento del rubro para el foco y los detalles de la tarjeta. */
  rubro?: SlugPerfil;
  titulo?: ReactNode;
  /** Nivel del título (por defecto 3). */
  nivelTitulo?: 2 | 3 | 4;
  /** Acción o dato a la derecha del título. */
  accion?: ReactNode;
  /** Aparece con fundido y 8 px al cargar; el número (0 a 7) escalona 50 ms por tarjeta. */
  aparecer?: number;
  /** Etiqueta HTML contenedora. */
  como?: "div" | "section" | "article" | "li";
  className?: string;
}

/** Tarjeta base: borde fino de 1 px + relieve `inset` arriba, radio 16 y padding 24. */
export function Tarjeta({ children, vidrio = false, interactiva = false, relieve = false, rubro, titulo, nivelTitulo = 3, accion, como = "div", aparecer, className }: TarjetaProps) {
  const Caja = como;
  const Titulo = `h${nivelTitulo}` as "h2" | "h3" | "h4";
  const clases = ["pm-tarjeta", vidrio ? "pm-tarjeta--vidrio" : "", interactiva || relieve ? "pm-tarjeta--viva" : "", relieve ? "pm-tarjeta--relieve" : "", vidrio ? "pm-entra-vidrio" : "", aparecer !== undefined ? "pm-aparece" : "", rubro ? claseRubro(rubro) : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const estilo = aparecer !== undefined ? ({ "--pm-orden": Math.min(7, Math.max(0, aparecer)) } as CSSProperties) : undefined;
  const contenido = (
    <>
      {titulo || accion ? (
        <div className="pm-tarjeta__cabeza">
          {titulo ? <Titulo className="pm-tarjeta__titulo">{titulo}</Titulo> : <span />}
          {accion ? <div className="pm-tarjeta__accion">{accion}</div> : null}
        </div>
      ) : null}
      {children}
    </>
  );
  if (relieve) {
    return (
      <Inclinable como={como} className={clases} style={estilo}>
        {contenido}
      </Inclinable>
    );
  }
  return (
    <Caja className={clases} style={estilo}>
      {contenido}
    </Caja>
  );
}
