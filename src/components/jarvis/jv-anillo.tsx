"use client";

import { useEffect, useRef, useState } from "react";
import { proporcionAnillo } from "@/lib/jarvis/parte";

/**
 * Anillo de Jarvis (22/11): SVG con pista y arco, el número real al centro
 * (texto, no dibujo) y dos animaciones simples: el arco se llena y la cifra
 * cuenta, una sola vez. Con «reducir movimiento» aparece en su valor final.
 * No usa hora ni azar: el primer dibujo ya es el valor final.
 */

interface Props {
  valor: number;
  meta: number;
  etiqueta: string;
  nota?: string;
  /** Color del arco (CSS). */
  color: string;
  tamano?: number;
  grosor?: number;
}

export function JvAnillo({ valor, meta, etiqueta, nota, color, tamano = 76, grosor = 7 }: Props) {
  const r = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * r;
  const objetivo = proporcionAnillo(valor, meta);
  const [prop, setProp] = useState(objetivo);
  const [cifra, setCifra] = useState(valor);
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) {
      setProp(objetivo);
      setCifra(valor);
      return;
    }
    hecho.current = true;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setProp(0);
    setCifra(0);
    let cuadro = 0;
    const t0 = performance.now();
    const DURACION = 900;
    // ease-out expo, el mismo que el llenado del arco.
    const suave = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
    const paso = (ahora: number) => {
      const k = Math.min(1, (ahora - t0) / DURACION);
      setCifra(Math.round(valor * suave(k)));
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame((t) => {
      setProp(objetivo);
      paso(t);
    });
    return () => cancelAnimationFrame(cuadro);
    // Una sola vez al entrar: los cambios posteriores solo actualizan el valor (rama de arriba).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, objetivo]);

  return (
    <div className="jv-anillo" role="img" aria-label={`${etiqueta}: ${valor}${meta > 0 ? ` de ${meta}` : ""}`}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true" focusable="false">
        <circle className="jv-anillo-pista" cx={tamano / 2} cy={tamano / 2} r={r} fill="none" strokeWidth={grosor} />
        <circle
          className="jv-anillo-arco"
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - prop)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
          style={{ stroke: color, filter: "drop-shadow(0 0 4px rgb(var(--c-gold-500) / 0.35))" }}
        />
      </svg>
      <span className="jv-anillo-cifra" aria-hidden="true">
        {cifra}
      </span>
      <span className="sr-only">{nota}</span>
    </div>
  );
}
