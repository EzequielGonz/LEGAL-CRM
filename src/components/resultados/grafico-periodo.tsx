import { createAdminClient } from "@/lib/supabase/admin";
import { rangoDePeriodo, type ClavePeriodo } from "@/lib/hoy/periodos";
import type { ClavePeriodoResultado } from "@/lib/resultados";
import { areaSuave, etiquetaDeDia, leerSerie, puntosDeSerie, topeDeEje, trazoSuave } from "@/lib/resultados-grafico";

/**
 * Gráfico del período (13/11): cuántas personas respondieron y cuántas se
 * captaron cada día, y debajo cuántos primeros mensajes salieron. Mismas
 * condiciones que el embudo (función `embudo_por_dia`). Las cifras están
 * también en una tabla para lectores de pantalla. Solo lectura.
 */
export async function GraficoPeriodo({ rubroId, areas, periodo }: { rubroId: string; areas: string[]; periodo: ClavePeriodoResultado }) {
  if (periodo === "todo") return null;
  const r = rangoDePeriodo(periodo as ClavePeriodo, new Date());
  const { data, error } = await (createAdminClient() as any).rpc("embudo_por_dia", { p_rubro: rubroId, p_areas: areas, p_desde: r.desde.toISOString(), p_hasta: r.hasta.toISOString() });
  const serie = error ? [] : leerSerie(data);
  if (serie.length < 2) return null;

  const W = 720;
  const H = 230;
  const margen = { izq: 34, der: 14, arriba: 14, abajo: 30 };
  const base = H - margen.abajo;
  const tope = topeDeEje(Math.max(...serie.map((d) => Math.max(d.respondieron, d.captados))));
  const pResp = puntosDeSerie(serie.map((d) => d.respondieron), W, H, tope, margen);
  const pCapt = puntosDeSerie(serie.map((d) => d.captados), W, H, tope, margen);
  const mes = serie.length > 8;
  const cada = mes ? Math.ceil(serie.length / 8) : 1;
  const maxEnviados = Math.max(1, ...serie.map((d) => d.contactados));
  const total = (k: "contactados" | "respondieron" | "captados") => serie.reduce((a, d) => a + d[k], 0);
  const n = (v: number) => v.toLocaleString("es-AR");
  const guias = [0, 0.5, 1].map((f) => ({ y: margen.arriba + (base - margen.arriba) * (1 - f), valor: Math.round(tope * f) }));
  const anchoBarra = Math.max(4, Math.min(34, ((W - margen.izq - margen.der) / serie.length) * 0.55));

  return (
    <section aria-labelledby="res-grafico" className="grafico-periodo rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="res-grafico" className="text-base font-semibold text-slate-950">
          Día por día
        </h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-700">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-gold-500" />
            Respondieron <span className="font-semibold tabular-nums text-slate-950">{n(total("respondieron"))}</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="grafico-marca-captado h-2.5 w-2.5 rotate-45 rounded-[2px]" />
            Captados <span className="font-semibold tabular-nums text-slate-950">{n(total("captados"))}</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-1.5 rounded-sm bg-slate-400" />
            Primeros mensajes <span className="font-semibold tabular-nums text-slate-950">{n(total("contactados"))}</span>
          </li>
        </ul>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 block h-auto w-full" role="img" aria-label="Gráfico de personas que respondieron y captados por día. Las cifras están en la tabla que sigue.">
        <defs>
          <linearGradient id="grafico-relleno" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--c-gold-500))" stopOpacity="0.42" />
            <stop offset="100%" stopColor="rgb(var(--c-gold-500))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {guias.map((g) => (
          <g key={g.valor}>
            <line className="grafico-guia" x1={margen.izq} x2={W - margen.der} y1={g.y} y2={g.y} strokeWidth="1" />
            <text className="grafico-texto" x={margen.izq - 8} y={g.y + 4} textAnchor="end" fontSize="11">
              {g.valor}
            </text>
          </g>
        ))}
        <path className="grafico-area" d={areaSuave(pResp, base)} fill="url(#grafico-relleno)" />
        <path className="grafico-linea" d={trazoSuave(pResp)} fill="none" stroke="rgb(var(--c-gold-500))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        {serie.map((d, i) => (
          <g key={d.dia}>
            <circle className="grafico-punto" cx={pResp[i].x} cy={pResp[i].y} r={mes ? 2.5 : 4} stroke="rgb(var(--c-gold-500))" strokeWidth="2">
              <title>{`${etiquetaDeDia(d.dia, false)}: ${n(d.respondieron)} respondieron, ${n(d.captados)} captados, ${n(d.contactados)} primeros mensajes`}</title>
            </circle>
            {d.captados > 0 ? <rect className="grafico-captado" x={pCapt[i].x - 4.5} y={pCapt[i].y - 4.5} width="9" height="9" rx="1.5" transform={`rotate(45 ${pCapt[i].x} ${pCapt[i].y})`} /> : null}
            {i % cada === 0 || i === serie.length - 1 ? (
              <text className="grafico-texto" x={pResp[i].x} y={H - 9} textAnchor="middle" fontSize="11">
                {etiquetaDeDia(d.dia, mes)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>

      <p className="mt-3 text-[13px] font-medium text-slate-600">Primeros mensajes que salieron cada día</p>
      <svg viewBox={`0 0 ${W} 54`} className="mt-1 block h-auto w-full" aria-hidden="true">
        {serie.map((d, i) => {
          const alto = d.contactados > 0 ? Math.max(3, (d.contactados / maxEnviados) * 36) : 0;
          return (
            <g key={d.dia}>
              <rect className="grafico-barra" x={pResp[i].x - anchoBarra / 2} y={40 - alto} width={anchoBarra} height={alto} rx={Math.min(4, anchoBarra / 2)} />
              {!mes && d.contactados > 0 ? (
                <text className="grafico-texto" x={pResp[i].x} y={52} textAnchor="middle" fontSize="11">
                  {n(d.contactados)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>Cifras por día</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Primeros mensajes</th>
            <th scope="col">Respondieron</th>
            <th scope="col">Captados</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((d) => (
            <tr key={d.dia}>
              <th scope="row">{etiquetaDeDia(d.dia, false)}</th>
              <td>{d.contactados}</td>
              <td>{d.respondieron}</td>
              <td>{d.captados}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
