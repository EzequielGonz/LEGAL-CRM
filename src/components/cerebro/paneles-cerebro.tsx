"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface PanelCerebro {
  id: string;
  titulo: string;
  contenido: ReactNode;
  /** Solo se arma cuando se abre (por ejemplo, la esfera de puntos, que dibuja en un canvas). */
  perezoso?: boolean;
}

/**
 * «Ver más» del Cerebro (22/11): todas las secciones de siempre, plegadas en pestañas. Nada se
 * borra: cada panel sigue en la página (oculto con `hidden`) y se abre desde las pestañas, desde los
 * anillos de estado (enlaces `#alertas`, `#preguntas`, `#pendientes`) o con la dirección con `#sección`.
 * El estado inicial es siempre el mismo en servidor y navegador (todo cerrado): sin diferencias de hidratación.
 */
export function PanelesCerebro({ paneles }: { paneles: PanelCerebro[] }) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(paneles[0]?.id ?? "");
  const [vistos, setVistos] = useState<Record<string, boolean>>({});
  const raiz = useRef<HTMLDivElement>(null);
  const claves = paneles.map((p) => p.id).join(",");

  useEffect(() => {
    const ids = claves.split(",");
    const ir = () => {
      const id = window.location.hash.slice(1);
      if (!ids.includes(id)) return;
      setAbierto(true);
      setActivo(id);
      setVistos((v) => ({ ...v, [id]: true }));
      window.requestAnimationFrame(() => raiz.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    ir();
    window.addEventListener("hashchange", ir);
    return () => window.removeEventListener("hashchange", ir);
  }, [claves]);

  const elegir = (id: string) => {
    setActivo(id);
    setVistos((v) => ({ ...v, [id]: true }));
  };
  const teclas = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const sig = paneles[(i + paso + paneles.length) % paneles.length];
    elegir(sig.id);
    document.getElementById(`pestana-${sig.id}`)?.focus();
  };

  return (
    <div ref={raiz} className="cz-mas" data-abierto={abierto ? "1" : "0"}>
      <button type="button" className="cz-mas__boton" aria-expanded={abierto} aria-controls="cz-mas-cuerpo" onClick={() => setAbierto((a) => !a)}>
        <span>{abierto ? "Ver menos" : "Ver más del cerebro"}</span>
        <small>{paneles.length} secciones: lo que veo, alertas, preguntas, asistente, laboratorio y más</small>
        <svg className="cz-mas__flecha" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="cz-mas-cuerpo" hidden={!abierto}>
        <div role="tablist" aria-label="Secciones del cerebro" className="cz-pestanas">
          {paneles.map((p, i) => (
            <button
              key={p.id}
              id={`pestana-${p.id}`}
              type="button"
              role="tab"
              aria-selected={activo === p.id}
              aria-controls={`panel-${p.id}`}
              tabIndex={activo === p.id ? 0 : -1}
              onClick={() => elegir(p.id)}
              onKeyDown={(e) => teclas(e, i)}
            >
              {p.titulo}
            </button>
          ))}
        </div>
        {paneles.map((p) => (
          <div key={p.id} id={p.id} role="tabpanel" aria-labelledby={`pestana-${p.id}`} hidden={activo !== p.id} tabIndex={-1} className="cz-panel-caja">
            {p.perezoso && !vistos[p.id] ? null : p.contenido}
          </div>
        ))}
      </div>
    </div>
  );
}
