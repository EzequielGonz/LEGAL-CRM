"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EnlaceAvanzado, enfocarCampo, useNivel } from "@/components/nivel/nivel";

/**
 * Crear contenido · recorrido guiado (rediseño 17/10, bloque 3). El mismo
 * componente sirve en Simple y en Avanzado: en Avanzado suma el texto
 * editable a mano. Alternar de nivel no lo desmonta, y lo escrito queda
 * además en esta pestaña (sessionStorage) para volver de «Completar
 * configuración» sin perderlo. Guardar borrador, programar y publicar son
 * acciones distintas y cada una dice antes qué va a pasar.
 */
type Canal = "instagram" | "facebook";
interface Borrador {
  tema: string;
  indicePilar: number | null;
  canal: Canal;
  textoPropio: string;
  fecha: string;
}
interface Vista {
  pieza: { titulo: string; texto: string; svg: string; pilar: string };
  faltan: { texto: string; ancla: string }[];
  consecuencias: { borrador: string; programar: string; publicar: string; bloqueos: string[]; sePublicaria: boolean };
}
const VACIO: Borrador = { tema: "", indicePilar: null, canal: "instagram", textoPropio: "", fecha: "" };

async function pedir(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function CreadorGuiado({ perfil }: { perfil: string }) {
  const router = useRouter();
  const { cambiar } = useNivel();
  const clave = `crm:contenido:borrador:${perfil}`;
  const [b, setB] = useState<Borrador>(VACIO);
  const [pilares, setPilares] = useState<{ pilar: string; ejemplo: string }[]>([]);
  const [faltan, setFaltan] = useState<{ texto: string; ancla: string }[]>([]);
  const [vista, setVista] = useState<Vista | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cargado = useRef(false);

  // Borrador de esta pestaña + datos del brief (para no pedir lo que ya está configurado).
  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem(clave);
      if (guardado) setB({ ...VACIO, ...JSON.parse(guardado) });
    } catch {
      /* sin almacenamiento: se sigue sin borrador previo */
    }
    cargado.current = true;
    void pedir(`/api/contenido/brief?perfil=${perfil}`).then((r) => {
      if (!r.ok) return;
      setPilares(r.data.pilares ?? []);
      setFaltan((r.data.faltantes ?? []).filter((f: string) => !f.startsWith("logo")).map((f: string) => ({ texto: f, ancla: "" })));
    });
  }, [clave, perfil]);
  useEffect(() => {
    if (!cargado.current) return;
    try {
      sessionStorage.setItem(clave, JSON.stringify(b));
    } catch {
      /* sin almacenamiento */
    }
  }, [b, clave]);

  const cambiarB = (c: Partial<Borrador>) => {
    setB((x) => ({ ...x, ...c }));
    setVista(null);
  };
  const cuerpo = (accion: "vista" | "borrador" | "programar") => ({
    perfil,
    canal: b.canal,
    tema: b.tema,
    indicePilar: b.indicePilar ?? undefined,
    textoPropio: b.textoPropio,
    accion,
    fecha: b.fecha ? new Date(b.fecha).toISOString() : undefined,
  });

  const verVista = async () => {
    setBusy("vista");
    setMsg(null);
    const r = await pedir("/api/contenido/pieza", "POST", cuerpo("vista"));
    setBusy(null);
    if (!r.ok) {
      setMsg({ ok: false, text: r.data?.error ?? "No se pudo preparar la vista previa." });
      if (r.data?.campo) enfocarCampo(r.data.campo);
      return;
    }
    setVista(r.data);
    setFaltan(r.data.faltan ?? []);
  };

  const guardar = async (accion: "borrador" | "programar") => {
    setBusy(accion);
    setMsg(null);
    const r = await pedir("/api/contenido/pieza", "POST", cuerpo(accion));
    setBusy(null);
    if (!r.ok) {
      setMsg({ ok: false, text: r.data?.error ?? "No se pudo guardar." });
      if (r.data?.campo) enfocarCampo(r.data.campo);
      return;
    }
    const estado = r.data.estado === "programada" ? "Programada" : r.data.estado === "borrador" ? "Borrador guardado" : r.data.estado === "retenida" ? "Guardada y retenida" : "Guardada";
    setMsg({ ok: true, text: `${estado}. ${r.data.mensaje ?? ""}${r.data.bloqueos?.length ? ` Pendiente: ${r.data.bloqueos.join("; ")}.` : ""}` });
    try {
      sessionStorage.removeItem(clave);
    } catch {
      /* sin almacenamiento */
    }
    setB(VACIO);
    setVista(null);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <ol className="space-y-5">
        <li>
          <label htmlFor="guiado-tema" className="block text-sm font-semibold text-slate-900">
            1. ¿Qué querés comunicar?
          </label>
          <textarea
            id="guiado-tema"
            value={b.tema}
            onChange={(e) => cambiarB({ tema: e.target.value, indicePilar: null })}
            rows={2}
            maxLength={120}
            placeholder="Por ejemplo: qué conviene guardar después de un accidente"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {pilares.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-600" id="guiado-sugeridos">O elegí un tema sugerido para este perfil:</p>
              <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="guiado-sugeridos">
                {pilares.map((p, i) => (
                  <button
                    key={p.pilar}
                    type="button"
                    aria-pressed={b.indicePilar === i && !b.tema}
                    onClick={() => cambiarB({ indicePilar: i, tema: "" })}
                    className="chip-opcion tactil"
                  >
                    {p.pilar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </li>

        <li>
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">2. ¿Dónde se publica?</legend>
            <div id="guiado-canal" tabIndex={-1} className="mt-1.5 flex flex-wrap gap-2 outline-none">
              {(["instagram", "facebook"] as Canal[]).map((c) => (
                <label key={c} className="chip-opcion tactil cursor-pointer">
                  <input type="radio" name="guiado-canal" value={c} checked={b.canal === c} onChange={() => cambiarB({ canal: c })} className="sr-only" />
                  {c === "instagram" ? "Instagram · publicación con imagen" : "Facebook · publicación con imagen"}
                </label>
              ))}
            </div>
          </fieldset>
        </li>

        <li>
          <p className="text-sm font-semibold text-slate-900">3. Datos de la marca</p>
          {faltan.length === 0 ? (
            <p className="mt-1 text-sm text-slate-700">Se usan el nombre, los servicios, el tono y los colores ya configurados. No hace falta cargarlos de nuevo.</p>
          ) : (
            <div className="mt-1.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="note">
              <p className="font-medium">Para que la pieza pueda publicarse falta: {faltan.map((f) => f.texto).join(", ")}.</p>
              <p className="mt-1">Mientras tanto se puede guardar como borrador.</p>
              <EnlaceAvanzado href="#c-brief" className="tactil mt-1 inline-flex items-center font-semibold text-amber-950 underline underline-offset-2">
                Completar configuración
              </EnlaceAvanzado>
            </div>
          )}
        </li>

        <li>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-slate-900">4. Vista previa</p>
            <button type="button" onClick={verVista} disabled={!!busy} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60">
              {busy === "vista" ? "Preparando…" : vista ? "Actualizar vista previa" : "Ver vista previa"}
            </button>
            <button
              type="button"
              onClick={() => {
                cambiar("avanzado");
                if (vista && !b.textoPropio) setB((x) => ({ ...x, textoPropio: vista.pieza.texto }));
                enfocarCampo("guiado-texto");
              }}
              className="solo-simple tactil text-sm font-medium text-slate-800 underline underline-offset-2"
            >
              Personalizar
            </button>
          </div>
          {b.textoPropio && (
            <p className="solo-simple mt-2 text-sm text-slate-700">
              Se usa tu texto personalizado.{" "}
              <button type="button" onClick={() => cambiarB({ textoPropio: "" })} className="tactil underline">
                Volver al texto generado
              </button>
            </p>
          )}
          <div className="solo-avanzado mt-3">
            <label htmlFor="guiado-texto" className="block text-xs font-medium text-slate-700">
              Texto de la pieza (Avanzado · opcional: si lo dejás vacío se arma con el brief)
            </label>
            <textarea
              id="guiado-texto"
              value={b.textoPropio}
              onChange={(e) => cambiarB({ textoPropio: e.target.value })}
              rows={5}
              maxLength={2200}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {vista && !b.textoPropio && (
              <button type="button" onClick={() => cambiarB({ textoPropio: vista.pieza.texto })} className="tactil mt-1 text-sm underline">
                Partir del texto generado
              </button>
            )}
          </div>
          {vista && (
            <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,16rem)_1fr]">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100" role="img" aria-label={`Imagen de la pieza: ${vista.pieza.titulo}`} dangerouslySetInnerHTML={{ __html: vista.pieza.svg }} />
              <div className="min-w-0 space-y-2 text-sm">
                <p className="text-xs text-slate-600">Tema: {vista.pieza.pilar}</p>
                <p className="whitespace-pre-line text-slate-900 [overflow-wrap:anywhere]">{vista.pieza.texto}</p>
              </div>
            </div>
          )}
        </li>

        <li>
          <p className="text-sm font-semibold text-slate-900">5. ¿Qué hacemos con la pieza?</p>
          {!vista && <p className="mt-1 text-sm text-slate-600">Mirá la vista previa para ver qué pasa con cada opción.</p>}
          {vista && (
            <dl className="mt-2 space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="font-medium text-slate-900">Guardar borrador</dt>
                <dd className="mt-0.5 text-slate-700">{vista.consecuencias.borrador}</dd>
                <button type="button" onClick={() => guardar("borrador")} disabled={!!busy} className="tactil mt-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
                  {busy === "borrador" ? "Guardando…" : "Guardar borrador"}
                </button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="font-medium text-slate-900">Programar</dt>
                <dd className="mt-0.5 text-slate-700">{vista.consecuencias.programar}</dd>
                {vista.consecuencias.bloqueos.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-amber-900">
                    {vista.consecuencias.bloqueos.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Fecha y hora (Argentina)
                    <input id="guiado-fecha" type="datetime-local" value={b.fecha} onChange={(e) => setB((x) => ({ ...x, fecha: e.target.value }))} className="tactil mt-1 block rounded-lg border border-slate-300 px-2" />
                  </label>
                  <button type="button" onClick={() => guardar("programar")} disabled={!!busy} className="tactil rounded-lg border border-slate-400 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60">
                    {busy === "programar" ? "Guardando…" : "Programar"}
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 p-3">
                <dt className="font-medium text-slate-900">Publicar</dt>
                <dd className="mt-0.5 text-slate-700">{vista.consecuencias.publicar}</dd>
              </div>
            </dl>
          )}
        </li>
      </ol>
      <p role="status" aria-live="polite" className={msg ? (msg.ok ? "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900" : "rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800") : "sr-only"}>
        {msg?.text ?? ""}
      </p>
    </div>
  );
}
