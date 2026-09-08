import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { BaseRowsTable, type BaseRowItem } from "@/components/bases/base-rows-table";

export const dynamic = "force-dynamic";

export default async function BaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: base } = await supabase
    .from("imported_bases")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!base) notFound();

  const [{ data: rows }, { data: channels }] = await Promise.all([
    supabase
      .from("imported_base_rows")
      .select("id, row_number, status, error, contact_id, contacts(full_name, phone)")
      .eq("base_id", params.id)
      .order("row_number"),
    supabase
      .from("channels")
      .select("id, label")
      .eq("area", base.area)
      .eq("type", "whatsapp"),
  ]);

  const items: BaseRowItem[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    row_number: r.row_number,
    status: r.status,
    error: r.error,
    contact_id: r.contact_id,
    contact_name: r.contacts?.full_name ?? null,
    contact_phone: r.contacts?.phone ?? null,
  }));

  return (
    <div>
      <Link href="/bases" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        ← Volver a bases
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{base.name}</h1>
          <p className="text-sm text-slate-500">
            {base.source_label} · {base.file_name} ·{" "}
            {new Date(base.created_at).toLocaleString("es-AR")}
          </p>
        </div>
        <AreaBadge area={base.area} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Filas totales</p>
          <p className="text-xl font-semibold">{base.total_rows}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Nuevos</p>
          <p className="text-xl font-semibold text-green-600">{base.created_rows}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Duplicados</p>
          <p className="text-xl font-semibold text-slate-500">{base.duplicate_rows}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Inválidos</p>
          <p className="text-xl font-semibold text-red-600">{base.invalid_rows}</p>
        </div>
      </div>

      <BaseRowsTable rows={items} channels={channels ?? []} />
    </div>
  );
}
