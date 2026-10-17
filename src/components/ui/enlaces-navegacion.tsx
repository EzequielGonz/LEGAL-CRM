"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { conVolver, etiquetaVolver, volverSeguro } from "@/lib/navegacion";

/** Dirección actual completa (ruta + consulta), para usarla como origen. */
export function useDireccionActual(): string {
  const ruta = usePathname() ?? "/";
  const query = useSearchParams()?.toString() ?? "";
  return query ? `${ruta}?${query}` : ruta;
}

/**
 * Enlace a un detalle (ficha, conversación) que guarda el origen exacto:
 * al volver se recuperan la lista, sus filtros, el orden y la página.
 */
export function EnlaceDetalle({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const aqui = useDireccionActual();
  return (
    <Link href={conVolver(href, aqui)} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/** «← Volver a …» con el texto según el destino. Sin origen, usa el respaldo. */
export function EnlaceVolver({
  volver,
  respaldo,
  textoRespaldo,
  className = "tactil inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline",
}: {
  volver: string | null | undefined;
  respaldo: string;
  textoRespaldo?: string;
  className?: string;
}) {
  const destino = volverSeguro(volver);
  const texto = destino ? etiquetaVolver(destino) : textoRespaldo ?? etiquetaVolver(respaldo);
  return (
    <Link href={destino ?? respaldo} className={className}>
      <span aria-hidden="true">←</span> {texto}
    </Link>
  );
}
