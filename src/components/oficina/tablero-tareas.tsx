"use client";

import { useState } from "react";
import { TarjetaTarea } from "@/components/oficina/tarea-oficina";
import { colasDeTareas, type ColaOficina as Pestana, type TareaOficina } from "@/lib/oficina/reglas";

/**
 * Tablero de tareas de la Oficina (27/11): debajo de la barra, con las
 * mismas tarjetas del panel lateral. Cada pestaña es una cola: mesa de
 * entrada (con «Que lo haga Gemini»), en marcha, para repasar (lo de Gemini
 * que Claude todavía no miró), para tu OK y cerradas. Avance y resultado
 * visibles en cada tarea.
 */
const TITULOS: Record<Pestana, string> = {
  entrada: "Mesa de entrada",
  marcha: "En marcha",
  repasar: "Para repasar",
  ok: "Para tu OK",
  cerradas: "Cerradas",
};

const VACIO: Record<Pestana, string> = {
  entrada: "No hay tareas esperando. Dejá una desde «Nueva tarea».",
  marcha: "Nadie está trabajando ahora.",
  repasar: "Nada para repasar: todo lo que hizo Gemini ya pasó por Claude.",
  ok: "Cuando una entrega esté lista y repasada, aparece acá.",
  cerradas: "Todavía no hay tareas aprobadas ni descartadas.",
};

export function TableroTareas({ tareas, ahora, alCambiar }: { tareas: TareaOficina[]; ahora: Date | null; alCambiar: () => Promise<void> }) {
  const colas = colasDeTareas(tareas);
  const [pestana, setPestana] = useState<Pestana>(colas.repasar.length ? "repasar" : "entrada");
  const lista = colas[pestana];
  const orden = Object.keys(TITULOS) as Pestana[];

  // Pestañas con teclado (auditoría 27/11): flechas, Inicio y Fin; solo la activa entra con Tab.
  function teclas(e: React.KeyboardEvent, i: number) {
    const n = orden.length;
    const j =
      e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (j === null) return;
    e.preventDefault();
    setPestana(orden[j]);
    document.getElementById(`oficina-tab-${orden[j]}`)?.focus();
  }
  return (
    <section className="of3-tablero" aria-labelledby="oficina-tablero">
      <h2 id="oficina-tablero" className="of3-tablero-t">
        Tareas
      </h2>
      <div className="of3-seg" role="tablist" aria-label="Colas de tareas">
        {orden.map((p, i) => (
          <button
            key={p}
            type="button"
            role="tab"
            id={`oficina-tab-${p}`}
            aria-selected={pestana === p}
            aria-controls="oficina-tab-panel"
            tabIndex={pestana === p ? 0 : -1}
            className="of3-neu"
            onClick={() => setPestana(p)}
            onKeyDown={(e) => teclas(e, i)}
          >
            {TITULOS[p]} · {colas[p].length}
          </button>
        ))}
      </div>
      <div id="oficina-tab-panel" role="tabpanel" aria-labelledby={`oficina-tab-${pestana}`}>
        {pestana === "repasar" && colas.repasar.length > 0 && (
          <p className="cz-muted">Lo hizo Gemini y Claude todavía no lo repasó: no se puede aprobar hasta ese repaso. Tocá «Arrancar ahora» para que Claude lo tome primero.</p>
        )}
        {lista.length ? (
          <ul className="cz-of-tareas">
            {lista.map((t) => (
              <TarjetaTarea key={t.id} t={t} todas={tareas} ahora={ahora} alCambiar={alCambiar} />
            ))}
          </ul>
        ) : (
          <p className="cz-muted">{VACIO[pestana]}</p>
        )}
      </div>
    </section>
  );
}
