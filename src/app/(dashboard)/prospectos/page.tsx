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
import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import { estadoCorto } from "@/lib/inicio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prospectos" };

const TONO_TEXTO: Record<string, string> = {
  bloqueo: "bg-red-50 text-red-800 ring-red-200",
  atencion: "bg-amber-50 text-amber-900 ring-amber-200",
  ok: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  info: "bg-slate-50 text-slate-800 ring-slate-200",
};

/** Vistas rápidas (Simple y Avanzado): los conjuntos que más se usan, en un clic. */
const VISTAS: { texto: string; params: Record<string, string> }[] = [
  { texto: "Todos", params: {} },
  { texto: "Esperan a una persona", params: { atencion: "requiere_humano" } },
  { texto: "Captados sin derivar", params: { captacion: "captado", derivacion: "no_derivado" } },
  { texto: "Sin contactar", params: { contacto: "sin_contactar" } },
  { texto: "Para revisar", params: { revision: "1" } },
];

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
      // También busca en los valores de las columnas importadas de sus bases (0204).
      query = query.or(`full_name.ilike.%${safeQ}%,phone.ilike.%${safeQ}%,dni_cuil.ilike.%${safeQ}%,base_text.ilike.%${safeQ}%`, {
        referencedTable: "contacts",
      });
    }
  }

  const { data: rows, count, error } = await query;
  const detained = await detainedContactIds((rows ?? []).map((r: any) => r.contact_id));
  const hasFilters = Object.entries(searchParams).some(([k, v]) => k !== "pagina" && !!v);

  const FILTROS: { name: keyof Params; label: string; options: Record<string, string> }[] = [
    { name: "area", label: "Área", options: { civil: "Civil", penal: "Penal" } },
    { name: "contacto", label: "Contacto", options: CONTACT_STATE_LABEL },
    { name: "captacion", label: "Captación", options: CAPTURE_STATE_LABEL },
    { name: "atencion", label: "Atención", options: ATTENTION_STATE_LABEL },
    { name: "derivacion", label: "Derivación (captados)", options: DERIVATION_STATE_LABEL },
  ];
  // Filtros activos, cada uno con su enlace para quitarlo (se conservan los demás).
  const sinFiltro = (clave: keyof Params) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== clave && k !== "pagina") p.set(k, String(v));
    const qs = p.toString();
    return qs ? `/prospectos?${qs}` : "/prospectos";
  };
  const activos: { clave: keyof Params; texto: string }[] = [
    ...FILTROS.filter((f) => searchParams[f.name] && f.options[searchParams[f.name] as string]).map((f) => ({
      clave: f.name,
      texto: `${f.label}: ${f.options[searchParams[f.name] as string]}`,
    })),
    ...(searchParams.q?.trim() ? [{ clave: "q" as const, texto: `Búsqueda: «${searchParams.q.trim()}»` }] : []),
    ...(searchParams.revision === "1" ? [{ clave: "revision" as const, texto: "Para revisar" }] : []),
  ];

  const select = (name: keyof Params, label: string, options: Record<string, string>) => (
    <div>
      <label htmlFor={`filtro-${name}`} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        id={`filtro-${name}`}
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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Prospectos</h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="tabular-nums">{(count ?? 0).toLocaleString("es-AR")}</span> {hasFilters ? "coinciden con lo elegido" : "oportunidades en total"}. Abrí uno para ver su ficha y su conversación.
        </p>
      </div>

      <nav aria-label="Vistas rápidas" className="mb-3 flex flex-wrap gap-2">
        {VISTAS.map((v) => {
          const qs = new URLSearchParams(v.params).toString();
          const activa =
            Object.keys(v.params).length === 0
              ? !hasFilters
              : Object.entries(v.params).every(([k, val]) => searchParams[k as keyof Params] === val) &&
                Object.entries(searchParams).filter(([k, val]) => val && k !== "pagina").length === Object.keys(v.params).length;
          return (
            <Link
              key={v.texto}
              href={qs ? `/prospectos?${qs}` : "/prospectos"}
              aria-current={activa ? "page" : undefined}
              className={clsx(
                "tactil inline-flex items-center rounded-full border px-4 text-sm font-medium",
                activa ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              )}
            >
              {v.texto}
            </Link>
          );
        })}
      </nav>

      <form action="/prospectos" method="GET" className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
        {/* Los filtros detallados se ven en Avanzado; en Simple siguen aplicándose (no se pierden al cambiar de nivel). */}
        {FILTROS.map((f) => (
          <span key={f.name} className="solo-avanzado">{select(f.name, f.label, f.options)}</span>
        ))}
        <div>
          <label htmlFor="filtro-q" className="mb-1 block text-sm font-medium text-slate-700">Buscar (nombre, teléfono o DNI)</label>
          <input
            id="filtro-q"
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Ej: Pérez o 1122223333"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          />
        </div>
        <label className="solo-avanzado tactil flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="revision" value="1" defaultChecked={searchParams.revision === "1"} className="h-4 w-4" />
          Para revisar
        </label>
        {/* En Simple, «Para revisar» se elige con las vistas rápidas; la casilla oculta igual se envía, así no se pierde. */}
        <button type="submit" className="btn-gold">
          <span className="solo-simple">Buscar</span>
          <span className="solo-avanzado">Filtrar</span>
        </button>
      </form>

      {activos.length > 0 && (
        <div role="group" aria-label="Filtros activos" className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-700">Filtros activos:</span>
          {activos.map((a) => (
            <Link
              key={a.clave}
              href={sinFiltro(a.clave)}
              className="tactil inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-slate-800 hover:bg-slate-50"
              aria-label={`Quitar filtro ${a.texto}`}
            >
              {a.texto} <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link href="/prospectos" className="tactil inline-flex items-center px-2 font-medium text-slate-800 underline">
            Limpiar filtros
          </Link>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">No se pudo cargar la lista: {error.message}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Área</th>
              <th className="solo-simple px-4 py-3">Qué pasa</th>
              <th className="solo-avanzado px-4 py-3">Contacto</th>
              <th className="solo-avanzado px-4 py-3">Captación</th>
              <th className="solo-avanzado px-4 py-3">Atención</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows ?? []).map((r: any) => {
              const det = detained.get(r.contact_id);
              const corto = estadoCorto({ ...r, detenido: !!det });
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <EnlaceDetalle href={`/prospectos/${r.contact_id}`} className="font-medium text-slate-900 hover:underline">
                      {r.contacts?.full_name ?? "Sin nombre"}
                    </EnlaceDetalle>
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
                  <td className="px-4 py-3 tabular-nums text-slate-700">{r.contacts?.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <AreaBadge area={r.area} />
                  </td>
                  <td className="solo-simple px-4 py-3">
                    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", TONO_TEXTO[corto.tono])}>{corto.texto}</span>
                  </td>
                  <td className="solo-avanzado px-4 py-3 text-xs text-slate-700">{CONTACT_STATE_LABEL[r.contact_state] ?? r.contact_state}</td>
                  <td className="solo-avanzado px-4 py-3 text-xs text-slate-700">
                    {CAPTURE_STATE_LABEL[r.capture_state] ?? r.capture_state}
                    {r.capture_state === "captado" && (
                      <span className="block text-xs text-slate-600">{DERIVATION_STATE_LABEL[r.derivation_state]}</span>
                    )}
                  </td>
                  <td className="solo-avanzado px-4 py-3 text-xs text-slate-700">{ATTENTION_STATE_LABEL[r.attention_state] ?? r.attention_state}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{new Date(r.created_at).toLocaleDateString("es-AR")}</td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-600">
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
