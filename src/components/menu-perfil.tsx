"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogoutButton } from "@/components/acceso/logout-button";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { itemActivo, menuDePerfil } from "@/lib/menu";
import { IconoSeccion } from "@/components/ui/icono-seccion";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { SelectorNivel } from "@/components/nivel/nivel";

/**
 * Menú unificado de los cuatro perfiles (16/10). Misma estructura y
 * comportamiento en todos; cambia la marca (logo, nombre) y la paleta, que
 * llega por `data-tema` del contenedor. En pantallas chicas se pliega en una
 * barra superior con botón «Menú».
 */
export function MenuPerfil({ slug, nombre, logo }: { slug: SlugPerfil; nombre?: string | null; logo?: string | null }) {
  const pathname = usePathname() ?? "/";
  const marca = marcaDe(slug);
  const grupos = menuDePerfil(slug);
  const activo = itemActivo(grupos, pathname);
  const [abierto, setAbierto] = useState(false);
  const titulo = nombre?.trim() || marca.nombre;
  // Fuente única: lo que resolvió el servidor (Configuración → original).
  const logoUrl = logo?.trim() || marca.logo;

  useEffect(() => setAbierto(false), [pathname]);

  // Título de la pestaña «Pantalla · Marca» (rediseño 17/10, bloque 2).
  const pantalla = grupos.flatMap((g) => g.items).find((it) => it.href === activo)?.label ?? "Panel";
  useEffect(() => {
    document.title = `${pantalla} · ${titulo}`;
  }, [pantalla, titulo]);

  const Logo = <LogoPerfil slug={slug} src={logoUrl} tamano="sm" />;

  return (
    <>
      {/* Barra superior en teléfono y tablet */}
      <div className="barra-movil sticky top-0 z-30 flex items-center justify-between gap-2 bg-slate-950 px-3 py-3 sm:px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          {Logo}
          <p className="hidden truncate font-serif text-sm font-semibold text-gold-100 min-[420px]:block">{titulo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <SelectorNivel oscuro />
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-perfil"
          className="tactil rounded-lg border border-white/15 px-3 text-sm font-medium text-gold-100"
        >
          {abierto ? "Cerrar" : "Menú"}
        </button>
        </div>
      </div>

      {abierto && <div className="menu-velo lg:hidden" aria-hidden="true" onClick={() => setAbierto(false)} />}

      <aside
        id="menu-perfil"
        className={clsx(
          "menu-estudio z-20 flex h-screen w-[17rem] shrink-0 flex-col bg-slate-950",
          "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:visible lg:translate-x-0",
          "transition-[transform,visibility] duration-300 ease-out",
          abierto ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <div className="menu-marca mx-3 mt-3 flex items-center gap-3 rounded-2xl px-3 py-3">
          {Logo}
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-semibold tracking-wide text-gold-100">{titulo}</p>
            <p className="truncate text-xs uppercase tracking-[0.14em] text-slate-400">{marca.bajada}</p>
          </div>
        </div>

        <nav aria-label="Secciones del perfil" className="flex-1 overflow-y-auto px-3 py-4">
          {grupos.map((g) => (
            <div key={g.titulo} className="mb-4">
              <p className="flex items-center gap-2 px-3 pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span>{g.titulo}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
              </p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const esActivo = item.href === activo;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={esActivo ? "page" : undefined}
                        className={clsx(
                          "menu-item group relative flex items-center gap-3 rounded-[10px] px-3 py-[0.5625rem] text-[13.5px] font-medium transition-[background-color,color,transform] duration-200",
                          esActivo
                            ? "menu-activo text-gold-100"
                            : "text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-gold-100"
                        )}
                      >
                        <span
                          className={clsx(
                            "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400 transition-opacity duration-200",
                            esActivo ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                          )}
                        />
                        <IconoSeccion href={item.href} className={clsx("ml-1 h-[18px] w-[18px] shrink-0 transition-opacity", esActivo ? "opacity-100 text-gold-300" : "opacity-60 group-hover:opacity-100")} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="menu-pie border-t border-white/[0.07] px-3 py-2">
          <Link
            href="/perfiles"
            className="block rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-gold-100"
          >
            ← Elegir otro perfil
          </Link>
          <Link
            href="/inicio"
            className="block rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-gold-100"
          >
            ← Teléfono o computadora
          </Link>
          <LogoutButton className="block w-full rounded-lg px-3 py-1.5 text-left text-xs hover:bg-white/5" />
        </div>
      </aside>
    </>
  );
}
