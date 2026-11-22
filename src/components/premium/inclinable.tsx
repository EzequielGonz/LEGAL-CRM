"use client";

import type React from "react";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useInclinacion } from "./use-inclinacion";

/** Contenedor con inclinación 3D (usa `useInclinacion`). Lo usa `Tarjeta relieve`; también sirve suelto. */
export function Inclinable({
  como = "div",
  className,
  style,
  max,
  children,
}: {
  como?: "div" | "section" | "article" | "li";
  className?: string;
  style?: CSSProperties;
  max?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useInclinacion(ref, { max });
  const Caja = como as "div";
  const ref2 = ref as React.RefObject<HTMLDivElement | null>;
  return (
    <Caja ref={ref2} className={className} style={style}>
      {children}
    </Caja>
  );
}
