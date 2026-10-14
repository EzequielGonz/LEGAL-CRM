import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { CAPTURE_STATE_LABEL, DERIVATION_STATE_LABEL, FOLLOWUP_STATE_LABEL } from "@/lib/opportunities";
import { textoBusquedaSeguro } from "@/lib/busqueda";

const PAGE_SIZE = 50;

type Vista = "captados" | "no_derivados" | "derivados" | "seguimiento" | "caidos" | "perdidos";

const VISTAS: { key: Vista; label: string }[] = [
  { key: "no_derivados", label: "Captados sin derivar" },
  { key: "derivados", label: "Derivados" },
  { key: "captados", label: "Todos los captados" },
  { key: "seguimiento", label: "En seguimiento" },
  { key: "caidos", label: "Seguimiento caído" },
  { key: "perdidos", label: "Perdidos" },
];

/**
 * Casos del perfil (doc. 1, sección Casos): captados (No derivado /
 * Derivado), en seguimiento, con seguimiento caído y perdidos. Es la misma
 * oportunidad que en Prospectos; las acciones se hacen en la ficha.
 */
export async function CasosList({
  rubroId,
  basePath,
  searchParams,
  fichaBase = "/prospectos",
}: {
  rubroId: string;
  basePath: string;
  searchParams: { vista?: string; q?: string; pagina?: string };
  fichaBase?: string;
}) {
  const supabase = createClient();
  const vista: Vista = (VISTAS.find((v) => v.key === searchParams.vista)?.key ?? "no_derivados") as Vista;
  const page = pageFromParam(searchParams.pagina);

  let query = supabase
    .from("opportunities")
    .select(
      "id, capture_state, capture_reason, captured_at, derivation_state, derived_at, derivation_recipient, followup_state, updated_at, contact_id, contacts!inner(full_name, phone)",
      { count: "exact" }
    )
    .eq("rubro_id", rubroId)
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (vista === "captados") query = query.eq("capture_state", "captado");
  if (vista === "no_derivados") query = query.eq("capture_state", "captado").eq("derivation_state", "no_derivado");
  if (vista === "derivados") query = query.eq("capture_state", "captado").eq("derivation_state", "derivado");
  if (vista === "seguimiento") query = query.eq("followup_state", "activo");
  if (vista === "caidos") query = query.eq("followup_state", "caido");
  if (vista === "perdidos") query = query.eq("capture_state", "perdido");

  const q = searchParams.q?.replace(/[,()]/g, "").trim();
  const qSeguro = textoBusquedaSeguro(q);
  if (qSeguro) query = query.or(`full_name.ilike.%${qSeguro}%,phone.ilike.%${qSeguro}%`, { referencedTable: "contacts" });

  const { data: rows, count } = await query;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {VISTAS.map((v) => (
          <Link
            key={v.key}
            href={`${basePath}?vista=${v.key}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium",
              vista === v.key ? "border-gold-400 bg-slate-900 text-gold-100" : "border-slate-200 bg-white text-slate-600 hover:border-gold-300"
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>
      <form action={basePath} method="GET" className="mb-3 flex gap-2">
        <input type="hidden" name="vista" value={vista} />
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Buscar nombre o teléfono"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
        <button type="submit" className="btn-gold">
          Buscar
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rows ?? []).map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`${fichaBase}/${r.contact_id}`} className="font-medium text-slate-900 hover:underline">
                    {r.contacts?.full_name ?? "Sin nombre"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.contacts?.phone ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {CAPTURE_STATE_LABEL[r.capture_state]}
                  {r.capture_state === "captado" && ` · ${DERIVATION_STATE_LABEL[r.derivation_state]}`}
                  {r.derivation_recipient ? ` · ${r.derivation_recipient}` : ""}
                  {r.followup_state !== "ninguno" ? ` · ${FOLLOWUP_STATE_LABEL[r.followup_state]}` : ""}
                  {r.capture_state === "perdido" && r.capture_reason ? ` · ${r.capture_reason}` : ""}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(r.derived_at ?? r.captured_at ?? r.updated_at).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No hay casos en esta vista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pager basePath={basePath} params={{ vista, q: searchParams.q }} page={page} pageSize={PAGE_SIZE} total={count ?? 0} unit="casos" />
      </div>
    </div>
  );
}
