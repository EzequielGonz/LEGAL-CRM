"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SlugPerfil } from "@/lib/marca";
import { accionesRapidasDe, pantallaDeRuta, sugerenciasDe } from "@/lib/jarvis/pantallas";
import { agregarHecho, hechosDeHoy, horaCorta, type HechoJarvis } from "@/lib/jarvis/historial";
import { textoResultado, type Propuesta } from "@/lib/asistente/eventos";
import { useDialogo } from "@/components/ui/use-dialogo";
import { Icono } from "@/components/ui/icono-seccion";
import { guardarCharla, guardarHechos, guardarParteCerrado, leerCharla, leerHechos, type MensajeJarvis } from "@/components/jarvis/almacen";
import { JvConfirmar } from "@/components/jarvis/jv-confirmar";
import { JvParte } from "@/components/jarvis/jv-parte";
import type { DatosParte } from "@/components/jarvis/jarvis";

interface PropsHoja {
  slug: SlugPerfil;
  nombrePerfil: string;
  ruta: string;
  modal: boolean;
  pedido: { texto: string; n: number } | null;
  datosParte: DatosParte | null;
  parteVisible: boolean;
  alCerrar: () => void;
  alCerrarParte: () => void;
  alCambiarPendiente: (p: Propuesta) => void;
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
 * La hoja de Jarvis (22/11): se baja la primera vez que se abre (ver `jarvis.tsx`). Charla, acciones rápidas
 * de la pantalla que EJECUTAN un pedido (siempre con «¿Lo hago?»), historial de lo confirmado hoy y voz.
 */
export function JarvisHoja({ slug, nombrePerfil, ruta, modal, pedido, datosParte, parteVisible, alCerrar, alCerrarParte, alCambiarPendiente }: PropsHoja) {
  const [mensajes, setMensajes] = useState<MensajeJarvis[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [listo, setListo] = useState(false);
  const [vozOk, setVozOk] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [todosHechos, setTodosHechos] = useState<HechoJarvis[]>([]);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const reconocedor = useRef<Reconocedor | null>(null);
  const dialogoRef = useDialogo<HTMLElement>(modal, alCerrar);

  const { pantalla } = pantallaDeRuta(ruta);
  const sugerencias = sugerenciasDe(pantalla, nombrePerfil);
  const acciones = accionesRapidasDe(pantalla);
  const hrefChats = slug === "juridico" ? "/inbox" : `/panel/${slug}/chats`;
  const hechos = useMemo(() => hechosDeHoy(todosHechos, new Date()), [todosHechos]);

  useEffect(() => {
    setMensajes(leerCharla(slug));
    setTodosHechos(leerHechos(slug));
    setVozOk(crearReconocedor() !== null);
    setListo(true);
    window.setTimeout(() => entrada.current?.focus(), 60);
  }, [slug]);

  useEffect(() => {
    if (listo) guardarCharla(slug, mensajes);
  }, [mensajes, listo, slug]);

  // Pedido precargado (botón «Preguntale a Jarvis» de otra pantalla).
  useEffect(() => {
    if (pedido?.texto) {
      setTexto(pedido.texto);
      window.setTimeout(() => entrada.current?.focus(), 60);
    }
  }, [pedido]);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [mensajes, pensando]);

  /** Lo que la persona confirmó con «Sí» (hecho o con error) va al historial de hoy. */
  const anotar = useCallback(
    (p: Propuesta) => {
      if (p.estado !== "ejecutada" && p.estado !== "error") return;
      const h: HechoJarvis = { id: p.id, titulo: p.titulo, detalle: textoResultado(p) ?? "", estado: p.estado, hora: new Date().toISOString() };
      setTodosHechos((l) => {
        const nueva = agregarHecho(l, h);
        guardarHechos(slug, nueva);
        return nueva;
      });
    },
    [slug]
  );
  const cambiarPendiente = (p: Propuesta) => {
    anotar(p);
    alCambiarPendiente(p);
  };

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

  const cambiarPropuesta = (i: number, p: Propuesta) => {
    anotar(p);
    setMensajes((ms) => ms.map((m, k) => (k === i ? { ...m, propuestas: (m.propuestas ?? []).map((x) => (x.id === p.id ? p : x)) } : m)));
  };

  const alNavegar = () => {
    if (modal) alCerrar();
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


  return (
    <>
          <div data-no-inerte="" className="jv-velo" aria-hidden="true" onClick={alCerrar} />
          <aside
            ref={dialogoRef}
            role="dialog"
            aria-modal={modal ? true : undefined}
            aria-label="Jarvis"
            tabIndex={-1}
            data-asistente=""
            className="jv-hoja"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !modal) alCerrar();
            }}
          >
            <header className="jv-cabeza">
              <span className="jv-orbe-mini" aria-hidden="true">
                <Icono nombre="asistente" className="jv-orbe-icono-mini" />
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
              <button type="button" className="jv-boton jv-boton-redondo" onClick={alCerrar} aria-label="Cerrar Jarvis">
                <Icono nombre="cerrar" className="h-4 w-4" />
              </button>
            </header>

            <div ref={lista} role="log" aria-live="polite" aria-label="Conversación con Jarvis" tabIndex={0} className="jv-cuerpo">
              {hechos.length > 0 && (
                <details className="jv-historial">
                  <summary>
                    Lo que confirmaste hoy <b>{hechos.length}</b>
                  </summary>
                  <ol className="jv-hechos" aria-label="Historial de hoy">
                    {hechos.map((h) => (
                      <li key={h.id} data-estado={h.estado}>
                        <time dateTime={h.hora}>{horaCorta(h.hora)}</time>
                        <span>
                          <b>{h.titulo}</b>
                          {h.detalle ? <em>{h.detalle}</em> : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              {parteVisible && datosParte && (
                <JvParte
                  parte={datosParte.parte}
                  pendientes={datosParte.pendientes}
                  otrasEnAsistente={datosParte.otrasEnAsistente}
                  alCerrar={() => {
                    guardarParteCerrado(slug, datosParte.parte.dia);
                    alCerrarParte();
                    window.setTimeout(() => entrada.current?.focus(), 30);
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
              <p className="jv-grupo-titulo" id="jv-acc-t">
                Hacer ahora <span>(te pregunto antes)</span>
              </p>
              <div className="jv-sugerencias jv-acciones" role="group" aria-labelledby="jv-acc-t">
                {acciones.map((s) => (
                  <button key={s.etiqueta} type="button" className="jv-chip jv-chip-accion" disabled={pensando} onClick={() => enviar(s.pedido)}>
                    <Icono nombre="flecha" className="h-3.5 w-3.5" />
                    {s.etiqueta}
                  </button>
                ))}
              </div>
              <div className="jv-sugerencias" role="group" aria-label="Preguntas para esta pantalla">
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
                  <button type="button" className={escuchando ? "jv-boton jv-boton-redondo jv-escuchando" : "jv-boton jv-boton-redondo"} onClick={alternarVoz} aria-pressed={escuchando} aria-label="Dictar por voz">
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
  );
}
