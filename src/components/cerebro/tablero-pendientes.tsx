"use client";

import { useEffect, useState } from "react";
import { MAX_PEDIDO } from "@/lib/bandeja-claude";
import { ETIQUETA_RUBRO, pendientesDe, type ColumnaPendientes, type RubroCerebro } from "@/lib/cerebro/contenido";

/** Tablero de pendientes con filtro por rubro (lo de todos siempre se ve). */
const COLOR: Record<RubroCerebro, string> = {
  todos: "var(--pink)",
  juridico: "var(--vita)",
  coberturas_medicas: "var(--cob)",
  agencia_0km: "var(--auto)",
  marketing: "var(--mkt)",
};
const PERFIL_DE: Record<RubroCerebro, string> = { todos: "marketing", juridico: "juridico", coberturas_medicas: "coberturas_medicas", agencia_0km: "agencia_0km", marketing: "marketing" };
const CLAVE_HECHOS = "cerebro:pendientes-hechos";
function leerHechos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_HECHOS) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
const FILTROS: RubroCerebro[] = ["todos", "juridico", "marketing", "coberturas_medicas", "agencia_0km"];

export function TableroPendientes({ columnas }: { columnas: ColumnaPendientes[] }) {
  const [rubro, setRubro] = useState<RubroCerebro>("todos");
  const [hechos, setHechos] = useState<string[]>([]);
  const [pregunta, setPregunta] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  useEffect(() => setHechos(leerHechos()), []);

  /** Tildar «hecho»: pide confirmación y deja una PROPUESTA en la Bandeja para Claude (no cambia nada solo). */
  async function marcarHecho(texto: string, r: RubroCerebro) {
    setOcupado(true);
    setAviso(null);
    try {
      const pedido = `Propuesta: dar por hecho este pendiente de los dueños. Revisalo y, si es cierto, sacalo de la lista del cerebro. Pendiente: ${texto}`.slice(0, MAX_PEDIDO);
      const res = await fetch("/api/bandeja-claude", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ perfil: PERFIL_DE[r], pedido }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? "No se pudo dejar la propuesta.");
      const nuevos = [...hechos, texto];
      setHechos(nuevos);
      try { localStorage.setItem(CLAVE_HECHOS, JSON.stringify(nuevos)); } catch { /* sin almacenamiento */ }
      setAviso({ ok: true, texto: "Listo: quedó como propuesta en la Bandeja para Claude. Hasta que la confirme, el pendiente sigue en la lista del cerebro." });
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    } finally {
      setOcupado(false);
      setPregunta(null);
    }
  }
  return (
    <>
      <p role="status" aria-live="polite" className={aviso?.ok === false ? "cz-err" : "cz-ok"}>{aviso?.texto ?? ""}</p>
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
                <article key={p.texto} className={hechos.includes(p.texto) ? "cz-task cz-task--hecho" : "cz-task"} style={{ ["--tc" as string]: COLOR[p.rubro] }}>
                  <p>{p.texto}</p>
                  <div className="cz-tags">
                    <span className="cz-tag" style={{ color: COLOR[p.rubro] }}>
                      {ETIQUETA_RUBRO[p.rubro]}
                    </span>
                    {p.urgente && <span className="cz-tag urg">Urgente</span>}
                  </div>
                  {c.clave === "duenos" && (hechos.includes(p.texto) ? (
                    <small className="cz-muted">Hecho: propuesta enviada a la Bandeja.</small>
                  ) : pregunta === p.texto ? (
                    <div className="cz-ens-acc" role="group" aria-label="Confirmar">
                      <span>¿Lo marco como hecho? Queda como propuesta para Claude.</span>
                      <button type="button" className="cz-btn chico" disabled={ocupado} onClick={() => marcarHecho(p.texto, p.rubro)}>{ocupado ? "Guardando…" : "Sí"}</button>
                      <button type="button" className="cz-btn sec chico" disabled={ocupado} onClick={() => setPregunta(null)}>No</button>
                    </div>
                  ) : (
                    <button type="button" className="cz-btn sec chico" onClick={() => setPregunta(p.texto)}>Ya lo hice</button>
                  ))}
                </article>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
