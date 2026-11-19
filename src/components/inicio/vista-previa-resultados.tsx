import Link from "next/link";

export interface CifrasSemana {
  respuestas: number | null;
  captados: number | null;
  citas: number | null;
  derivados: number | null;
}

/**
 * Vista previa gráfica de «Resultados» para Hoy (19/11): la semana en cuatro barras
 * y un botón que lleva a la pantalla completa. Solo lectura.
 */
export function VistaPreviaResultados({ slug, semana }: { slug: string; semana: CifrasSemana | null }) {
  const filas: [string, number | null | undefined, string][] = [
    ["Personas que escribieron", semana?.respuestas, "bg-slate-500"],
    ["Citas", semana?.citas, "bg-amber-500"],
    ["Captados", semana?.captados, "bg-emerald-600"],
    ["Derivados", semana?.derivados, "bg-sky-600"],
  ];
  const max = Math.max(1, ...filas.map(([, n]) => n ?? 0));
  return (
    <section aria-labelledby="hoy-resultados" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="hoy-resultados" className="text-base font-semibold text-slate-950">
            Resultados de la semana
          </h2>
          <p className="text-[13px] text-slate-600">Desde el lunes. Tocá el botón para ver cada cifra con sus personas y de dónde vinieron.</p>
        </div>
        <Link prefetch={false} href={`/resultados?perfil=${slug}`} className="btn-gold-sm">
          Ver todos los resultados
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {filas.map(([titulo, n, color]) => (
          <li key={titulo} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 sm:grid-cols-[12rem_1fr_auto]">
            <span className="truncate text-[13px] text-slate-700">{titulo}</span>
            <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <span className={`block h-full rounded-full ${color}`} style={{ width: `${n ? Math.max(4, Math.round((n / max) * 100)) : 0}%` }} />
            </span>
            <span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-950">{n === null || n === undefined ? "—" : n.toLocaleString("es-AR")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
