"use client";

/**
 * La Oficina como edificio (22/11). Pedido del dueño: «Así quiero que sea la oficina, no con botones
 * y cosas así, que lleven todas sus tareas al agente principal, el cerebro». Casa de muñecas 3D de
 * noche: una sala por sector y el Cerebro en el centro. Se entra a una sala con un clic (la cámara
 * vuela); clic afuera o Esc vuelve al edificio. A la izquierda, un panel de vidrio con los agentes,
 * lo que entregaron para tu OK, el formulario para dejar una tarea y la actividad reciente.
 * Capas, de la más completa a la más liviana:
 *  - escena 3D (react-three-fiber, perezosa y sin SSR);
 *  - plano SVG (celular, sin WebGL, o mientras carga);
 *  - lista accesible de salas y agentes: es la fuente de verdad, el canvas es aria-hidden.
 * No cambia ninguna regla ni ruta: recibe las tareas ya cargadas.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PlanoEdificio } from "@/components/cerebro/oficina-edificio-css";
import { anuncioDeEntrega, COLOR_ESTADO, ETIQUETA_VISUAL, type EstadoVisual, type PuestoVisual } from "@/lib/oficina/escena";
import { SALAS_ORDEN } from "@/lib/oficina/edificio";
import { actividadReciente, entregasParaOk, hojasParaOk, salasVisuales } from "@/lib/oficina/panel";
import type { Area, TareaOficina } from "@/lib/oficina/reglas";
import { NOMBRE_MOTOR, SECTORES } from "@/lib/oficina/sectores";

const EscenaEdificio = dynamic(() => import("@/components/cerebro/oficina-edificio-3d"), { ssr: false, loading: () => null });

type Modo = "pendiente" | "3d" | "liviano";
type Seccion = "agentes" | "ok" | "tarea" | "actividad";

function hayWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
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

function Icono({ estado }: { estado: EstadoVisual }) {
  const p = { viewBox: "0 0 16 16", width: 13, height: 13, "aria-hidden": true, focusable: false } as const;
  if (estado === "listo")
    return (
      <svg {...p}>
        <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (estado === "trabajando")
    return (
      <svg {...p}>
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="22 12" strokeLinecap="round" />
      </svg>
    );
  if (estado === "en_cola")
    return (
      <svg {...p}>
        <circle cx="4" cy="8" r="1.6" fill="currentColor" />
        <circle cx="8" cy="8" r="1.6" fill="currentColor" />
        <circle cx="12" cy="8" r="1.6" fill="currentColor" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function OficinaVisual({
  tareas,
  sector = null,
  renderEnMarcha,
  renderAprobar,
  renderFormulario,
}: {
  tareas: TareaOficina[];
  /** Sala que se abre al cargar (viene de `?sector=`). */
  sector?: Area | null;
  renderEnMarcha: (t: TareaOficina) => ReactNode;
  renderAprobar: (t: TareaOficina) => ReactNode;
  /** El formulario de dejar una tarea; recibe la sala actual para dirigirla a ese sector. */
  renderFormulario: (sala: Area | null) => ReactNode;
}) {
  const salas = useMemo(() => salasVisuales(tareas), [tareas]);
  const hojas = useMemo(() => hojasParaOk(tareas), [tareas]);
  const entregas = useMemo(() => entregasParaOk(tareas), [tareas]);
  const actividad = useMemo(() => actividadReciente(tareas, 6), [tareas]);
  const enMarcha = useMemo(() => tareas.filter((t) => t.estado === "en_curso"), [tareas]);

  const [sala, setSala] = useState<Area | null>(sector);
  const [resaltada, setResaltada] = useState<Area | null>(null);
  const [puestoSel, setPuestoSel] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("pendiente");
  const [webgl, setWebgl] = useState(false);
  const [forzado, setForzado] = useState<"3d" | "liviano" | null>(null);
  const [reducido, setReducido] = useState(false);
  const [movil, setMovil] = useState(false);
  const [listo3d, setListo3d] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [enPantalla, setEnPantalla] = useState(true);
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [abiertas, setAbiertas] = useState<Record<Seccion, boolean>>({ agentes: true, ok: true, tarea: false, actividad: true });
  const [montado, setMontado] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const raiz = useRef<HTMLDivElement>(null);
  const volverRef = useRef<HTMLButtonElement>(null);
  const botonesSala = useRef<Partial<Record<Area, HTMLButtonElement | null>>>({});
  const anteriores = useRef<PuestoVisual[] | null>(null);
  const ultimoAnuncio = useRef(0);

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
    mq.addEventListener("change", leer);
    rm.addEventListener("change", leer);
    return () => {
      mq.removeEventListener("change", leer);
      rm.removeEventListener("change", leer);
    };
  }, []);

  useEffect(() => {
    const por = forzado ?? (webgl && !movil ? "3d" : "liviano");
    setModo(por === "3d" && !webgl ? "liviano" : por);
  }, [forzado, webgl, movil]);

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
    (a: Area) => {
      setSala(a);
      setPuestoSel(null);
      cambiarUrl(a);
      requestAnimationFrame(() => volverRef.current?.focus({ preventScroll: true }));
    },
    [cambiarUrl],
  );

  const salir = useCallback(() => {
    const antes = sala;
    setSala(null);
    setPuestoSel(null);
    cambiarUrl(null);
    if (antes) requestAnimationFrame(() => botonesSala.current[antes]?.focus({ preventScroll: true }));
  }, [sala, cambiarUrl]);

  const alElegirSala = useCallback(
    (a: Area | null) => {
      if (a) entrar(a);
      else if (sala) salir();
    },
    [entrar, salir, sala],
  );

  function teclas(e: React.KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("textarea, input, select")) return;
    if (e.key === "Escape" && sala) {
      e.preventDefault();
      salir();
    }
  }

  const escena3d = modo === "3d";
  const animar = !pausa && !reducido;
  const alta = sala ? salas[sala] : null;
  const activos = useMemo(
    () =>
      SALAS_ORDEN.flatMap((a) => salas[a].puestos.map((p, j) => ({ a, j, p }))).filter((x) => x.p.estado === "trabajando" || x.p.estado === "listo"),
    [salas],
  );
  const totalTrabajando = activos.filter((x) => x.p.estado === "trabajando").length;
  const [verTodos, setVerTodos] = useState(false);
  const completa = alta ? alta.puestos.map((p, j) => ({ a: alta.area, j, p })) : activos;
  const lista = verTodos || alta ? completa : completa.slice(0, 5);

  const alternar = (s: Seccion) => setAbiertas((a) => ({ ...a, [s]: !a[s] }));

  return (
    <div className={`cz-ed ${pausa || reducido ? "quieta" : ""}`} ref={raiz} onKeyDown={teclas}>
      {/* Fuente de verdad para teclado y lector de pantalla: una entrada por sala. */}
      <ul className="cz-sr" aria-label="Salas del edificio">
        {SALAS_ORDEN.map((a) => {
          const v = salas[a];
          const resumen =
            a === "direccion"
              ? `${hojas} ${hojas === 1 ? "entrega espera" : "entregas esperan"} tu OK`
              : `${v.trabajando} ${v.trabajando === 1 ? "agente trabajando" : "agentes trabajando"} de ${v.puestos.length}`;
          return (
            <li key={a}>
              <button
                type="button"
                ref={(el) => {
                  botonesSala.current[a] = el;
                }}
                aria-pressed={sala === a}
                onFocus={() => setResaltada(a)}
                onBlur={() => setResaltada((r) => (r === a ? null : r))}
                onClick={() => entrar(a)}
              >
                {v.titulo}: {resumen}. Enter para entrar, Esc para volver al edificio.
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cz-ed-escena" data-modo={modo} data-sala={sala ?? "edificio"} data-listo={listo3d ? "1" : "0"}>
        {(!escena3d || !listo3d) && <PlanoEdificio salas={salas} sala={sala} resaltada={resaltada} puestoSel={puestoSel} hojas={hojas} animar={animar} alElegirSala={alElegirSala} />}
        {escena3d && (
          <div className="cz-ed-canvas" aria-hidden="true" style={{ opacity: listo3d ? 1 : 0 }}>
            <EscenaEdificio
              salas={salas}
              hojas={hojas}
              sala={sala}
              resaltada={resaltada}
              puestoSel={puestoSel}
              conPanel={panelAbierto && !movil}
              animar={animar}
              activa={enPantalla && pestanaVisible}
              reducido={reducido}
              alElegirSala={alElegirSala}
              alElegirPuesto={(a, j) => setPuestoSel(`${a}:${j}`)}
              alListo={() => setListo3d(true)}
            />
          </div>
        )}

        {sala && (
          <button ref={volverRef} type="button" className="cz-ed-volver" onClick={salir}>
            <span aria-hidden="true">←</span> Edificio
          </button>
        )}

        <aside className={`cz-ed-panel${panelAbierto ? " abierto" : ""}`} aria-label="Agentes, entregas y actividad">
          <button type="button" className="cz-ed-panel-t" aria-expanded={panelAbierto} onClick={() => setPanelAbierto((v) => !v)}>
            <span className="logo" aria-hidden="true" />
            <span className="txt">
              <b>{alta ? alta.titulo : "Oficina"}</b>
              <small>
                {totalTrabajando} {totalTrabajando === 1 ? "agente trabajando" : "agentes trabajando"}
                {hojas > 0 ? ` · ${hojas} para tu OK` : ""}
              </small>
            </span>
            <span className="flecha" aria-hidden="true">
              {panelAbierto ? "▾" : "▸"}
            </span>
          </button>

          {panelAbierto && (
            <div className="cz-ed-panel-c">
              {alta ? <p className="bajada">{alta.bajada}</p> : <p className="bajada">Tocá una sala para entrar. Los agentes llevan sus tareas al Cerebro, en el centro.</p>}

              <Tramo id="ok" titulo="Para tu OK en el Cerebro" nota={String(entregas.length)} abierto={abiertas.ok} alternar={() => alternar("ok")} destaca={entregas.length > 0}>
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

              <Tramo id="agentes" titulo={alta ? "Agentes de la sala" : "Agentes en marcha"} nota={String(completa.length)} abierto={abiertas.agentes} alternar={() => alternar("agentes")}>
                {lista.length === 0 ? (
                  <p className="vacio">Nadie trabajando ahora. Dejá una tarea y los agentes salen a buscarla.</p>
                ) : (
                  <ul className="agentes">
                    {lista.map(({ a, j, p }) => (
                      <FilaAgente
                        key={`${a}:${j}`}
                        p={p}
                        sector={a}
                        conSector={!alta}
                        sel={puestoSel === `${a}:${j}`}
                        alElegir={() => {
                          const k = `${a}:${j}`;
                          setPuestoSel((s) => (s === k ? null : k));
                          if (sala !== a) entrar(a);
                        }}
                      />
                    ))}
                  </ul>
                )}
                {!alta && completa.length > 5 && (
                  <button type="button" className="mas" aria-expanded={verTodos} onClick={() => setVerTodos((v) => !v)}>
                    {verTodos ? "Ver menos" : `Ver los ${completa.length}`}
                  </button>
                )}
                {!alta && <p className="libres">{SALAS_ORDEN.reduce((n, a) => n + salas[a].puestos.length, 0) - activos.length} agentes libres.</p>}
              </Tramo>

              <Tramo id="tarea" titulo={alta && alta.area !== "direccion" ? `Dejar una tarea a ${alta.titulo}` : "Dejar una tarea"} abierto={abiertas.tarea} alternar={() => alternar("tarea")}>
                {renderFormulario(sala)}
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

        <p className="cz-ed-pista" aria-hidden="true">
          {sala ? "Clic afuera o Esc para volver al edificio" : "Tocá una sala para entrar"}
        </p>
        <details className="cz-ed-ajustes">
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
        <span style={{ ["--c" as string]: "#E8A87C" }}>Claude</span>
        <span style={{ ["--c" as string]: "#7FA7F2" }}>Gemini</span>
        <span style={{ ["--c" as string]: "#7CC39A" }}>Panel</span>
      </p>

      <p className="cz-sr" role="status" aria-live="polite">
        {anuncio}
      </p>
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
  const motor = p.equipo[0] ?? "";
  return (
    <li className={`fila e-${p.estado}${sel ? " sel" : ""}`}>
      <button type="button" aria-expanded={sel} onClick={alElegir}>
        <i className="punto" style={{ background: COLOR_ESTADO[p.estado] }} aria-hidden="true" />
        <span className="n">
          <b>{p.nombre}</b>
          <small>{conSector ? SECTORES[sector].titulo : motor}</small>
        </span>
        <span className={`est ${p.estado}`}>
          <Icono estado={p.estado} />
          {ETIQUETA_VISUAL[p.estado]}
        </span>
      </button>
      {sel && (
        <div className="det">
          <p>{p.rol}.</p>
          <p className="mot">
            {motor || `Corre con ${NOMBRE_MOTOR.panel}`}
            {p.tarea ? <> · en «{p.tarea}»</> : null}
          </p>
        </div>
      )}
    </li>
  );
}
