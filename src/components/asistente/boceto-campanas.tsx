"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { Propuesta } from "@/components/asistente/asistente-panel";
import { DIAS_SEMANA, NOMBRE_PERFIL, diasEnPalabras, lineaDelPlan, type PayloadPlan } from "@/lib/asistente/general";
import { ENTRENAMIENTO } from "@/lib/campanas/entrenamiento";

/**
 * Boceto del plan de campañas del asistente general (15/11): una tarjeta por
 * perfil con la base, cuántas personas, la línea, el ritmo, ejemplos de las
 * plantillas de inicio, el límite por día y los días estimados. Se puede
 * editar y destildar cada perfil antes de confirmar; el botón final dice la
 * cifra exacta. Lanzar pide la confirmación reforzada (sin código).
 */

const n = (v: number | null | undefined) => (typeof v === "number" ? v.toLocaleString("es-AR") : "–");
const fecha = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
};
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function rutaCampana(perfil: string, id: string) {
  return `${perfil === "juridico" ? "" : `/panel/${perfil}`}/campanas/${id}`;
}

/** Qué pasó con un plan confirmado, en palabras. */
function resultadoEnPalabras(p: Propuesta): { texto: string; tono: "ok" | "error" | "avance" } | null {
  const r = p.resultado ?? {};
  const d = p.detalle as PayloadPlan;
  const pasos = r.pasos ?? {};
  const bases = (pasos.bases ?? []).filter(Boolean) as { nombre: string; creados: number }[];
  const partes: string[] = [];
  if (bases.length) partes.push(`${bases.length === 1 ? `Base «${bases[0].nombre}» importada` : `${bases.length} bases importadas`}`);
  if (pasos.campana) partes.push(`campaña «${pasos.campana.nombre}» creada en borrador`);
  if (pasos.lanzada) partes.push("y lanzada: los envíos siguen el ritmo y el horario de la campaña");
  if (p.estado === "ejecutando") return { texto: `En curso: paso ${n((r.hechos ?? 0) + 1)} de ${n(r.total ?? 0)}${partes.length ? ` (${partes.join(", ")})` : ""}.`, tono: "avance" };
  if (p.estado === "error") return { texto: `${partes.length ? `${partes.join(", ")}. ` : ""}No se pudo seguir: ${r.error ?? "error desconocido"}. Lo hecho queda hecho; cuando lo resuelvas, tocá «Reintentar lo que falló».`, tono: "error" };
  if (p.estado === "ejecutada") return { texto: `Listo: ${partes.join(", ")}${!d?.lanzar ? ". No se envió nada: lanzala cuando quieras" : ""}.`, tono: "ok" };
  if (p.estado === "descartada") return { texto: "Descartada: no se hizo nada.", tono: "ok" };
  return null;
}

