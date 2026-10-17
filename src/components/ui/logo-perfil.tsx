"use client";

import { useState } from "react";
import { marcaDe, type SlugPerfil } from "@/lib/marca";

/**
 * Logo de un perfil sobre su placa negra (pedido de la responsable, 17/10).
 * Una sola pieza para menú, selector de perfiles y Teléfono: la imagen se
 * muestra tal cual (sin filtros ni deformación, `object-contain`) y, si es
 * el logo original, con la escala óptica de `MARCAS` para que los cuatro se
 * vean del mismo tamaño. Si la imagen no carga, queda la inicial del nombre.
 */
export function LogoPerfil({
  slug,
  src,
  alt = "",
  tamano = "md",
  className = "",
}: {
  slug: SlugPerfil;
  src?: string | null;
  alt?: string;
  tamano?: "sm" | "md" | "lg";
  className?: string;
}) {
  const marca = marcaDe(slug);
  const url = src?.trim() || marca.logo;
  const original = url === marca.logo;
  const [fallo, setFallo] = useState(false);
  return (
    <span className={`placa-logo placa-logo-${tamano} ${className}`} data-perfil={slug}>
      {fallo ? (
        <span className="placa-logo-inicial" aria-hidden={alt ? undefined : true}>
          {marca.nombre.charAt(0)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          width={128}
          height={128}
          decoding="async"
          style={original && marca.escalaOptica !== 1 ? { transform: `scale(${marca.escalaOptica})` } : undefined}
          onError={() => setFallo(true)}
        />
      )}
    </span>
  );
}
