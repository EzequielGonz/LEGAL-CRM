"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { SlugPerfil } from "@/lib/marca";
import type { ParteDelDia } from "@/lib/jarvis/parte";
import { EVENTO_ASISTENTE, type Propuesta } from "@/lib/asistente/eventos";
import { Icono } from "@/components/ui/icono-seccion";
import { guardarAbierto, guardarParteCache, guardarUltimaVisita, leerAbierto, leerParteCache, leerParteCerrado, leerUltimaVisita } from "@/components/jarvis/almacen";
import "./jarvis.css";

export interface DatosParte {
  parte: ParteDelDia;
  pendientes: Propuesta[];
  otrasEnAsistente: number;
}

/**
 * La hoja (charla, acciones rápidas, historial, voz) pesa casi todo el código de Jarvis: se baja recién la
 * primera vez que se abre. El orbe, el atajo y el aviso del parte quedan livianos en cada pantalla.
 */
const cargarHoja = () => import("@/components/jarvis/jarvis-hoja").then((m) => m.JarvisHoja);
const JarvisHoja = dynamic(cargarHoja, {
  ssr: false,
  loading: () => (
    <aside className="jv-hoja jv-hoja-cargando" aria-label="Jarvis">
      <p role="status" className="jv-inicio-texto">
        Abriendo Jarvis…
      </p>
    </aside>
  ),
});

/**
 * Jarvis (22/11): el secretario del panel. Un orbe flotante abajo a la derecha abre una hoja de vidrio con la
 * charla, las acciones rápidas de la pantalla, el historial de lo confirmado hoy y el parte del día. Atajo
 * Ctrl/Cmd+J. Todo lo que cambia algo (incluso lanzar, publicar o responder) pasa por «¿Lo hago?».
 */
export function Jarvis({ slug, nombrePerfil }: { slug: SlugPerfil; nombrePerfil: string }) {
  const pathname = usePathname() ?? "/";
  const [ruta, setRuta] = useState(pathname);
  const [abierto, setAbierto] = useState(false);
  const [modal, setModal] = useState(false);
  const [pedido, setPedido] = useState<{ texto: string; n: number } | null>(null);
  const [datosParte, setDatosParte] = useState<DatosParte | null>(null);
  const [parteVisible, setParteVisible] = useState(false);
  // Foco: al abrir se guarda dónde estaba; al cerrar vuelve ahí o al orbe (WCAG 2.4.3).
  const previo = useRef<HTMLElement | null>(null);
  const orbe = useRef<HTMLButtonElement>(null);
  const devolverFoco = useCallback(() => {
    window.setTimeout(() => {
      const p = previo.current;
      if (p && p.isConnected && p !== document.body) p.focus();
      else orbe.current?.focus();
    }, 60);
  }, []);
  const cerrar = useCallback(() => {
    setAbierto(false);
    guardarAbierto(false);
    devolverFoco();
  }, [devolverFoco]);

  // ---- arranque: pantalla chica (hoja a pantalla completa) y si estaba abierta
  useEffect(() => {
    const m = window.matchMedia("(max-width: 1023px)");
    setModal(m.matches);
    const alCambiar = (e: MediaQueryListEvent) => setModal(e.matches);
    m.addEventListener("change", alCambiar);
    if (!m.matches && leerAbierto()) setAbierto(true);
    return () => m.removeEventListener("change", alCambiar);
  }, []);

  useEffect(() => {
    setRuta(`${pathname}${window.location.search}`);
  }, [pathname]);

  // ---- abrir: orbe, atajo y pedidos de otras partes del panel (botones «Preguntale al asistente»)
  const abrir = useCallback((texto?: string | null) => {
    if (document.activeElement instanceof HTMLElement) previo.current = document.activeElement;
    setAbierto(true);
    guardarAbierto(true);
    if (texto) setPedido((p) => ({ texto, n: (p?.n ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    const alEvento = (e: Event) => abrir((e as CustomEvent<string | null>).detail);
    const alTeclado = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAbierto((a) => {
          guardarAbierto(!a);
          if (!a) {
            if (document.activeElement instanceof HTMLElement) previo.current = document.activeElement;
          } else devolverFoco();
          return !a;
        });
      }
    };
    window.addEventListener(EVENTO_ASISTENTE, alEvento);
    window.addEventListener("keydown", alTeclado);
    return () => {
      window.removeEventListener(EVENTO_ASISTENTE, alEvento);
      window.removeEventListener("keydown", alTeclado);
    };
  }, [abrir, devolverFoco]);

  // ---- parte del día: se pide solo una vez por sesión (10 min) y se muestra una vez por día
  useEffect(() => {
    let vivo = true;
    const mostrar = (d: DatosParte) => {
      if (!vivo) return;
      setDatosParte(d);
      setParteVisible(leerParteCerrado(slug) !== d.parte.dia);
    };
    const enCache = leerParteCache(slug, Date.now()) as DatosParte | null;
    if (enCache) {
      mostrar(enCache);
      return () => {
        vivo = false;
      };
    }
    const t = window.setTimeout(async () => {
      try {
        const desde = leerUltimaVisita(slug);
        const res = await fetch(`/api/jarvis/parte?perfil=${slug}${desde ? `&desde=${encodeURIComponent(desde)}` : ""}`);
        if (!res.ok) return;
        const d = (await res.json()) as DatosParte;
        guardarParteCache(slug, d, Date.now());
        guardarUltimaVisita(slug, new Date().toISOString());
        mostrar(d);
      } catch {
        /* sin parte: Jarvis anda igual */
      }
    }, 1200);
    return () => {
      vivo = false;
      window.clearTimeout(t);
    };
  }, [slug]);

  const hayAviso = !abierto && parteVisible && datosParte !== null;
  // Al acercarse al orbe se adelanta la descarga de la hoja: al tocar ya está.
  const adelantar = () => void cargarHoja();

  return (
    <div>
      {!abierto && (
        <button
          ref={orbe}
          type="button"
          className="jv-orbe"
          onClick={() => abrir()}
          onPointerEnter={adelantar}
          onFocus={adelantar}
          onTouchStart={adelantar}
          aria-label={hayAviso ? "Abrir Jarvis, hay un parte del día para leer" : "Abrir Jarvis"}
          aria-keyshortcuts="Control+J Meta+J"
          title="Jarvis · Ctrl J"
        >
          <span className="jv-orbe-pulso" aria-hidden="true" />
          <span className="jv-orbe-cuerpo" aria-hidden="true">
            <Icono nombre="asistente" className="jv-orbe-icono" />
          </span>
          {hayAviso && <span className="jv-orbe-aviso" aria-hidden="true" />}
        </button>
      )}
      {abierto && (
        <JarvisHoja
          slug={slug}
          nombrePerfil={nombrePerfil}
          ruta={ruta}
          modal={modal}
          pedido={pedido}
          datosParte={datosParte}
          parteVisible={parteVisible}
          alCerrar={cerrar}
          alCerrarParte={() => setParteVisible(false)}
          alCambiarPendiente={(p) => setDatosParte((d) => (d ? { ...d, pendientes: d.pendientes.map((x) => (x.id === p.id ? p : x)) } : d))}
        />
      )}
    </div>
  );
}
