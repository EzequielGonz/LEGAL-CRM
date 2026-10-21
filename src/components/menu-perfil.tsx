"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { LogoutButton } from "@/components/acceso/logout-button";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { seccionActiva, seccionesDePerfil } from "@/lib/menu";
import { Icono } from "@/components/ui/icono-seccion";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { abrirAsistente } from "@/components/asistente/asistente-panel";

/**
 * Menú de los cuatro perfiles (renovado 18/10): barra clara con seis
 * secciones, iguales en todos los perfiles. Cambia la marca (logo, nombre y
 * color del acento). Las vistas de cada sección se eligen con las pestañas
 * de arriba del contenido. En pantallas chicas se pliega en una barra con
 * botón «Menú». Abajo, la Bandeja para Claude (tarjeta negra, 19/10) justo
 * arriba del asistente IA («Pedile algo», Gemini).
 */
export function MenuPerfil({ slug, nombre, logo }: { slug: SlugPerfil; nombre?: string | null; logo?: string | null }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const marca = marcaDe(slug);
  const secciones = seccionesDePerfil(slug);
  const activa = seccionActiva(secciones, pathname, search?.toString() ?? null);
  const [abierto, setAbierto] = useState(false);
  const titulo = nombre?.trim() || marca.nombre;
  const logoUrl = logo?.trim() || marca.logo;

  useEffect(() => setAbierto(false), [pathname]);

  // Título de la pestaña del navegador: «Vista · Marca».
  const pantalla = activa ? (activa.seccion.tabs.length > 1 ? activa.tab.label : activa.seccion.label) : "Panel";
  useEffect(() => {
    document.title = `${pantalla} · ${titulo}`;
  }, [pantalla, titulo]);

  return (
    <>
      {/* Barra superior en teléfono y tablet */}
      <div className="barra-movil sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoPerfil slug={slug} src={logoUrl} tamano="sm" />
          <p className="truncate text-sm font-semibold text-slate-950">{titulo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => abrirAsistente()} className="tactil inline-flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100" aria-label="Abrir el asistente">
            <Icono nombre="asistente" className="h-5 w-5 text-gold-600" />
          </button>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-perfil"
            className="tactil rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800"
          >
            {abierto ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {abierto && <div className="menu-velo lg:hidden" aria-hidden="true" onClick={() => setAbierto(false)} />}

      <aside
        id="menu-perfil"
        className={clsx(
          "menu-estudio z-20 flex h-screen w-[16rem] shrink-0 flex-col",
          "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:visible lg:translate-x-0",
          "transition-[transform,visibility] duration-300 ease-out",
          abierto ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <Link href="/perfiles" className="menu-marca mx-3 mt-4 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50" title="Cambiar de perfil">
          <LogoPerfil slug={slug} src={logoUrl} tamano="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">{titulo}</span>
            <span className="block truncate text-xs text-slate-500">{marca.bajada}</span>
          </span>
        </Link>

        <nav aria-label="Secciones del perfil" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {secciones.map((s) => {
              const esActiva = activa?.seccion.clave === s.clave;
              return (
                <li key={s.clave}>
                  <Link
                    href={s.href}
                    aria-current={esActiva ? "page" : undefined}
                    className="menu-item flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
                  >
                    <Icono nombre={s.icono} className="h-[18px] w-[18px] shrink-0" />
                    <span>{s.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <EntradaBandeja slug={slug} activa={pathname === "/bandeja"} />

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => abrirAsistente()}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-3 py-2.5 text-left text-sm font-medium text-slate-800 shadow-sm hover:border-slate-300"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-500/15 text-gold-700">
              <Icono nombre="asistente" className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block">Pedile algo</span>
              <span className="block truncate text-xs font-normal text-slate-500">Asistente del panel</span>
            </span>
          </button>
        </div>

        <div className="menu-pie border-t border-slate-100 px-3 py-2">
          <Link href="/perfiles" className="block rounded-lg px-3 py-1.5 text-xs font-medium">
            Cambiar de perfil
          </Link>
          <LogoutButton className="block w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium" />
        </div>
      </aside>
    </>
  );
}

/**
 * Bandeja para Claude, tarjeta negra arriba de «Pedile algo» (19/10). Lleva a
 * la pantalla donde se dejan tareas complejas para Claude. Si alguna quedó
 * «en espera», lo avisa con un punto y el número; también muestra cuántas
 * hay pendientes.
 */
function EntradaBandeja({ slug, activa }: { slug: SlugPerfil; activa: boolean }) {
  const [resumen, setResumen] = useState<{ pendiente: number; en_curso: number; en_espera: number } | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch("/api/bandeja-claude?resumen=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && d?.resumen && setResumen(d.resumen))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [slug]);
  const espera = resumen?.en_espera ?? 0;
  const abiertas = (resumen?.pendiente ?? 0) + (resumen?.en_curso ?? 0);
  const detalle = espera ? `${espera} en espera` : abiertas ? `${abiertas} abierta${abiertas === 1 ? "" : "s"}` : "Tareas para Claude";
  return (
    <div className="px-3 pb-2">
      <Link
        href={`/bandeja?perfil=${slug}`}
        aria-current={activa ? "page" : undefined}
        className={clsx(
          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium shadow-sm",
          activa ? "border-slate-500 bg-slate-950 text-white ring-2 ring-slate-400/60" : "border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
        )}
      >
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true" focusable="false">
            <path d="M4 13.5h4.5l1 2h5l1-2H20V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" fill="currentColor" fillOpacity=".14" />
            <path d="M4 13.5h4.5l1 2h5l1-2H20M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5M4 13.5 6 8.5M20 13.5l-2-5M12 3.5v8M9 8.5l3 3 3-3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {espera > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block">Bandeja para Claude</span>
          <span className={clsx("block truncate text-xs font-normal", espera ? "font-medium text-amber-300" : "text-slate-300")}>{detalle}</span>
        </span>
      </Link>
    </div>
  );
}
