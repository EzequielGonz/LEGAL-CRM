"use client";

import { useRef, type CSSProperties } from "react";
import type { SlugPerfil } from "@/lib/marca";
import { desplazamiento, etiquetaAnillo, formatoNumero, fraccion, geometriaMedidor } from "@/lib/premium/anillo";
import { NOMBRE_RUBRO, claseRubro } from "@/lib/premium/rubros";
import { useConteo, useRelleno } from "./animacion";

export interface MedidorProps {
  valor: number;
  meta?: number;
  rubro: SlugPerfil;
  nombre?: string;
  unidad?: string;
  sufijo?: string;
  /** Rótulo visible debajo del número («servicios en orden»). */
  etiqueta?: string;
  animar?: boolean;
  retrasoMs?: number;
  className?: string;
}

const ANCHO = 200;
const TRAZO = 12;

/** Medidor en semicírculo: mismo lenguaje que el anillo, para una sola cifra grande («¿anda todo?»). */
export function Medidor({ valor, meta = 100, rubro, nombre, unidad, sufijo, etiqueta, animar = true, retrasoMs = 0, className }: MedidorProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const cifra = useRef<HTMLSpanElement>(null);
  const g = geometriaMedidor(ANCHO, TRAZO);
  const fin = desplazamiento(g.largo, fraccion(valor, meta));
  useRelleno(raiz, animar, retrasoMs);
  useConteo(cifra, valor, animar, 900, retrasoMs);
  const estilo = { "--pm-largo": g.largo, "--pm-fin": fin, "--pm-ms": "900ms" } as CSSProperties;
  return (
    <div
      ref={raiz}
      className={`pm-medidor ${claseRubro(rubro)}${className ? ` ${className}` : ""}`}
      data-fase="previa"
      role="img"
      aria-label={etiquetaAnillo({ nombre: nombre ?? NOMBRE_RUBRO[rubro], valor, meta, unidad, sufijo })}
      style={estilo}
    >
      <svg viewBox={`0 0 ${ANCHO} ${g.alto}`} aria-hidden="true" focusable="false">
        <path className="pm-medidor__pista" d={g.trazado} fill="none" strokeWidth={TRAZO} strokeLinecap="round" />
        <path className="pm-medidor__arco" d={g.trazado} fill="none" strokeWidth={TRAZO} strokeLinecap="round" />
      </svg>
      <div className="pm-medidor__centro">
        <span className="pm-medidor__numero">
          <span ref={cifra} className="pm-cifra__n">
            {formatoNumero(valor)}
          </span>
          {sufijo ? <span className="pm-medidor__sufijo">{sufijo}</span> : null}
        </span>
        {etiqueta ? <span className="pm-medidor__etiqueta">{etiqueta}</span> : null}
      </div>
    </div>
  );
}
