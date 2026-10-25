"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Conocimiento del bot por versiones (25/10), en la pantalla de perfiles.
 * Muestra qué versión rige en cada rubro, la compara con la anterior con
 * resultados reales (conversaciones, siguen la charla, captación, bajas) y
 * permite cambiar de versión, repartir 50/50 para comparar o editar el
 * contenido. Ningún botón envía mensajes ni toca campañas.
 */

interface Tasas {
  version: number;
  conversaciones: number;
  turnos: number;
  retenidos: number;
  tokens_promedio: number | null;
  tasa_sigue: number;
  tasa_captacion: number;
  tasa_escalado: number;
  tasa_detencion: number;
  turnos_por_conversacion: number;
}
interface Perfil {
  rubro: string;
  asignacion: { version: number; comparar_con: number | null; porcentaje: number; desde: string } | null;
  v1: Tasas;
  v2: Tasas;
  veredicto: { tono: "datos" | "mejor" | "peor" | "igual"; texto: string };
  fichas: { clave: string; titulo: string; usos: number; siguieron: number }[];
  contenido_v2: { total: number; fichas: number; temas: number };
}
interface Item {
  clave: string;
  capa: "general" | "rubro" | "tema" | "objecion";
  rubro: string | null;
  titulo: string;
  contenido: string;
  fuente: string | null;
  verificado_el: string | null;
  activo: boolean;
}

const CAPA: Record<Item["capa"], string> = { general: "Base general", rubro: "Base del rubro", tema: "Tema", objecion: "Objeción" };
const TONO: Record<Perfil["veredicto"]["tono"], string> = {
  datos: "border-white/10 bg-white/5 text-slate-300",
  mejor: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  peor: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  igual: "border-white/10 bg-white/5 text-slate-200",
};

function rige(a: Perfil["asignacion"]): string {
  if (!a) return "Rige v1";
  if (a.comparar_con) return `Comparando: v${a.version} ${a.porcentaje}% · v${a.comparar_con} ${100 - a.porcentaje}%`;
  return `Rige v${a.version}`;
}

