import Link from "next/link";
import { Anillo, VerMas } from "@/components/premium";
import type { SlugPerfil } from "@/lib/marca";
import { cifrasDePeriodo, rangoDePeriodo, tasa, variacion, type ClavePeriodo } from "@/lib/hoy/periodos";
import type { ClavePeriodoResultado, ClaveResultado } from "@/lib/resultados";

/**
 * Embudo del período (13/11): contactados → respondieron → conversaron →
 * oportunidades reales → captados → derivados → ventas, con cuántos pasan de una etapa a la otra y la comparación con el
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
  return <EmbudoVista slug={slug} c={c} antes={antes} ver={ver} periodo={periodo} />;
}

type Cifras = Awaited<ReturnType<typeof cifrasDePeriodo>>;

/** La presentación del embudo, separada de la lectura de datos (así se puede ver con datos de ejemplo). */
export function EmbudoVista({ slug, c, antes, periodo, ver }: { slug: string; c: Cifras; antes: Cifras | null; periodo: ClavePeriodoResultado; ver: ClaveResultado }) {
  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("es-AR"));
  const href = (v: string) => `/resultados?perfil=${slug}&ver=${v}&periodo=${periodo}`;
  const parte = (a: number | null, b: number | null) => (a === null || b === null || b <= 0 ? null : Math.max(0, Math.min(1, a / b)));
  const etapas: { ver: ClaveResultado; titulo: string; valor: number | null; antes: number | null; paso: string | null; fraccion: number | null; nota: string }[] = [
    { ver: "contactados", titulo: "Contactados", valor: c.contactados, antes: antes?.contactados ?? null, paso: null, fraccion: null, nota: "recibieron el primer mensaje" },
    { ver: "respondieron", titulo: "Respondieron", valor: c.respondieron, antes: antes?.respondieron ?? null, paso: tasa(c.respondieron, c.contactados), fraccion: parte(c.respondieron, c.contactados), nota: "de los contactados" },
    { ver: "conversaron", titulo: "Conversaron", valor: c.conversaron, antes: antes?.conversaron ?? null, paso: tasa(c.conversaron, c.respondieron), fraccion: parte(c.conversaron, c.respondieron), nota: "de los que respondieron" },
    { ver: "oportunidades", titulo: "Oportunidades reales", valor: c.oportunidades, antes: antes?.oportunidades ?? null, paso: tasa(c.oportunidades, c.respondieron), fraccion: parte(c.oportunidades, c.respondieron), nota: "de los que respondieron" },
    { ver: "captados", titulo: "Captados", valor: c.captados, antes: antes?.captados ?? null, paso: tasa(c.captados, c.respondieron), fraccion: parte(c.captados, c.respondieron), nota: "de los que respondieron" },
    { ver: "derivados", titulo: "Derivados", valor: c.derivados, antes: antes?.derivados ?? null, paso: tasa(c.derivados, c.captados), fraccion: parte(c.derivados, c.captados), nota: "de los captados" },
    { ver: "ventas", titulo: "Ventas", valor: c.ventas, antes: antes?.ventas ?? null, paso: tasa(c.ventas, c.derivados), fraccion: parte(c.ventas, c.derivados), nota: "de los derivados" },
  ];
  const TONO = { sube: "text-emerald-700", baja: "text-red-700", igual: "text-slate-500", nada: "text-slate-500" } as const;
  const vPerdidos = antes ? variacion(c.perdidos, antes.perdidos) : null;

  // 22/11: el embudo en 4 anillos (cada anillo se llena con lo que pasó de la etapa anterior) y, entre
  // ellos, la conversión. El resto de las etapas y los perdidos siguen más abajo, en «Ver más».
  const ANILLOS: { ver: ClaveResultado; base: number | null }[] = [
    { ver: "contactados", base: null },
    { ver: "respondieron", base: c.contactados },
    { ver: "oportunidades", base: c.respondieron },
    { ver: "captados", base: c.respondieron },
  ];
  return (
    <section id="res-embudo" aria-labelledby="res-embudo-titulo" className="scroll-mt-24 space-y-4">
      <h2 id="res-embudo-titulo" className="sr-only">
        Embudo del período
      </h2>
      <ol className="pc-fila-anillos">
        {ANILLOS.map((a, i) => {
          const e = etapas.find((x) => x.ver === a.ver);
          if (!e) return null;
          const activa = e.ver === ver;
          // Un dato que no se pudo leer no es cero: se muestra «—».
          const sinDato = e.valor === null || e.valor === undefined;
          const valor = e.valor ?? 0;
          const meta = a.base === null ? Math.max(1, valor) : Math.max(1, a.base ?? 0);
          return (
            <li key={e.ver} className="min-w-0">
              {/* Vuelta 6: cada etapa es una caja del bento de colores (entra creciendo, escalonada). */}
              <div className={`vv-celda vv-celda--${(["violeta", "rosa", "amarillo", "agua"] as const)[i % 4]} vv-celda--res${activa ? " pc-activa" : ""}`} style={{ "--vv-i": i } as React.CSSProperties}>
                <div className="pc-celda">
                  <span className="pc-etiqueta">{e.titulo}</span>
                  {sinDato ? (
                    <span role="img" aria-label={`${e.titulo}: sin dato`} style={{ width: 120, height: 120, display: "grid", placeItems: "center", fontSize: 36, color: "var(--d-texto-3)" }}>
                      —
                    </span>
                  ) : (
                    <Anillo valor={valor} meta={meta} rubro={slug as SlugPerfil} tamano="medio" nombre={e.titulo} unidad="personas" mostrarMeta={a.base !== null && a.base !== undefined} retrasoMs={i * 80} />
                  )}
                  <span className="pc-paso">{e.paso ? `${e.paso}` : "Primer mensaje"}</span>
                  <span className="pc-contexto">{e.nota}</span>
                  <Link prefetch={false} href={href(e.ver)} aria-current={activa ? "page" : undefined} className="pc-enlace">
                    {activa ? "Viendo quiénes" : "Ver quiénes"}
                    <span className="sr-only"> · {e.titulo.toLowerCase()}</span>
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <VerMas cerrado="Ver más etapas" abierto="Ver menos etapas" abiertoAlInicio={["conversaron", "derivados", "ventas", "perdidos"].includes(ver)}>
        <div className="space-y-3">
      {/* 22/11: grilla bento; en el celular angosto, una etapa por renglón para que la cifra respire. */}
      <ol className="d-revelar grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-4">
        {etapas.map((e) => {
          const v = antes ? variacion(e.valor, e.antes) : null;
          const activa = e.ver === ver;
          return (
            <li key={e.ver} className={`kpi-hoy relative min-w-0 rounded-2xl border p-4 sm:p-5 ${activa ? "kpi-activo" : ""}`}>
              <div className="flex min-h-10 items-start justify-between gap-3">
                <p className="min-w-0 text-[13px] font-medium text-slate-600">{e.titulo}</p>
                {e.fraccion !== null ? <AnilloAvance fraccion={e.fraccion} /> : null}
              </div>
              <p className="cifra-premium mt-1 text-3xl font-semibold tabular-nums text-slate-950 sm:text-4xl">{n(e.valor)}</p>
              <p className="mt-1 min-h-[2.5rem] text-[13px] text-slate-600">{e.paso ? <><span className="font-semibold text-slate-900">{e.paso}</span> {e.nota}</> : e.nota}</p>
              {v ? <p className={`mt-1 text-[13px] font-medium ${TONO[v.tono]}`}>{v.texto}</p> : null}
              <p className="mt-3">
                <Link prefetch={false} href={href(e.ver)} aria-current={activa ? "page" : undefined} className="text-[13px] font-semibold text-slate-900 underline underline-offset-2 after:absolute after:inset-0">
                  {activa ? "Viendo quiénes" : "Ver quiénes"}
                  <span className="sr-only"> · {e.titulo.toLowerCase()}</span>
                </Link>
              </p>
            </li>
          );
        })}
      </ol>
      <p className={`d-tarjeta relative !flex-row flex-wrap items-baseline !gap-x-2 !gap-y-1 !py-3 text-sm ${ver === "perdidos" ? "kpi-activo" : ""}`}>
        <span className="font-semibold tabular-nums text-slate-950">{n(c.perdidos)}</span>
        <span className="text-slate-700">cerrados sin avanzar (perdidos)</span>
        {/* En perdidos, subir no es bueno: el color se invierte. */}
        {vPerdidos ? <span className={`text-[13px] font-medium ${TONO[vPerdidos.tono === "sube" ? "baja" : vPerdidos.tono === "baja" ? "sube" : vPerdidos.tono]}`}>{vPerdidos.texto}</span> : null}
        <Link prefetch={false} href={href("perdidos")} aria-current={ver === "perdidos" ? "page" : undefined} className="ml-auto text-[13px] font-semibold text-slate-900 underline underline-offset-2 after:absolute after:inset-0">
          {ver === "perdidos" ? "Viendo quiénes" : "Ver quiénes"}
          <span className="sr-only"> · perdidos</span>
        </Link>
      </p>
        </div>
      </VerMas>
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
