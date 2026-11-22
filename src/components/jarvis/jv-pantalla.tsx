"use client";

import { useEffect, useRef, useState } from "react";
import type { Propuesta } from "@/lib/asistente/eventos";
import { BotonesNeumorficos } from "@/components/jarvis/jv-neumorfico";
import { JvConfirmar } from "@/components/jarvis/jv-confirmar";

/**
 * Piezas de cliente de /asistente (vuelta 6).
 * - `JvParallax`: cabecera con capas que se mueven a distinta velocidad al mover el mouse o bajar (marca 5
 *   del dueño en el video). Cada hijo con `data-profundidad` (0 a 1) se corre más o menos. Quieto con
 *   «reducir movimiento».
 * - `AccesosNeumorficos`: los accesos de Jarvis como botones neumórficos; avisan al chat con un evento.
 */
export function JvParallax({ children, className }: { children: React.ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = caja.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const capas = Array.from(el.querySelectorAll<HTMLElement>("[data-profundidad]"));
    let px = 0;
    let py = 0;
    let cuadro = 0;
    const aplicar = () => {
      cuadro = 0;
      const scroll = Math.min(200, window.scrollY);
      for (const c of capas) {
        const k = Number(c.dataset.profundidad) || 0;
        c.style.transform = `translate3d(${(px * 26 * k).toFixed(1)}px, ${(py * 18 * k + scroll * 0.25 * k).toFixed(1)}px, 0)`;
      }
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(aplicar);
    };
    const alMover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = (e.clientX - (r.left + r.width / 2)) / r.width;
      py = (e.clientY - (r.top + r.height / 2)) / r.height;
      pedir();
    };
    el.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("scroll", pedir, { passive: true });
    return () => {
      el.removeEventListener("pointermove", alMover);
      window.removeEventListener("scroll", pedir);
      cancelAnimationFrame(cuadro);
    };
  }, []);
  return (
    <div ref={caja} className={className}>
      {children}
    </div>
  );
}

export function AccesosNeumorficos({ accesos }: { accesos: { titulo: string; texto: string }[] }) {
  return (
    <BotonesNeumorficos
      acciones={accesos.map((a) => ({ etiqueta: a.titulo, pedido: a.texto }))}
      alElegir={(a) => {
        window.dispatchEvent(new CustomEvent("jarvis:acceso", { detail: a.etiqueta }));
        document.getElementById("asistente-chat")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }}
    />
  );
}

/** Lo que espera el OK en los cuatro perfiles: tarjetas de vidrio sobre círculos de color, con «¿Lo hago?». */
export function PropuestasVidrio({ grupos }: { grupos: { perfil: string; nombre: string; propuestas: Propuesta[] }[] }) {
  const [estado, setEstado] = useState(grupos);
  const total = estado.reduce((a, g) => a + g.propuestas.filter((p) => p.estado === "propuesta").length, 0);
  return (
    <section aria-labelledby="jv-ok-g" className="jv-lado-sec">
      <h2 id="jv-ok-g" className="jv-sec-titulo">
        Esperan tu OK {total > 0 && <b className="jv-cuenta">{total}</b>}
      </h2>
      <div className="jv-vidrio-escena">
        <span className="jv-circ jv-circ-1" aria-hidden="true" />
        <span className="jv-circ jv-circ-2" aria-hidden="true" />
        <span className="jv-circ jv-circ-3" aria-hidden="true" />
        {estado.every((g) => g.propuestas.length === 0) && (
          <div className="jv-vidrio">
            <p className="jv-vidrio-titulo">Todo al día</p>
            <p className="jv-vidrio-texto">No hay propuestas esperando tu decisión en ningún perfil.</p>
          </div>
        )}
        {estado.map((g) =>
          g.propuestas.map((p) => (
            <div key={p.id} className="jv-vidrio-grupo">
              <span className="jv-perfil-et">{g.nombre}</span>
              <JvConfirmar p={p} alCambiar={(np) => setEstado((e) => e.map((x) => (x.perfil === g.perfil ? { ...x, propuestas: x.propuestas.map((y) => (y.id === np.id ? np : y)) } : x)))} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
