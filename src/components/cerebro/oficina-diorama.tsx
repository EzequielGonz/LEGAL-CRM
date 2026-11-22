"use client";

/**
 * Diorama CSS 3D de la Oficina: la versión liviana (celular, sin WebGL,
 * movimiento reducido y mientras carga la escena 3D). Cero librerías: ocho
 * puestos en un plano girado con perspectiva, personajes hechos con divs y el
 * mismo estado de cada escritorio. Es decorativo (aria-hidden): la fuente de
 * verdad es la lista accesible. Con movimiento reducido no hay animaciones.
 */
import { useEffect, useRef, useState } from "react";
import { DIORAMA, centroPuestoDiorama, proyeccionDiorama, type PuestoVisual, type Vista } from "@/lib/oficina/escena";
import type { Area } from "@/lib/oficina/reglas";

export function Diorama({ puestos, vista, conPanel, alElegir }: { puestos: PuestoVisual[]; vista: Vista; conPanel: boolean; alElegir: (a: Area) => void }) {
  const caja = useRef<HTMLDivElement>(null);
  // Un valor de arranque fijo: el servidor y el cliente dibujan lo mismo.
  const [esc, setEsc] = useState(0.62);

  useEffect(() => {
    const el = caja.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const medir = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // La sala girada ocupa ~1040 px de ancho y ~640 de alto; se deja que las esquinas de la alfombra se recorten un poco.
      setEsc(Math.max(0.3, Math.min(w / 1100, h / 720)));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let zoom = 1;
  let tx = 0;
  let ty = 0;
  if (vista === "cenital") {
    zoom = 1.08;
  } else if (vista !== "sala") {
    const i = puestos.findIndex((p) => p.area === vista);
    const { sx, sy } = proyeccionDiorama(Math.max(0, i));
    zoom = 2.1;
    tx = -sx * zoom + (conPanel ? -DIORAMA.ancho * 0.1 : 0);
    ty = -sy * zoom + 30;
  }

  return (
    <div ref={caja} className="cz-dio" data-vista={vista === "cenital" ? "cenital" : vista === "sala" ? "sala" : "puesto"} aria-hidden="true">
      <div className="cz-dio-noche" />
      <div className="cz-dio-camara" style={{ transform: `translate(${tx * esc}px, ${ty * esc}px) scale(${zoom * esc})` }}>
        <div className="cz-dio-sala" style={{ width: DIORAMA.ancho, height: DIORAMA.alto, transform: `rotateX(${vista === "cenital" ? 18 : DIORAMA.rotX}deg) rotateZ(${vista === "cenital" ? -2 : DIORAMA.rotZ}deg)` }}>
          <div className="piso" />
          <div className="alfombra" />
          {puestos.map((p) => {
            const c = centroPuestoDiorama(p.indice);
            return (
              <div
                key={p.area}
                className={`cz-dio-puesto ${p.estado} ${vista === p.area ? "foco" : ""}`}
                style={{ left: c.x, top: c.y, ["--tono" as string]: p.color, ["--rot" as string]: `${vista === "cenital" ? 2 : -DIORAMA.rotZ}deg`, ["--vuelco" as string]: `${vista === "cenital" ? -18 : -DIORAMA.rotX}deg` }}
                onClick={() => alElegir(p.area)}
              >
                <i className="aro" />
                <span className="sombra" />
                <span className="mampara" />
                <span className="escritorio">
                  <b className="tapa" />
                  <b className="frente" />
                </span>
                <span className="monitor">
                  <span className="led" />
                </span>
                <span className="de-pie">
                  <span className="agente">
                    <span className="destello" />
                    <span className="brazo i" />
                    <span className="brazo d" />
                    <span className="cuerpo" />
                    <span className="cabeza">
                      <span className="gorra" />
                      <span className="visera" />
                    </span>
                  </span>
                  <span className="etiqueta">
                    <i className="punto" />
                    {p.nombre}
                  </span>
                  {p.estado === "trabajando" && <span className="glifo">{p.glifos[p.indice % 3]}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
