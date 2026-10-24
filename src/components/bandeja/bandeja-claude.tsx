"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icono } from "@/components/ui/icono-seccion";
import type { SlugPerfil } from "@/lib/marca";
import {
  ETIQUETA_ESTADO,
  MAX_ENLACES,
  MAX_PEDIDO,
  estadoVisible,
  filaATarea,
  ordenarTareas,
  pareceDatoPersonal,
  puedeDescartar,
  resumenBandeja,
  type EstadoBandeja,
  type TareaBandeja,
} from "@/lib/bandeja-claude";

export type TareaVista = TareaBandeja & { perfil: SlugPerfil | null };

const CHIP: Record<EstadoBandeja, string> = {
  pendiente: "border-slate-300 bg-white text-slate-700",
  en_curso: "border-sky-300 bg-sky-50 text-sky-800",
  en_espera: "border-amber-300 bg-amber-50 text-amber-800",
  lista: "border-emerald-300 bg-emerald-50 text-emerald-800",
  descartada: "border-slate-200 bg-slate-100 text-slate-500",
};

const fecha = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23" }).format(new Date(iso))
    : "";

/**
 * Pantalla de la Bandeja para Claude: formulario para dejar una tarea y la
 * lista con su estado. Lo que necesita atención (en espera) va arriba y con
 * aviso. Desde acá solo se crea y se descarta (con motivo); el trabajo lo
 * hace Claude desde Cowork y deja acá el resultado.
 */
