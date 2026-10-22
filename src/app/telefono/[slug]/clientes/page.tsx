import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { PhoneHeader } from "@/components/telefono/phone-header";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { phoneProfile } from "@/lib/telefono";
import { soloDigitos, textoBusquedaSeguro } from "@/lib/busqueda";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const ESTADOS = [
  { key: "no_derivado", label: "No derivado" },
  { key: "derivado", label: "Derivado" },
  { key: "todos", label: "Todos" },
];

/**
 * Clientes cerrados en el teléfono (doc. 1, 3.2 · bloque 1.9): búsqueda por
 * nombre o teléfono, estado No derivado o Derivado y acceso a la ficha
 * completa (con su texto para compartir). Los captados con datos faltantes
 * siguen visibles y se pueden derivar.
 */
export default async function TelefonoClientesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { q?: string; estado?: string; pagina?: string };
}) {
  const profile = phoneProfile(params.slug);
  if (!profile) notFound();
  const supabase = createClient();
  const estado = ESTADOS.find((e) => e.key === searchParams.estado)?.key ?? "no_derivado";
  const page = pageFromParam(searchParams.pagina);
  const basePath = `/telefono/${params.slug}/clientes`;

  let query = supabase
    .from("opportunities")
    .select("id, contact_id, captured_at, derivation_state, derivation_recipient, derived_at, contacts!inner(full_name, phone)", {
      count: "exact",
    })
    .eq("rubro_id", profile.rubroId)
    .eq("capture_state", "captado")
    .order("captured_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (estado !== "todos") query = query.eq("derivation_state", estado);
  const q = searchParams.q?.replace(/[,()]/g, "").trim();
  const qSeguro = textoBusquedaSeguro(q);
  if (qSeguro) query = query.or(`full_name.ilike.%${qSeguro}%,phone.ilike.%${soloDigitos(qSeguro) || qSeguro}%`, { referencedTable: "contacts" });

  const [{ data: rows, count }, { data: rubro }] = await Promise.all([
    query,
    supabase.from("rubros").select("name").eq("id", profile.rubroId).maybeSingle(),
  ]);

  const volver = encodeURIComponent(`${basePath}?estado=${estado}${q ? `&q=${encodeURIComponent(q)}` : ""}`);

  return (
    <div>
      <PhoneHeader eyebrow={rubro?.name ?? params.slug} title="Clientes cerrados" subtitle={`${count ?? 0} en esta vista`} backHref="/telefono" />
      <main className="mx-auto max-w-md space-y-3 px-4 py-4">
        <form action={basePath} method="GET" className="flex gap-2">
          <input type="hidden" name="estado" value={estado} />
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Nombre o teléfono"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus-gold"
          />
          <button type="submit" className="btn-gold">
            Buscar
          </button>
        </form>
        <div className="flex gap-2">
          {ESTADOS.map((e) => (
            <Link
              key={e.key}
              href={`${basePath}?estado=${e.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={estado === e.key ? "page" : undefined}
              className="chip-filtro chip-filtro-chico"
            >
              {e.label}
            </Link>
          ))}
        </div>

        {(rows ?? []).map((r: any) => (
          <Link
            key={r.id}
            href={`/ficha/${r.contact_id}?volver=${volver}`}
            className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{r.contacts?.full_name ?? "Sin nombre"}</p>
                <p className="text-sm text-slate-500">{r.contacts?.phone ? `+${r.contacts.phone}` : "Sin teléfono"}</p>
              </div>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                  r.derivation_state === "derivado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
                )}
              >
                {r.derivation_state === "derivado" ? "Derivado" : "No derivado"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Captado {r.captured_at ? new Date(r.captured_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) : "—"}
              {r.derivation_state === "derivado" && r.derived_at ? ` · derivado ${new Date(r.derived_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}` : ""}
              {r.derivation_recipient ? ` · ${r.derivation_recipient}` : ""}
            </p>
          </Link>
        ))}
        {(rows ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            {q ? "No hay resultados para esa búsqueda." : "No hay clientes en esta vista."}
          </p>
        )}
        <div className="rounded-xl border border-slate-200 bg-white">
          <Pager basePath={basePath} params={{ estado, q }} page={page} pageSize={PAGE_SIZE} total={count ?? 0} unit="clientes" />
        </div>
      </main>
    </div>
  );
}
