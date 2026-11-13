import Link from "next/link";
import { cifrasDePeriodo, rangoDePeriodo, tasa, variacion, type ClavePeriodo } from "@/lib/hoy/periodos";
import type { ClavePeriodoResultado, ClaveResultado } from "@/lib/resultados";

/**
 * Embudo del período (13/11): contactados → respondieron → captados →
 * derivados, con cuántos pasan de una etapa a la otra y la comparación con el
 * período anterior. Cada etapa abre sus personas. Los perdidos van aparte:
 * no son una etapa. Usa las mismas cuentas que tenía «Hoy». Solo lectura.
 */
export async function EmbudoPeriodo({ slug, rubroId, areas, periodo, ver }: { slug: string; rubroId: string; areas: string[]; periodo: ClavePeriodoResultado; ver: ClaveResultado }) {
  const ahora = new Date();
  const todo = periodo === "todo";
  const r = todo ? null : rangoDePeriodo(periodo as ClavePeriodo, ahora);
  const [c, antes] = await Promise.all([
    cifrasDePeriodo(rubroId, areas, r ? r.desde : new Date("2020-01-01T00:00:00Z"), r ? r.hasta : ahora),
    r ? cifrasDePeriodo(rubroId, areas, r.antesDesde, r.antesHasta) : Promise.resolve(null),
  ]);
  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("es-AR"));
  const href = (v: string) => `/resultados?perfil=${slug}&ver=${v}&periodo=${periodo}`;
  const parte = (a: number | null, b: number | null) => (a === null || b === null || b <= 0 ? null : Math.max(0, Math.min(1, a / b)));
  const etapas: { ver: ClaveResultado; titulo: string; valor: number | null; antes: number | null; paso: string | null; fraccion: number | null; nota: string }[] = [
    { ver: "contactados", titulo: "Contactados", valor: c.contactados, antes: antes?.contactados ?? null, paso: null, fraccion: null, nota: "recibieron el primer mensaje" },
    { ver: "respondieron", titulo: "Respondieron", valor: c.respondieron, antes: antes?.respondieron ?? null, paso: tasa(c.respondieron, c.contactados), fraccion: parte(c.respondieron, c.contactados), nota: "de los contactados" },
    { ver: "captados", titulo: "Captados", valor: c.captados, antes: antes?.captados ?? null, paso: tasa(c.captados, c.respondieron), fraccion: parte(c.captados, c.respondieron), nota: "de los que respondieron" },
    { ver: "derivados", titulo: "Derivados", valor: c.derivados, antes: antes?.derivados ?? null, paso: tasa(c.derivados, c.captados), fraccion: parte(c.derivados, c.captados), nota: "de los captados" },
  ];
  const TONO = { sube: "text-emerald-700", baja: "text-red-700", igual: "text-slate-500", nada: "text-slate-500" } as const;
  const vPerdidos = antes ? variacion(c.perdidos, antes.perdidos) : null;

  return (
    <section id="res-embudo" aria-labelledby="res-embudo-titulo" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 id="res-embudo-titulo" className="sr-only">
        Embudo del período
      </h2>
      <ol className="grid grid-cols-2 gap-px bg-slate-100 md:grid-cols-4">
        {etapas.map((e) => {
          const v = antes ? variacion(e.valor, e.antes) : null;
          const activa = e.ver === ver;
          return (
            <li key={e.ver} className={`relative p-5 transition-colors focus-within:bg-slate-50 hover:bg-slate-50 ${activa ? "bg-gold-500/10" : "bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-600">{e.titulo}</p>
                {e.fraccion !== null ? <AnilloAvance fraccion={e.fraccion} /> : null}
              </div>
              <p className="cifra-premium mt-1 text-4xl font-semibold tabular-nums text-slate-950">{n(e.valor)}</p>
              <p className="mt-1 min-h-[2.5rem] text-[13px] text-slate-600">{e.paso ? <><span className="font-semibold text-slate-900">{e.paso}</span> {e.nota}</> : e.nota}</p>
              {v ? <p className={`mt-1 text-[13px] font-medium ${TONO[v.tono]}`}>{v.texto}</p> : null}
              <p className="mt-3">
                <Link href={href(e.ver)} aria-current={activa ? "page" : undefined} className="text-[13px] font-semibold text-slate-900 underline underline-offset-2 after:absolute after:inset-0">
                  {activa ? "Viendo quiénes" : "Ver quiénes"}
                  <span className="sr-only"> · {e.titulo.toLowerCase()}</span>
                </Link>
              </p>
            </li>
          );
        })}
      </ol>
      <p className={`relative flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-slate-100 px-5 py-3 text-sm ${ver === "perdidos" ? "bg-gold-500/10" : ""}`}>
        <span className="font-semibold tabular-nums text-slate-950">{n(c.perdidos)}</span>
        <span className="text-slate-700">cerrados sin avanzar (perdidos)</span>
        {/* En perdidos, subir no es bueno: el color se invierte. */}
        {vPerdidos ? <span className={`text-[13px] font-medium ${TONO[vPerdidos.tono === "sube" ? "baja" : vPerdidos.tono === "baja" ? "sube" : vPerdidos.tono]}`}>{vPerdidos.texto}</span> : null}
        <Link href={href("perdidos")} aria-current={ver === "perdidos" ? "page" : undefined} className="ml-auto text-[13px] font-semibold text-slate-900 underline underline-offset-2 after:absolute after:inset-0">
          {ver === "perdidos" ? "Viendo quiénes" : "Ver quiénes"}
          <span className="sr-only"> · perdidos</span>
        </Link>
      </p>
    </section>
  );
}

/** Anillo con el porcentaje de paso de una etapa a la siguiente. Es un adorno: la cifra está escrita al lado. */
function AnilloAvance({ fraccion }: { fraccion: number }) {
  const R = 15;
  const largo = 2 * Math.PI * R;
  return (
    <svg aria-hidden="true" className="anillo-avance h-10 w-10 shrink-0 -rotate-90" viewBox="0 0 40 40">
      <circle className="anillo-pista" cx="20" cy="20" r={R} fill="none" strokeWidth="5" />
      <circle
        className="anillo-valor"
        cx="20"
        cy="20"
        r={R}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        stroke="rgb(var(--c-gold-500))"
        strokeDasharray={`${Math.max(0.5, fraccion * largo).toFixed(2)} ${largo.toFixed(2)}`}
      />
    </svg>
  );
}
