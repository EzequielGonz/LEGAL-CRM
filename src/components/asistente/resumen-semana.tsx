import { resumenSemana } from "@/lib/asistente/semana";
import { CIFRAS_SEMANA, proporciones, totalSemana, variacion, type Variacion } from "@/lib/asistente/semana-reglas";
import { NOMBRE_PERFIL } from "@/lib/asistente/general";

/**
 * Resumen de la semana de todo el panel (15/11), arriba del asistente
 * general. Una tarjeta por cifra: el total grande con la flecha contra la
 * semana anterior y una barra por perfil con su número escrito. Las barras
 * son una sola serie (mismo color); el número y el nombre del perfil están
 * siempre en texto, así que nada depende del color. Solo lectura.
 */
const FORMATO = new Intl.NumberFormat("es-AR");
const num = (n: number | null) => (n == null ? "—" : FORMATO.format(n));

function Flecha({ v }: { v: Variacion }) {
  if (v.flecha === "sin_dato") return null;
  const tono = v.flecha === "igual" ? "text-slate-600" : v.flecha === "sube" ? "text-emerald-800" : "text-amber-800";
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${tono}`}>
      <span aria-hidden="true">{v.flecha === "sube" ? "▲" : v.flecha === "baja" ? "▼" : "="}</span>
      <span aria-hidden="true">{v.texto}</span>
      <span className="sr-only">{v.largo}</span>
    </span>
  );
}

export async function ResumenSemana() {
  const datos = await resumenSemana().catch(() => null);
  if (!datos) {
    return <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">No se pudo leer el resumen de la semana. Probá recargar en un rato.</p>;
  }
  const total = totalSemana(datos.perfiles.map((p) => p.cifras));
  return (
    <section aria-labelledby="semana-titulo">
      <h2 id="semana-titulo" className="text-lg font-semibold text-slate-900">
        La semana en todo el panel
      </h2>
      <p className="mt-1 text-sm text-slate-600">Últimos 7 días, con la flecha contra los 7 anteriores.</p>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CIFRAS_SEMANA.map((c) => {
          const valores = datos.perfiles.map((p) => p.cifras[c.clave].actual);
          const largos = proporciones(valores);
          return (
            <li key={c.clave} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-slate-700">{c.titulo}</h3>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums text-slate-950">{num(total[c.clave].actual)}</span>
                <Flecha v={variacion(total[c.clave].actual, total[c.clave].anterior)} />
              </p>
              <p className="text-xs text-slate-600">{c.ayuda}</p>
              <ul className="mt-3 space-y-1.5" aria-label={`${c.titulo} por perfil`}>
                {datos.perfiles.map((p, i) => (
                  <li key={p.perfil} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 text-xs text-slate-700">
                    <span className="truncate">{NOMBRE_PERFIL[p.perfil]}</span>
                    <span aria-hidden="true" className="h-2.5 rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-slate-700" style={{ width: `${largos[i]}%` }} />
                    </span>
                    <span className="min-w-[2.5rem] text-right font-semibold tabular-nums text-slate-900">{num(p.cifras[c.clave].actual)}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
