"use client";

import { useRef } from "react";
import { formatoNumero } from "@/lib/premium/anillo";
import { useConteo } from "./animacion";

export interface CifraProps {
  valor: number;
  /** Tamaño: xl 48, l 32, m 20, s 16 (px). */
  tamano?: "xl" | "l" | "m" | "s";
  /** Texto pegado a la cifra, por ejemplo «%». */
  sufijo?: string;
  /** Rótulo chico debajo (opcional). */
  etiqueta?: string;
  /** Línea de contexto debajo del rótulo, por ejemplo «+4 que ayer». */
  detalle?: string;
  /** Cuenta de 0 al valor una sola vez al entrar en pantalla. */
  animar?: boolean;
  duracionMs?: number;
  retrasoMs?: number;
  className?: string;
}

/**
 * Cifra grande con número tabular. Todo son <span> (válido dentro de <p>). El número real está
 * siempre en el HTML; la cuenta se dibuja con ::after desde `data-cuenta`, sin tocar texto de React.
 */
export function Cifra({ valor, tamano = "l", sufijo, etiqueta, detalle, animar = true, duracionMs = 900, retrasoMs = 0, className }: CifraProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useConteo(ref, valor, animar, duracionMs, retrasoMs);
  return (
    <span className={`pm-cifra pm-cifra--${tamano}${className ? ` ${className}` : ""}`}>
      <span className="pm-cifra__valor">
        <span ref={ref} className="pm-cifra__n">
          {formatoNumero(valor)}
        </span>
        {sufijo ? <span className="pm-cifra__sufijo">{sufijo}</span> : null}
      </span>
      {etiqueta ? <span className="pm-cifra__etiqueta">{etiqueta}</span> : null}
      {detalle ? <span className="pm-cifra__detalle">{detalle}</span> : null}
    </span>
  );
}
