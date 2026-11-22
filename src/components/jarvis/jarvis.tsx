"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SlugPerfil } from "@/lib/marca";
import { pantallaDeRuta, sugerenciasDe } from "@/lib/jarvis/pantallas";
import type { ParteDelDia } from "@/lib/jarvis/parte";
import { EVENTO_ASISTENTE, type Propuesta } from "@/components/asistente/asistente-panel";
import { useDialogo } from "@/components/ui/use-dialogo";
import { Icono } from "@/components/ui/icono-seccion";
import { guardarAbierto, guardarCharla, guardarParteCache, guardarParteCerrado, guardarUltimaVisita, leerAbierto, leerCharla, leerParteCache, leerParteCerrado, leerUltimaVisita, type MensajeJarvis } from "@/components/jarvis/almacen";
import { JvConfirmar } from "@/components/jarvis/jv-confirmar";
import { JvParte } from "@/components/jarvis/jv-parte";
import "./jarvis.css";

interface DatosParte {
  parte: ParteDelDia;
  pendientes: Propuesta[];
  otrasEnAsistente: number;
}

/** Web Speech API (sin servicios pagos): solo si el navegador la trae. */
type Reconocedor = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
function crearReconocedor(): Reconocedor | null {
  if (typeof window === "undefined") return null;
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return C ? (new C() as Reconocedor) : null;
}

/**
 * Jarvis (22/11): el secretario del panel. Un orbe flotante abajo a la derecha
 * abre una hoja de vidrio con la charla, las sugerencias de la pantalla y el
 * parte del día. Atajo Ctrl/Cmd+J. La charla se recuerda al cambiar de
 * pantalla (por perfil). No lanza campañas, no publica y no le escribe a
 * nadie; todo lo que cambia algo lleva «¿Lo hago?».
 */