export function BocetoCampanas({ propuestas, alCambiar }: { propuestas: Propuesta[]; alCambiar: (p: Propuesta) => void }) {
  const pendientes = propuestas.filter((p) => p.estado === "propuesta");
  const [excluidas, setExcluidas] = useState<string[]>([]);
  const [entendido, setEntendido] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [guardando, setGuardando] = useState<string[]>([]);
  const [avance, setAvance] = useState<string | null>(null);
  const idTotales = useId();

  // Cambios del boceto que todavía se están guardando: confirmar los espera (un cambio hecho
  // justo antes de tocar Confirmar no se pierde ni llega tarde).
  const enVuelo = useRef(new Set<Promise<void>>());
  // Última versión de cada propuesta (lo que devolvió el último guardado), para no pisarla al confirmar.
  const ultimas = useRef(new Map<string, Propuesta>());
  ultimas.current = new Map(propuestas.map((x) => [x.id, x]));
  const incluidas = pendientes.filter((p) => !excluidas.includes(p.id));
  const ds = incluidas.map((p) => p.detalle as PayloadPlan);
  const totales = {
    campanas: ds.length,
    personas: ds.reduce((a, d) => a + (d?.boceto?.elegibles ?? 0), 0),
    lineas: new Set(ds.map((d) => d?.campana?.wasender_line_id)).size,
    lanzan: ds.filter((d) => d?.lanzar).length,
  };
  const reintentables = propuestas.filter((p) => p.estado === "error");
  const algunaLanza = totales.lanzan > 0 || reintentables.some((p) => (p.detalle as PayloadPlan)?.lanzar);

  /** Confirma (o sigue, o reintenta) una propuesta hasta que termina o falla. */
  async function ejecutarUna(p: Propuesta) {
    let actual = ultimas.current.get(p.id) ?? p;
    for (let vuelta = 0; vuelta < 60; vuelta++) {
      const res = await fetch(`/api/asistente/acciones/${p.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El servidor decide si hace falta con la propuesta guardada; si falta, avisa y no hace nada.
        body: JSON.stringify({ confirmar_envio: entendido }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const motivo = data?.error ?? "No se pudo confirmar.";
        actual = actual.estado === "propuesta" ? { ...actual, resultado: { aviso: motivo } } : { ...actual, estado: "error", resultado: { ...(actual.resultado ?? {}), error: motivo } };
        alCambiar(actual);
        return;
      }
      actual = { ...actual, estado: data.estado, resultado: data.resultado ?? {} };
      alCambiar(actual);
      if (data.estado !== "ejecutando") return;
      if (data.resultado?.ocupado) await espera(3000);
    }
  }

  async function confirmar(lista: Propuesta[]) {
    if (ocupado) return;
    setOcupado(true);
    try {
      await Promise.all([...enVuelo.current]);
      // Una por una: si una falla, las demás siguen.
      for (const [i, p] of lista.entries()) {
        setAvance(`Preparando ${i + 1} de ${lista.length}: ${NOMBRE_PERFIL[(p.detalle as PayloadPlan)?.perfil] ?? p.titulo}…`);
        await ejecutarUna(p);
      }
      setAvance(lista.length > 1 ? "Terminó: mirá el resultado de cada perfil abajo." : null);
    } finally {
      setOcupado(false);
      setEntendido(false);
    }
  }

  function guardar(p: Propuesta, ajustes: Record<string, unknown>) {
    const tarea = guardarYa(p, ajustes);
    enVuelo.current.add(tarea);
    void tarea.finally(() => enVuelo.current.delete(tarea));
  }

  async function guardarYa(p: Propuesta, ajustes: Record<string, unknown>) {
    setGuardando((g) => [...g, p.id]);
    try {
      const res = await fetch(`/api/asistente/acciones/${p.id}/plan`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ajustes }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alCambiar({ ...p, resultado: { aviso: data?.error ?? "No se pudo guardar el cambio." } });
      else alCambiar({ ...p, titulo: data.titulo, resumen: data.resumen, detalle: data.detalle, resultado: undefined });
    } finally {
      setGuardando((g) => g.filter((x) => x !== p.id));
    }
  }

  async function descartar(p: Propuesta) {
    const res = await fetch(`/api/asistente/acciones/${p.id}`, { method: "DELETE" });
    if (res.ok) alCambiar({ ...p, estado: "descartada" });
  }

  return (
    <section aria-labelledby={idTotales} className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">Boceto de campañas · propuesta</p>
      <h3 id={idTotales} className="mt-1 text-base font-semibold text-slate-950">
        {pendientes.length
          ? `${n(totales.campanas)} campaña(s) · ${n(totales.personas)} personas · ${n(totales.lineas)} línea(s)`
          : `${propuestas.length} campaña(s) del plan`}
      </h3>
      {pendientes.length > 0 && (
        <p className="mt-1 text-sm text-slate-600">
          Revisá cada perfil, cambiá lo que haga falta y destildá el que no quieras. Nada se hace hasta que confirmes.{" "}
          {totales.lanzan ? `${totales.lanzan} se lanza(n) al confirmar.` : "Ninguna se lanza: se crean en borrador y no envían nada."}
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {propuestas.map((p) => (
          <TarjetaPlan
            key={p.id}
            p={p}
            incluida={!excluidas.includes(p.id)}
            alIncluir={(si) => setExcluidas((x) => (si ? x.filter((y) => y !== p.id) : [...x, p.id]))}
            ocupado={ocupado}
            guardando={guardando.includes(p.id)}
            alGuardar={(a) => guardar(p, a)}
            alDescartar={() => descartar(p)}
            alReintentar={() => confirmar([p])}
            puedeReintentar={!(p.detalle as PayloadPlan)?.lanzar || entendido}
          />
        ))}
      </ul>

      {(incluidas.length > 0 || reintentables.length > 0) && algunaLanza && (
        <label className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-900">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={entendido} onChange={(e) => setEntendido(e.target.checked)} />
          <span>Revisé a quién, cuántas personas y desde qué línea: entiendo que al confirmar pueden empezar a salir mensajes reales.</span>
        </label>
      )}

      {incluidas.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-gold" disabled={ocupado || guardando.length > 0 || (totales.lanzan > 0 && !entendido)} onClick={() => confirmar(incluidas)}>
            {ocupado
              ? "Confirmando…"
              : `${totales.lanzan ? "Confirmar y lanzar" : "Confirmar"} ${n(totales.campanas)} campaña(s) · ${n(totales.personas)} personas`}
          </button>
          {guardando.length > 0 && <span className="text-sm text-slate-600">Guardando cambios…</span>}
        </div>
      )}
      <p role="status" aria-live="polite" className="mt-2 text-sm text-slate-700">
        {avance}
      </p>
    </section>
  );
}

function TarjetaPlan({
  p,
  incluida,
  alIncluir,
  ocupado,
  guardando,
  alGuardar,
  alDescartar,
  alReintentar,
  puedeReintentar,
}: {
  p: Propuesta;
  incluida: boolean;
  alIncluir: (si: boolean) => void;
  ocupado: boolean;
  guardando: boolean;
  alGuardar: (ajustes: Record<string, unknown>) => void;
  alDescartar: () => void;
  alReintentar: () => void;
  puedeReintentar: boolean;
}) {
  const d = p.detalle as PayloadPlan;
  const id = useId();
  const [abierta, setAbierta] = useState(true);
  const [nombre, setNombre] = useState(d?.campana?.nombre ?? "");
  const [limite, setLimite] = useState<string>(d?.campana?.daily_send_limit ? String(d.campana.daily_send_limit) : "");
  useEffect(() => {
    // En el teléfono las tarjetas arrancan plegadas para ver primero el total.
    if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches) setAbierta(false);
  }, []);
  useEffect(() => {
    setNombre(d?.campana?.nombre ?? "");
    setLimite(d?.campana?.daily_send_limit ? String(d.campana.daily_send_limit) : "");
  }, [d?.campana?.nombre, d?.campana?.daily_send_limit]);
  if (!d?.boceto) return null;
  const b = d.boceto;
  const linea = lineaDelPlan(d);
  const editable = p.estado === "propuesta" && !ocupado;
  const resultado = resultadoEnPalabras(p);
  const dias = d.campana.run_days ?? [];

  return (
    <li className={`rounded-xl border p-3 ${incluida || p.estado !== "propuesta" ? "border-slate-200 bg-slate-50" : "border-dashed border-slate-300 bg-white opacity-80"}`}>
      {p.estado === "propuesta" && (
        <label className="mb-1 flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-900">
          <input type="checkbox" className="h-5 w-5" checked={incluida} disabled={ocupado} onChange={(e) => alIncluir(e.target.checked)} />
          Incluir {NOMBRE_PERFIL[d.perfil]} al confirmar
        </label>
      )}
      <details open={abierta} onToggle={(e) => setAbierta((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="flex min-h-[44px] cursor-pointer list-none items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600">{NOMBRE_PERFIL[d.perfil]}</span>
            <span className="block truncate text-sm font-semibold text-slate-950">{d.campana.nombre}</span>
            <span className="block text-sm text-slate-700">
              {n(b.elegibles)} personas · {linea?.nombre ?? "sin línea"}
              {linea && !linea.conectada ? " (desconectada)" : ""} · {d.campana.daily_send_limit ? `${n(d.campana.daily_send_limit)} por día` : "límite de la línea"}
              {d.lanzar ? " · se lanza" : " · borrador"}
            </span>
          </span>
          <span aria-hidden="true" className="mt-1 text-slate-500">
            {abierta ? "▲" : "▼"}
          </span>
        </summary>

        <div className="mt-3 space-y-3 text-sm text-slate-800">
          <div>
            <p className="font-medium text-slate-950">Base nueva: «{d.nombre_base}»</p>
            <p className="text-slate-700">
              De «{d.archivo_nombre}»: {n(b.filas)} filas{d.partes > 1 ? `, se divide en ${d.partes} bases de hasta 5.000` : ""}. Teléfono: columna «{b.columna_telefono ?? "—"}»
              {b.columna_nombre ? ` · Nombre: columna «${b.columna_nombre}»` : " · sin columna de nombre"}.
            </p>
            <p className="text-slate-700">
              <strong className="text-base text-slate-950 tabular-nums">{n(b.elegibles)}</strong> personas para contactar. Quedan afuera {n(b.detenidos)} detenida(s) y {n(b.ya_contactados)} ya contactada(s)
              {b.filas > b.utilizables ? `; ${n(b.filas - b.utilizables)} fila(s) sin teléfono válido se guardan igual` : ""}.
            </p>
          </div>

          {linea && !linea.conectada && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-900">
              La línea «{linea.nombre}» está desconectada: se importa y se crea en borrador, pero no se puede lanzar hasta reconectarla (no arranca sola).
            </p>
          )}
          {b.rotacion.plantillas === 0 && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-900">El perfil no tiene plantillas de inicio listas: la campaña se crea, pero no se puede lanzar hasta sumarlas.</p>
          )}

          {editable ? (
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Ajustes de la campaña de {NOMBRE_PERFIL[d.perfil]}</legend>
              <label className="block">
                <span className="font-medium">Nombre de la campaña</span>
                <input className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} onBlur={() => nombre.trim() !== d.campana.nombre && alGuardar({ nombre })} />
              </label>
              <label className="block">
                <span className="font-medium">Línea de Wasender</span>
                <select className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900" value={d.campana.wasender_line_id} onChange={(e) => alGuardar({ wasender_line_id: e.target.value })}>
                  {b.lineas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                      {l.conectada ? "" : " (desconectada)"}
                      {l.limite ? ` · ${l.limite}/día` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-medium">Límite por día</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                  value={limite}
                  placeholder="El de la línea"
                  aria-describedby={`${id}-limite`}
                  onChange={(e) => setLimite(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onBlur={() => String(d.campana.daily_send_limit ?? "") !== limite && alGuardar({ daily_send_limit: limite === "" ? null : Number(limite) })}
                />
                <span id={`${id}-limite`} className="mt-1 block text-xs text-slate-600">
                  Con entrenamiento, {ENTRENAMIENTO.porDia} o menos; un número mayor lo apaga.
                </span>
              </label>
              <fieldset>
                <legend className="font-medium">Días de envío</legend>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5, 6].map((dia) => {
                    const marcado = dias.length === 0 || dias.includes(dia);
                    return (
                      <label key={dia} className="cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={marcado}
                          onChange={() => {
                            const base = dias.length ? dias : [1, 2, 3, 4, 5, 6];
                            const nuevos = marcado ? base.filter((x) => x !== dia) : [...base, dia];
                            if (nuevos.length) alGuardar({ run_days: nuevos });
                          }}
                        />
                        {/* El foco se ve en el recuadro del día (la casilla real está oculta). */}
                        <span
                          className={`grid min-h-[44px] min-w-[44px] place-items-center rounded-lg border px-2 text-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-900 ${marcado ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
                        >
                          {DIAS_SEMANA[dia]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <label className="flex min-h-[44px] items-start gap-2">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={d.campana.entrenamiento} onChange={(e) => alGuardar({ entrenamiento: e.target.checked })} />
                <span>
                  <span className="font-medium">Modo entrenamiento</span>
                  <span className="block text-xs text-slate-600">
                    {ENTRENAMIENTO.porDia} por día durante {ENTRENAMIENTO.dias} días, con esperas largas. Al día {ENTRENAMIENTO.dias} te pedimos el resultado. Nada se sube solo.
                  </span>
                </span>
              </label>
              <label className="flex min-h-[44px] items-start gap-2">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={d.lanzar} onChange={(e) => alGuardar({ lanzar: e.target.checked })} />
                <span>
                  <span className="font-medium">Lanzar al confirmar</span>
                  <span className="block text-xs text-slate-600">Sin tildar, queda en borrador y no envía nada.</span>
                </span>
              </label>
            </fieldset>
          ) : (
            <p className="text-slate-700">
              {diasEnPalabras(d.campana.run_days)} · {d.campana.daily_send_limit ? `${n(d.campana.daily_send_limit)} por día` : "límite de la línea"}
              {d.campana.entrenamiento ? " · modo entrenamiento" : ""}
            </p>
          )}

          <div>
            <p className="font-medium text-slate-950">Ritmo</p>
            <p className="text-slate-700">{b.ritmo}</p>
            <p className="text-slate-700">
              {b.estimado ? `Unos ${n(b.estimado.dias_de_envio)} día(s) de envío: termina cerca del ${fecha(b.estimado.termina)}.` : "Sin límite propio no se puede estimar cuántos días tarda: rige el límite de la línea."}
            </p>
          </div>

          <div>
            <p className="font-medium text-slate-950">
              Mensajes de ejemplo · rota al azar entre {n(b.rotacion.plantillas)} plantilla(s) de inicio ({n(b.rotacion.textos)} textos)
            </p>
            {b.ejemplos.length ? (
              <ul className="mt-1 space-y-1.5">
                {b.ejemplos.map((t, i) => (
                  <li key={i} className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-2 text-slate-800">
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-700">Sin textos de ejemplo.</p>
            )}
            <p className="mt-1 text-xs text-slate-600">«María» es un nombre de ejemplo: cada persona recibe su primer nombre.</p>
          </div>


          {p.estado === "propuesta" && (
            <button type="button" disabled={ocupado} onClick={alDescartar} className="tactil rounded-lg px-3 text-sm font-medium text-slate-700 underline hover:bg-slate-100">
              Descartar este perfil
            </button>
          )}
        </div>
      </details>

      {p.resultado?.aviso && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {p.resultado.aviso}
        </p>
      )}
      {guardando && (
        <p role="status" className="mt-2 text-sm text-slate-600">
          Guardando…
        </p>
      )}
      {resultado && (
        <p role={resultado.tono === "error" ? "alert" : "status"} className={`mt-2 text-sm font-medium ${resultado.tono === "error" ? "text-red-700" : resultado.tono === "ok" ? "text-emerald-700" : "text-slate-700"}`}>
          {resultado.texto}
        </p>
      )}
      {p.estado === "ejecutando" && !ocupado && (
        <div className="mt-2">
          <button type="button" className="btn-gold-sm" onClick={alReintentar}>
            Seguir donde quedó
          </button>
        </div>
      )}
      {p.estado === "error" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-gold-sm" disabled={ocupado || !puedeReintentar} onClick={alReintentar}>
            Reintentar lo que falló
          </button>
          {!puedeReintentar && <span className="text-xs text-slate-600">Marcá la confirmación de envío para reintentar el lanzamiento.</span>}
        </div>
      )}
      {(p.estado === "ejecutada" || p.estado === "error") && p.resultado?.pasos?.campana?.id && (
        <Link prefetch={false} href={rutaCampana(d.perfil, p.resultado.pasos.campana.id)} className="mt-2 inline-flex min-h-[44px] items-center text-sm font-medium text-slate-900 underline">
          Abrir la campaña
        </Link>
      )}
    </li>
  );
}
