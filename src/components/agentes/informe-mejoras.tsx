"use client";

import { useEffect, useState } from "react";
import { abrirAsistente } from "@/components/asistente/asistente-panel";
import { pedidoParaAsistente } from "@/lib/agentes/informe-mejoras-texto";

type Destino = "conocimiento" | "rol";

interface Propuesta {
  titulo: string;
  por_que: string;
  destino: Destino;
  capa: "tema" | "objecion" | "rubro";
  disparadores: string[];
  contenido: string;
  objetivo: string;
  tono: string;
}

interface Informe {
  id: string;
  creado_at: string;
  dias: number;
  conversaciones: number;
  estado: "listo" | "error";
  error: string | null;
  resultado: {
    resumen?: string;
    lo_que_funciona?: string[];
    hallazgos?: { titulo: string; detalle: string; conversaciones: number; gravedad: "alta" | "media" | "baja" }[];
    propuestas?: Propuesta[];
  };
  metricas: Record<string, number>;
  aplicadas: { indice: number; destino: Destino; ref: string; at: string }[];
}

const GRAVEDAD: Record<string, string> = {
  alta: "bg-red-50 text-red-800",
  media: "bg-amber-50 text-amber-800",
  baja: "bg-slate-100 text-slate-700",
};
const CAPA: Record<string, string> = { tema: "Tema del rubro", objecion: "Objeción o respuesta típica", rubro: "Vale para todas las conversaciones" };

/**
 * Informe de mejoras del bot (14/11). La IA relee las conversaciones reales
 * del período (sin teléfonos, documentos, correos ni nombres) y propone
 * mejoras. Cada propuesta se aplica a mano (se puede corregir el texto antes)
 * o se le pide al asistente. Aplicar solo suma: una ficha nueva al bot del
 * perfil o un rol nuevo sin asignar. Generar el informe no cambia nada.
 */
