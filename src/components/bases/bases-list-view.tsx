import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { ImportBaseForm } from "@/components/bases/import-base-form";
import { DeleteBaseButton } from "@/components/bases/delete-base-button";
import { ArchivedToggle } from "@/components/ui/archived-toggle";
import { getBaseQuality, pctText } from "@/lib/bases/quality";
import type { AreaOption } from "@/components/bases/import-flow";

/**
 * Listado de bases de un perfil (bloque 1.6), con su resumen de carga y su
 * calidad con denominador. El mismo componente sirve para todos los
 * perfiles; cada panel pasa sus áreas.
 */
export async function BasesListView({
  areas,
  importAreas,
  basesPath,
  searchParams,
}: {
  areas: string[];
  importAreas: AreaOption[];
  basesPath: string;
  searchParams: { archivadas?: string };
}) {
  const verArchivadas = searchParams?.archivadas === "1";
  const supabase = createClient();
  const { data: bases } = await supabase
    .from("imported_bases")
    .select("*")
    .in("area", areas)
    .filter("archived_at", verArchivadas ? "not.is" : "is", null)
    .order("created_at", { ascending: false });

  const qualities = new Map(
    await Promise.all((bases ?? []).map(async (b: any) => [b.id, await getBaseQuality(b.id)] as const))
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bases</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cargá un archivo con contactos para usarlo después en una campaña. Cargar una base nunca envía mensajes; el archivo
            original queda guardado sin modificar.
          </p>
        </div>
        <span className={verArchivadas ? "" : "solo-avanzado"}>
          <ArchivedToggle basePath={basesPath} showing={verArchivadas} />
        </span>
      </div>

      {!verArchivadas && (
        <div className="mb-6">
          <ImportBaseForm areas={importAreas} basesPath={basesPath} />
        </div>
      )}

      <ul className="space-y-3" aria-label="Bases cargadas">
        {(bases ?? []).map((b: any) => {
          const q = qualities.get(b.id);
          const s = b.import_summary as any;
          return (
            <li key={b.id} className="card-lift rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400">
              <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 font-medium text-slate-900 [overflow-wrap:anywhere]">
                  <Link href={`${basesPath}/${b.id}`} className="underline-offset-2 hover:underline">
                    {b.name}
                  </Link>
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                  <AreaBadge area={b.area} />
                  {/* Archivar queda fuera del enlace (antes había un botón dentro de un enlace). */}
                  <span className="solo-avanzado">
                    <DeleteBaseButton baseId={b.id} baseName={b.name} archived={!!b.archived_at} />
                  </span>
                </div>
              </div>
              {/* Simple: lo que importa para decidir qué hacer con la base. */}
              <p className="solo-simple text-sm text-slate-700">
                <span className="tabular-nums">{(b.total_rows ?? 0).toLocaleString("es-AR")}</span> filas ·{" "}
                <span className="tabular-nums">{(b.created_rows ?? 0).toLocaleString("es-AR")}</span> contactos nuevos
                {b.invalid_rows ? <> · <span className="tabular-nums">{b.invalid_rows.toLocaleString("es-AR")}</span> requieren corrección</> : null}
                {q ? <> · respondieron <span className="tabular-nums">{q.respondieron}</span> de <span className="tabular-nums">{q.contactados}</span> contactados</> : null}
                {" · "}
                <span className="tabular-nums">{new Date(b.created_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</span>
              </p>
              <p className="solo-avanzado text-xs text-slate-600">
                {b.source_label} · {b.total_rows} filas · {b.created_rows} nuevos · {b.duplicate_rows} duplicados ·{" "}
                {b.invalid_rows} inválidos · {new Date(b.created_at).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                {s?.contactados_anteriormente ? ` · ${s.contactados_anteriormente} contactados antes de la carga` : ""}
                {s?.conflictos ? ` · ${s.conflictos} conflictos` : ""}
              </p>
              {q && (
                <p className="solo-avanzado mt-1 text-xs text-slate-600">
                  Calidad: {q.respondieron} respondieron de {q.contactados} contactados · números equivocados{" "}
                  {pctText(q.numeros_equivocados, q.respondieron)} · consultas negadas {pctText(q.consultas_negadas, q.respondieron)} ·
                  contestadores {pctText(q.contestadores_automaticos, q.respondieron)} · desconocido{" "}
                  {pctText(q.sin_clasificar, q.respondieron)} · {q.detenidos} detenidos
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div>
        {(bases ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-700">
            {verArchivadas ? "No hay bases archivadas." : "Todavía no importaste ninguna base."}
          </p>
        )}
      </div>
    </div>
  );
}
