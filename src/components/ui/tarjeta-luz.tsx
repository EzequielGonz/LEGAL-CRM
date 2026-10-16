"use client";

import Link from "next/link";

/**
 * Tarjeta de entrada con foco de luz que sigue al puntero (solo decorativo:
 * el enlace funciona igual con teclado y sin movimiento). Los estilos viven
 * en premium.css (`.tarjeta-luz`).
 */
export function TarjetaLuz({
  href,
  className = "",
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={style}
      className={`tarjeta-luz ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </Link>
  );
}
