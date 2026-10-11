import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AreaBadge } from "@/components/ui/badge";
import { BaseRowsTable, type BaseRowItem } from "@/components/bases/base-rows-table";
import { BaseRawGrid, type BaseRawRow } from "@/components/bases/base-raw-grid";
import { BaseViewTabs } from "@/components/bases/base-view-tabs";
import { DeleteBaseButton } from "@/components/bases/delete-base-button";
import { BaseQualityPanel } from "@/components/bases/base-quality-panel";
import { ImportSummaryCard } from "@/components/bases/import-flow";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { getBaseQuality } from "@/lib/bases/quality";
import { MATCH_KIND_LABEL, type MatchKind } from "@/lib/bases/import";
import { DETENTION_LABEL, type DetentionMotive } from "@/lib/detention";
import { AREA_TO_RUBRO_ID } from "@/lib/rubros";

const PAGE_SIZE = 100;

const FILTERS: { key: string; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "nuevos", label: "Nuevos" },
  { key: "repetidas", label: "Repetidas en el archivo" },
  { key: "base_anterior", label: "En bases anteriores" },
  { key: "existentes", label: "Contactos existentes" },
  { key: "invalidas", label: "Requieren corrección" },
  { key: "revisar", label: "Teléfono a revisar" },
  { key: "contactados", label: "Contactados antes" },
  { key: "detenidos", label: "Detenidos" },
  { key: "conflictos", label: "Conflictos" },
];

