import Link from "next/link";
import { cifrasDePeriodo, PERIODOS, rangoDePeriodo, tasa, variacion, type ClavePeriodo } from "@/lib/hoy/periodos";

/**
 * Estadísticas de «Hoy» como una presentación (12/11): una lámina por período.
 * La primera es la semana actual; con las flechas se pasa a la semana pasada,
 * al mes y al mes pasado. El historial completo queda a un clic. Solo lectura.
 */
export async function PresentacionHoy({ slug, rubroId, areas, periodo, historial }: { slug: string; rubroId: string; areas: string[]; periodo?: string; historial: string }) {
  const i = Math.max(0, PERIODOS.findIndex((p) => p.clave === periodo));
  const actual = PERIODOS[i];
  const r = rangoDePeriodo(actual.clave as ClavePeriodo);
  const [c, antes] = await Promise.all([cifrasDePeriodo(rubroId, areas, r.desde, r.hasta), cifrasDePeriodo(rubroId, areas, r.antesDesde, r.antesHasta)]);
  const enlace = (clave: string) => `/hoy?perfil=${slug}${clave === "semana" ? "" : `&periodo=${clave}`}#hoy-cifras`;
  const previo = PERIODOS[i - 1];
  const siguiente = PERIODOS[i + 1];
  const fecha = (d: Date) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(d);
  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("es-AR"));

  const cifras = [
    { titulo: "Contactados", valor: c.contactados, antes: antes.contactados, nota: "primer mensaje enviado" },
    { titulo: "Respondieron", valor: c.respondieron, antes: antes.respondieron, nota: tasa(c.respondieron, c.contactados) ? `${tasa(c.respondieron, c.contactados)} de los contactados` : "personas que escribieron" },
    { titulo: "Captados", valor: c.captados, antes: antes.captados, nota: tasa(c.captados, c.respondieron) ? `${tasa(c.captados, c.respondieron)} de los que respondieron` : "aceptaron el siguiente paso" },
    { titulo: "Derivados", valor: c.derivados, antes: antes.derivados, nota: "pasados a quien los atiende" },
    { titulo: "Perdidos", valor: c.perdidos, antes: antes.perdidos, nota: "cerrados sin avanzar" },
  ];
  const TONO = { sube: "text-emerald-700", baja: "text-red-700", igual: "text-slate-500", nada: "text-slate-500" } as const;

  return (
    <section id="hoy-cifras" aria-labelledby="hoy-cifras-titulo" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 id="hoy-cifras-titulo" className="text-lg font-semibold text-slate-950">
            {actual.titulo}
          </h2>
          <p className="text-sm text-slate-600">
            {actual.bajada} · {fecha(r.desde)} al {fecha(new Date(r.hasta.getTime() - 1))} · lámina {i + 1} de {PERIODOS.length}
          </p>
        </div>
        <nav aria-label="Cambiar de período" className="flex items-center gap-2">
          {previo ? (
            <Link href={enlace(previo.clave)} className="btn-suave-sm" aria-label={`Volver a ${previo.titulo}`}>
              ‹ {previo.titulo}
            </Link>
          ) : null}
          {siguiente ? (
            <Link href={enlace(siguiente.clave)} className="btn-suave-sm" aria-label={`Pasar a ${siguiente.titulo}`}>
              {siguiente.titulo} ›
            </Link>
          ) : null}
        </nav>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-slate-100 md:grid-cols-5">
        {cifras.map((x, k) => {
          const v = variacion(x.valor, x.antes);
          // En «Perdidos», subir no es bueno: el color se invierte.
          const tono = x.titulo === "Perdidos" && v.tono !== "igual" && v.tono !== "nada" ? (v.tono === "sube" ? "baja" : "sube") : v.tono;
          return (
            <div key={x.titulo} className={`bg-white p-5 ${k === 0 ? "col-span-2 md:col-span-1" : ""}`}>
              <dt className="text-[13px] font-medium text-slate-600">{x.titulo}</dt>
              <dd className="cifra-premium mt-1 text-4xl font-semibold tabular-nums text-slate-950">{n(x.valor)}</dd>
              <dd className="mt-1 text-[13px] text-slate-600">{x.nota}</dd>
              <dd className={`mt-2 text-[13px] font-medium ${TONO[tono]}`}>{v.texto}</dd>
            </div>
          );
        })}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <ol className="flex flex-wrap gap-1.5" aria-label="Láminas">
          {PERIODOS.map((p, k) => (
            <li key={p.clave}>
              <Link
                href={enlace(p.clave)}
                aria-current={k === i ? "true" : undefined}
                className={`tactil inline-flex items-center rounded-full border px-3 text-[13px] font-medium ${k === i ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                {p.titulo}
              </Link>
            </li>
          ))}
        </ol>
        <Link href={historial} className="text-sm font-medium text-slate-800 underline underline-offset-2">
          Ver el historial completo
        </Link>
      </div>
    </section>
  );
}