export function ConocimientoBot({ nombres }: { nombres: Record<string, string> }) {
  const [dias, setDias] = useState(14);
  const [perfiles, setPerfiles] = useState<Perfil[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);

  const leer = useCallback(async (d: number) => {
    try {
      const r = await fetch(`/api/perfiles/conocimiento?dias=${d}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No se pudo leer.");
      setPerfiles(j.perfiles);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message));
    }
  }, []);

  useEffect(() => {
    leer(dias);
  }, [dias, leer]);

  async function asignar(rubro: string, version: number, comparar_con: number | null) {
    setAviso(null);
    const r = await fetch("/api/perfiles/conocimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "asignar", perfil: rubro, version, comparar_con, porcentaje: 50 }),
    });
    const j = await r.json().catch(() => ({}));
    setConfirmar(null);
    if (!r.ok) return setAviso(j.error ?? "No se pudo cambiar.");
    setAviso(`${nombres[rubro] ?? rubro}: listo. El cambio rige en menos de un minuto para las respuestas nuevas.`);
    leer(dias);
  }

  async function verContenido(rubro: string) {
    if (abierto === rubro) return setAbierto(null);
    setAbierto(rubro);
    setItems(null);
    const r = await fetch(`/api/perfiles/conocimiento?items=1&perfil=${rubro}&version=2`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    setItems(r.ok ? j.items : []);
  }

  async function guardar(item: Item, cambios: { contenido?: string; activo?: boolean }): Promise<void> {
    const r = await fetch("/api/perfiles/conocimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "editar", version: 2, clave: item.clave, ...cambios }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setAviso(j.error ?? "No se pudo guardar.");
      return;
    }
    setItems((lista) => (lista ?? []).map((i) => (i.clave === item.clave ? { ...i, ...cambios } : i)));
    setAviso("Guardado. Queda en el historial de cambios.");
  }

  const filas: [string, (t: Tasas) => string][] = [
    ["Conversaciones atendidas", (t) => t.conversaciones.toLocaleString("es-AR")],
    ["Siguieron la charla", (t) => `${t.tasa_sigue}%`],
    ["Captación", (t) => `${t.tasa_captacion}%`],
    ["Pasaron a una persona", (t) => `${t.tasa_escalado}%`],
    ["Bajas o detenciones", (t) => `${t.tasa_detencion}%`],
    ["Respuestas por conversación", (t) => String(t.turnos_por_conversacion)],
    ["Respuestas retenidas por el control", (t) => String(t.retenidos)],
    ["Tamaño del pedido al modelo (tokens)", (t) => (t.tokens_promedio == null ? "—" : Math.round(t.tokens_promedio).toLocaleString("es-AR"))],
  ];

  return (
    <section aria-labelledby="conocimiento-titulo" className="mt-12 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200 shadow-xl sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="conocimiento-titulo" className="text-xl font-semibold text-white">
            Conocimiento del bot
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            v1 es el bot como estaba el 24/10. v2 suma la biblioteca de ventas, objeciones y conocimiento de cada rubro, por debajo de las reglas, la ficha y el rol. Las cifras salen de conversaciones reales del período.
          </p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Período</span>
          <select className="tactil rounded-lg border border-white/15 bg-slate-800 px-2 text-sm text-white" value={dias} onChange={(e) => { setPerfiles(null); setDias(Number(e.target.value)); }}>
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
      {aviso && <p role="status" className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm text-slate-100">{aviso}</p>}
      {!perfiles && !error && <p className="mt-4 text-sm text-slate-400">Cargando…</p>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {perfiles?.map((p) => {
          const a = p.asignacion;
          const opciones: { id: string; label: string; v: number; c: number | null }[] = [
            { id: "v1", label: "Usar v1", v: 1, c: null },
            { id: "v2", label: "Usar v2", v: 2, c: null },
            { id: "cmp", label: "Comparar 50/50", v: 2, c: 1 },
          ];
          return (
            <article key={p.rubro} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-white">{nombres[p.rubro] ?? p.rubro}</h3>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">{rige(a)}</span>
              </div>
              <table className="mt-3 w-full text-sm">
                <caption className="sr-only">Comparación de v1 y v2</caption>
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th scope="col" className="py-1 font-medium">Resultado</th>
                    <th scope="col" className="py-1 text-right font-medium">v1</th>
                    <th scope="col" className="py-1 text-right font-medium">v2</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(([label, f]) => (
                    <tr key={label} className="border-t border-white/5">
                      <th scope="row" className="py-1 pr-2 text-left font-normal text-slate-300">{label}</th>
                      <td className="py-1 text-right tabular-nums text-white">{f(p.v1)}</td>
                      <td className="py-1 text-right tabular-nums text-white">{f(p.v2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${TONO[p.veredicto.tono]}`}>{p.veredicto.texto}</p>
              {p.fichas.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lo que más usó la v2</p>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {p.fichas.slice(0, 6).map((f) => (
                      <li key={f.clave} className="flex justify-between gap-2">
                        <span className="truncate text-slate-200">{f.titulo}</span>
                        <span className="shrink-0 tabular-nums text-slate-400">
                          {f.usos} · {f.usos ? Math.round((f.siguieron / f.usos) * 100) : 0}% siguió
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {opciones.map((o) => {
                  const actual = (a?.version ?? 1) === o.v && (a?.comparar_con ?? null) === o.c;
                  const clave = `${p.rubro}:${o.id}`;
                  return confirmar === clave ? (
                    <span key={o.id} className="flex gap-1">
                      <button type="button" className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900" onClick={() => asignar(p.rubro, o.v, o.c)}>
                        Confirmar
                      </button>
                      <button type="button" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300" onClick={() => setConfirmar(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      key={o.id}
                      type="button"
                      disabled={actual}
                      aria-pressed={actual}
                      onClick={() => setConfirmar(clave)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${actual ? "bg-white/20 text-white" : "border border-white/15 text-slate-200 hover:bg-white/10"}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
                <button type="button" onClick={() => verContenido(p.rubro)} aria-expanded={abierto === p.rubro} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 underline-offset-2 hover:underline">
                  {abierto === p.rubro ? "Ocultar contenido" : `Ver contenido de v2 (${p.contenido_v2.fichas} objeciones, ${p.contenido_v2.temas} temas)`}
                </button>
              </div>
              {abierto === p.rubro && (
                <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {!items && <p className="text-sm text-slate-400">Cargando…</p>}
                  {items?.map((i) => (
                    <ItemEditable key={i.clave} item={i} onGuardar={guardar} />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ItemEditable({ item, onGuardar }: { item: Item; onGuardar: (i: Item, c: { contenido?: string; activo?: boolean }) => Promise<void> }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(item.contenido);
  return (
    <details className={`rounded-lg border border-white/10 p-2 ${item.activo ? "bg-white/5" : "bg-white/0 opacity-60"}`}>
      <summary className="cursor-pointer text-sm text-white">
        <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">{CAPA[item.capa]}</span>
        {item.titulo}
        {!item.activo && <span className="ml-2 text-xs text-slate-400">(apagado)</span>}
      </summary>
      {editando ? (
        <textarea className="mt-2 w-full rounded-lg border border-white/15 bg-slate-800 p-2 text-sm text-white" rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} />
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{item.contenido}</p>
      )}
      <p className="mt-1 text-[11px] text-slate-500">
        {item.fuente}
        {item.verificado_el ? ` · norma verificada el ${item.verificado_el.split("-").reverse().join("/")}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {editando ? (
          <>
            <button type="button" className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-900" onClick={async () => { await onGuardar(item, { contenido: texto }); setEditando(false); }}>
              Guardar
            </button>
            <button type="button" className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-300" onClick={() => { setTexto(item.contenido); setEditando(false); }}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200" onClick={() => setEditando(true)}>
            Editar
          </button>
        )}
        <button type="button" className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200" onClick={() => onGuardar(item, { activo: !item.activo })}>
          {item.activo ? "Apagar" : "Encender"}
        </button>
      </div>
    </details>
  );
}
