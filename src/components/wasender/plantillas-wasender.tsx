"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Icono } from "@/components/ui/icono-seccion";
import type { SlugPerfil } from "@/lib/marca";
import { completar, validarPlantilla, type UsoPlantilla } from "@/lib/wasender/plantillas";
import { MINIMO_TEXTOS_CAMPANA, textosDistintos } from "@/lib/wasender/ritmo";

interface Plantilla {
  id: string;
  nombre: string;
  uso: UsoPlantilla;
  cuerpo: string;
  variantes: string[];
  activa: boolean;
  origen: "panel" | "meta";
  meta_nombre: string | null;
  archivada_at: string | null;
  motivo_archivo: string | null;
}

const USO: Record<UsoPlantilla, string> = { campana: "Primer mensaje (campaña)", seguimiento: "Seguimiento", manual: "Para mandar a mano" };

const VACIA = { id: "", nombre: "", uso: "campana" as UsoPlantilla, cuerpo: "", variantes: [] as string[], activa: true };

async function pedir(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`);
  return json;
}

/**
 * Plantillas de Wasender de un perfil: texto con {{nombre}}, {{asesor}} y
 * {{marca}}, variantes del mismo mensaje y vista previa. Se pueden copiar
 * como base las plantillas aprobadas de Meta (no se tocan las de Meta).
 */
export function PlantillasWasender({ slug, marca }: { slug: SlugPerfil; marca: string }) {
  const [lista, setLista] = useState<Plantilla[] | null>(null);
  const [edicion, setEdicion] = useState<typeof VACIA | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [verArchivadas, setVerArchivadas] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLista((await pedir(`/api/wasender/plantillas?perfil=${slug}`)).plantillas ?? []);
    } catch (e: any) {
      setError(e.message);
      setLista((l) => l ?? []);
    }
  }, [slug]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const problemas = useMemo(() => (edicion ? validarPlantilla(edicion) : []), [edicion]);
  const ejemplo = { nombre: "Laura", asesor: "Martín", marca };

  async function copiarMeta() {
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const r = await pedir("/api/wasender/plantillas", { method: "POST", body: JSON.stringify({ perfil: slug, accion: "copiar_meta" }) });
      setAviso(
        `Copiadas ${r.copiadas} plantillas de Meta en los cuatro perfiles${r.yaEstaban ? ` (${r.yaEstaban} ya estaban)` : ""}.` +
          (r.paraRevisar?.length ? ` Quedaron inactivas para revisar (tienen datos que no se pueden completar solos, como la hora): ${r.paraRevisar.join(", ")}.` : "")
      );
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!edicion || problemas.length) return;
    setOcupado(true);
    setError(null);
    try {
      const cuerpo = JSON.stringify({ perfil: slug, ...edicion });
      if (edicion.id) await pedir(`/api/wasender/plantillas/${edicion.id}`, { method: "PATCH", body: cuerpo });
      else await pedir("/api/wasender/plantillas", { method: "POST", body: cuerpo });
      setEdicion(null);
      setAviso("Plantilla guardada.");
      await cargar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function archivar(p: Plantilla) {
    const motivo = window.prompt(`¿Por qué archivás «${p.nombre}»? (no se borra: queda guardada con el motivo)`);
    if (!motivo?.trim()) return;
    try {
      await pedir(`/api/wasender/plantillas/${p.id}`, { method: "POST", body: JSON.stringify({ perfil: slug, accion: "archivar", motivo }) });
      await cargar();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const activas = (lista ?? []).filter((p) => !p.archivada_at);
  const archivadas = (lista ?? []).filter((p) => p.archivada_at);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Plantillas de Wasender · {marca}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Textos propios, sin aprobación de Meta. Usá {"{{nombre}}"}, {"{{asesor}}"} y {"{{marca}}"}. Sumá variantes del mismo mensaje: mandar el mismo texto a muchos números es lo que más bloquea.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{aviso}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setEdicion({ ...VACIA })} className="tactil inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
          <Icono nombre="mas" className="h-4 w-4" />
          Nueva plantilla
        </button>
        <button type="button" disabled={ocupado} onClick={copiarMeta} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {ocupado ? "Copiando…" : "Copiar las plantillas de Meta (los cuatro perfiles)"}
        </button>
      </div>

      {edicion && (
        <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">{edicion.id ? "Editar plantilla" : "Nueva plantilla"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Nombre</span>
              <input value={edicion.nombre} maxLength={80} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Para qué se usa</span>
              <select value={edicion.uso} onChange={(e) => setEdicion({ ...edicion, uso: e.target.value as UsoPlantilla })} className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                {(Object.keys(USO) as UsoPlantilla[]).map((u) => (
                  <option key={u} value={u}>{USO[u]}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Mensaje</span>
            <textarea value={edicion.cuerpo} rows={4} onChange={(e) => setEdicion({ ...edicion, cuerpo: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed" />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Variantes (el mismo mensaje dicho de otra forma)</p>
            {edicion.variantes.map((v, i) => (
              <div key={i} className="flex gap-2">
                <textarea value={v} rows={3} onChange={(e) => setEdicion({ ...edicion, variantes: edicion.variantes.map((x, j) => (j === i ? e.target.value : x)) })} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed" />
                <button type="button" onClick={() => setEdicion({ ...edicion, variantes: edicion.variantes.filter((_, j) => j !== i) })} className="tactil self-start rounded-lg px-2 text-sm text-slate-500 underline">Quitar</button>
              </div>
            ))}
            {edicion.variantes.length < 10 && (
              <button type="button" onClick={() => setEdicion({ ...edicion, variantes: [...edicion.variantes, ""] })} className="tactil text-sm font-medium text-slate-700 underline">Agregar variante</button>
            )}
          </div>
          {edicion.cuerpo.trim() && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-xs font-medium text-slate-500">Así le llega a «{ejemplo.nombre}»:</p>
              <p className="mt-1 whitespace-pre-line">{completar(edicion.cuerpo, ejemplo)}</p>
            </div>
          )}
          {problemas.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-amber-800">
              {problemas.map((p, i) => (
                <li key={i}>{p.campo}: {p.texto}</li>
              ))}
            </ul>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={edicion.activa} onChange={(e) => setEdicion({ ...edicion, activa: e.target.checked })} />
            Activa (se puede elegir en campañas y seguimientos)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={ocupado || problemas.length > 0} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">Guardar</button>
            <button type="button" onClick={() => setEdicion(null)} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700">Cancelar</button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        {lista === null ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : activas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Todavía no hay plantillas. Creá una o copiá las de Meta como base.</p>
        ) : (
          <ul className="space-y-3">
            {activas.map((p) => (
              <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {USO[p.uso]}
                      {p.variantes.length ? ` · ${p.variantes.length + 1} textos` : " · 1 texto"}
                      {/* 12/11: el ritmo nuevo pide 4 textos distintos para salir en una campaña. */}
                      {p.uso === "campana"
                        ? textosDistintos(p.cuerpo, p.variantes) >= MINIMO_TEXTOS_CAMPANA
                          ? " · lista para campañas"
                          : ` · le faltan ${MINIMO_TEXTOS_CAMPANA - textosDistintos(p.cuerpo, p.variantes)} textos para salir en campañas`
                        : ""}
                      {p.origen === "meta" ? " · copiada de Meta" : ""}
                    </p>
                  </div>
                  <span className={clsx("rounded-full border px-2.5 py-0.5 text-xs font-medium", p.activa ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800")}>
                    {p.activa ? "Activa" : "Para revisar"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{p.cuerpo}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button type="button" onClick={() => setEdicion({ id: p.id, nombre: p.nombre, uso: p.uso, cuerpo: p.cuerpo, variantes: p.variantes, activa: p.activa })} className="tactil font-medium text-slate-800 underline">Editar</button>
                  <button type="button" onClick={() => archivar(p)} className="tactil text-slate-500 underline">Archivar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {archivadas.length > 0 && (
        <section className="space-y-2">
          <button type="button" onClick={() => setVerArchivadas((v) => !v)} className="tactil text-sm font-medium text-slate-700 underline">
            {verArchivadas ? "Ocultar" : "Ver"} archivadas ({archivadas.length})
          </button>
          {verArchivadas && (
            <ul className="space-y-2">
              {archivadas.map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{p.nombre}</span> · {p.motivo_archivo}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
