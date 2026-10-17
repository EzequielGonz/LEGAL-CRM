import Link from "next/link";

/**
 * Tarjeta de acceso de las pantallas de entrada: superficie translúcida que
 * al pasar o enfocar solo cambia el borde (bloque 4: sin 3D ni luz al cursor).
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
    >
      {children}
    </Link>
  );
}
