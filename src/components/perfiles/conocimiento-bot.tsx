"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Conocimiento del bot por versiones (25/10), en la pantalla de perfiles.
 * Muestra qué versión rige en cada rubro y, al desplegar, la compara con la
 * anterior con resultados reales. Permite cambiar de versión, ajustar el
 * reparto de la comparación y editar el contenido (título, disparadores y
 * texto). Ningún botón envía mensajes ni toca campañas.
 *
 * Colores: clases del tema claro (bg-white, text-slate-*); el modo oscuro
 * las invierte solo (tema-premium.css), igual que el resto del panel.
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
interface Asignacion {
  version: number;
  comparar_con: number | null;
  porcentaje: number;
  desde: string;
}
interface Perfil {
  rubro: string;
  asignacion: Asignacion | null;
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
  disparadores: string[] | null;
  contenido: string;
  fuente: string | null;
  verificado_el: string | null;
  activo: boolean;
}
type Cambios = { contenido?: string; activo?: boolean; titulo?: string; disparadores?: string[] };

const CAPA: Record<Item["capa"], string> = { general: "Base general", rubro: "Base del rubro", tema: "Tema", objecion: "Objeción" };
const TONO: Record<Perfil["veredicto"]["tono"], string> = {
  datos: "border-slate-200 bg-slate-50 text-slate-700",
  mejor: "border-emerald-200 bg-emerald-50 text-emerald-800",
  peor: "border-amber-200 bg-amber-50 text-amber-800",
  igual: "border-slate-200 bg-slate-50 text-slate-700",
};
const BTN = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100";
const BTN_ACTIVO = "rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white";
const CLAVE_ABIERTOS = "perfiles-conocimiento-abiertos";

function rige(a: Asignacion | null): string {
  if (!a) return "Rige v1";
  if (a.comparar_con) return `Comparando: v${a.version} ${a.porcentaje}% · v${a.comparar_con} ${100 - a.porcentaje}%`;
  return `Rige v${a.version}`;
}

export function ConocimientoBot({ nombres }: { nombres: Record<string, string> }) {
  const [dias, setDias] = useState(14);
  const [perfiles, setPerfiles] = useState<Perfil[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abiertos, setAbiertos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CLAVE_ABIERTOS) ?? "[]");
      if (Array.isArray(v)) setAbiertos(v.filter((x) => typeof x === "string"));
    } catch {
      /* sin almacenamiento: todo plegado */
    }
  }, []);

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

  function alternar(rubro: string) {
    setAbiertos((prev) => {
      const next = prev.includes(rubro) ? prev.filter((r) => r !== rubro) : [...prev, rubro];
      try {
        localStorage.setItem(CLAVE_ABIERTOS, JSON.stringify(next));
      } catch {
        /* nada */
      }
      return next;
    });
  }

  async function asignar(rubro: string, version: number, comparar_con: number | null, porcentaje = 50): Promise<boolean> {
    setAviso(null);
    const r = await fetch("/api/perfiles/conocimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "asignar", perfil: rubro, version, comparar_con, porcentaje }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setAviso(j.error ?? "No se pudo cambiar.");
      return false;
    }
    setAviso(`${nombres[rubro] ?? rubro}: listo. El cambio rige en menos de un minuto para las respuestas nuevas.`);
    leer(dias);
    return true;
  }

  return (
    <section aria-labelledby="conocimiento-titulo" className="mt-12 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="conocimiento-titulo" className="text-xl font-semibold text-slate-900">
            Conocimiento del bot
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            v1 es el bot como estaba el 24/10. v2 suma la biblioteca de ventas, objeciones y conocimiento de cada rubro, por debajo de las reglas, la ficha y el rol. Las cifras salen de conversaciones reales del período.
          </p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Período</span>
          <select className="tactil rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900" value={dias} onChange={(e) => { setPerfiles(null); setDias(Number(e.target.value)); }}>
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
      {aviso && <p role="status" className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{aviso}</p>}
      {!perfiles && !error && <p className="mt-4 text-sm text-slate-500">Cargando…</p>}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {perfiles?.map((p) => (
          <TarjetaRubro
            key={p.rubro}
            perfil={p}
            nombre={nombres[p.rubro] ?? p.rubro}
            abierto={abiertos.includes(p.rubro)}
            onAlternar={() => alternar(p.rubro)}
            onAsignar={asignar}
            onAviso={setAviso}
          />
        ))}
      </div>
    </section>
  );
}

