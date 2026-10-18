import { getProfileMetrics } from "@/lib/metrics";
import { puntajeBot } from "@/lib/agentes/puntaje";
import { BotonAsistente } from "@/components/asistente/boton-asistente";

const COLOR_NIVEL: Record<string, string> = {
  muy_bien: "text-emerald-600",
  bien: "text-emerald-600",
  mejorable: "text-amber-600",
  ajustar: "text-red-600",
  pocos_datos: "text-slate-400",
};

/**
 * Cómo viene el bot (18/10): un puntaje de 0 a 100 con resultados reales
 * del perfil, lo que lo compone y qué conviene mejorar. Los cambios se
 * piden al asistente con palabras; las instrucciones completas quedan en
 * «Más opciones».
 */
export async function PuntajeBots({ rubroId }: { rubroId: string }) {
  const p = puntajeBot(await getProfileMetrics(rubroId));
  const valor = p.puntaje ?? 0;
  const radio = 52;
  const vuelta = 2 * Math.PI * radio;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radio} fill="none" stroke="rgb(var(--c-slate-100))" strokeWidth="10" />
            {p.puntaje !== null && (
              <circle cx="60" cy="60" r={radio} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(valor / 100) * vuelta} ${vuelta}`} className={COLOR_NIVEL[p.nivel]} />
            )}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-slate-950">{p.puntaje ?? "—"}</p>
              <p className="text-xs text-slate-500">de 100</p>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">Cómo viene el bot</p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-950">{p.etiqueta}</p>
          <p className="mt-1 text-sm text-slate-600">
            {p.conversaciones} conversaciones · {p.captados} captados. Calculado con resultados reales del perfil.
          </p>
          {p.componentes.length > 0 && (
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {p.componentes.map((c) => (
                <li key={c.clave}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.label}</span>
                    <span className="tabular-nums text-slate-500">
                      {c.puntos}/{c.maximo}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.round((c.puntos / c.maximo) * 100)}%` }} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{c.detalle}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        {p.sugerencia && <p className="min-w-0 flex-1 text-sm text-slate-700"><span className="font-semibold">Sugerencia:</span> {p.sugerencia}</p>}
        <BotonAsistente texto={p.sugerencia && p.puntaje !== null ? `Ajustá el bot: ${p.sugerencia}` : "Quiero cambiar algo del bot: "}>Pedir un cambio al bot</BotonAsistente>
      </div>
    </section>
  );
}
