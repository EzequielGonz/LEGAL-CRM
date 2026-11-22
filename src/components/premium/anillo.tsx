"use client";

import { useId, useRef, type CSSProperties } from "react";
import type { SlugPerfil } from "@/lib/marca";
import {
  TAMANOS_ANILLO,
  desplazamiento,
  etiquetaAnillo,
  formatoNumero,
  fraccion,
  geometriaAnillo,
  llegoALaMeta,
  type TamanoAnillo,
} from "@/lib/premium/anillo";
import { NOMBRE_RUBRO, claseRubro } from "@/lib/premium/rubros";
import { useConteo, useRelleno } from "./animacion";

export interface AnilloProps {
  valor: number;
  /** Meta del anillo (por defecto 100: el valor es un porcentaje). */
  meta?: number;
  /** Rubro: fija el color del arco. */
  rubro: SlugPerfil;
  /** 160 (grande), 120 (medio, celular) o 64 (chico). */
  tamano?: TamanoAnillo;
  /** Nombre para el lector de pantalla. Por defecto, el nombre del rubro. */
  nombre?: string;
  /** Unidad para el lector de pantalla y para la meta, por ejemplo «consultas hoy». */
  unidad?: string;
  /** Texto pegado al número del centro, por ejemplo «%». */
  sufijo?: string;
  /** Muestra «de 20» bajo el número (solo grande y medio). */
  mostrarMeta?: boolean;
  /** Relieve: arco con degradé del acento y leve glow, pista «hundida» y número que entra con escala 0,96 a 1. Por defecto sí. */
  relieve?: boolean;
  /** Llenado + conteo de 900 ms una sola vez. */
  animar?: boolean;
  /** Demora en ms, para escalonar varios anillos. */
  retrasoMs?: number;
  className?: string;
}

/**
 * Anillo de progreso: SVG con pista y arco, número real al centro (tabular) y
 * `role="img"` con la lectura completa. El arco nunca es el único portador del dato.
 */
export function Anillo({ valor, meta = 100, rubro, tamano = "grande", nombre, unidad, sufijo, mostrarMeta = true, relieve = true, animar = true, retrasoMs = 0, className }: AnilloProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const cifra = useRef<HTMLSpanElement>(null);
  const t = TAMANOS_ANILLO[tamano];
  const g = geometriaAnillo(t.diametro, t.trazo);
  const fin = desplazamiento(g.largo, fraccion(valor, meta));
  const cerrado = llegoALaMeta(valor, meta);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const idGrad = `pm-g-${uid}`;
  const idHundido = `pm-h-${uid}`;
  const nom = nombre ?? NOMBRE_RUBRO[rubro];
  useRelleno(raiz, animar, retrasoMs);
  useConteo(cifra, valor, animar, t.ms, retrasoMs);

  const estilo = {
    "--pm-largo": g.largo,
    "--pm-fin": fin,
    "--pm-ms": `${t.ms}ms`,
    "--pm-cifra": `${t.cifra}px`,
    width: t.diametro,
    height: t.diametro,
  } as CSSProperties;

  return (
    <div
      ref={raiz}
      className={`pm-anillo pm-anillo--${tamano} ${claseRubro(rubro)}${relieve ? " pm-anillo--relieve" : ""}${className ? ` ${className}` : ""}`}
      data-fase="previa"
      role="img"
      aria-label={etiquetaAnillo({ nombre: nom, valor, meta, unidad, sufijo })}
      style={estilo}
    >
      <svg viewBox={`0 0 ${t.diametro} ${t.diametro}`} width={t.diametro} height={t.diametro} aria-hidden="true" focusable="false">
        {relieve ? (
          <defs>
            <linearGradient id={idGrad} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={t.diametro} y2={t.diametro}>
              <stop offset="0" className="pm-grad-a" />
              <stop offset="1" className="pm-grad-b" />
            </linearGradient>
            <filter id={idHundido} x="-20%" y="-20%" width="140%" height="140%">
              <feComponentTransfer in="SourceAlpha">
                <feFuncA type="table" tableValues="1 0" />
              </feComponentTransfer>
              <feGaussianBlur stdDeviation={t.trazo / 6} />
              <feOffset dy={t.trazo / 6} result="sombra" />
              <feFlood floodColor="#000" floodOpacity="0.6" />
              <feComposite in2="sombra" operator="in" />
              <feComposite in2="SourceAlpha" operator="in" result="adentro" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="adentro" />
              </feMerge>
            </filter>
          </defs>
        ) : null}
        <circle className="pm-anillo__pista" cx={g.centro} cy={g.centro} r={g.radio} fill="none" strokeWidth={t.trazo} filter={relieve ? `url(#${idHundido})` : undefined} />
        <circle
          className="pm-anillo__arco"
          cx={g.centro}
          cy={g.centro}
          r={g.radio}
          fill="none"
          strokeWidth={t.trazo}
          strokeLinecap="round"
          transform={`rotate(-90 ${g.centro} ${g.centro})`}
          style={relieve ? ({ stroke: `url(#${idGrad})` } as CSSProperties) : undefined}
        />
      </svg>
      <div className="pm-anillo__centro">
        <span className="pm-anillo__numero">
          <span ref={cifra} className="pm-cifra__n">
            {formatoNumero(valor)}
          </span>
          {sufijo ? <span className="pm-anillo__sufijo">{sufijo}</span> : null}
        </span>
        {mostrarMeta && tamano !== "chico" && !sufijo ? (
          <span className="pm-anillo__meta">
            {cerrado ? (
              <svg className="pm-anillo__tilde" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M2.5 6.4 5 8.8l4.5-5.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            de {formatoNumero(meta)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
