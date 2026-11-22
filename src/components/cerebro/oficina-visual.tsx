"use client";

/**
 * La parte visual de la Oficina (22/11): escena 3D con los ocho escritorios,
 * tarjetas flotantes, cámara que vuela al puesto elegido y panel de vidrio
 * con las acciones. Tres capas, de la más completa a la más liviana:
 *  - escena 3D (react-three-fiber, cargada recién cuando hace falta);
 *  - diorama CSS 3D (celular, sin WebGL, movimiento reducido, o mientras carga);
 *  - lista accesible, siempre presente: es la fuente de verdad. La escena y
 *    el diorama son aria-hidden y espejan esa lista.
 * No cambia ninguna regla ni ruta: recibe las tareas ya cargadas y los
 * formularios de aprobar / pedir cambios llegan desde la Oficina.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Diorama } from "@/components/cerebro/oficina-diorama";
import {
  COLOR_ESTADO,
  anuncioDeEntrega,
  descripcionAccesible,
  puestosVisuales,
  vecino,
  type EstadoVisual,
  type PuestoVisual,
  type Vista,
} from "@/lib/oficina/escena";
import { ESCRITORIOS, type Area, type TareaOficina } from "@/lib/oficina/reglas";

// La escena 3D se baja solo cuando la Oficina la pide: el resto del panel no la carga.
const Escena3D = dynamic(() => import("@/components/cerebro/oficina-3d"), { ssr: false, loading: () => null });

type Modo = "pendiente" | "3d" | "liviano";

function hayWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function IconoEstado({ estado }: { estado: EstadoVisual }) {
  if (estado === "listo")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (estado === "trabajando")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="22 12" strokeLinecap="round" />
      </svg>
    );
  if (estado === "en_cola")
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <circle cx="4" cy="8" r="1.6" fill="currentColor" />
        <circle cx="8" cy="8" r="1.6" fill="currentColor" />
        <circle cx="12" cy="8" r="1.6" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function OficinaVisual({
  tareas,
  renderEnMarcha,
  renderAprobar,
}: {
  tareas: TareaOficina[];
  renderEnMarcha: (t: TareaOficina) => ReactNode;
  renderAprobar: (t: TareaOficina) => ReactNode;
}) {
  const puestos = useMemo(() => puestosVisuales(tareas), [tareas]);
  const [vista, setVista] = useState<Vista>("sala");
  const [modo, setModo] = useState<Modo>("pendiente");
  const [webgl, setWebgl] = useState(false);
  const [forzado, setForzado] = useState<"3d" | "liviano" | null>(null);
  const [reducido, setReducido] = useState(false);
  const [movil, setMovil] = useState(false);
  const [listo3d, setListo3d] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [enPantalla, setEnPantalla] = useState(true);
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [anuncio, setAnuncio] = useState("");
  const raiz = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const marcoRef = useRef<HTMLDivElement>(null);
  const botones = useRef<Partial<Record<Area, HTMLButtonElement | null>>>({});
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
    setWebgl(hayWebGL());
    mq.addEventListener("change", leer);
    rm.addEventListener("change", leer);
    return () => {
      mq.removeEventListener("change", leer);
      rm.removeEventListener("change", leer);
    };
  }, []);

  useEffect(() => {
    const por = forzado ?? (webgl && !movil && !reducido ? "3d" : "liviano");
    setModo(por === "3d" && !webgl ? "liviano" : por);
  }, [forzado, webgl, movil, reducido]);

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

  // Aviso a lectores de pantalla cuando un escritorio entrega, como mucho uno cada 10 s.
  useEffect(() => {
    const msg = anuncioDeEntrega(anteriores.current, puestos);
    anteriores.current = puestos;
    if (msg && Date.now() - ultimoAnuncio.current > 10000) {
      ultimoAnuncio.current = Date.now();
      setAnuncio(msg);
    }
  }, [puestos]);

  const elegida = vista !== "sala" && vista !== "cenital" ? puestos.find((p) => p.area === vista) ?? null : null;

  const ir = useCallback((v: Vista) => {
    setVista(v);
  }, []);

  const mover = useCallback(
    (delta: 1 | -1) => {
      if (elegida) return setVista(vecino(elegida.area, delta));
      setVista(delta === 1 ? ESCRITORIOS[0].area : ESCRITORIOS[ESCRITORIOS.length - 1].area);
    },
    [elegida],
  );

  const cerrar = useCallback(() => {
    const area = elegida?.area;
    setVista("sala");
    if (area) requestAnimationFrame(() => botones.current[area]?.focus());
  }, [elegida]);

  // Al abrir el panel con el teclado, el foco va al panel.
  useEffect(() => {
    if (elegida) panelRef.current?.focus({ preventScroll: true });
  }, [elegida?.area]); // eslint-disable-line react-hooks/exhaustive-deps

  function teclas(e: React.KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("textarea, input, select")) return;
    if (e.key === "Escape" && vista !== "sala") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "ArrowRight" && elegida) {
      e.preventDefault();
      mover(1);
    } else if (e.key === "ArrowLeft" && elegida) {
      e.preventDefault();
      mover(-1);
    }
  }

  // Si se vuelve a la versión liviana, la próxima escena 3D arranca de cero.
  useEffect(() => {
    if (modo !== "3d") setListo3d(false);
  }, [modo]);

  const escena3d = modo === "3d";
  const animar = !pausa && !reducido;
  const tareaPorId = (id: string) => tareas.find((t) => t.id === id);

  return (
    <div className={`cz-of3 ${pausa || reducido ? "quieta" : ""}`} ref={raiz} onKeyDown={teclas}>
      <div className="cz-of3-marco" ref={marcoRef}>
      <div className="cz-of3-escena" data-modo={modo} data-vista={vista === "sala" || vista === "cenital" ? vista : "puesto"} data-listo={listo3d ? "1" : "0"}>
        {(!escena3d || !listo3d) && <Diorama puestos={puestos} vista={vista} conPanel={!!elegida} alElegir={ir} />}
        {escena3d && (
          <div className="cz-of3-canvas" aria-hidden="true" style={{ opacity: listo3d ? 1 : 0 }}>
            <Escena3D
              puestos={puestos}
              vista={vista}
              conPanel={!!elegida}
              animar={animar}
              activa={enPantalla && pestanaVisible}
              reducido={reducido}
              alElegir={ir}
              alListo={() => setListo3d(true)}
            />
          </div>
        )}

        <div className="cz-of3-controles" role="group" aria-label="Vista de la oficina">
          <button type="button" className="cz-of3-b" aria-pressed={vista === "sala"} onClick={() => ir("sala")}>
            Sala
          </button>
          <button type="button" className="cz-of3-b" aria-pressed={vista === "cenital"} onClick={() => ir("cenital")}>
            Ver toda la oficina
          </button>
          <span className="sep solo-pc" aria-hidden="true" />
          <button type="button" className="cz-of3-b solo-pc" onClick={() => mover(-1)} aria-label="Escritorio anterior">
            <span aria-hidden="true">‹</span> Anterior
          </button>
          <button type="button" className="cz-of3-b solo-pc" onClick={() => mover(1)} aria-label="Escritorio siguiente">
            Siguiente <span aria-hidden="true">›</span>
          </button>
        </div>

        <details className="cz-of3-ajustes">
          <summary>Ajustes de la vista</summary>
          <div>
            <button type="button" className="cz-of3-b" aria-pressed={pausa || reducido} onClick={() => setPausa((v) => !v)} disabled={reducido}>
              {pausa || reducido ? "Animaciones en pausa" : "Pausar animaciones"}
            </button>
            {webgl && (
              <button type="button" className="cz-of3-b" onClick={() => setForzado(escena3d ? "liviano" : "3d")}>
                {escena3d ? "Ver versión liviana" : "Ver en 3D"}
              </button>
            )}
          </div>
        </details>

      </div>
        {elegida && (
          <aside ref={panelRef} tabIndex={-1} className={`cz-of3-panel e-${elegida.estado}`} aria-label={`Escritorio ${elegida.nombre}`} style={{ ["--tono" as string]: elegida.color }}>
            <header>
              <div>
                <h3>{elegida.nombre}</h3>
                <span className={`cz-of3-chip ${elegida.estado}`}>
                  <IconoEstado estado={elegida.estado} />
                  {elegida.chip}
                </span>
              </div>
              <button type="button" className="cz-of3-b" onClick={cerrar} aria-label="Cerrar el panel del escritorio">
                Cerrar
              </button>
            </header>
            <p className="que">{elegida.queHace}</p>
            <div className="barra" role="progressbar" aria-label="Avance" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(elegida.progreso * 100)} aria-valuetext={`${Math.round(elegida.progreso * 100)} %`}>
              <span style={{ width: `${Math.round(elegida.progreso * 100)}%` }} />
            </div>
            <p className="rol">{elegida.rol}.</p>
            <div className="equipo" aria-label="Agentes de este escritorio">
              {elegida.equipo.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            {elegida.enMarcha.length > 0 && (
              <div role="group" aria-label="Tareas en marcha">
                <h4>En marcha</h4>
                <ul className="cz-of-tareas">{elegida.enMarcha.map((id) => tareaPorId(id)).filter((t): t is TareaOficina => !!t).map((t) => <ListaItem key={t.id}>{renderEnMarcha(t)}</ListaItem>)}</ul>
              </div>
            )}
            {elegida.listas.length > 0 && (
              <div role="group" aria-label="Para tu OK" className="cz-of-ok">
                <h4>Para tu OK</h4>
                <ul className="cz-of-tareas">{elegida.listas.map((id) => tareaPorId(id)).filter((t): t is TareaOficina => !!t).map((t) => <ListaItem key={t.id}>{renderAprobar(t)}</ListaItem>)}</ul>
              </div>
            )}
            {elegida.enMarcha.length === 0 && elegida.listas.length === 0 && elegida.ultima && <p className="ultima">Lo último que dejó: «{elegida.ultima.length > 140 ? `${elegida.ultima.slice(0, 137)}…` : elegida.ultima}»</p>}
            <footer>
              <button type="button" className="cz-of3-b" onClick={() => mover(-1)}>
                <span aria-hidden="true">‹</span> Anterior
              </button>
              <button type="button" className="cz-of3-b" onClick={() => mover(1)}>
                Siguiente <span aria-hidden="true">›</span>
              </button>
            </footer>
          </aside>
        )}
      </div>

      <p className="cz-of3-leyenda" aria-hidden="true">
        <span style={{ ["--c" as string]: COLOR_ESTADO.trabajando }}>Trabajando</span>
        <span style={{ ["--c" as string]: COLOR_ESTADO.listo }}>Listo para tu OK</span>
        <span style={{ ["--c" as string]: COLOR_ESTADO.libre }}>Libre</span>
        <small>Tocá un escritorio para verlo de cerca. Con el teclado, las flechas pasan de uno a otro y Esc vuelve a la sala.</small>
      </p>

      {/* La fuente de verdad: lista accesible, siempre presente. */}
      <ul className="cz-of3-lista" aria-label="Escritorios de la oficina">
        {puestos.map((p) => (
          <li key={p.area}>
            <button
              type="button"
              ref={(el) => {
                botones.current[p.area] = el;
              }}
              className={`cz-of3-item ${p.estado} ${vista === p.area ? "activa" : ""}`}
              style={{ ["--tono" as string]: p.color }}
              aria-pressed={vista === p.area}
              aria-label={descripcionAccesible(p)}
              onClick={() => {
                ir(vista === p.area ? "sala" : p.area);
                // En el celular la escena queda arriba: se la trae a la vista.
                marcoRef.current?.scrollIntoView({ block: "nearest", behavior: reducido ? "auto" : "smooth" });
              }}
            >
              <span className="nombre">
                <i className="punto" aria-hidden="true" />
                {p.nombre}
              </span>
              <span className={`cz-of3-chip ${p.estado}`}>
                <IconoEstado estado={p.estado} />
                {p.chip}
              </span>
              <span className="que">{p.queHace}</span>
              <span className="barra" aria-hidden="true">
                <span style={{ width: `${Math.round(p.progreso * 100)}%` }} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="cz-sr" role="status" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}

function ListaItem({ children }: { children: ReactNode }) {
  // Las tareas de la Oficina ya traen su propio <li>; acá solo se agrupan.
  return <>{children}</>;
}