const FILAS: [string, (t: Tasas) => string][] = [
  ["Conversaciones atendidas", (t) => t.conversaciones.toLocaleString("es-AR")],
  ["Siguieron la charla", (t) => `${t.tasa_sigue}%`],
  ["Captación", (t) => `${t.tasa_captacion}%`],
  ["Pasaron a una persona", (t) => `${t.tasa_escalado}%`],
  ["Bajas o detenciones", (t) => `${t.tasa_detencion}%`],
  ["Respuestas por conversación", (t) => String(t.turnos_por_conversacion)],
  ["Respuestas retenidas por el control", (t) => String(t.retenidos)],
  ["Tamaño del pedido al modelo (tokens)", (t) => (t.tokens_promedio == null ? "—" : Math.round(t.tokens_promedio).toLocaleString("es-AR"))],
];

function TarjetaRubro({
  perfil: p,
  nombre,
  abierto,
  onAlternar,
  onAsignar,
  onAviso,
}: {
  perfil: Perfil;
  nombre: string;
  abierto: boolean;
  onAlternar: () => void;
  onAsignar: (rubro: string, version: number, comparar_con: number | null, porcentaje?: number) => Promise<boolean>;
  onAviso: (t: string | null) => void;
}) {
  const a = p.asignacion;
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [reparto, setReparto] = useState<number>(a?.comparar_con ? a.porcentaje : 50);
  const [contenido, setContenido] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const idPanel = `conocimiento-${p.rubro}`;

  useEffect(() => {
    setReparto(a?.comparar_con ? a.porcentaje : 50);
  }, [a?.comparar_con, a?.porcentaje]);

  const opciones: { id: string; label: string; v: number; c: number | null }[] = [
    { id: "v1", label: "Usar v1", v: 1, c: null },
    { id: "v2", label: "Usar v2", v: 2, c: null },
    { id: "cmp", label: "Comparar v2 con v1", v: 2, c: 1 },
  ];

  async function verContenido() {
    if (contenido) return setContenido(false);
    setContenido(true);
    setItems(null);
    const r = await fetch(`/api/perfiles/conocimiento?items=1&perfil=${p.rubro}&version=2`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    setItems(r.ok ? j.items : []);
  }

  async function guardar(item: Item, cambios: Cambios): Promise<boolean> {
    const r = await fetch("/api/perfiles/conocimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "editar", version: 2, clave: item.clave, ...cambios }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      onAviso(j.error ?? "No se pudo guardar.");
      return false;
    }
    setItems((lista) => (lista ?? []).map((i) => (i.clave === item.clave ? { ...i, ...cambios } : i)));
    onAviso("Guardado. Queda en el historial de cambios y rige en menos de un minuto.");
    return true;
  }

  const q = filtro.trim().toLowerCase();
  const visibles = (items ?? []).filter((i) => !q || `${i.titulo} ${i.contenido} ${(i.disparadores ?? []).join(" ")}`.toLowerCase().includes(q));

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{nombre}</h3>
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-800">{rige(a)}</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        v1: <strong className="font-semibold text-slate-900 tabular-nums">{p.v1.conversaciones}</strong> conversaciones · v2:{" "}
        <strong className="font-semibold text-slate-900 tabular-nums">{p.v2.conversaciones}</strong>
      </p>

      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-controls={idPanel}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
      >
        <span>{abierto ? "Ocultar comparativa" : "Ver comparativa"}</span>
        <span aria-hidden="true" className={`transition-transform ${abierto ? "rotate-180" : ""}`}>▾</span>
      </button>

      {abierto && (
        <div id={idPanel} className="mt-3">
          <table className="w-full text-sm">
            <caption className="sr-only">Comparación de v1 y v2</caption>
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-1 font-medium">Resultado</th>
                <th scope="col" className="py-1 text-right font-medium">v1</th>
                <th scope="col" className="py-1 text-right font-medium">v2</th>
              </tr>
            </thead>
            <tbody>
              {FILAS.map(([label, f]) => (
                <tr key={label} className="border-t border-slate-200">
                  <th scope="row" className="py-1.5 pr-2 text-left font-normal text-slate-700">{label}</th>
                  <td className="py-1.5 text-right font-medium tabular-nums text-slate-900">{f(p.v1)}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums text-slate-900">{f(p.v2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${TONO[p.veredicto.tono]}`}>{p.veredicto.texto}</p>
          {p.fichas.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lo que más usó la v2</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {p.fichas.slice(0, 6).map((f) => (
                  <li key={f.clave} className="flex justify-between gap-2">
                    <span className="truncate text-slate-800">{f.titulo}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">
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
              return confirmar === o.id ? (
                <span key={o.id} className="flex gap-1">
                  <button type="button" className={BTN_ACTIVO} onClick={async () => { await onAsignar(p.rubro, o.v, o.c, reparto); setConfirmar(null); }}>
                    Confirmar {o.label.toLowerCase()}
                  </button>
                  <button type="button" className={BTN} onClick={() => setConfirmar(null)}>
                    Cancelar
                  </button>
                </span>
              ) : (
                <button key={o.id} type="button" disabled={actual} aria-pressed={actual} onClick={() => setConfirmar(o.id)} className={actual ? BTN_ACTIVO : BTN}>
                  {o.label}
                </button>
              );
            })}
          </div>

          {a?.comparar_con ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <label htmlFor={`reparto-${p.rubro}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reparto de conversaciones nuevas
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <input
                  id={`reparto-${p.rubro}`}
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={reparto}
                  onChange={(e) => setReparto(Number(e.target.value))}
                  className="w-40 accent-slate-900"
                />
                <span className="text-sm tabular-nums text-slate-800">
                  v2 {reparto}% · v1 {100 - reparto}%
                </span>
                {reparto !== a.porcentaje && (
                  <button type="button" className={BTN_ACTIVO} onClick={() => onAsignar(p.rubro, a.version, a.comparar_con, reparto)}>
                    Guardar reparto
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Cada conversación queda siempre con la misma versión; el cambio vale para las nuevas.</p>
            </div>
          ) : null}
        </div>
      )}

      <button type="button" onClick={verContenido} aria-expanded={contenido} className="mt-3 text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900">
        {contenido ? "Ocultar contenido" : `Ver y editar contenido de v2 (${p.contenido_v2.fichas} objeciones, ${p.contenido_v2.temas} temas)`}
      </button>
      {contenido && (
        <div className="mt-2">
          <label className="block">
            <span className="sr-only">Buscar en el contenido</span>
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar: precio, ART, usado, Google…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
            />
          </label>
          <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {!items && <p className="text-sm text-slate-500">Cargando…</p>}
            {items && visibles.length === 0 && <p className="text-sm text-slate-500">Nada coincide con la búsqueda.</p>}
            {visibles.map((i) => (
              <ItemEditable key={i.clave} item={i} onGuardar={guardar} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function ItemEditable({ item, onGuardar }: { item: Item; onGuardar: (i: Item, c: Cambios) => Promise<boolean> }) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(item.titulo);
  const [disparadores, setDisparadores] = useState((item.disparadores ?? []).join(", "));
  const [texto, setTexto] = useState(item.contenido);
  const conDisparadores = item.capa === "tema" || item.capa === "objecion";

  function cancelar() {
    setTitulo(item.titulo);
    setDisparadores((item.disparadores ?? []).join(", "));
    setTexto(item.contenido);
    setEditando(false);
  }

  async function guardar() {
    const cambios: Cambios = {};
    if (titulo.trim() !== item.titulo) cambios.titulo = titulo.trim();
    if (texto.trim() !== item.contenido) cambios.contenido = texto;
    if (conDisparadores) {
      const lista = disparadores.split(",").map((d) => d.trim()).filter(Boolean);
      if (lista.join("|") !== (item.disparadores ?? []).join("|")) cambios.disparadores = lista;
    }
    if (Object.keys(cambios).length === 0) return setEditando(false);
    if (await onGuardar(item, cambios)) setEditando(false);
  }

  return (
    <details className={`rounded-lg border border-slate-200 bg-white p-2 ${item.activo ? "" : "opacity-60"}`}>
      <summary className="cursor-pointer text-sm text-slate-900">
        <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">{CAPA[item.capa]}</span>
        {item.titulo}
        {!item.activo && <span className="ml-2 text-xs text-slate-500">(apagado)</span>}
      </summary>
      {editando ? (
        <div className="mt-2 space-y-2">
          <label className="block text-xs text-slate-600">
            Título
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900" />
          </label>
          {conDisparadores && (
            <label className="block text-xs text-slate-600">
              Cuándo se usa (frases separadas por coma; «*» al final para que valga cualquier terminación)
              <input value={disparadores} onChange={(e) => setDisparadores(e.target.value)} className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900" />
            </label>
          )}
          <label className="block text-xs text-slate-600">
            Texto que lee el bot
            <textarea className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900" rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </label>
        </div>
      ) : (
        <>
          {conDisparadores && (item.disparadores ?? []).length > 0 && (
            <p className="mt-2 text-xs text-slate-500">Se usa con: {(item.disparadores ?? []).join(", ")}</p>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.contenido}</p>
        </>
      )}
      <p className="mt-1 text-[11px] text-slate-500">
        {item.fuente}
        {item.verificado_el ? ` · norma verificada el ${item.verificado_el.split("-").reverse().join("/")}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {editando ? (
          <>
            <button type="button" className={BTN_ACTIVO} onClick={guardar}>
              Guardar
            </button>
            <button type="button" className={BTN} onClick={cancelar}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className={BTN} onClick={() => setEditando(true)}>
            Editar
          </button>
        )}
        <button type="button" className={BTN} onClick={() => onGuardar(item, { activo: !item.activo })}>
          {item.activo ? "Apagar" : "Encender"}
        </button>
      </div>
    </details>
  );
}
