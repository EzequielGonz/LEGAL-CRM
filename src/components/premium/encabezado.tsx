"use client";

import "@/app/premium-fondo.css";
import { useRef, type CSSProperties, type ReactNode } from "react";
import type { SlugPerfil } from "@/lib/marca";
import { claseRubro } from "@/lib/premium/rubros";
import { useParalaje } from "./use-paralaje";

export interface EncabezadoProps {
  titulo: string;
  subtitulo?: string;
  /** Rubro: tiñe las formas del encabezado con su acento. */
  rubro?: SlugPerfil;
  /** Acciones o pastillas a la derecha del texto. */
  children?: ReactNode;
  /** Nivel del título (por defecto 1). */
  nivel?: 1 | 2;
}

const capa = (k: number) => ({ "--pm-k": k }) as CSSProperties;

/**
 * Encabezado de pantalla con parallax en tres capas: fondo (degradé), formas (esferas de vidrio) y texto,
 * cada una a distinta velocidad con el scroll y el puntero. Sutil: nada se mueve más de 24 px.
 */
export function Encabezado({ titulo, subtitulo, rubro, children, nivel = 1 }: EncabezadoProps) {
  const raiz = useRef<HTMLElement>(null);
  useParalaje(raiz);
  const Titulo = `h${nivel}` as "h1" | "h2";
  return (
    <header ref={raiz} className={`pm-encabezado${rubro ? ` ${claseRubro(rubro)}` : ""}`}>
      <span className="pm-encabezado__capa pm-encabezado__capa--fondo" style={capa(6)} aria-hidden="true">
        <span className="pm-encabezado__degrade" />
      </span>
      <span className="pm-encabezado__capa pm-encabezado__capa--formas" style={capa(18)} aria-hidden="true">
        <span className="pm-encabezado__esfera pm-encabezado__esfera--a" />
        <span className="pm-encabezado__esfera pm-encabezado__esfera--b" />
        <span className="pm-encabezado__esfera pm-encabezado__esfera--c" />
      </span>
      <div className="pm-encabezado__capa pm-encabezado__capa--texto" style={capa(3)}>
        <div className="pm-encabezado__texto">
          <Titulo className="pm-titulo-pantalla">{titulo}</Titulo>
          {subtitulo ? <p className="pm-subtitulo">{subtitulo}</p> : null}
        </div>
        {children ? <div className="pm-encabezado__acciones">{children}</div> : null}
      </div>
    </header>
  );
}