function previousLabel(p: any): string | null {
  if (!p) return null;
  const parts: string[] = [];
  if (p.fecha) parts.push(new Date(p.fecha).toLocaleDateString("es-AR"));
  if (p.campana) parts.push(`campaña «${p.campana}»`);
  if (p.linea) parts.push(`línea ${p.linea}`);
  if (p.estado === "respondio") parts.push("respondió");
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Detalle de una base (bloque 1.6): resumen de la carga (las filas suman el
 * total), calidad con denominador, filtros por resultado y marca, y filas
 * paginadas en el servidor (sin el tope de 1.000).
 */
export async function BaseDetailView({
  baseId,
  areas,
  basesPath,
  campaignsPath,
  searchParams,
  backLabel = "← Volver a bases",
  headerExtra,
  fichaBase = "/prospectos",
}: {
  baseId: string;
  areas: string[];
  /** listado al que pertenece la base (también arma los enlaces de filtros y páginas) */
  basesPath: string;
  campaignsPath: string;
  searchParams: { pagina?: string; filtro?: string };
  backLabel?: string;
  /** acciones propias de un panel (por ejemplo, exportar una búsqueda de Marketing) */
  headerExtra?: React.ReactNode;
  /** dónde se abre la ficha de un contacto ("/prospectos" en Jurídico, "/ficha" en los demás) */
  fichaBase?: string;
}) {
  const supabase = createClient();
  const { data: base } = await supabase
    .from("imported_bases")
    .select("*")
    .eq("id", baseId)
    .in("area", areas)
    .maybeSingle();
  if (!base) notFound();

  const filter = FILTERS.find((f) => f.key === searchParams.filtro) ?? FILTERS[0];
  const page = pageFromParam(searchParams.pagina);

  let rowsQuery = supabase
    .from("imported_base_rows")
    .select(
      "id, row_number, status, error, raw_data, contact_id, match_kind, previously_contacted, previous_contact, detained_motive, conflict, contacts(full_name, phone)",
      { count: "exact" }
    )
    .eq("base_id", baseId)
    .order("row_number")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  switch (filter.key) {
    case "nuevos":
      rowsQuery = rowsQuery.eq("status", "creado");
      break;
    case "repetidas":
      rowsQuery = rowsQuery.eq("match_kind", "repetido_en_archivo");
      break;
    case "base_anterior":
      rowsQuery = rowsQuery.eq("match_kind", "base_anterior");
      break;
    case "existentes":
      rowsQuery = rowsQuery.eq("match_kind", "contacto_existente");
      break;
    case "invalidas":
      rowsQuery = rowsQuery.eq("status", "invalido");
      break;
    case "revisar":
      rowsQuery = rowsQuery.neq("status", "invalido").ilike("error", "%baja confianza%");
      break;
    case "contactados":
      rowsQuery = rowsQuery.eq("previously_contacted", true);
      break;
    case "detenidos":
      rowsQuery = rowsQuery.not("detained_motive", "is", null);
      break;
    case "conflictos":
      rowsQuery = rowsQuery.not("conflict", "is", null);
      break;
  }

  const rubroId = AREA_TO_RUBRO_ID[base.area as string];
  const [{ data: rows, count }, { data: channels }, { data: lines }, quality, { count: savedRows }] = await Promise.all([
    rowsQuery,
    supabase.from("channels").select("id, label").eq("area", base.area).eq("type", "whatsapp"),
    supabase
      .from("profile_lines")
      .select("id, label")
      .eq("rubro_id", rubroId)
      .eq("active", true)
      .eq("use_for_campaigns", true)
      .order("created_at"),
    getBaseQuality(baseId),
    supabase.from("imported_base_rows").select("id", { count: "exact", head: true }).eq("base_id", baseId),
  ]);

  const items: BaseRowItem[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    row_number: r.row_number,
    status: r.status,
    error: r.error,
    contact_id: r.contact_id,
    contact_name: r.contacts?.full_name ?? null,
    contact_phone: r.contacts?.phone ?? null,
    match_label: r.match_kind ? MATCH_KIND_LABEL[r.match_kind as MatchKind] ?? r.match_kind : null,
    previously_contacted: r.previously_contacted ?? null,
    previous_label: previousLabel(r.previous_contact),
    detained_label: r.detained_motive ? DETENTION_LABEL[r.detained_motive as DetentionMotive] ?? r.detained_motive : null,
    conflict: r.conflict ?? null,
  }));

  const rawRows: BaseRawRow[] = (rows ?? []).map((r: any) => ({
    row_number: r.row_number,
    status: r.status,
    raw_data: r.raw_data ?? {},
  }));

  // El link de descarga del archivo original se genera al vuelo (URL
  // firmada, vence en 1 h) contra el bucket privado.
  let downloadUrl: string | null = null;
  if (base.storage_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage.from("bases-originales").createSignedUrl(base.storage_path, 3600);
    downloadUrl = signed?.signedUrl ?? null;
  }

  const rawSummary = base.import_summary as any;
  const incompleta = rawSummary?.incompleta === true || (!rawSummary && (savedRows ?? 0) < base.total_rows);
  const summary = rawSummary && !rawSummary.incompleta ? rawSummary : null;
  const detailPath = `${basesPath}/${baseId}`;

  return (
    <div>
      <Link href={basesPath} className="mb-4 inline-block text-sm text-slate-500 hover:underline">
        {backLabel}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{base.name}</h1>
          <p className="text-sm text-slate-500">
            {base.source_label} · {base.file_name ?? "sin archivo"} · {new Date(base.created_at).toLocaleString("es-AR")}
            {base.archived_at ? ` · archivada el ${new Date(base.archived_at).toLocaleDateString("es-AR")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          {downloadUrl && (
            <Link href={downloadUrl} className="text-sm text-gold-700 hover:underline">
              Descargar archivo original
            </Link>
          )}
          <AreaBadge area={base.area} />
          <DeleteBaseButton baseId={base.id} baseName={base.name} redirectTo={basesPath} archived={!!base.archived_at} />
        </div>
      </div>

      {incompleta && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Importación incompleta: se guardaron {savedRows ?? 0} de {base.total_rows} filas
          {rawSummary?.error ? ` (motivo: ${rawSummary.error})` : ""}. Lo guardado se ve abajo y no se borra; para completar,
          volvé a cargar el archivo (se registra como una base nueva).
        </p>
      )}

      {summary ? (
        <div className="mb-6">
          <ImportSummaryCard summary={summary} basesPath={null} />
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Filas totales", base.total_rows, ""],
            ["Nuevos", base.created_rows, "text-green-600"],
            ["Duplicados", base.duplicate_rows, "text-slate-500"],
            ["Inválidos", base.invalid_rows, "text-red-600"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`text-xl font-semibold ${tone}`}>{value as number}</p>
            </div>
          ))}
          <p className="col-span-2 text-xs text-slate-400 md:col-span-4">
            {base.created_rows + base.duplicate_rows + base.invalid_rows === base.total_rows
              ? `Nuevos + duplicados + inválidos = ${base.total_rows} (coincide con las filas).`
              : "Nuevos + duplicados + inválidos no coincide con las filas: revisar."}{" "}
            Base importada antes del diagnóstico por fila (contactado anteriormente, detención y conflictos sin dato).
          </p>
        </div>
      )}

      <div className="mb-6">
        <BaseQualityPanel q={quality} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "todas" ? detailPath : `${detailPath}?filtro=${f.key}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium",
              filter.key === f.key ? "border-gold-400 bg-slate-900 text-gold-100" : "border-slate-200 bg-white text-slate-600 hover:border-gold-300"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <BaseViewTabs
        gridView={<BaseRawGrid rows={rawRows} />}
        contactsView={
          <BaseRowsTable
            rows={items}
            baseId={base.id}
            baseContactCount={quality?.contactos ?? 0}
            channels={channels ?? []}
            lines={lines ?? []}
            redirectBase={campaignsPath}
            fichaHref={fichaBase === "/ficha" ? `/ficha/{id}?volver=${encodeURIComponent(detailPath)}` : `${fichaBase}/{id}`}
          />
        }
      />
      <div className="mt-2 rounded-xl border border-slate-200 bg-white">
        <Pager
          basePath={detailPath}
          params={{ filtro: filter.key === "todas" ? undefined : filter.key }}
          page={page}
          pageSize={PAGE_SIZE}
          total={count ?? 0}
          unit="filas"
        />
      </div>
    </div>
  );
}
