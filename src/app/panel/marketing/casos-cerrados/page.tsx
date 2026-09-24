import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SourceBadge, StatusBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const AREA = "marketing" as const;

/**
 * Versión de "Casos cerrados" exclusiva de Marketing: mismo criterio de
 * cierre que Jurídico y Agencia 0KM (status cerrado_ganado /
 * cerrado_perdido), pero siempre filtrado por area = "marketing" para que
 * nunca se mezcle con los clientes cerrados de otro rubro.
 */
export default async function CasosMarketingPage({
  searchParams,
}: {
  searchParams: { resultado?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("contacts")
    .select("id, full_name, phone, source, status, updated_at, qualification_data")
    .eq("area", AREA)
    .in("status", ["cerrado_ganado", "cerrado_perdido"])
    .order("updated_at", { ascending: false })
    .limit(200);

  if (searchParams.resultado === "ganado") query = query.eq("status", "cerrado_ganado");
  if (searchParams.resultado === "perdido") query = query.eq("status", "cerrado_perdido");

  const { data: casos } = await query;
  const hasFilters = Boolean(searchParams.resultado);

  const totalGanados = (casos ?? []).filter((c) => c.status === "cerrado_ganado").length;
  const totalPerdidos = (casos ?? []).filter((c) => c.status === "cerrado_perdido").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes cerrados</h1>
          <p className="text-sm text-slate-500">
            Clientes de Marketing marcados como cerrados (ganados o perdidos) desde su ficha.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:w-80">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-[11px] uppercase text-slate-400">Ganados</p>
          <p className="text-xl font-semibold text-green-600">{totalGanados}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-[11px] uppercase text-slate-400">Perdidos</p>
          <p className="text-xl font-semibold text-red-600">{totalPerdidos}</p>
        </div>
      </div>

      <form
        action="/panel/marketing/casos-cerrados"
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Resultado</label>
          <select
            name="resultado"
            defaultValue={searchParams.resultado ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Todos</option>
            <option value="ganado">Ganado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
        <button type="submit" className="btn-gold">
          Filtrar
        </button>
        {hasFilters && (
          <Link
            href="/panel/marketing/casos-cerrados"
            className="pb-2 text-sm text-slate-500 hover:underline"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Información del caso</th>
              <th className="px-4 py-3">Última actualización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(casos ?? []).map((c: any) => {
              const datos = Object.entries(c.qualification_data ?? {}) as [string, unknown][];
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 align-top font-medium text-slate-900">
                    {c.full_name ?? "Sin nombre"}
                  </td>
                  <td className="px-4 py-3 align-top text-slate-600">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 align-top">
                    <SourceBadge source={c.source} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    {datos.length === 0 ? (
                      <span className="text-slate-400">Sin datos recopilados.</span>
                    ) : (
                      <dl className="max-w-xs space-y-0.5">
                        {datos.map(([key, value]) => (
                          <div key={key} className="text-xs">
                            <dt className="inline font-medium capitalize text-slate-500">
                              {key.replaceAll("_", " ")}:
                            </dt>{" "}
                            <dd className="inline text-slate-700">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-slate-400">
                    {new Date(c.updated_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              );
            })}
            {(casos ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {hasFilters
                    ? "No hay clientes cerrados que coincidan con este filtro."
                    : "Todavía no hay ningún cliente cerrado de Marketing."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
