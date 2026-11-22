"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { SlugPerfil } from "@/lib/marca";
import type { ParteDelDia } from "@/lib/jarvis/parte";
import { EVENTO_ASISTENTE, type Propuesta } from "@/lib/asistente/eventos";
import { guardarAbierto, guardarParteCache, guardarUltimaVisita, leerParteCache, leerParteCerrado, leerUltimaVisita } from "@/components/jarvis/almacen";
import { OrbeVivo } from "@/components/jarvis/jv-orbe-vivo";
import "./jarvis.css";
import "./jarvis-vivo.css";

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
    <>
      <div className="jv-velo2" aria-hidden="true" />
      <div className="jv-modo jv-modo-cargando" aria-label="Jarvis">
        <p role="status" className="jv-modo-estado">
          Abriendo Jarvis…
        </p>
      </div>
    </>
  ),
});

/**
 * Jarvis (22/11, vuelta 6): el secretario del panel. Un orbe vivo flotante abajo a la derecha (respira,
 * brilla al pasar el mouse y muestra cuántas cosas esperan tu OK) abre el modo Jarvis inmersivo: vidrio
 * sobre el panel desenfocado, estado del día con gráficos, charla y acciones. Atajo Ctrl/Cmd+J; Esc cierra
 * y el foco vuelve a donde estaba. Todo lo que cambia algo pasa por «¿Lo hago?».
 */
export function Jarvis({ slug, nombrePerfil }: { slug: SlugPerfil; nombrePerfil: string }) {
  const pathname = usePathname() ?? "/";
  const [ruta, setRuta] = useState(pathname);
  const [abierto, setAbierto] = useState(false);
  const [encima, setEncima] = useState(false);
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

  const avisos = datosParte ? datosParte.parte.decisiones.length + datosParte.pendientes.length : 0;
  const hayAviso = !abierto && (avisos > 0 || (parteVisible && datosParte !== null));
  // Al acercarse al orbe se adelanta la descarga del modo Jarvis: al tocar ya está.
  const adelantar = () => void cargarHoja();
  const etiqueta = avisos > 0 ? `Abrir Jarvis, ${avisos} ${avisos === 1 ? "cosa espera" : "cosas esperan"} tu OK` : hayAviso ? "Abrir Jarvis, hay un parte del día para leer" : "Abrir Jarvis";

  return (
    <div>
      {!abierto && (
        <button
          ref={orbe}
          type="button"
          className="jv-orbe2"
          onClick={() => abrir()}
          onPointerEnter={() => {
            adelantar();
            setEncima(true);
          }}
          onPointerLeave={() => setEncima(false)}
          onFocus={() => {
            adelantar();
            setEncima(true);
          }}
          onBlur={() => setEncima(false)}
          onTouchStart={adelantar}
          aria-label={etiqueta}
          aria-keyshortcuts="Control+J Meta+J"
          title="Jarvis · Ctrl J"
        >
          <OrbeVivo tamano={68} brillo={encima ? 1 : 0} className="jv-orbe2-lienzo" />
          {avisos > 0 ? (
            <span className="jv-orbe2-cuenta" aria-hidden="true">
              {avisos > 9 ? "9+" : avisos}
            </span>
          ) : hayAviso ? (
            <span className="jv-orbe2-punto" aria-hidden="true" />
          ) : null}
          <span className="jv-orbe2-tip" aria-hidden="true">
            Jarvis <kbd>Ctrl J</kbd>
          </span>
        </button>
      )}
      {abierto && (
        <JarvisHoja
          slug={slug}
          nombrePerfil={nombrePerfil}
          ruta={ruta}
          pedido={pedido}
          datosParte={datosParte}
          alCerrar={cerrar}
          alLeerParte={() => setParteVisible(false)}
          alCambiarPendiente={(p) => setDatosParte((d) => (d ? { ...d, pendientes: d.pendientes.map((x) => (x.id === p.id ? p : x)) } : d))}
        />
      )}
    </div>
  );
}
