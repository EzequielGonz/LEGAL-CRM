"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SlugPerfil } from "@/lib/marca";
import { NOMBRE_PANTALLA, pantallaDeRuta, sugerenciasDe, todasLasAcciones } from "@/lib/jarvis/pantallas";
import { agregarHecho, hechosDeHoy, horaCorta, type HechoJarvis } from "@/lib/jarvis/historial";
import type { TableroJarvis } from "@/lib/jarvis/tablero";
import { textoResultado, type Propuesta } from "@/lib/asistente/eventos";
import { useDialogo } from "@/components/ui/use-dialogo";
import { Icono } from "@/components/ui/icono-seccion";
import { guardarCacheSesion, guardarCharla, guardarHechos, guardarParteCerrado, leerCacheSesion, leerCharla, leerHechos, type MensajeJarvis } from "@/components/jarvis/almacen";
import { JvConfirmar } from "@/components/jarvis/jv-confirmar";
import { JvBento } from "@/components/jarvis/jv-bento";
import { OrbeVivo, type EstadoOrbe } from "@/components/jarvis/jv-orbe-vivo";
import { Cartel } from "@/components/jarvis/jv-cartel";
import { TarjetaResultado, TextoVivo } from "@/components/jarvis/jv-resultado";
import { callar, guardarVozActiva, hablar, leerVozActiva, OndaVoz, vozDisponible } from "@/components/jarvis/jv-voz";
import { BotonesNeumorficos } from "@/components/jarvis/jv-neumorfico";
import type { DatosParte } from "@/components/jarvis/jarvis";

