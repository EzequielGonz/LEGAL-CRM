import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge, SourceBadge, StatusBadge, STATUS_LABEL } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: { area?: string; estado?: string; q?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("contacts")
    .select("id, full_name, phone, area, source, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (searchParams.area) query = query.eq("area", searchParams.area);
  if (searchParams.estado) query = query.eq("status", searchParams.estado);

  const q = searchParams.q?.trim();
  if (q) {
    // La sintaxis de `.or()` de PostgREST usa "," y "()" como separadores de
    // filtros: se sacan del término de búsqueda para no romper el query.
    const safeQ = q.replace(/[,()]/g, "");
    if (safeQ) query = query.or(`full_name.ilike.%${safeQ}%,phone.ilike.%${safeQ}%`);
  }

  const { data: prospectos } = await query;
  const hasFilters = Boolean(searchParams.area || searchParams.estado || searchParams.q);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Prospectos</h1>
      </div>

      <form
        action="/prospectos"
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Área</label>
          <select
            name="area"
            defaultValue={searchParams.area ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Todas</option>
            <option value="civil">Civil</option>
            <option value="penal">Penal</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Estado</label>
          <select
            name="estado"
            defaultValue={searchParams.estado ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Buscar (nombre o teléfono)
          </label>
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Ej: Pérez o 1122223333"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <button
          type="submit"
          className="btn-gold"
        >
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/prospectos" className="pb-2 text-sm text-slate-500 hover:underline">
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
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(prospectos ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/prospectos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.full_name ?? "Sin nombre"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <AreaBadge area={p.area} />
                </td>
                <td className="px-4 py-3">
                  <SourceBadge source={p.source} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(p.created_at).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
            {(prospectos ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {hasFilters
                    ? "No hay prospectos que coincidan con estos filtros."
                    : "No hay prospectos todavía."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
