"use client";

import { useState } from "react";
import { ETIQUETA_RUBRO, pendientesDe, type ColumnaPendientes, type RubroCerebro } from "@/lib/cerebro/contenido";

/** Tablero de pendientes con filtro por rubro (lo de todos siempre se ve). */
const COLOR: Record<RubroCerebro, string> = {
  todos: "var(--pink)",
  juridico: "var(--vita)",
  coberturas_medicas: "var(--cob)",
  agencia_0km: "var(--auto)",
  marketing: "var(--mkt)",
};
const FILTROS: RubroCerebro[] = ["todos", "juridico", "marketing", "coberturas_medicas", "agencia_0km"];

export function TableroPendientes({ columnas }: { columnas: ColumnaPendientes[] }) {
  const [rubro, setRubro] = useState<RubroCerebro>("todos");
  return (
    <>
      <div className="cz-rfilter" role="group" aria-label="Filtrar por rubro">
        {FILTROS.map((r) => (
          <button key={r} type="button" aria-pressed={rubro === r} onClick={() => setRubro(r)}>
            {ETIQUETA_RUBRO[r]}
          </button>
        ))}
      </div>
      <div className="cz-board">
        {columnas.map((c) => {
          const items = pendientesDe(c, rubro);
          return (
            <div key={c.clave} className="cz-col">
              <header>
                <div>
                  <h3>{c.titulo}</h3>
                  <small>{c.ayuda}</small>
                </div>
                <span>{items.length}</span>
              </header>
              {items.map((p) => (
                <article key={p.texto} className="cz-task" style={{ ["--tc" as string]: COLOR[p.rubro] }}>
                  <p>{p.texto}</p>
                  <div className="cz-tags">
                    <span className="cz-tag" style={{ color: COLOR[p.rubro] }}>
                      {ETIQUETA_RUBRO[p.rubro]}
                    </span>
                    {p.urgente && <span className="cz-tag urg">Urgente</span>}
                  </div>
                </article>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
