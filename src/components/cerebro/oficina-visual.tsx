"use client";

/**
 * La Oficina como el reel (22/11, vuelta 6). Pedido del dueño: «la oficina nada que ver con el
 * video». Ahora: oficina 3D estilo videojuego de noche, con muebles reales, personajes animados que
 * trabajan, llevan carpetas al Cerebro y van por un café, vista aérea que se orbita y recorrido a
 * altura de persona. Encima, como en el reel: barra de arriba (Vista aérea · Recorrer · salas), panel
 * de vidrio a la izquierda (cifras, nueva tarea, para tu OK, agentes, actividad), canal del equipo a
 * la derecha y el chat de cada agente.
 * Capas, de la más completa a la más liviana:
 *  - escena 3D (react-three-fiber, perezosa y sin SSR, con pantalla de carga);
 *  - plano SVG liviano (sin WebGL, o si la escena falla);
 *  - listas accesibles de salas y agentes: son la fuente de verdad, el canvas es aria-hidden.
 * Funciones que se mantienen: aprobar, pedir cambios, descartar, dejar tarea y «Arrancar ahora»
 * (este componente recibe esas piezas ya armadas desde `oficina.tsx`).
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PlanoEdificio } from "@/components/cerebro/oficina-edificio-css";
import { anuncioDeEntrega, COLOR_AREA, COLOR_ESTADO, ETIQUETA_VISUAL, type EstadoVisual, type PuestoVisual } from "@/lib/oficina/escena";
import { SALAS_ORDEN } from "@/lib/oficina/edificio";
import { actividadReciente, entregasParaOk, hojasParaOk, salasVisuales } from "@/lib/oficina/panel";
import { etapaDe, type Area, type TareaOficina } from "@/lib/oficina/reglas";
import { NOMBRE_MOTOR, SECTORES } from "@/lib/oficina/sectores";
import { SUGERENCIAS, enlaceJarvis, iniciales, mensajesDelEquipo, respuestaAgente, type Lugar, type Pregunta } from "@/lib/oficina/recorrido";
import type { Calidad, Vista3D } from "@/components/cerebro/oficina-reel-3d";

const Escena3D = dynamic(() => import("@/components/cerebro/oficina-reel-3d"), { ssr: false, loading: () => null });

type Modo = "pendiente" | "3d" | "liviano";
type Seccion = "agentes" | "ok" | "tarea" | "actividad";

function hayWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

function hace(iso: string): string {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (!Number.isFinite(min)) return "";
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

const NOMBRE_LUGAR = (l: Lugar): string => (l === "entrada" ? "Living y cocina" : SECTORES[l].titulo);

export interface ResultadoEnvio {
  ok: boolean;
  texto: string;
}

interface Mensaje {
  de: "vos" | "agente" | "sistema";
  texto: string;
  enlace?: string;
}

export function OficinaVisual({
  tareas,
  sector = null,
  renderEnMarcha,
  renderAprobar,
  renderFormulario,
  alMandarAAgente,
}: {
  tareas: TareaOficina[];
  /** Sala que se abre al cargar (viene de `?sector=`). */
  sector?: Area | null;
  renderEnMarcha: (t: TareaOficina) => ReactNode;
  renderAprobar: (t: TareaOficina) => ReactNode;
  /** El formulario de dejar una tarea; recibe la sala actual para dirigirla a ese sector. */
  renderFormulario: (sala: Area | null) => ReactNode;
  /** Manda el pedido escrito en el chat de un agente a la mesa de entrada (canal de la Oficina). */
  alMandarAAgente: (area: Area, nombre: string, texto: string) => Promise<ResultadoEnvio>;
}) {
  const salas = useMemo(() => salasVisuales(tareas), [tareas]);
  const hojas = useMemo(() => hojasParaOk(tareas), [tareas]);
  const entregas = useMemo(() => entregasParaOk(tareas), [tareas]);
  const actividad = useMemo(() => actividadReciente(tareas, 6), [tareas]);
  const enMarcha = useMemo(() => tareas.filter((t) => t.estado === "en_curso"), [tareas]);
  const canal = useMemo(() => mensajesDelEquipo(tareas, salas, 6), [tareas, salas]);

  const [vista, setVista] = useState<Vista3D>(sector ? { tipo: "dentro", lugar: sector, n: 0 } : { tipo: "aerea" });
  const [lugar, setLugar] = useState<Lugar | null>(sector);
  const sala: Area | null = vista.tipo === "dentro" && lugar && lugar !== "entrada" ? lugar : vista.tipo === "aerea" ? null : null;
  const [salaLiviana, setSalaLiviana] = useState<Area | null>(sector);
  const [resaltada, setResaltada] = useState<Area | null>(null);
  const [agenteSel, setAgenteSel] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("pendiente");
  const [webgl, setWebgl] = useState(false);
  const [forzado, setForzado] = useState<"3d" | "liviano" | null>(null);
  const [reducido, setReducido] = useState(false);
  const [movil, setMovil] = useState(false);
  const [calidad, setCalidad] = useState<Calidad>("alta");
  const [listo3d, setListo3d] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [enPantalla, setEnPantalla] = useState(true);
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [abiertas, setAbiertas] = useState<Record<Seccion, boolean>>({ agentes: true, ok: true, tarea: false, actividad: false });
  const [montado, setMontado] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const [cartelLugar, setCartelLugar] = useState<{ lugar: Lugar; n: number } | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const volverRef = useRef<HTMLButtonElement>(null);
  const botonesSala = useRef<Partial<Record<Lugar, HTMLButtonElement | null>>>({});
  const anteriores = useRef<PuestoVisual[] | null>(null);
  const ultimoAnuncio = useRef(0);
  const nVista = useRef(0);

  // Capacidades del equipo: se miran recién en el cliente, así el HTML del servidor no cambia.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => {
      setMovil(mq.matches);
      setReducido(rm.matches);
    };
    leer();
    setMontado(true);
    setWebgl(hayWebGL());
    setPanelAbierto(!mq.matches);
    const q = new URLSearchParams(window.location.search).get("calidad");
    const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    setCalidad(q === "alta" || q === "media" || q === "baja" ? q : mq.matches || memoria <= 4 ? "baja" : "alta");
    mq.addEventListener("change", leer);
    rm.addEventListener("change", leer);
    return () => {
      mq.removeEventListener("change", leer);
      rm.removeEventListener("change", leer);
    };
  }, []);

  useEffect(() => {
    if (!montado) return;
    const por = forzado ?? (webgl ? "3d" : "liviano");
    setModo(por === "3d" && !webgl ? "liviano" : por);
  }, [forzado, webgl, montado]);

  useEffect(() => {
    if (modo !== "3d") setListo3d(false);
  }, [modo]);

  // La escena pausa cuando sale de pantalla o la pestaña queda oculta.
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setPestanaVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  // Aviso a lectores de pantalla cuando un puesto entrega, como mucho uno cada 10 s.
  useEffect(() => {
    const todos = SALAS_ORDEN.flatMap((a) => salas[a].puestos);
    const msg = anuncioDeEntrega(anteriores.current, todos);
    anteriores.current = todos;
    if (msg && Date.now() - ultimoAnuncio.current > 10000) {
      ultimoAnuncio.current = Date.now();
      setAnuncio(msg);
    }
  }, [salas]);

  // El botón «Dejar una tarea» de la barra abre ese tramo del panel.
  useEffect(() => {
    const abrir = () => {
      setPanelAbierto(true);
      setAbiertas((a) => ({ ...a, tarea: true }));
      requestAnimationFrame(() => {
        const f = raiz.current?.querySelector<HTMLTextAreaElement>("#oficina-tarea textarea");
        f?.scrollIntoView({ block: "nearest" });
        f?.focus({ preventScroll: true });
      });
    };
    window.addEventListener("oficina:tarea", abrir);
    return () => window.removeEventListener("oficina:tarea", abrir);
  }, []);

  // Cartel animado al entrar a un lugar: se va solo a los 3 s.
  useEffect(() => {
    if (!cartelLugar) return;
    const id = window.setTimeout(() => setCartelLugar(null), reducido ? 2000 : 3200);
    return () => window.clearTimeout(id);
  }, [cartelLugar, reducido]);

  const cambiarUrl = useCallback((a: Area | null) => {
    try {
      const u = new URL(window.location.href);
      if (a) u.searchParams.set("sector", a);
      else u.searchParams.delete("sector");
      window.history.replaceState(window.history.state, "", u.toString());
    } catch {
      /* sin historial: no pasa nada */
    }
  }, []);

  const entrar = useCallback(
    (l: Lugar) => {
      nVista.current += 1;
      setVista({ tipo: "dentro", lugar: l, n: nVista.current });
      setLugar(l);
      setCartelLugar({ lugar: l, n: nVista.current });
      setPanelAbierto(false);
      if (l !== "entrada") setSalaLiviana(l);
      cambiarUrl(l === "entrada" ? null : l);
      requestAnimationFrame(() => volverRef.current?.focus({ preventScroll: true }));
    },
    [cambiarUrl],
  );

  const salir = useCallback(() => {
    const antes = lugar;
    setVista({ tipo: "aerea" });
    setLugar(null);
    if (!window.matchMedia("(max-width: 767px)").matches) setPanelAbierto(true);
    setSalaLiviana(null);
    cambiarUrl(null);
    if (antes) requestAnimationFrame(() => botonesSala.current[antes]?.focus({ preventScroll: true }));
  }, [lugar, cambiarUrl]);

  const alCambiarLugar = useCallback(
    (l: Lugar | null) => {
      if (!l) return;
      setLugar(l);
      setCartelLugar({ lugar: l, n: ++nVista.current });
      cambiarUrl(l === "entrada" ? null : l);
    },
    [cambiarUrl],
  );

  const elegirAgente = useCallback((clave: string) => {
    setAgenteSel((s) => (s === clave ? s : clave));
  }, []);

  function teclas(e: React.KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("textarea, input, select")) return;
    if (e.key === "Escape") {
      if (agenteSel) {
        e.preventDefault();
        setAgenteSel(null);
      } else if (vista.tipo === "dentro" || salaLiviana) {
        e.preventDefault();
        salir();
      }
    }
  }

  const escena3d = modo === "3d";
  const animar = !pausa && !reducido;
  const salaPanel = escena3d ? sala : salaLiviana;
  const alta = salaPanel ? salas[salaPanel] : null;
  const todos = useMemo(() => SALAS_ORDEN.flatMap((a) => salas[a].puestos.map((p, j) => ({ a, j, p }))), [salas]);
  const activos = useMemo(() => todos.filter((x) => x.p.estado === "trabajando" || x.p.estado === "listo"), [todos]);
  const totalTrabajando = activos.filter((x) => x.p.estado === "trabajando").length;
  const [verTodos, setVerTodos] = useState(false);
  const completa = alta ? alta.puestos.map((p, j) => ({ a: alta.area, j, p })) : activos.length ? activos : todos;
  const lista = verTodos || alta ? completa : completa.slice(0, 6);
  const aprobadas = tareas.filter((t) => etapaDe(t) === "aprobada").length;
  const elegido = agenteSel ? todos.find((x) => `${x.a}:${x.j}` === agenteSel) ?? null : null;

  const alternar = (s: Seccion) => setAbiertas((a) => ({ ...a, [s]: !a[s] }));
  const conPanel = panelAbierto && !movil;

  return (
    <div className={`cz-ed of3 ${pausa || reducido ? "quieta" : ""}`} ref={raiz} onKeyDown={teclas}>
      {/* Fuente de verdad para teclado y lector de pantalla: salas y agentes. */}
      <nav className="cz-sr" aria-label="Salas y agentes de la oficina">
        <ul>
          {[...SALAS_ORDEN, "entrada" as const].map((l) => {
            const v = l === "entrada" ? null : salas[l];
            const resumen = !v
              ? "living con cocina y pool"
              : l === "direccion"
                ? `${hojas} ${hojas === 1 ? "entrega espera" : "entregas esperan"} tu OK`
                : `${v.trabajando} ${v.trabajando === 1 ? "agente trabajando" : "agentes trabajando"} de ${v.puestos.length}`;
            return (
              <li key={l}>
                <button
                  type="button"
                  ref={(el) => {
                    botonesSala.current[l] = el;
                  }}
                  aria-pressed={lugar === l && vista.tipo === "dentro"}
                  onFocus={() => setResaltada(l === "entrada" ? null : l)}
                  onBlur={() => setResaltada(null)}
                  onClick={() => (escena3d ? entrar(l) : l !== "entrada" && setSalaLiviana(l))}
                >
                  Entrar a {NOMBRE_LUGAR(l)}: {resumen}. Esc para volver a la vista aérea.
                </button>
                {v && (
                  <ul>
                    {v.puestos.map((p, j) => (
                      <li key={j}>
                        <button type="button" onClick={() => setAgenteSel(`${l}:${j}`)}>
                          Hablar con {p.nombre} ({ETIQUETA_VISUAL[p.estado]})
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="cz-ed-escena of3-escena" data-modo={modo} data-vista={vista.tipo} data-listo={listo3d ? "1" : "0"}>
        {(!escena3d || !listo3d) && (
          <PlanoEdificio
            salas={salas}
            sala={salaLiviana}
            resaltada={resaltada}
            puestoSel={agenteSel}
            hojas={hojas}
            animar={animar}
            alElegirSala={(a) => {
              if (escena3d) {
                if (a) entrar(a);
              } else setSalaLiviana(a);
            }}
          />
        )}
        {escena3d && (
          <div className="cz-ed-canvas" aria-hidden="true">
            <Escena3D
              salas={salas}
              hojas={hojas}
              vista={vista}
              conPanel={conPanel}
              animar={animar}
              activa={enPantalla && pestanaVisible}
              reducido={reducido}
              calidad={calidad}
              resaltada={resaltada}
              agenteSel={agenteSel}
              alEntrar={entrar}
              alCambiarLugar={alCambiarLugar}
              alElegirAgente={elegirAgente}
              alListo={() => setListo3d(true)}
              alFallar={() => setForzado("liviano")}
            />
          </div>
        )}

        {/* Barra de arriba, como en el reel: marca, vista aérea / recorrer y salas. */}
        <div className="of3-barra">
          <div className="of3-marca">
            <span className="logo" aria-hidden="true">
              IA
            </span>
            <span>
              <b>Oficina</b>
              <small>
                <i aria-hidden="true" /> {todos.length} agentes en línea
              </small>
            </span>
          </div>
          {escena3d && (
            <div className="of3-seg" role="group" aria-label="Cómo mirar la oficina">
              <button type="button" className="of3-neu" aria-pressed={vista.tipo === "aerea"} onClick={salir}>
                Vista aérea
              </button>
              <button type="button" className="of3-neu" aria-pressed={vista.tipo === "dentro"} onClick={() => entrar(lugar ?? "direccion")}>
                Recorrer
              </button>
            </div>
          )}
          {escena3d && (
            <div className="of3-salas" role="group" aria-label="Ir a una sala">
              {[...SALAS_ORDEN, "entrada" as const].map((l) => (
                <button key={l} type="button" aria-pressed={vista.tipo === "dentro" && lugar === l} onClick={() => entrar(l)} style={{ ["--c" as string]: l === "entrada" ? "#e9c677" : COLOR_AREA[l] }}>
                  {l === "direccion" ? "Cerebro" : l === "entrada" ? "Living" : SECTORES[l].titulo.split(" ")[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {vista.tipo === "dentro" && escena3d && (
          <button ref={volverRef} type="button" className="cz-ed-volver of3-neu of3-volver" onClick={salir}>
            <span aria-hidden="true">↑</span> Volver a la vista aérea
          </button>
        )}
        {!escena3d && salaLiviana && (
          <button ref={volverRef} type="button" className="cz-ed-volver" onClick={() => setSalaLiviana(null)}>
            <span aria-hidden="true">←</span> Edificio
          </button>
        )}

        {/* Cartel animado al entrar: palabra clave en itálica serif recuadrada. */}
        {cartelLugar && (
          <div key={cartelLugar.n} className="of3-cartel-lugar" aria-hidden="true">
            <span className="pildora">Entraste</span>
            <p>
              {"Estás en".split(" ").map((w, i) => (
                <span key={i} className="pal" style={{ animationDelay: `${i * 0.09}s` }}>
                  {w}{" "}
                </span>
              ))}
              <em className="recuadro pal" style={{ animationDelay: "0.24s" }}>
                {NOMBRE_LUGAR(cartelLugar.lugar)}
              </em>
            </p>
          </div>
        )}

        <aside className={`cz-ed-panel of3-panel${panelAbierto ? " abierto" : ""}`} aria-label="Agentes, entregas y actividad">
          <button type="button" className="cz-ed-panel-t" aria-expanded={panelAbierto} onClick={() => setPanelAbierto((v) => !v)}>
            <span className="logo" aria-hidden="true" />
            <span className="txt">
              <b>{alta ? alta.titulo : lugar === "entrada" && vista.tipo === "dentro" ? "Living y cocina" : "Equipo de agentes"}</b>
              <small>
                {totalTrabajando} {totalTrabajando === 1 ? "trabajando" : "trabajando"}
                {hojas > 0 ? ` · ${hojas} para tu OK` : ""}
              </small>
            </span>
            <span className="flecha" aria-hidden="true">
              {panelAbierto ? "▾" : "▸"}
            </span>
          </button>

          {panelAbierto && (
            <div className="cz-ed-panel-c">
              <div className="of3-cifras">
                <Cifra etiqueta="Agentes activos" valor={`${totalTrabajando}/${todos.length}`} tono="verde" />
                <Cifra etiqueta="Tareas en curso" valor={String(enMarcha.length)} tono="ambar" />
                <Cifra etiqueta="Para tu OK" valor={String(entregas.length)} tono="violeta" />
                <Cifra etiqueta="Aprobadas" valor={String(aprobadas)} tono="azul" />
              </div>
              {alta ? <p className="bajada">{alta.bajada}</p> : null}

              <Tramo id="tarea" titulo={alta && alta.area !== "direccion" ? `Nueva tarea para ${alta.titulo}` : "Nueva tarea para el equipo"} abierto={abiertas.tarea} alternar={() => alternar("tarea")}>
                {renderFormulario(salaPanel)}
              </Tramo>

              <Tramo id="ok" titulo="Para tu OK" nota={String(entregas.length)} abierto={abiertas.ok} alternar={() => alternar("ok")} destaca={entregas.length > 0}>
                {entregas.length ? (
                  <ul className="cz-of-tareas cz-ed-tareas">{entregas.map((t) => renderAprobar(t))}</ul>
                ) : (
                  <p className="vacio">Cuando los agentes terminen, las entregas se apilan en el escritorio del Cerebro y aparecen acá.</p>
                )}
                {enMarcha.length > 0 && (
                  <>
                    <h4>En marcha</h4>
                    <ul className="cz-of-tareas cz-ed-tareas">{enMarcha.slice(0, 5).map((t) => renderEnMarcha(t))}</ul>
                  </>
                )}
              </Tramo>

              <Tramo id="agentes" titulo={alta ? "Agentes de la sala" : activos.length ? "Agentes activos" : "Agentes"} nota={String(completa.length)} abierto={abiertas.agentes} alternar={() => alternar("agentes")}>
                <ul className="agentes of3-agentes">
                  {lista.map(({ a, j, p }) => (
                    <FilaAgente key={`${a}:${j}`} p={p} sector={a} conSector={!alta} sel={agenteSel === `${a}:${j}`} alElegir={() => setAgenteSel(`${a}:${j}`)} />
                  ))}
                </ul>
                {!alta && completa.length > 6 && (
                  <button type="button" className="mas" aria-expanded={verTodos} onClick={() => setVerTodos((v) => !v)}>
                    {verTodos ? "Ver menos" : `Ver los ${completa.length}`}
                  </button>
                )}
              </Tramo>

              <Tramo id="actividad" titulo="Actividad" nota={String(actividad.length)} abierto={abiertas.actividad} alternar={() => alternar("actividad")}>
                {actividad.length ? (
                  <ol className="actividad">
                    {actividad.map((x) => (
                      <li key={x.id}>
                        <span className="t">{x.titulo}</span>
                        <small>
                          {x.sector} · {x.etapa}
                          {montado ? ` · ${hace(x.updated_at)}` : ""}
                        </small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="vacio">Todavía no hay tareas.</p>
                )}
              </Tramo>
            </div>
          )}
        </aside>

        {/* Canal del equipo, arriba a la derecha (como «Agent communication» del reel). */}
        {escena3d && !movil && vista.tipo === "aerea" && (
          <section className="of3-canal" aria-label="Canal del equipo">
            <h3>
              Canal del equipo <span className="vivo">en vivo</span>
            </h3>
            <ol>
              {canal.map((m) => (
                <li key={m.id}>
                  <b style={{ color: m.area ? COLOR_AREA[m.area] : undefined }}>{m.quien}</b>
                  <small>{m.at && montado ? hace(m.at) : "ahora"}</small>
                  <p>{m.texto}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {elegido && (
          <ChatAgente key={agenteSel} area={elegido.a} p={elegido.p} alCerrar={() => setAgenteSel(null)} alMandar={alMandarAAgente} />
        )}

        {vista.tipo === "dentro" && escena3d && (
          <p className="of3-teclas" aria-hidden="true">
            {movil ? (
              <>Arrastrá para mirar · tocá el piso para caminar · tocá un agente para hablarle</>
            ) : (
              <>
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd> caminar · <kbd>Shift</kbd> correr · arrastrá para mirar · clic en el piso para ir · clic en un agente para hablarle · <kbd>Esc</kbd> vista aérea
              </>
            )}
          </p>
        )}
        {vista.tipo === "aerea" && escena3d && listo3d && <p className="cz-ed-pista of3-pista">Arrastrá para girar · rueda para acercar · tocá una sala para entrar</p>}

        <details className="cz-ed-ajustes of3-ajustes">
          <summary>Vista</summary>
          <div>
            <button type="button" aria-pressed={pausa || reducido} onClick={() => setPausa((v) => !v)} disabled={reducido}>
              {pausa || reducido ? "Animaciones en pausa" : "Pausar animaciones"}
            </button>
            {webgl && (
              <button type="button" onClick={() => setForzado(escena3d ? "liviano" : "3d")}>
                {escena3d ? "Ver plano liviano" : "Ver en 3D"}
              </button>
            )}
          </div>
        </details>
      </div>

      <p className="cz-ed-leyenda" aria-hidden="true">
        <span style={{ ["--c" as string]: COLOR_ESTADO.trabajando }}>Trabajando</span>
        <span style={{ ["--c" as string]: COLOR_ESTADO.listo }}>Listo para tu OK</span>
        <span style={{ ["--c" as string]: COLOR_ESTADO.libre }}>Libre</span>
        <span style={{ ["--c" as string]: "#e9c677" }}>Llevando al Cerebro</span>
      </p>

      <p className="cz-sr" role="status" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}

function Cifra({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono: "verde" | "ambar" | "violeta" | "azul" }) {
  return (
    <div className={`of3-cifra ${tono}`}>
      <small>{etiqueta}</small>
      <b>{valor}</b>
    </div>
  );
}

function Tramo({ id, titulo, nota, abierto, alternar, destaca, children }: { id: string; titulo: string; nota?: string; abierto: boolean; alternar: () => void; destaca?: boolean; children: ReactNode }) {
  return (
    <div className={`cz-ed-tramo${destaca ? " destaca" : ""}`}>
      <h3>
        <button type="button" aria-expanded={abierto} aria-controls={`tramo-${id}`} onClick={alternar}>
          <span>{titulo}</span>
          {nota !== undefined && <em>{nota}</em>}
          <i aria-hidden="true">{abierto ? "−" : "+"}</i>
        </button>
      </h3>
      {abierto && <div id={`tramo-${id}`}>{children}</div>}
    </div>
  );
}

function FilaAgente({ p, sector, conSector, sel, alElegir }: { p: PuestoVisual; sector: Area; conSector: boolean; sel: boolean; alElegir: () => void }) {
  return (
    <li className={`fila e-${p.estado}${sel ? " sel" : ""}`}>
      <button type="button" aria-pressed={sel} onClick={alElegir} title={`Hablar con ${p.nombre}`}>
        <span className="of3-avatar" style={{ ["--c" as string]: COLOR_AREA[sector] }} aria-hidden="true">
          {iniciales(p.nombre)}
        </span>
        <span className="n">
          <b>{p.nombre}</b>
          <small>{conSector ? SECTORES[sector].titulo : p.rol}</small>
        </span>
        <span className={`est ${p.estado}`}>
          <i style={{ background: COLOR_ESTADO[p.estado] }} aria-hidden="true" />
          {ETIQUETA_VISUAL[p.estado]}
        </span>
      </button>
    </li>
  );
}

function motorDe(p: PuestoVisual): string {
  const m = p.equipo[0] ?? "";
  return m.replace(/^Corre con /, "") || NOMBRE_MOTOR.panel;
}

function ChatAgente({ area, p, alCerrar, alMandar }: { area: Area; p: PuestoVisual; alCerrar: () => void; alMandar: (area: Area, nombre: string, texto: string) => Promise<ResultadoEnvio> }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ de: "agente", texto: `Hola, soy ${p.nombre} de ${SECTORES[area].titulo}. ${p.rol}.` }]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const lista = useRef<HTMLOListElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const estado: EstadoVisual = p.estado;
  const ficha = { nombre: p.nombre, rol: p.rol, estado, tarea: p.tarea, progreso: p.progreso, area, motor: motorDe(p) };

  useEffect(() => {
    entrada.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [mensajes]);

  function preguntar(id: Pregunta, t: string) {
    setMensajes((m) => [...m, { de: "vos", texto: t }, { de: "agente", texto: respuestaAgente(ficha, id) }]);
  }

  async function mandar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setMensajes((m) => [...m, { de: "vos", texto: limpio }]);
    const r = await alMandar(area, p.nombre, limpio);
    setMensajes((m) => [...m, { de: r.ok ? "agente" : "sistema", texto: r.texto, enlace: r.ok ? undefined : enlaceJarvis(area, p.nombre, limpio) }]);
    if (r.ok) setTexto("");
    setEnviando(false);
  }

  return (
    <section className="of3-chat" role="dialog" aria-modal="false" aria-label={`Chat con ${p.nombre}`}>
      <header>
        <span className="of3-avatar grande" style={{ ["--c" as string]: COLOR_AREA[area] }} aria-hidden="true">
          {iniciales(p.nombre)}
        </span>
        <div>
          <h3>
            {p.nombre} <span className={`est ${estado}`}>· {ETIQUETA_VISUAL[estado]}</span>
          </h3>
          <small>
            {SECTORES[area].titulo} · {motorDe(p)}
          </small>
        </div>
        <span className="ondas" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <button type="button" className="cerrar" onClick={alCerrar} aria-label="Cerrar el chat">
          ×
        </button>
      </header>
      <ol ref={lista} aria-live="polite">
        {mensajes.map((m, i) => (
          <li key={i} className={m.de}>
            {m.texto}
            {m.enlace && (
              <a href={m.enlace} className="jarvis">
                Pedírselo a Jarvis
              </a>
            )}
          </li>
        ))}
      </ol>
      <div className="sug" role="group" aria-label="Preguntas rápidas">
        {SUGERENCIAS.map((s) => (
          <button key={s.id} type="button" onClick={() => preguntar(s.id, s.texto)}>
            {s.texto}
          </button>
        ))}
      </div>
      <form onSubmit={mandar}>
        <label className="cz-sr" htmlFor="of3-chat-texto">
          Mensaje para {p.nombre}
        </label>
        <textarea
          id="of3-chat-texto"
          ref={entrada}
          rows={2}
          maxLength={1500}
          value={texto}
          placeholder={`Escribile a ${p.nombre}…`}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="acc">
          <a className="of3-neu sec" href={enlaceJarvis(area, p.nombre, texto)}>
            Abrir en Jarvis
          </a>
          <button type="submit" className="of3-neu" disabled={enviando || !texto.trim()}>
            {enviando ? "Mandando…" : "Mandar a la Oficina"}
          </button>
        </div>
        <small className="nota">Va a la mesa de entrada de la Oficina como tarea para su sector. Nada se publica sin tu OK.</small>
      </form>
    </section>
  );
}
