import Link from "next/link";

/**
 * Tarjeta de entrada con perspectiva y luz que sigue al puntero (la mueve
 * efectos-3d.tsx por `data-3d`; solo decorativo: el enlace funciona igual
 * con teclado y sin movimiento).
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
      data-3d="fuerte"
      className={`tarjeta-luz ${className}`}
    >
      {children}
    </Link>
  );
}
