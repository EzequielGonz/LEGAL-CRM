"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogoutButton } from "@/components/acceso/logout-button";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { seccionActiva, seccionesDePerfil } from "@/lib/menu";
import type { MenuPersonal } from "@/lib/personalizacion/menu";
import { Icono } from "@/components/ui/icono-seccion";
import { LogoPerfil } from "@/components/ui/logo-perfil";
import { abrirAsistente } from "@/components/asistente/asistente-panel";
import { HojaMas } from "@/components/menu-mas";
import { SelectorModo } from "@/components/ui/selector-modo";

/**
 * Menú de los cuatro perfiles (renovado 18/10; 24/10: grupos «Trabajo» y
 * «Configurar», modo oscuro o claro), igual en todos los perfiles. Cambia la marca (logo, nombre y
 * color del acento). Las vistas de cada sección se eligen con las pestañas
 * de arriba del contenido. En pantallas chicas se pliega en una barra con
 * botón «Menú». Abajo, la Bandeja para Claude (tarjeta negra, 19/10) justo
 * arriba del asistente IA («Pedile algo», Gemini).
 */
const CLAVE_PLEGADO = "menu-plegado";

export function MenuPerfil({ slug, nombre, logo, menu = null }: { slug: SlugPerfil; nombre?: string | null; logo?: string | null; menu?: MenuPersonal | null }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const marca = marcaDe(slug);
  const secciones = seccionesDePerfil(slug, menu);
  const activa = seccionActiva(secciones, pathname, search?.toString() ?? null);
  const principales = secciones.filter((s) => s.grupo === "trabajo" && !s.oculta);
  const enMas = activa?.seccion.grupo === "mas";
  // 22/11: «Más» es una hoja (diálogo) en computadora y celular; ya no hay menú lateral desplegable en el celular.
  const [masAbierto, setMasAbierto] = useState(false);
  const botonMas = useRef<HTMLButtonElement | null>(null);
  // 13/11: en la computadora el menú se pliega a una barra de íconos. Se recuerda en el navegador.
  const [plegado, setPlegado] = useState(false);
  useEffect(() => {
    try {
      setPlegado(localStorage.getItem(CLAVE_PLEGADO) === "1");
    } catch {
      // sin almacenamiento: arranca desplegado
    }
  }, []);
  const plegar = () =>
    setPlegado((v) => {
      try {
        localStorage.setItem(CLAVE_PLEGADO, v ? "0" : "1");
      } catch {
        // no se recuerda, pero funciona
      }
      return !v;
    });
  const titulo = nombre?.trim() || marca.nombre;
  const logoUrl = logo?.trim() || marca.logo;

  useEffect(() => setMasAbierto(false), [pathname]);

  // 13/11: la opción activa es una píldora que se desliza. El menú se vuelve a montar al
  // cambiar de sección, así que la posición anterior se recuerda en la pestaña y la píldora
  // arranca desde ahí.
  const navRef = useRef<HTMLElement | null>(null);
  const pildoraRef = useRef<HTMLSpanElement | null>(null);
  const claveActiva = activa?.seccion.clave ?? null;
  const usarEfecto = typeof window === "undefined" ? useEffect : useLayoutEffect;
  usarEfecto(() => {
    const nav = navRef.current;
    const pildora = pildoraRef.current;
    const aside = nav?.closest<HTMLElement>("#menu-perfil");
    if (!nav || !pildora || !aside) return;
    const item = nav.querySelector<HTMLElement>('a.menu-item[aria-current="page"]');
    if (!item) {
      pildora.dataset.lista = "0";
      aside.dataset.pildora = "0";
      return;
    }
    const y = item.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
    const alto = item.offsetHeight;
    const CLAVE = `menu-pildora:${slug}`;
    let previa: { y: number; alto: number } | null = null;
    try {
      previa = JSON.parse(sessionStorage.getItem(CLAVE) ?? "null");
    } catch {
      previa = null;
    }
    const poner = (p: { y: number; alto: number }) => {
      pildora.style.transform = `translate3d(0, ${p.y}px, 0)`;
      pildora.style.height = `${p.alto}px`;
    };
    aside.dataset.pildora = "1";
    if (previa && typeof previa.y === "number" && Math.abs(previa.y - y) > 1 && pildora.dataset.lista !== "1") {
      pildora.dataset.animar = "0";
      poner(previa);
      pildora.dataset.lista = "1";
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          pildora.dataset.animar = "1";
          poner({ y, alto });
        })
      );
    } else {
      pildora.dataset.animar = pildora.dataset.lista === "1" ? "1" : "0";
      poner({ y, alto });
      pildora.dataset.lista = "1";
    }
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ y, alto }));
    } catch {
      // sin almacenamiento: la píldora aparece en su lugar, sin recorrido
    }
  }, [claveActiva, slug, secciones.length, plegado]);

  // Título de la pestaña del navegador: «Vista · Marca».
  const pantalla = activa ? (activa.seccion.tabs.length > 1 ? activa.tab.label : activa.seccion.label) : "Panel";
  useEffect(() => {
    document.title = `${pantalla} · ${titulo}`;
  }, [pantalla, titulo]);

  return (
    <>
      {/* Barra superior en teléfono y tablet: marca y Jarvis. Las secciones van abajo. */}
      <div data-no-inerte="" className="barra-movil sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoPerfil slug={slug} src={logoUrl} tamano="sm" />
          <p className="truncate text-sm font-semibold text-slate-950">{titulo}</p>
        </div>
        <button type="button" onClick={() => abrirAsistente()} className="tactil inline-flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100" aria-label="Abrir Jarvis">
          <Icono nombre="asistente" className="h-5 w-5 text-gold-600" />
        </button>
      </div>

      {/* 22/11: barra inferior del celular con los cinco destinos y «Más». La activa muestra su nombre. */}
      <nav aria-label="Secciones principales" className="barra-inferior lg:hidden">
        <ul>
          {principales.map((s) => {
            const esActiva = activa?.seccion.clave === s.clave;
            return (
              <li key={s.clave}>
                <Link href={s.href} aria-current={esActiva ? "page" : undefined} aria-label={s.label} className="barra-inferior-item">
                  <Icono nombre={s.icono} className="h-5 w-5 shrink-0" />
                  <span className="barra-inferior-nombre" aria-hidden="true">
                    {s.label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMasAbierto(true)} aria-haspopup="dialog" aria-expanded={masAbierto} aria-controls="hoja-mas" aria-label="Más secciones" data-activa={enMas ? "1" : undefined} className="barra-inferior-item">
              <Icono nombre="puntos" className="h-5 w-5 shrink-0" />
              <span className="barra-inferior-nombre" aria-hidden="true">
                Más
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <HojaMas abierto={masAbierto} alCerrar={() => setMasAbierto(false)} secciones={secciones.filter((s) => s.grupo === "mas" && !s.oculta)} activaClave={activa?.seccion.clave ?? null} slug={slug} plegado={plegado} />

      <aside
        id="menu-perfil"
        aria-label="Menú del perfil"
        data-plegado={plegado ? "1" : "0"}
        className="menu-estudio z-20 hidden h-screen w-[16rem] shrink-0 flex-col lg:sticky lg:top-0 lg:flex"
      >
        <Link href="/perfiles" className="menu-marca mx-3 mt-4 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50" title="Cambiar de perfil">
          <LogoPerfil slug={slug} src={logoUrl} tamano="sm" />
          <span className="menu-texto min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">{titulo}</span>
            <span className="block truncate text-xs text-slate-500">{marca.bajada}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={plegar}
          aria-expanded={!plegado}
          aria-controls="menu-perfil"
          aria-label={plegado ? "Desplegar el menú" : "Plegar el menú a íconos"}
          title={plegado ? "Desplegar el menú" : "Plegar el menú"}
          className="menu-plegar hidden lg:grid"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true" focusable="false">
            <path d="M14.5 6 8.5 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <nav ref={navRef} aria-label="Secciones del perfil" className="flex-1 overflow-y-auto px-3 py-4">
          <span ref={pildoraRef} aria-hidden="true" className="menu-pildora" />
          <ul className="space-y-0.5">
            {principales.map((s) => {
              const esActiva = activa?.seccion.clave === s.clave;
              return (
                <li key={s.clave}>
                  <Link href={s.href} aria-current={esActiva ? "page" : undefined} title={plegado ? s.label : undefined} className="menu-item flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium">
                    <Icono nombre={s.icono} className="h-[18px] w-[18px] shrink-0" />
                    <span className="menu-texto">{s.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                ref={botonMas}
                type="button"
                onClick={() => setMasAbierto((v) => !v)}
                aria-haspopup="dialog"
                aria-expanded={masAbierto}
                aria-controls="hoja-mas"
                data-activa={enMas ? "1" : undefined}
                title={plegado ? "Más" : undefined}
                className="menu-item menu-mas flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium"
              >
                <Icono nombre="puntos" className="h-[18px] w-[18px] shrink-0" />
                <span className="menu-texto">Más</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="menu-pie border-t border-slate-100 px-3 py-2">
          <Link href="/cerebro" prefetch={false} target="_blank" rel="noopener" title={plegado ? "Cerebro (se abre en una pestaña nueva)" : undefined} className="menu-item menu-pie-cerebro flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium">
            <Icono nombre="cerebro" className="h-[18px] w-[18px] shrink-0" />
            <span className="menu-texto">
              Cerebro<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </span>
          </Link>
          <div className="menu-texto">
            <SelectorModo />
            <Link href="/perfiles" className="block min-h-[2.75rem] content-center rounded-lg px-3 py-1.5 text-xs font-medium lg:min-h-0">
              Cambiar de perfil
            </Link>
            <LogoutButton className="block min-h-[2.75rem] w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium lg:min-h-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
