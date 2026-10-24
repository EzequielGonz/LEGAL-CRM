"use client";

import { useMemo, useState } from "react";

export interface PiezaCalendario {
  id: string;
  canal: string;
  formato: string;
  titulo: string | null;
  texto: string;
  estado: string;
  motivo: string | null;
  programada_para: string | null;
  publicada_at: string | null;
  proveedor_id: string | null;
  url_publicada: string | null;
  imagen: string | null;
}

const RED: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", landing: "Web" };
const FORMATO: Record<string, string> = { post: "Posteo", carrusel: "Carrusel", historia: "Historia", video: "Video", articulo: "Artículo" };
const TZ = "America/Argentina/Buenos_Aires";

function estadoVisible(p: PiezaCalendario): { texto: string; clase: string } {
  if (p.estado === "programada" && p.proveedor_id) return { texto: "En Metricool", clase: "bg-emerald-50 text-emerald-800" };
  if (p.estado === "programada") return { texto: "Programada", clase: "bg-emerald-50 text-emerald-800" };
  if (p.estado === "publicada") return { texto: "Publicada", clase: "bg-slate-100 text-slate-700" };
  if (p.estado === "lista") return { texto: "Espera conexión", clase: "bg-amber-50 text-amber-800" };
  if (p.estado === "retenida") return { texto: "Retenida", clase: "bg-amber-50 text-amber-800" };
  if (p.estado === "error" || p.estado === "incierta") return { texto: "Con error", clase: "bg-red-50 text-red-800" };
  return { texto: p.estado, clase: "bg-slate-100 text-slate-700" };
}

/**
 * Calendario de publicaciones (18/10): lo que viene, agrupado por día, con
 * la imagen, la red y el estado real. Se puede cancelar lo que todavía no
 * salió (queda cancelado con su historial, no se borra).
 */
export function CalendarioPublicaciones({ piezas: inicial }: { piezas: PiezaCalendario[] }) {
  const [piezas, setPiezas] = useState(inicial);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);

  const dias = useMemo(() => {
    const m = new Map<string, PiezaCalendario[]>();
    for (const p of piezas) {
      const fecha = p.programada_para ?? p.publicada_at;
      const clave = fecha ? new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(fecha)) : "sin-fecha";
      m.set(clave, [...(m.get(clave) ?? []), p]);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [piezas]);

  async function cancelar(id: string) {
    if (!window.confirm("¿Cancelar esta publicación? No se publica y queda en el historial.")) return;
    setOcupada(id);
    const res = await fetch(`/api/redes/piezas/${id}`, { method: "DELETE" });
    setOcupada(null);
    if (res.ok) setPiezas((ps) => ps.filter((p) => p.id !== id));
  }

  if (piezas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-base font-semibold text-slate-900">Todavía no hay publicaciones programadas</p>
        <p className="mt-1 text-sm text-slate-600">Pedile al asistente un calendario y lo vas a ver acá, día por día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dias.map(([dia, lista]) => (
        <section key={dia}>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            {dia === "sin-fecha" ? "Sin fecha" : new Date(`${dia}T12:00:00Z`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((p) => {
              const e = estadoVisible(p);
              const hora = p.programada_para ? new Date(p.programada_para).toLocaleTimeString("es-AR", { timeZone: TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }) : "";
              const abiertaEsta = abierta === p.id;
              return (
                <li key={p.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt="" loading="lazy" className={`shrink-0 rounded-lg bg-slate-100 object-cover ${p.formato === "historia" ? "h-28 w-16" : "h-20 w-20"}`} />
                  ) : (
                    <div className="h-20 w-20 shrink-0 rounded-lg bg-slate-100" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-900">{RED[p.canal] ?? p.canal}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{FORMATO[p.formato] ?? p.formato}</span>
                      {hora && <span className="text-slate-500">· {hora}</span>}
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.clase}`}>{e.texto}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{p.titulo || p.texto}</p>
                    {p.motivo && p.estado !== "programada" && <p className="mt-1 line-clamp-2 text-xs text-amber-800">{p.motivo}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                      <button type="button" onClick={() => setAbierta(abiertaEsta ? null : p.id)} className="text-slate-700 underline underline-offset-2">
                        {abiertaEsta ? "Ocultar texto" : "Ver texto"}
                      </button>
                      {p.url_publicada && (
                        <a href={p.url_publicada} target="_blank" rel="noreferrer" className="text-slate-700 underline underline-offset-2">
                          Abrir
                        </a>
                      )}
                      {!["publicada", "publicando"].includes(p.estado) && (
                        <button type="button" disabled={ocupada === p.id} onClick={() => cancelar(p.id)} className="text-red-700 underline underline-offset-2">
                          {ocupada === p.id ? "Cancelando…" : "Cancelar"}
                        </button>
                      )}
                    </div>
                    {abiertaEsta && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{p.texto}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
