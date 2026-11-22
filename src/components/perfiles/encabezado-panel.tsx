"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { seccionActiva, seccionesDePerfil } from "@/lib/menu";
import { esPantallaMas } from "@/lib/mas-pantallas";
import "@/app/mas-premium.css";
import type { MenuPersonal } from "@/lib/personalizacion/menu";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { Icono } from "@/components/ui/icono-seccion";
import { abrirAsistente } from "@/components/asistente/asistente-panel";

/**
 * Franja superior del panel (renovada 18/10): dónde se está (perfil ›
 * sección), la fecha y el acceso al asistente. La ruta es solo orientación
 * visual: el menú ya marca la página actual para el lector de pantalla.
 */
export function EncabezadoPanel({ slug, nombre, menu = null }: { slug: SlugPerfil; nombre?: string | null; menu?: MenuPersonal | null }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const activa = seccionActiva(seccionesDePerfil(slug, menu), pathname, search?.toString() ?? null);
  const marca = marcaDe(slug);
  const titulo = nombre?.trim() || marca.nombre;
  // 22/11 (hidratación): la fecha se arma en el navegador, después de hidratar. En el servidor queda vacía,
  // así el HTML nunca difiere (antes, cruzar la medianoche entre servidor y cliente daba el error #418).
  const [hoy, setHoy] = useState("");
  useEffect(() => {
    setHoy(new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()));
  }, []);
  // 13/11 · cada rubro separado: la pestaña del navegador dice primero en qué perfil se está.
  const vista = activa?.tab.label ?? activa?.seccion.label ?? null;
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.title = vista ? `${titulo} · ${vista}` : titulo;
    }, 0);
    return () => window.clearTimeout(t);
  }, [titulo, vista, pathname]);

  return (
    <div className="encabezado-panel" data-mas={esPantallaMas(activa?.seccion.grupo, activa?.seccion.clave, activa?.tab.label, pathname) ? "1" : undefined}>
      <div className="encabezado-ruta" aria-hidden="true">
        <span className="encabezado-perfil">{titulo}</span>
        {activa && <span className="encabezado-sep">/</span>}
        {activa && <span className="encabezado-seccion">{activa.seccion.label}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="encabezado-fecha" aria-hidden="true">
          {hoy}
        </span>
        <button
          type="button"
          onClick={() => abrirAsistente()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-950"
        >
          <Icono nombre="asistente" className="h-4 w-4 text-gold-600" />
          Hablar con Jarvis
        </button>
      </div>
    </div>
  );
}

/** Pestañas de la sección actual: las vistas que agrupa (18/10). */
export function PestanasSeccion({ slug, menu = null }: { slug: SlugPerfil; menu?: MenuPersonal | null }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams();
  const activa = seccionActiva(seccionesDePerfil(slug, menu), pathname, search?.toString() ?? null);
  const visibles = activa ? activa.seccion.tabs.filter((t) => !t.oculto) : [];
  // 12/11: en el celular la pestaña en la que estás queda a la vista (antes podía quedar cortada).
  const riel = useRef<HTMLElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const hrefActivo = activa?.tab.href ?? null;
  useEffect(() => {
    const actual = riel.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (actual && riel.current) riel.current.scrollLeft = Math.max(0, actual.offsetLeft - 16);
  }, [hrefActivo]);
  // 22/11 (lista del 20/11, punto i): si hay más pestañas a un costado, el borde se desvanece y
  // aparece una flecha que las trae (antes se cortaban sin ninguna señal de deslizar).
  useEffect(() => {
    const nav = riel.current;
    const c = caja.current;
    if (!nav || !c) return;
    const marcar = () => {
      const izq = nav.scrollLeft > 4;
      const der = nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4;
      c.toggleAttribute("data-mas-izquierda", izq);
      c.toggleAttribute("data-mas-derecha", der);
    };
    marcar();
    nav.addEventListener("scroll", marcar, { passive: true });
    window.addEventListener("resize", marcar);
    return () => {
      nav.removeEventListener("scroll", marcar);
      window.removeEventListener("resize", marcar);
    };
  }, [hrefActivo, visibles.length]);
  const correr = (lado: 1 | -1) => {
    const nav = riel.current;
    if (!nav) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollBy({ left: lado * Math.round(nav.clientWidth * 0.7), behavior: quieto ? "auto" : "smooth" });
  };
  if (!activa || visibles.length < 2) return null;
  return (
    <div ref={caja} className="pestanas-riel" data-sin-entrada="">
      <nav ref={riel} aria-label={`Vistas de ${activa.seccion.label}`} className="pestanas-seccion">
        {visibles.map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.href === activa.tab.href ? "page" : undefined} className="pestana">
            {t.label}
          </Link>
        ))}
      </nav>
      {/* Las flechas son una ayuda para el dedo y el mouse; con teclado se recorren las pestañas con Tab. */}
      <button type="button" className="pestanas-flecha" data-lado="izq" tabIndex={-1} aria-hidden="true" onClick={() => correr(-1)}>
        ‹
      </button>
      <button type="button" className="pestanas-flecha" data-lado="der" tabIndex={-1} aria-hidden="true" onClick={() => correr(1)}>
        ›
      </button>
    </div>
  );
}