export function Jarvis({ slug, nombrePerfil }: { slug: SlugPerfil; nombrePerfil: string }) {
  const pathname = usePathname() ?? "/";
  const [ruta, setRuta] = useState(pathname);
  const [abierto, setAbierto] = useState(false);
  const [modal, setModal] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeJarvis[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [listo, setListo] = useState(false);
  const [datosParte, setDatosParte] = useState<DatosParte | null>(null);
  const [parteVisible, setParteVisible] = useState(false);
  const [vozOk, setVozOk] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const reconocedor = useRef<Reconocedor | null>(null);
  const panel = useRef<HTMLElement | null>(null);
  const cerrar = useCallback(() => {
    setAbierto(false);
    guardarAbierto(false);
  }, []);
  // En el celular la hoja ocupa toda la pantalla (diálogo modal); en escritorio queda al costado y el panel sigue usable.
  const dialogoRef = useDialogo<HTMLElement>(abierto && modal, cerrar);

  const { pantalla } = pantallaDeRuta(ruta);
  const sugerencias = sugerenciasDe(pantalla, nombrePerfil);
  const hrefChats = slug === "juridico" ? "/inbox" : `/panel/${slug}/chats`;

  // ---- arranque: lo que se recuerda y lo que el navegador permite
  useEffect(() => {
    setMensajes(leerCharla(slug));
    const m = window.matchMedia("(max-width: 1023px)");
    setModal(m.matches);
    const alCambiar = (e: MediaQueryListEvent) => setModal(e.matches);
    m.addEventListener("change", alCambiar);
    if (!m.matches && leerAbierto()) setAbierto(true);
    setVozOk(crearReconocedor() !== null);
    setListo(true);
    return () => m.removeEventListener("change", alCambiar);
  }, [slug]);

  useEffect(() => {
    setRuta(`${pathname}${window.location.search}`);
  }, [pathname]);

  useEffect(() => {
    if (listo) guardarCharla(slug, mensajes);
  }, [mensajes, listo, slug]);

  // ---- abrir: orbe, atajo y pedidos de otras partes del panel (botones «Preguntale al asistente»)
  const abrir = useCallback((pedido?: string | null) => {
    setAbierto(true);
    guardarAbierto(true);
    if (pedido) setTexto(pedido);
    window.setTimeout(() => entrada.current?.focus(), 60);
  }, []);

  useEffect(() => {
    const alEvento = (e: Event) => abrir((e as CustomEvent<string | null>).detail);
    const alTeclado = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAbierto((a) => {
          guardarAbierto(!a);
          if (!a) window.setTimeout(() => entrada.current?.focus(), 60);
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
  }, [abrir]);

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

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [mensajes, pensando, abierto]);

  // ---- enviar
  const enviar = useCallback(
    async (contenido: string) => {
      const limpio = contenido.trim();
      if (!limpio || pensando) return;
      const historial: MensajeJarvis[] = [...mensajes, { rol: "usuario", texto: limpio }];
      setMensajes(historial);
      setTexto("");
      setPensando(true);
      try {
        const res = await fetch("/api/jarvis/mensaje", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ perfil: slug, ruta, mensajes: historial.filter((m) => !m.error).map((m) => ({ rol: m.rol === "jarvis" ? "asistente" : "usuario", texto: m.texto })) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "No pude responder.");
        setMensajes((m) => [...m, { rol: "jarvis", texto: data.texto, propuestas: data.propuestas ?? [], enlaces: data.enlaces ?? [], borradores: data.borradores ?? [] }]);
      } catch (e) {
        setMensajes((m) => [...m, { rol: "jarvis", texto: (e as Error).message, error: true }]);
      } finally {
        setPensando(false);
      }
    },
    [mensajes, pensando, slug, ruta]
  );

  const cambiarPropuesta = (i: number, p: Propuesta) => setMensajes((ms) => ms.map((m, k) => (k === i ? { ...m, propuestas: (m.propuestas ?? []).map((x) => (x.id === p.id ? p : x)) } : m)));
  const cambiarPendiente = (p: Propuesta) => setDatosParte((d) => (d ? { ...d, pendientes: d.pendientes.map((x) => (x.id === p.id ? p : x)) } : d));

  const alNavegar = () => {
    if (modal) cerrar();
  };

  async function copiar(textoBorrador: string) {
    try {
      await navigator.clipboard.writeText(textoBorrador);
      setCopiado(textoBorrador);
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* el navegador no deja copiar: la persona puede seleccionar el texto */
    }
  }

  // ---- voz
  function alternarVoz() {
    if (escuchando) {
      reconocedor.current?.stop();
      return;
    }
    const r = crearReconocedor();
    if (!r) return;
    reconocedor.current = r;
    r.lang = "es-AR";
    r.interimResults = true;
    r.continuous = false;
    const base = texto ? `${texto} ` : "";
    r.onresult = (e: any) => {
      let dicho = "";
      for (let i = 0; i < e.results.length; i++) dicho += e.results[i][0].transcript;
      setTexto(`${base}${dicho}`.trimStart());
    };
    r.onend = () => setEscuchando(false);
    r.onerror = () => setEscuchando(false);
    try {
      r.start();
      setEscuchando(true);
    } catch {
      setEscuchando(false);
    }
  }

  const hayAviso = !abierto && parteVisible && datosParte !== null;

  return (
    <div>
      {!abierto && (
        <button type="button" className="jv-orbe" onClick={() => abrir()} aria-label="Abrir Jarvis" aria-keyshortcuts="Control+J Meta+J" title="Jarvis · Ctrl J">
          <span className="jv-orbe-esfera" aria-hidden="true">
            <Icono nombre="asistente" />
          </span>
          {hayAviso && <span className="jv-orbe-aviso" aria-hidden="true" />}
          {hayAviso && <span className="sr-only">Hay un parte del día para leer</span>}
        </button>
      )}

      {abierto && (
        <>
          <div data-no-inerte="" className="jv-velo" aria-hidden="true" onClick={cerrar} />
          <aside
            ref={(el) => {
              dialogoRef.current = el;
              panel.current = el;
            }}
            role="dialog"
            aria-modal={modal ? true : undefined}
            aria-label="Jarvis"
            tabIndex={-1}
            data-asistente=""
            className="jv-hoja"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !modal) cerrar();
            }}
          >
            <header className="jv-cabeza">
              <span className="jv-orbe-mini" aria-hidden="true">
                <Icono nombre="asistente" />
              </span>
              <div className="jv-cabeza-texto">
                <p className="jv-nombre">Jarvis</p>
                <p className="jv-sub">Tu secretario en {nombrePerfil}</p>
              </div>
              {mensajes.length > 0 && (
                <button type="button" className="jv-boton jv-boton-chico" onClick={() => setMensajes([])}>
                  Charla nueva
                </button>
              )}
              <button type="button" className="jv-boton jv-boton-redondo" onClick={cerrar} aria-label="Cerrar Jarvis">
                <Icono nombre="cerrar" className="h-4 w-4" />
              </button>
            </header>

            <div ref={lista} role="log" aria-live="polite" aria-label="Conversación con Jarvis" tabIndex={0} className="jv-cuerpo">
              {parteVisible && datosParte && (
                <JvParte
                  parte={datosParte.parte}
                  pendientes={datosParte.pendientes}
                  otrasEnAsistente={datosParte.otrasEnAsistente}
                  alCerrar={() => {
                    guardarParteCerrado(slug, datosParte.parte.dia);
                    setParteVisible(false);
                  }}
                  alPedir={(p) => enviar(p)}
                  alIr={alNavegar}
                  alCambiarPropuesta={cambiarPendiente}
                />
              )}

              {mensajes.length === 0 && (
                <div className="jv-inicio">
                  <p className="jv-inicio-texto">Preguntame lo que quieras o pedime algo. Antes de cambiar cualquier cosa te pregunto «¿Lo hago?».</p>
                </div>
              )}

              {mensajes.map((m, i) => (
                <div key={i} className={m.rol === "usuario" ? "jv-fila jv-fila-yo" : "jv-fila"}>
                  <div className={m.rol === "usuario" ? "jv-burbuja jv-burbuja-yo" : m.error ? "jv-burbuja jv-burbuja-error" : "jv-burbuja"}>
                    <p className="jv-burbuja-texto">{m.texto}</p>
                    {(m.borradores ?? []).map((b, k) => (
                      <div key={k} className="jv-tarjeta jv-borrador">
                        <p className="jv-tarjeta-titulo">Borrador{b.para ? ` para ${b.para}` : ""}</p>
                        <p className="jv-tarjeta-texto jv-borrador-texto">{b.texto}</p>
                        <div className="jv-fila-botones">
                          <button type="button" className="jv-boton jv-boton-acento" onClick={() => copiar(b.texto)}>
                            {copiado === b.texto ? "Copiado" : "Copiar"}
                          </button>
                          <Link prefetch={false} href={hrefChats} onClick={alNavegar} className="jv-boton">
                            Abrir los chats
                          </Link>
                        </div>
                        <p className="jv-nota-chica">No se envió nada: lo mandás vos desde el chat.</p>
                      </div>
                    ))}
                    {(m.propuestas ?? []).map((p) => (
                      <JvConfirmar key={p.id} p={p} alCambiar={(np) => cambiarPropuesta(i, np)} />
                    ))}
                    {(m.enlaces ?? []).length > 0 && (
                      <div className="jv-fila-botones">
                        {m.enlaces!.map((e) => (
                          <Link prefetch={false} key={e.href} href={e.href} onClick={alNavegar} className="jv-boton">
                            {e.texto}
                            <Icono nombre="flecha" className="h-3.5 w-3.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {pensando && (
                <div role="status" className="jv-pensando">
                  <span className="jv-puntos" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  Jarvis está pensando
                </div>
              )}
            </div>

            <footer className="jv-pie">
              <div className="jv-sugerencias" aria-label="Sugerencias para esta pantalla">
                {sugerencias.map((s) => (
                  <button key={s.etiqueta} type="button" className="jv-chip" disabled={pensando} onClick={() => enviar(s.pedido)}>
                    {s.etiqueta}
                  </button>
                ))}
              </div>
              <form
                className="jv-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar(texto);
                }}
              >
                <label htmlFor="jarvis-texto" className="sr-only">
                  Pedido para Jarvis
                </label>
                <textarea
                  id="jarvis-texto"
                  ref={entrada}
                  rows={2}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar(texto);
                    }
                  }}
                  placeholder={escuchando ? "Te escucho…" : "Escribile a Jarvis"}
                  className="jv-texto"
                />
                {vozOk && (
                  <button type="button" className={escuchando ? "jv-boton jv-boton-redondo jv-escuchando" : "jv-boton jv-boton-redondo"} onClick={alternarVoz} aria-pressed={escuchando} aria-label={escuchando ? "Dejar de escuchar" : "Hablar en vez de escribir"}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="jv-boton jv-boton-redondo jv-boton-acento" disabled={pensando || !texto.trim()} aria-label="Enviar">
                  <Icono nombre="enviar" className="h-4 w-4" />
                </button>
              </form>
            </footer>
          </aside>
        </>
      )}
    </div>
  );
}
