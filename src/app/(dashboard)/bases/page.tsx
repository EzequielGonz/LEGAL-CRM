import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { ImportBaseForm } from "@/components/bases/import-base-form";

export const dynamic = "force-dynamic";

export default async function BasesPage() {
  const supabase = createClient();
  const { data: bases } = await supabase
    .from("imported_bases")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bases</h1>
          <p className="text-sm text-slate-500">
            Historial de bases importadas. El archivo original de cada una queda guardado sin
            modificar — acá solo se agregan importaciones nuevas.
          </p>
        </div>
      </div>

      <ImportBaseForm />

      <div className="space-y-3">
        {(bases ?? []).map((b) => (
          <Link
            key={b.id}
            href={`/bases/${b.id}`}
            className="block card-lift rounded-xl border border-slate-200 bg-white p-5 hover:border-gold-300"
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">{b.name}</h3>
              <AreaBadge area={b.area} />
            </div>
            <p className="text-xs text-slate-400">
              {b.source_label} · {b.total_rows} filas · {b.created_rows} nuevos ·{" "}
              {b.duplicate_rows} duplicados · {b.invalid_rows} inválidos ·{" "}
              {new Date(b.created_at).toLocaleDateString("es-AR")}
            </p>
          </Link>
        ))}
        {(bases ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Todavía no importaste ninguna base.
          </p>
        )}
      </div>
    </div>
  );
}