export function BandejaClaude({
  slug,
  perfiles,
  iniciales,
  errorLectura,
}: {
  slug: SlugPerfil;
  perfiles: { slug: SlugPerfil; nombre: string }[];
  iniciales: TareaVista[];
  errorLectura: boolean;
}) {
  const [tareas, setTareas] = useState<TareaVista[]>(iniciales);
  const [perfil, setPerfil] = useState<SlugPerfil>(slug);
  const [pedido, setPedido] = useState("");
  const [enlaces, setEnlaces] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verCerradas, setVerCerradas] = useState(false);

  const ahora = new Date();
  const ordenadas = useMemo(() => ordenarTareas(tareas), [tareas]);
  const resumen = useMemo(() => resumenBandeja(tareas), [tareas]);
  const abiertas = ordenadas.filter((t) => !["lista", "descartada"].includes(estadoVisible(t, ahora).estado));
  const cerradas = ordenadas.filter((t) => ["lista", "descartada"].includes(estadoVisible(t, ahora).estado));
  const nombreDe = (s: SlugPerfil | null) => perfiles.find((p) => p.slug === s)?.nombre ?? "Sin perfil";
  const datoEnPedido = pedido ? pareceDatoPersonal(pedido) : null;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/bandeja-claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, pedido, enlaces }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar la tarea.");
      const t = filaATarea(d.tarea);
      if (t) setTareas((prev) => [{ ...t, perfil }, ...prev]);
      setPedido("");
      setEnlaces("");
      setAviso("Listo: la tarea quedó pendiente. Para que Claude la tome, abrí un chat nuevo de Cowork en el proyecto y decí «ok».");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la tarea.");
    } finally {
      setEnviando(false);
    }
  }

  function reemplazar(t: TareaVista) {
    setTareas((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Bandeja para Claude</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Dejá acá tareas complejas (armar y cargar contenido, mejorar una landing, revisar algo del panel). Claude las toma desde Cowork, con el contexto del
          proyecto, cuando abrís un chat nuevo del proyecto y decís <strong>«ok»</strong>. Lo que cambie el panel o el código vuelve como propuesta para
          confirmar. Para consultas rápidas sigue estando <em>Pedile algo</em>.
        </p>
      </div>

      {errorLectura && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          No se pudo leer la bandeja. Probá recargar la página en unos segundos.
        </p>
      )}

      {resumen.en_espera > 0 && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <Icono nombre="alerta" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              {resumen.en_espera === 1 ? "Una tarea está en espera" : `${resumen.en_espera} tareas están en espera`}
            </p>
            <p className="mt-0.5">
              Claude no pudo terminarlas (por ejemplo, se agotó el uso del plan o falta una decisión tuya). Leé el motivo en cada una; la próxima vez que digas
              «ok» en Cowork las retoma.
            </p>
          </div>
        </div>
      )}

      {/* Nueva tarea */}
      <section aria-labelledby="bandeja-nueva" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 id="bandeja-nueva" className="text-base font-semibold text-slate-900">
          Nueva tarea
        </h2>
        <form onSubmit={crear} className="mt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Perfil</span>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as SlugPerfil)}
                className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              >
                {perfiles.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Enlaces de referencia (opcional)</span>
              <input
                type="text"
                inputMode="url"
                value={enlaces}
                onChange={(e) => setEnlaces(e.target.value)}
                placeholder="https://… (hasta 5, separados por espacio)"
                className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">¿Qué querés que haga Claude?</span>
            <textarea
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              rows={5}
              maxLength={MAX_PEDIDO}
              required
              aria-describedby="bandeja-ayuda"
              placeholder="Ej.: Armá el calendario de publicaciones de noviembre para Coberturas, con 1 post por día y 4 historias destacadas, y dejalo como propuesta."
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400"
            />
          </label>
          <p id="bandeja-ayuda" className={clsx("text-xs", datoEnPedido ? "font-medium text-amber-800" : "text-slate-500")}>
            {datoEnPedido
              ? "Parece que hay un correo o un número de teléfono o documento: la bandeja no guarda datos personales. Nombrá la base, la campaña o la landing."
              : `Sin datos personales de prospectos: nombrá la base, la campaña o la landing. Hasta ${MAX_PEDIDO} caracteres y ${MAX_ENLACES} enlaces.`}
          </p>
          {error && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {aviso && (
            <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {aviso}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={enviando || !pedido.trim()}
              className="tactil inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icono nombre="enviar" className="h-4 w-4" />
              {enviando ? "Guardando…" : "Dejar para Claude"}
            </button>
            <span className="text-xs text-slate-500">Guardarla no ejecuta nada: queda pendiente hasta que digas «ok» en Cowork.</span>
          </div>
        </form>
      </section>

      {/* Abiertas */}
      <section aria-labelledby="bandeja-abiertas" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="bandeja-abiertas" className="text-base font-semibold text-slate-900">
            Abiertas
          </h2>
          <p className="text-xs text-slate-600">
            <span className="tabular-nums">{resumen.en_espera}</span> en espera · <span className="tabular-nums">{resumen.en_curso}</span> en curso ·{" "}
            <span className="tabular-nums">{resumen.pendiente}</span> pendientes
          </p>
        </div>
        {abiertas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No hay tareas abiertas.</p>
        ) : (
          <ul className="space-y-3">
            {abiertas.map((t) => (
              <TarjetaTarea key={t.id} tarea={t} nombrePerfil={nombreDe(t.perfil)} ahora={ahora} onCambio={reemplazar} />
            ))}
          </ul>
        )}
      </section>

      {/* Cerradas */}
      {cerradas.length > 0 && (
        <section aria-labelledby="bandeja-cerradas" className="space-y-3">
          <button
            type="button"
            onClick={() => setVerCerradas((v) => !v)}
            aria-expanded={verCerradas}
            aria-controls="bandeja-lista-cerradas"
            className="tactil inline-flex items-center gap-2 rounded-lg px-1 text-base font-semibold text-slate-900"
            id="bandeja-cerradas"
          >
            Cerradas <span className="text-sm font-normal text-slate-600">({resumen.lista} listas · {resumen.descartada} descartadas)</span>
            <span aria-hidden="true" className="text-slate-500">
              {verCerradas ? "▴" : "▾"}
            </span>
          </button>
          {verCerradas && (
            <ul id="bandeja-lista-cerradas" className="space-y-3">
              {cerradas.map((t) => (
                <TarjetaTarea key={t.id} tarea={t} nombrePerfil={nombreDe(t.perfil)} ahora={ahora} onCambio={reemplazar} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TarjetaTarea({ tarea, nombrePerfil, ahora, onCambio }: { tarea: TareaVista; nombrePerfil: string; ahora: Date; onCambio: (t: TareaVista) => void }) {
  const v = estadoVisible(tarea, ahora);
  const [descartando, setDescartando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descartar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      const r = await fetch(`/api/bandeja-claude/${tarea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "descartar", motivo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo descartar.");
      const t = filaATarea(d.tarea);
      if (t) onCambio({ ...t, perfil: tarea.perfil });
      setDescartando(false);
    } catch (err: any) {
      setError(err?.message || "No se pudo descartar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <li
      className={clsx(
        "rounded-xl border border-l-4 bg-white p-4",
        v.estado === "en_espera" ? "border-amber-300 border-l-amber-500" : v.estado === "en_curso" ? "border-slate-200 border-l-sky-500" : v.estado === "lista" ? "border-slate-200 border-l-emerald-600" : "border-slate-200 border-l-slate-300"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 font-medium", CHIP[v.estado])}>{ETIQUETA_ESTADO[v.estado]}</span>
        <span className="font-medium text-slate-700">{nombrePerfil}</span>
        <span className="text-slate-500" suppressHydrationWarning>
          · {fecha(tarea.created_at)}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-900 [overflow-wrap:anywhere]">{tarea.pedido}</p>
      {tarea.enlaces.length > 0 && <ListaEnlaces enlaces={tarea.enlaces} titulo="Referencias" />}

      {v.aviso && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-medium">En espera: </span>
          {v.aviso}
        </p>
      )}
      {tarea.estado === "en_curso" && !v.deducido && (
        <p className="mt-3 text-sm text-sky-800" suppressHydrationWarning>
          Claude la está trabajando{tarea.tomada_at ? ` desde ${fecha(tarea.tomada_at)}` : ""}.
        </p>
      )}
      {tarea.resultado && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Resultado</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-900 [overflow-wrap:anywhere]">{tarea.resultado}</p>
          {tarea.resultado_enlaces.length > 0 && <ListaEnlaces enlaces={tarea.resultado_enlaces} titulo="Enlaces" />}
        </div>
      )}
      {tarea.estado === "descartada" && tarea.motivo_descarte && (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium">Descartada: </span>
          {tarea.motivo_descarte}
        </p>
      )}

      {puedeDescartar(tarea.estado) && !v.deducido && (
        <div className="mt-3">
          {descartando ? (
            <form onSubmit={descartar} className="flex flex-wrap items-end gap-2">
              <label className="block min-w-[14rem] flex-1 text-sm">
                <span className="font-medium text-slate-800">¿Por qué la descartás?</span>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  maxLength={500}
                  required
                  className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
              </label>
              <button type="submit" disabled={ocupado || motivo.trim().length < 3} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">
                {ocupado ? "Descartando…" : "Descartar"}
              </button>
              <button type="button" onClick={() => setDescartando(false)} className="tactil rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Cancelar
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setDescartando(true)} className="tactil rounded-lg px-1 text-sm font-medium text-slate-700 underline underline-offset-2">
              Descartar
            </button>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function ListaEnlaces({ enlaces, titulo }: { enlaces: string[]; titulo: string }) {
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-slate-600">{titulo}</p>
      <ul className="mt-1 space-y-0.5">
        {enlaces.map((e) => (
          <li key={e} className="truncate text-sm">
            <a href={e} target="_blank" rel="noopener noreferrer nofollow" className="text-slate-800 underline underline-offset-2 hover:text-slate-950">
              {e}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
