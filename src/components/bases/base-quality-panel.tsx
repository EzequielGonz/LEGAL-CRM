import { pctText, type BaseQuality } from "@/lib/bases/quality";

/**
 * Diagnóstico de calidad de una base con su denominador. Números
 * equivocados, consultas negadas y contestadores automáticos se cuentan
 * sobre quienes respondieron; lo que no se pudo clasificar se muestra como
 * desconocido.
 */
export function BaseQualityPanel({ q, compact = false }: { q: BaseQuality | null; compact?: boolean }) {
  if (!q) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">No se pudo calcular la calidad de esta base.</p>;
  }
  const items: { label: string; n: number; tone: string }[] = [
    { label: "Números equivocados", n: q.numeros_equivocados, tone: "text-red-600" },
    { label: "Consultas negadas", n: q.consultas_negadas, tone: "text-amber-600" },
    { label: "Contestadores automáticos", n: q.contestadores_automaticos, tone: "text-slate-600" },
    { label: "Desconocido (sin clasificar)", n: q.sin_clasificar, tone: "text-slate-500" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-1 text-sm font-semibold text-slate-800">Calidad de la base</p>
      <p className="mb-3 text-xs text-slate-500">
        {q.contactos.toLocaleString("es-AR")} contactos · {q.contactados.toLocaleString("es-AR")} contactados (
        {pctText(q.contactados, q.contactos)}) · {q.respondieron.toLocaleString("es-AR")} respondieron (
        {pctText(q.respondieron, q.contactados)} de los contactados) · {q.detenidos.toLocaleString("es-AR")} detenidos
      </p>
      <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-3 md:grid-cols-4"}>
        {items.map((it) => (
          <div key={it.label} className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{it.label}</p>
            <p className={`text-lg font-semibold ${it.tone}`}>{it.n.toLocaleString("es-AR")}</p>
            <p className="text-[11px] text-slate-400">
              {pctText(it.n, q.respondieron)} de {q.respondieron.toLocaleString("es-AR")} que respondieron
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Denominador: contactos de la base que respondieron. Una respuesta puede tener más de una marca; lo no clasificado queda
        como desconocido.
      </p>
    </div>
  );
}
