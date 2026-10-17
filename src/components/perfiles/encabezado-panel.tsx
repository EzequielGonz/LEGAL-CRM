"use client";

import { usePathname } from "next/navigation";
import { itemActivo, menuDePerfil } from "@/lib/menu";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { IconoSeccion } from "@/components/ui/icono-seccion";
import { SelectorNivel } from "@/components/nivel/nivel";

/**
 * Franja superior del panel (diseño «estudio», 16/10): ubica dónde se está
 * (grupo › sección del mismo menú), el perfil y la fecha. La ruta es solo
 * orientación visual (oculta al lector: el menú ya marca la página actual).
 * A la derecha, siempre en el mismo lugar, el selector Simple / Avanzado.
 */
export function EncabezadoPanel({ slug, nombre }: { slug: SlugPerfil; nombre?: string | null }) {
  const pathname = usePathname() ?? "/";
  const grupos = menuDePerfil(slug);
  const activo = itemActivo(grupos, pathname);
  let grupo: string | null = null;
  let seccion: string | null = null;
  for (const g of grupos) {
    const it = g.items.find((i) => i.href === activo);
    if (it) {
      grupo = g.titulo;
      seccion = it.label;
      break;
    }
  }
  const marca = marcaDe(slug);
  const titulo = nombre?.trim() || marca.nombre;
  const hoy = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="encabezado-panel">
      <div className="encabezado-ruta" aria-hidden="true">
        {activo && (
          <span className="encabezado-icono">
            <IconoSeccion href={activo} className="h-4 w-4" />
          </span>
        )}
        <span className="encabezado-perfil">{titulo}</span>
        {grupo && <span className="encabezado-sep">/</span>}
        {grupo && <span className="encabezado-grupo">{grupo}</span>}
        {seccion && <span className="encabezado-sep">/</span>}
        {seccion && <span className="encabezado-seccion">{seccion}</span>}
      </div>
      <div className="flex items-center gap-4">
        <span className="encabezado-fecha" aria-hidden="true" suppressHydrationWarning>
          {hoy}
        </span>
        <SelectorNivel />
      </div>
    </div>
  );
}
