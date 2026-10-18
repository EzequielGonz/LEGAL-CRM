"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { seccionActiva, seccionesDePerfil } from "@/lib/menu";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { Icono } from "@/components/ui/icono-seccion";
import { abrirAsistente } from "@/components/asistente/asistente-panel";

/**
 * Franja superior del panel (renovada 18/10): dónde se está (perfil ›
 * sección), la fecha y el acceso al asistente. La ruta es solo orientación
 * visual: el menú ya marca la página actual para el lector de pantalla.
 */
export function EncabezadoPanel({ slug, nombre }: { slug: SlugPerfil; nombre?: string | null }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const activa = seccionActiva(seccionesDePerfil(slug), pathname, search?.toString() ?? null);
  const marca = marcaDe(slug);
  const titulo = nombre?.trim() || marca.nombre;
  const hoy = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

  return (
    <div className="encabezado-panel">
      <div className="encabezado-ruta" aria-hidden="true">
        <span className="encabezado-perfil">{titulo}</span>
        {activa && <span className="encabezado-sep">/</span>}
        {activa && <span className="encabezado-seccion">{activa.seccion.label}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="encabezado-fecha" aria-hidden="true" suppressHydrationWarning>
          {hoy}
        </span>
        <button
          type="button"
          onClick={() => abrirAsistente()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-950"
        >
          <Icono nombre="asistente" className="h-4 w-4 text-gold-600" />
          Pedile algo
        </button>
      </div>
    </div>
  );
}

/** Pestañas de la sección actual: las vistas que agrupa (18/10). */
export function PestanasSeccion({ slug }: { slug: SlugPerfil }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const activa = seccionActiva(seccionesDePerfil(slug), pathname, search?.toString() ?? null);
  if (!activa || activa.seccion.tabs.length < 2) return null;
  return (
    <nav aria-label={`Vistas de ${activa.seccion.label}`} className="pestanas-seccion">
      {activa.seccion.tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.href === activa.tab.href ? "page" : undefined} className="pestana">
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
