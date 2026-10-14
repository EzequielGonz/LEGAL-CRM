import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { Pager, pageFromParam } from "@/components/ui/pager";
import {
  ATTENTION_STATE_LABEL,
  CAPTURE_STATE_LABEL,
  CONTACT_STATE_LABEL,
  DERIVATION_STATE_LABEL,
} from "@/lib/opportunities";
import { DETENTION_LABEL, detainedContactIds, type DetentionMotive } from "@/lib/detention";
import { RUBRO_IDS } from "@/lib/rubros";
import { textoBusquedaSeguro } from "@/lib/busqueda";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Params = {
  area?: string;
  contacto?: string;
  captacion?: string;
  atencion?: string;
  derivacion?: string;
  revision?: string;
  q?: string;
  pagina?: string;
};

/**
 * Prospectos (bloques 1.5 y 1.8): una fila por oportunidad, con sus estados
 * que coexisten. Búsqueda, filtros, totales y paginación en el servidor.
 */
export default async function ProspectosPage({ searchParams }: { searchParams: Params }) {
  const supabase = createClient();
  const page = pageFromParam(searchParams.pagina);

  let query = supabase
    .from("opportunities")
    .select(
      "id, area, contact_state, capture_state, attention_state, derivation_state, review_required, created_at, contact_id, contacts!inner(full_name, phone, dni_cuil, source)",
      { count: "exact" }
    )
    .eq("rubro_id", RUBRO_IDS.juridico)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (searchParams.area) query = query.eq("area", searchParams.area);
  if (searchParams.contacto && CONTACT_STATE_LABEL[searchParams.contacto]) query = query.eq("contact_state", searchParams.contacto);
  if (searchParams.captacion && CAPTURE_STATE_LABEL[searchParams.captacion]) query = query.eq("capture_state", searchParams.captacion);
  if (searchParams.atencion && ATTENTION_STATE_LABEL[searchParams.atencion]) query = query.eq("attention_state", searchParams.atencion);
  if (searchParams.derivacion && DERIVATION_STATE_LABEL[searchParams.derivacion]) {
    query = query.eq("derivation_state", searchParams.derivacion).eq("capture_state", "captado");
  }
  if (searchParams.revision === "1") query = query.eq("review_required", true);

  const q = searchParams.q?.trim();
  if (q) {
    // Los separadores de filtros de PostgREST ("," y "()") se quitan del término.
    const safeQ = textoBusquedaSeguro(q);
    if (safeQ) {
      query = query.or(`full_name.ilike.%${safeQ}%,phone.ilike.%${safeQ}%,dni_cuil.ilike.%${safeQ}%`, {
        referencedTable: "contacts",
      });
    }
  }

  const { data: rows, count, error } = await query;
  const detained = await detainedContactIds((rows ?? []).map((r: any) => r.contact_id));
  const hasFilters = Object.entries(searchParams).some(([k, v]) => k !== "pagina" && !!v);

  const select = (name: keyof Params, label: string, options: Record<string, string>) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select
        name={name}
        defaultValue={searchParams[name] ?? ""}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
      >
        <option value="">Todos</option>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Prospectos</h1>
      </div>

      <form action="/prospectos" method="GET" className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
        {select("area", "Área", { civil: "Civil", penal: "Penal" })}
        {select("contacto", "Contacto", CONTACT_STATE_LABEL)}
        {select("captacion", "Captación", CAPTURE_STATE_LABEL)}
        {select("atencion", "Atención", ATTENTION_STATE_LABEL)}
        {select("derivacion", "Derivación (captados)", DERIVATION_STATE_LABEL)}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Buscar (nombre, teléfono o DNI)</label>
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Ej: Pérez o 1122223333"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <label className="flex items-center gap-1 pb-2 text-xs text-slate-600">
          <input type="checkbox" name="revision" value="1" defaultChecked={searchParams.revision === "1"} />
          Para revisar
        </label>
        <button type="submit" className="btn-gold">
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/prospectos" className="pb-2 text-sm text-slate-500 hover:underline">
            Limpiar filtros
          </Link>
        )}
      </form>

      {error && <p className="mb-3 text-sm text-red-600">No se pudo cargar la lista: {error.message}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Captación</th>
              <th className="px-4 py-3">Atención</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows ?? []).map((r: any) => {
              const det = detained.get(r.contact_id);
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/prospectos/${r.contact_id}`} className="font-medium text-slate-900 hover:underline">
                      {r.contacts?.full_name ?? "Sin nombre"}
                    </Link>
                    {det && (
                      <span
                        className={clsx(
                          "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          det.hardBlock ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
                        )}
                        title={DETENTION_LABEL[det.motive as DetentionMotive]}
                      >
                        {det.motive === "motivo_no_confirmado" ? "Retenido" : "Detenido"}
                      </span>
                    )}
                    {r.review_required && <span className="ml-1 text-[10px] font-semibold text-slate-500">· revisar</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.contacts?.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <AreaBadge area={r.area} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{CONTACT_STATE_LABEL[r.contact_state] ?? r.contact_state}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {CAPTURE_STATE_LABEL[r.capture_state] ?? r.capture_state}
                    {r.capture_state === "captado" && (
                      <span className="block text-[10px] text-slate-400">{DERIVATION_STATE_LABEL[r.derivation_state]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{ATTENTION_STATE_LABEL[r.attention_state] ?? r.attention_state}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleDateString("es-AR")}</td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  {hasFilters ? "No hay prospectos que coincidan con estos filtros." : "No hay prospectos todavía."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pager
          basePath="/prospectos"
          params={{ ...searchParams, pagina: undefined }}
          page={page}
          pageSize={PAGE_SIZE}
          total={count ?? 0}
          unit="oportunidades"
        />
      </div>
    </div>
  );
}