export function InformeMejoras({ perfil }: { perfil: string }) {
  const [informes, setInformes] = useState<Informe[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [dias, setDias] = useState(14);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function cargar() {
    try {
      const r = await fetch(`/api/agentes/informes?perfil=${perfil}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No se pudieron leer los informes.");
      setInformes(j.informes ?? []);
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]);

  async function generar() {
    setGenerando(true);
    setMsg(null);
    try {
      const r = await fetch("/api/agentes/informes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, dias }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo generar el informe.");
      if (j.informe) setInformes((prev) => [j.informe, ...prev.filter((i) => i.id !== j.informe.id)]);
      setMsg(j.ok ? { ok: true, text: "Informe listo. Revisá las propuestas: ninguna se aplica sola." } : { ok: false, text: j.error ?? "La IA no pudo terminar el informe." });
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setGenerando(false);
    }
  }

  const [ultimo, ...anteriores] = informes;

  return (
    <section id="informe-mejoras" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="informe-mejoras-titulo">
      <h2 id="informe-mejoras-titulo" className="text-lg font-semibold text-slate-900">
        Informe de mejoras del bot
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-700">
        La IA relee las conversaciones reales del período, sin teléfonos, documentos, correos ni nombres, y te dice qué funciona, qué falla y qué sumar. Cada propuesta la aplicás vos o se la pedís al asistente: se suma al bot de este perfil o queda como un rol nuevo. No cambia nada de lo que ya tiene el bot ni le escribe a nadie.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`informe-dias-${perfil}`} className="mb-1 block text-sm font-medium text-slate-700">
            Período
          </label>
          <select id={`informe-dias-${perfil}`} value={dias} onChange={(e) => setDias(Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold" disabled={generando}>
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
          </select>
        </div>
        <button type="button" className="btn-gold" onClick={generar} disabled={generando}>
          {generando ? "Leyendo las conversaciones…" : "Generar informe"}
        </button>
        {generando ? <p className="text-xs text-slate-600" role="status">Puede tardar hasta un minuto.</p> : null}
      </div>

      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={`mt-4 rounded-lg p-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      ) : null}

      {cargando ? (
        <p className="mt-4 text-sm text-slate-600">Cargando…</p>
      ) : !ultimo ? (
        <p className="mt-4 text-sm text-slate-600">Todavía no hay informes. Elegí el período y tocá «Generar informe».</p>
      ) : (
        <div className="mt-5">
          <VistaInforme perfil={perfil} informe={ultimo} onAplicada={cargar} />
          {anteriores.length ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Informes anteriores ({anteriores.length})</summary>
              <div className="mt-3 space-y-6">
                {anteriores.map((i) => (
                  <VistaInforme key={i.id} perfil={perfil} informe={i} onAplicada={cargar} />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </section>
  );
}

function VistaInforme({ perfil, informe, onAplicada }: { perfil: string; informe: Informe; onAplicada: () => void }) {
  const r = informe.resultado ?? {};
  const m = informe.metricas ?? {};
  return (
    <article className="space-y-4" aria-label={`Informe del ${new Date(informe.creado_at).toLocaleDateString("es-AR")}`}>
      <p className="text-xs text-slate-600">
        {new Date(informe.creado_at).toLocaleString("es-AR")} · últimos {informe.dias} días · {informe.conversaciones} conversaciones leídas
        {m.conversaciones != null ? ` · ${m.con_respuesta_de_la_persona ?? 0} con respuesta de la persona, ${m.con_respuesta_del_bot ?? 0} con respuesta del bot, ${m.atendidas_por_el_equipo ?? 0} con intervención del equipo` : ""}
      </p>
      {informe.estado === "error" ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          La IA no pudo terminar este informe. Probá generar otro.
        </p>
      ) : (
        <>
          {r.resumen ? <p className="text-sm text-slate-800">{r.resumen}</p> : null}
          {r.lo_que_funciona?.length ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Lo que funciona</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {r.lo_que_funciona.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.hallazgos?.length ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Qué encontró</h3>
              <ul className="mt-2 space-y-2">
                {r.hallazgos.map((h, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">
                      <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-medium ${GRAVEDAD[h.gravedad] ?? GRAVEDAD.media}`}>{h.gravedad === "alta" ? "Importante" : h.gravedad === "baja" ? "Menor" : "Para mejorar"}</span>
                      {h.titulo}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{h.detalle}</p>
                    {h.conversaciones ? <p className="mt-1 text-xs text-slate-600">Visto en {h.conversaciones} conversación(es)</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Propuestas</h3>
            {r.propuestas?.length ? (
              <ul className="mt-2 space-y-3">
                {r.propuestas.map((p, i) => (
                  <TarjetaPropuesta key={`${informe.id}-${i}`} perfil={perfil} informeId={informe.id} indice={i} propuesta={p} aplicadas={informe.aplicadas.filter((a) => a.indice === i)} onAplicada={onAplicada} />
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-600">La IA no encontró mejoras con evidencia suficiente en este período.</p>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function TarjetaPropuesta({
  perfil,
  informeId,
  indice,
  propuesta,
  aplicadas,
  onAplicada,
}: {
  perfil: string;
  informeId: string;
  indice: number;
  propuesta: Propuesta;
  aplicadas: { destino: Destino }[];
  onAplicada: () => void;
}) {
  const [titulo, setTitulo] = useState(propuesta.titulo);
  const [contenido, setContenido] = useState(propuesta.contenido);
  const [disparadores, setDisparadores] = useState(propuesta.disparadores.join(", "));
  const [busy, setBusy] = useState<Destino | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const yaBot = aplicadas.some((a) => a.destino === "conocimiento");
  const yaRol = aplicadas.some((a) => a.destino === "rol");
  const id = `prop-${informeId.slice(0, 8)}-${indice}`;

  async function aplicar(destino: Destino) {
    const confirmar =
      destino === "conocimiento"
        ? "Se suma como ficha nueva al bot de este perfil y empieza a usarse en las próximas respuestas. No cambia nada de lo que ya tiene. ¿Seguimos?"
        : "Se crea un rol nuevo, sin asignar a ninguna base ni campaña. ¿Seguimos?";
    if (!window.confirm(confirmar)) return;
    setBusy(destino);
    setMsg(null);
    try {
      const r = await fetch(`/api/agentes/informes/${informeId}/aplicar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfil,
          indice,
          destino,
          titulo,
          contenido,
          disparadores: disparadores.split(",").map((d) => d.trim()).filter(Boolean),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo aplicar.");
      setMsg({ ok: true, text: destino === "conocimiento" ? "Listo: sumada al bot del perfil. Se apaga desde Conocimiento si hace falta." : "Listo: rol creado. Cargalo a una base o campaña en «Roles por base»." });
      onAplicada();
    } catch (e) {
      setMsg({ ok: false, text: String((e as Error).message) });
    } finally {
      setBusy(null);
    }
  }

  const textoActual = { titulo, por_que: propuesta.por_que, contenido, disparadores: disparadores.split(",").map((d) => d.trim()).filter(Boolean) };

  return (
    <li className="rounded-lg border border-slate-200 p-3 sm:p-4">
      <label htmlFor={`${id}-titulo`} className="sr-only">
        Título de la propuesta
      </label>
      <input id={`${id}-titulo`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={140} className="w-full rounded-lg border border-transparent px-1 py-1 text-sm font-semibold text-slate-900 hover:border-slate-200 focus:border-slate-300 outline-none" />
      {propuesta.por_que ? <p className="mt-1 text-sm text-slate-700">{propuesta.por_que}</p> : null}
      <p className="mt-1 text-xs text-slate-600">
        Sugerido: {propuesta.destino === "rol" ? "rol nuevo para una base o campaña" : `sumar al bot del perfil · ${CAPA[propuesta.capa] ?? propuesta.capa}`}
      </p>
      <label htmlFor={`${id}-texto`} className="mt-3 block text-xs font-medium text-slate-700">
        Texto (lo podés corregir antes de aplicar)
      </label>
      <textarea id={`${id}-texto`} value={contenido} onChange={(e) => setContenido(e.target.value)} maxLength={4000} className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
      {propuesta.capa !== "rubro" ? (
        <>
          <label htmlFor={`${id}-disp`} className="mt-2 block text-xs font-medium text-slate-700">
            Cuándo se usa (palabras de la persona, separadas por coma)
          </label>
          <input id={`${id}-disp`} value={disparadores} onChange={(e) => setDisparadores(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </>
      ) : null}
      {msg ? (
        <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-lg p-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={propuesta.destino === "rol" ? "btn-suave" : "btn-gold"} disabled={!!busy || yaBot} onClick={() => aplicar("conocimiento")}>
          {yaBot ? "Sumada al bot ✓" : busy === "conocimiento" ? "Sumando…" : "Sumar al bot del perfil"}
        </button>
        <button type="button" className={propuesta.destino === "rol" ? "btn-gold" : "btn-suave"} disabled={!!busy || yaRol} onClick={() => aplicar("rol")}>
          {yaRol ? "Rol creado ✓" : busy === "rol" ? "Creando…" : "Crear como rol nuevo"}
        </button>
        <button type="button" className="btn-suave" onClick={() => abrirAsistente(pedidoParaAsistente(textoActual, propuesta.destino))}>
          Pedírselo al asistente
        </button>
      </div>
    </li>
  );
}
