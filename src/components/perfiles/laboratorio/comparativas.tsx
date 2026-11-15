"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AYUDA, CAMPO, ETIQUETA, Mensajes, SUBTITULO, fecha, pedir, perfilesDe } from "./comun";
import type { PropsPestana } from "./laboratorio-bot";

// El informe de mejoras ya existe (Bot IA): se reutiliza tal cual, cargado solo si se abre.
const InformeMejoras = dynamic(() => import("@/components/agentes/informe-mejoras").then((m) => m.InformeMejoras), { ssr: false, loading: () => <p className="text-sm text-slate-700" role="status">Cargando el informe…</p> });

interface Cifras {
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

const FILAS: [string, (t: Cifras) => string][] = [
  ["Conversaciones atendidas", (t) => t.conversaciones.toLocaleString("es-AR")],
  ["Siguieron la charla", (t) => `${t.tasa_sigue} %`],
  ["Captación", (t) => `${t.tasa_captacion} %`],
  ["Pasaron a una persona", (t) => `${t.tasa_escalado} %`],
  ["Bajas o detenciones", (t) => `${t.tasa_detencion} %`],
  ["Respuestas por conversación", (t) => String(t.turnos_por_conversacion)],
  ["Respuestas frenadas por el control de calidad", (t) => String(t.retenidos)],
  ["Uso de IA por pedido (promedio)", (t) => (t.tokens_promedio == null ? "—" : Math.round(t.tokens_promedio).toLocaleString("es-AR"))],
];

const TONO: Record<string, string> = {
  datos: "border-slate-200 bg-white text-slate-800",
  mejor: "border-emerald-300 bg-emerald-50 text-emerald-900",
  peor: "border-amber-300 bg-amber-50 text-amber-900",
  igual: "border-slate-200 bg-white text-slate-800",
};

function Tabla({ titulo, columnas }: { titulo: string; columnas: { clave: string; nombre: string; cifras: Cifras; suficiente: boolean }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white" role="region" aria-label={titulo} tabIndex={0}>
      <table className="w-full min-w-[28rem] text-sm">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-700">
            <th scope="col" className="px-3 py-2 font-medium">Resultado</th>
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className="px-3 py-2 text-right font-medium">
                {c.nombre}
                {!c.suficiente && <span className="mt-0.5 block text-[11px] font-semibold normal-case tracking-normal text-amber-800">Datos insuficientes</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FILAS.map(([label, f]) => (
            <tr key={label} className="border-t border-slate-200">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-slate-800">{label}</th>
              {columnas.map((c) => (
                <td key={c.clave} className="px-3 py-1.5 text-right font-medium tabular-nums text-slate-900">{f(c.cifras)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pestaña «Comparativas e informes»: la tabla de siempre para N versiones y para las variantes de cada A/B. */
export function PestanaComparativas({ sel, nombres }: PropsPestana) {
  const [dias, setDias] = useState(14);
  const [datos, setDatos] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const perfiles = perfilesDe(sel);

  useEffect(() => {
    let vivo = true;
    setDatos(null);
    setError(null);
    pedir<any>(`vista=comparativa&perfiles=${perfiles.join(",")}&dias=${dias}`)
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError((e as Error).message));
    return () => {
      vivo = false;
    };
    // perfiles se deriva de sel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, dias]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-700">
          {sel === "todos" ? "Sumando los cuatro perfiles." : `Perfil: ${nombres[sel] ?? sel}.`} Las cifras salen de conversaciones reales del período. La unidad es la conversación atendida por el bot. Con menos de 30 conversaciones por columna no se sacan conclusiones.
        </p>
        <label className="block">
          <span className={ETIQUETA}>Período</span>
          <select className={CAMPO} value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </label>
      </div>
      <Mensajes ok={null} error={error} />
      {!datos && !error && <p className="text-sm text-slate-700" role="status">Cargando cifras…</p>}

      {datos && (
        <section aria-labelledby="lab-cmp-versiones">
          <h4 id="lab-cmp-versiones" className={SUBTITULO}>Por versión</h4>
          {datos.versiones.length === 0 ? (
            <p className="mt-1 text-sm text-slate-700">Sin conversaciones atendidas por el bot en el período.</p>
          ) : (
            <>
              <div className="mt-2">
                <Tabla titulo="Comparación por versión" columnas={datos.versiones.map((v: any) => ({ clave: `v${v.version}`, nombre: `v${v.version}${v.version === datos.referencia ? " (rige)" : ""}`, cifras: v, suficiente: v.suficiente }))} />
              </div>
              {datos.referencia == null && (
                <p className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                  Sin referencia común: en estos perfiles rigen versiones distintas. Para ver qué versión anda mejor, elegí un perfil arriba.
                </p>
              )}
              <ul className="mt-2 space-y-2">
                {datos.versiones
                  .filter((v: any) => v.veredicto)
                  .map((v: any) => (
                    <li key={v.version} className={`rounded-lg border px-3 py-2 text-sm ${TONO[v.veredicto.tono]}`}>
                      <strong className="font-semibold">v{v.version} contra v{datos.referencia}:</strong> {v.veredicto.texto}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>
      )}

      {datos && (
        <section aria-labelledby="lab-cmp-ab">
          <h4 id="lab-cmp-ab" className={SUBTITULO}>Pruebas con dos versiones (A/B)</h4>
          {datos.ab.length === 0 ? (
            <p className="mt-1 text-sm text-slate-700">No hubo pruebas A/B en el período.</p>
          ) : (
            <ul className="mt-2 space-y-4">
              {datos.ab.map((p: any) => (
                <li key={p.id} className="space-y-2">
                  <p className="text-sm text-slate-800">
                    <strong className="font-semibold text-slate-900">{p.campana}</strong> ({nombres[p.rubro] ?? p.rubro}) · v{p.version}
                    {p.modelo ? ` con ${p.modelo}` : ""} al {p.porcentaje} % contra v{p.control_version ?? "—"} · {fecha(p.inicio)} a {fecha(p.cortada_at ?? p.fin)}
                    {p.vigente ? " · en curso" : ""}
                  </p>
                  {p.variantes.length === 0 ? (
                    <p className="text-sm text-slate-700">Todavía no hay charlas nuevas en la prueba.</p>
                  ) : (
                    <Tabla
                      titulo={`Prueba A/B en ${p.campana}`}
                      columnas={["control", "prueba"]
                        .map((k) => p.variantes.find((x: any) => x.variante === k))
                        .filter(Boolean)
                        .map((x: any) => ({ clave: x.variante, nombre: x.variante === "prueba" ? `En prueba (v${p.version}${p.modelo ? ` · ${p.modelo}` : ""})` : `Activa (v${p.control_version ?? "—"})`, cifras: x, suficiente: !!x.suficiente }))}
                    />
                  )}
                  <p className={`rounded-lg border px-3 py-2 text-sm ${p.suficientes && p.veredicto ? TONO[p.veredicto.tono] : TONO.datos}`}>
                    {p.suficientes && p.veredicto ? p.veredicto.texto : "Datos insuficientes: hacen falta al menos 30 conversaciones en cada variante para comparar."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="lab-cmp-informe">
        <h4 id="lab-cmp-informe" className={SUBTITULO}>Informe y propuestas</h4>
        {sel === "todos" ? (
          <p className={AYUDA}>El informe de mejoras se arma por perfil: elegí uno arriba.</p>
        ) : (
          <details className="mt-1">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-slate-800">Abrir el informe de mejoras del bot de {nombres[sel] ?? sel}</summary>
            <div className="mt-2">
              <InformeMejoras perfil={sel} />
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