interface PropsHoja {
  slug: SlugPerfil;
  nombrePerfil: string;
  ruta: string;
  pedido: { texto: string; n: number } | null;
  datosParte: DatosParte | null;
  alCerrar: () => void;
  alLeerParte: () => void;
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
 * Modo Jarvis (vuelta 6): pantalla inmersiva de vidrio sobre el panel desenfocado. Arriba, el orbe vivo y el
 * estado; a la izquierda, el estado del día en bento de colores con gráficos y la charla (respuesta que se
 * escribe en vivo, tarjetas con gráficos y personas, dictado con onda y lectura en voz alta opcional); a la
 * derecha, acciones neumórficas, lo que espera tu OK en tarjetas de vidrio y lo que confirmaste hoy.
 * Todo lo que cambia algo pasa por «¿Lo hago?». Ctrl/Cmd+J abre y cierra; Esc cierra; el foco vuelve.
 */
export function JarvisHoja({ slug, nombrePerfil, ruta, pedido, datosParte, alCerrar, alLeerParte, alCambiarPendiente }: PropsHoja) {
  const [mensajes, setMensajes] = useState<MensajeJarvis[]>([]);
  const [nuevo, setNuevo] = useState<number | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [listo, setListo] = useState(false);
  const [vozOk, setVozOk] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [leerVoz, setLeerVoz] = useState(false);
  const [puedeLeer, setPuedeLeer] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [todosHechos, setTodosHechos] = useState<HechoJarvis[]>([]);
  const [tablero, setTablero] = useState<TableroJarvis | null>(null);
  const [errorTablero, setErrorTablero] = useState(false);
  const ultimo = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const reconocedor = useRef<Reconocedor | null>(null);
  const dialogoRef = useDialogo<HTMLDivElement>(true, alCerrar);

  const { pantalla } = pantallaDeRuta(ruta);
  const sugerencias = sugerenciasDe(pantalla, nombrePerfil);
  const acciones = todasLasAcciones(pantalla);
  const hrefChats = slug === "juridico" ? "/inbox" : `/panel/${slug}/chats`;
  const hechos = useMemo(() => hechosDeHoy(todosHechos, new Date()), [todosHechos]);
  const parte = datosParte?.parte ?? null;
  const pendientes = datosParte?.pendientes ?? [];

  const estadoOrbe: EstadoOrbe = escuchando ? "escuchando" : pensando ? "pensando" : hablando || escribiendo ? "hablando" : "reposo";
  const textoEstado = escuchando ? "Te escucho…" : pensando ? "Pensando…" : hablando ? "Hablando…" : `Listo · ${NOMBRE_PANTALLA[pantalla]} · ${nombrePerfil}`;

  useEffect(() => {
    setMensajes(leerCharla(slug));
    setTodosHechos(leerHechos(slug));
    setVozOk(crearReconocedor() !== null);
    setPuedeLeer(vozDisponible());
    setLeerVoz(leerVozActiva());
    setListo(true);
    if (parte) {
      guardarParteCerrado(slug, parte.dia);
      alLeerParte();
    }
    window.setTimeout(() => entrada.current?.focus(), 80);
    return () => callar();
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Tablero de la semana (gráficos): 2 minutos en la sesión.
  useEffect(() => {
    let vivo = true;
    const clave = `tablero:${slug}`;
    const guardado = leerCacheSesion(clave, Date.now(), 2 * 60_000) as TableroJarvis | null;
    if (guardado) {
      setTablero(guardado);
      return;
    }
    fetch(`/api/jarvis/tablero?perfil=${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("tablero"))))
      .then((d: TableroJarvis) => {
        if (!vivo) return;
        guardarCacheSesion(clave, d, Date.now());
        setTablero(d);
      })
      .catch(() => vivo && setErrorTablero(true));
    return () => {
      vivo = false;
    };
  }, [slug]);

  useEffect(() => {
    if (listo) guardarCharla(slug, mensajes);
  }, [mensajes, listo, slug]);

  useEffect(() => {
    if (pedido?.texto) {
      setTexto(pedido.texto);
      window.setTimeout(() => entrada.current?.focus(), 60);
    }
  }, [pedido]);

  useEffect(() => {
    if (mensajes.length === 0 && !pensando) return;
    ultimo.current?.scrollIntoView({ block: "end", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [mensajes, pensando]);

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

  const enviar = useCallback(
    async (contenido: string) => {
      const limpio = contenido.trim();
      if (!limpio || pensando) return;
      callar();
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
        const respuesta: MensajeJarvis = { rol: "jarvis", texto: data.texto, propuestas: data.propuestas ?? [], enlaces: data.enlaces ?? [], borradores: data.borradores ?? [], tarjetas: data.tarjetas ?? [] };
        setMensajes((m) => {
          setNuevo(m.length);
          return [...m, respuesta];
        });
        setEscribiendo(true);
        if (leerVoz) hablar(String(data.texto ?? ""), () => setHablando(true), () => setHablando(false));
      } catch (e) {
        setMensajes((m) => [...m, { rol: "jarvis", texto: (e as Error).message, error: true }]);
      } finally {
        setPensando(false);
      }
    },
    [mensajes, pensando, slug, ruta, leerVoz]
  );

  const cambiarPropuesta = (i: number, p: Propuesta) => {
    anotar(p);
    setMensajes((ms) => ms.map((m, k) => (k === i ? { ...m, propuestas: (m.propuestas ?? []).map((x) => (x.id === p.id ? p : x)) } : m)));
  };

  async function copiar(textoBorrador: string) {
    try {
      await navigator.clipboard.writeText(textoBorrador);
      setCopiado(textoBorrador);
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* el navegador no deja copiar */
    }
  }

  function alternarVoz() {
    if (escuchando) {
      reconocedor.current?.stop();
      return;
    }
    const r = crearReconocedor();
    if (!r) return;
    callar();
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

  function alternarLectura() {
    const v = !leerVoz;
    setLeerVoz(v);
    guardarVozActiva(v);
    if (!v) {
      callar();
      setHablando(false);
    }
  }

  const hayParaDecidir = (parte?.decisiones.length ?? 0) > 0 || pendientes.length > 0;

  return (
    <>
      <div data-no-inerte="" className="jv-velo2" aria-hidden="true" onClick={alCerrar} />
      <div ref={dialogoRef} role="dialog" aria-modal="true" aria-labelledby="jv-modo-titulo" tabIndex={-1} data-asistente="" className="jv-modo">
        <header className="jv-modo-cabeza">
          <span className="jv-modo-orbe">
            <OrbeVivo tamano={64} estado={estadoOrbe} />
          </span>
          <div className="jv-modo-id">
            <Cartel como="h2" id="jv-modo-titulo" texto="*Jarvis*" className="jv-modo-nombre" />
            <p className="jv-modo-estado" role="status" aria-live="polite">
              <span className={`jv-modo-luz jv-modo-luz-${estadoOrbe}`} aria-hidden="true" />
              {textoEstado}
            </p>
          </div>
          <div className="jv-modo-botones">
            {puedeLeer && (
              <button type="button" className="jv-ctrl" aria-pressed={leerVoz} onClick={alternarLectura} title="Leer las respuestas en voz alta">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10v4h3l5 4V6L7 10H4Z" />
                  {leerVoz ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /> : <path d="m17 10 4 4M21 10l-4 4" />}
                </svg>
                <span className="jv-ctrl-texto">{leerVoz ? "Voz encendida" : "Voz apagada"}</span>
              </button>
            )}
            {mensajes.length > 0 && (
              <button type="button" className="jv-ctrl" onClick={() => setMensajes([])}>
                <Icono nombre="mas" className="h-4 w-4" />
                <span className="jv-ctrl-texto">Charla nueva</span>
              </button>
            )}
            <button type="button" className="jv-ctrl jv-ctrl-cerrar" onClick={alCerrar} aria-label="Cerrar Jarvis" aria-keyshortcuts="Escape">
              <Icono nombre="cerrar" className="h-4 w-4" />
              <kbd className="jv-kbd" aria-hidden="true">
                Esc
              </kbd>
            </button>
          </div>
        </header>

        <div className="jv-modo-cuerpo">
          <div className="jv-modo-principal">
            <div className="jv-modo-scroll">
              <JvBento parte={parte} tablero={tablero} errorTablero={errorTablero} hrefChats={hrefChats} perfilNombre={nombrePerfil} />

              <section className="jv-charla" aria-labelledby="jv-charla-t">
                <h3 id="jv-charla-t" className="jv-sec-titulo">
                  Charla
                </h3>
                <div role="log" aria-live="polite" aria-label="Conversación con Jarvis" className="jv-charla-lista">
                  {mensajes.length === 0 && <Cartel texto="Preguntame lo que quieras o pedime algo. Antes de cambiar cualquier cosa te pregunto *«¿Lo hago?»*" className="jv-charla-vacia" retrasoMs={500} />}
                  {mensajes.map((m, i) => (
                    <div key={i} className={m.rol === "usuario" ? "jv-fila jv-fila-yo" : "jv-fila"} ref={i === mensajes.length - 1 ? ultimo : undefined}>
                      {m.rol === "jarvis" && <span className="jv-fila-avatar" aria-hidden="true" />}
                      <div className={m.rol === "usuario" ? "jv-burbuja jv-burbuja-yo" : m.error ? "jv-burbuja jv-burbuja-error" : "jv-burbuja jv-burbuja-jarvis"}>
                        {m.rol === "jarvis" && !m.error ? (
                          <TextoVivo texto={m.texto} animar={nuevo === i} alTerminar={() => nuevo === i && setEscribiendo(false)} />
                        ) : (
                          <p className="jv-burbuja-texto">{m.texto}</p>
                        )}
                        {(m.tarjetas ?? []).map((t, k) => (
                          <TarjetaResultado key={k} t={t} alIr={alCerrar} />
                        ))}
                        {(m.borradores ?? []).map((b, k) => (
                          <div key={k} className="jv-tarjeta jv-borrador">
                            <p className="jv-tarjeta-titulo">Borrador{b.para ? ` para ${b.para}` : ""}</p>
                            <p className="jv-tarjeta-texto jv-borrador-texto">{b.texto}</p>
                            <div className="jv-fila-botones">
                              <button type="button" className="jv-boton jv-boton-acento" onClick={() => copiar(b.texto)}>
                                {copiado === b.texto ? "Copiado" : "Copiar"}
                              </button>
                              <Link prefetch={false} href={hrefChats} onClick={alCerrar} className="jv-boton">
                                Abrir los chats
                              </Link>
                            </div>
                            <p className="jv-nota-chica">No se envió nada: lo mandás vos desde el chat.</p>
                          </div>
                        ))}
                        {(m.propuestas ?? []).length > 0 && (
                          <div className="jv-vidrio-escena jv-vidrio-escena-chica">
                            <span className="jv-circ jv-circ-1" aria-hidden="true" />
                            <span className="jv-circ jv-circ-2" aria-hidden="true" />
                            {(m.propuestas ?? []).map((p) => (
                              <JvConfirmar key={p.id} p={p} alCambiar={(np) => cambiarPropuesta(i, np)} />
                            ))}
                          </div>
                        )}
                        {(m.enlaces ?? []).length > 0 && (
                          <div className="jv-fila-botones">
                            {m.enlaces!.map((e) => (
                              <Link prefetch={false} key={e.href} href={e.href} onClick={alCerrar} className="jv-boton">
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
                    <div role="status" className="jv-pensando2" ref={ultimo}>
                      <span className="jv-pensando-ondas" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                      Jarvis está pensando
                    </div>
                  )}
                </div>
              </section>
            </div>

            <footer className="jv-modo-pie">
              <div className="jv-sugerencias" role="group" aria-label="Preguntas para esta pantalla">
                {sugerencias.map((s) => (
                  <button key={s.etiqueta} type="button" className="jv-chip" disabled={pensando} onClick={() => enviar(s.pedido)}>
                    {s.etiqueta}
                  </button>
                ))}
              </div>
              <form
                className={escuchando ? "jv-form2 jv-form2-escucha" : "jv-form2"}
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
                  rows={1}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar(texto);
                    }
                  }}
                  placeholder={escuchando ? "Te escucho…" : "Escribile a Jarvis o dictale"}
                  className="jv-texto2"
                />
                <OndaVoz activa={escuchando} />
                {vozOk && (
                  <button type="button" className={escuchando ? "jv-redondo jv-redondo-mic jv-escuchando" : "jv-redondo jv-redondo-mic"} onClick={alternarVoz} aria-pressed={escuchando} aria-label={escuchando ? "Dejar de dictar" : "Dictar por voz"}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="jv-redondo jv-redondo-enviar" disabled={pensando || !texto.trim()} aria-label="Enviar">
                  <Icono nombre="enviar" className="h-4 w-4" />
                </button>
              </form>
            </footer>
          </div>

          <aside className="jv-modo-lado" aria-label="Acciones, propuestas e historial">
            <section aria-labelledby="jv-hacer-t" className="jv-lado-sec">
              <h3 id="jv-hacer-t" className="jv-sec-titulo">
                Hacer ahora <span>te pregunto antes</span>
              </h3>
              <BotonesNeumorficos acciones={acciones} deshabilitado={pensando} alElegir={(a) => enviar(a.pedido)} />
            </section>

            <section aria-labelledby="jv-ok-t" className="jv-lado-sec">
              <h3 id="jv-ok-t" className="jv-sec-titulo">
                Esperan tu OK {hayParaDecidir && <b className="jv-cuenta">{(parte?.decisiones.length ?? 0) + pendientes.length}</b>}
              </h3>
              <div className="jv-vidrio-escena">
                <span className="jv-circ jv-circ-1" aria-hidden="true" />
                <span className="jv-circ jv-circ-2" aria-hidden="true" />
                <span className="jv-circ jv-circ-3" aria-hidden="true" />
                {!hayParaDecidir && (
                  <div className="jv-vidrio">
                    <p className="jv-vidrio-titulo">Todo al día</p>
                    <p className="jv-vidrio-texto">No hay nada esperando tu decisión.</p>
                  </div>
                )}
                {(parte?.decisiones ?? []).map((d) => (
                  <div key={d.texto} className="jv-vidrio">
                    <p className="jv-vidrio-titulo">{d.texto}</p>
                    <div className="jv-vidrio-fila">
                      <span className="jv-pregunta">¿Lo hago?</span>
                      {d.accion.tipo === "ir" ? (
                        <Link prefetch={false} href={d.accion.href} onClick={alCerrar} className="jv-boton jv-boton-chico">
                          {d.boton}
                        </Link>
                      ) : (
                        <button type="button" className="jv-boton jv-boton-chico jv-boton-acento" disabled={pensando} onClick={() => enviar((d.accion as { tipo: "jarvis"; pedido: string }).pedido)}>
                          {d.boton}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {pendientes.map((p) => (
                  <JvConfirmar key={p.id} p={p} alCambiar={cambiarPendiente} />
                ))}
                {(datosParte?.otrasEnAsistente ?? 0) > 0 && (
                  <p className="jv-nota-chica">
                    Hay más propuestas en{" "}
                    <Link prefetch={false} href="/asistente" onClick={alCerrar}>
                      Jarvis general
                    </Link>
                    .
                  </p>
                )}
              </div>
            </section>

            <section aria-labelledby="jv-hoy-t" className="jv-lado-sec">
              <h3 id="jv-hoy-t" className="jv-sec-titulo">
                Lo que confirmaste hoy {hechos.length > 0 && <b className="jv-cuenta">{hechos.length}</b>}
              </h3>
              {hechos.length === 0 ? (
                <p className="jv-nota-chica">Cuando confirmes algo con «Sí», queda anotado acá con la hora.</p>
              ) : (
                <ol className="jv-linea-tiempo" aria-label="Historial de hoy">
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
              )}
              <Link prefetch={false} href="/asistente" onClick={alCerrar} className="jv-lado-enlace">
                Abrir Jarvis en pantalla completa
                <Icono nombre="flecha" className="h-3.5 w-3.5" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
