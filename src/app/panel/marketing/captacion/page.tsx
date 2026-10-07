import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteBaseButton } from "@/components/bases/delete-base-button";
import { ScrapingForm } from "@/components/marketing/scraping-form";
import { ScrapeQueueForm } from "@/components/marketing/scrape-queue-form";

export const dynamic = "force-dynamic";

export default async function CaptacionMarketingPage() {
  const supabase = createClient();
  const [{ data: bases }, { data: jobs }] = await Promise.all([
    supabase.from("imported_bases").select("*").eq("area", "marketing").order("created_at", { ascending: false }),
    supabase.from("marketing_scrape_jobs").select("*").order("created_at", { ascending: false }).limit(60),
  ]);
  const jobCount = (status: string) => (jobs ?? []).filter((j: any) => j.status === status).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Captación — Google Maps</h1>
          <p className="text-sm text-slate-500">
            Busca negocios por rubro y zona a través de la API oficial de Google Maps y los carga
            como leads nuevos. Un negocio que ya apareció en una búsqueda anterior nunca se vuelve
            a cargar.
          </p>
        </div>
      </div>

      <ScrapingForm />

      <ScrapeQueueForm />

      {(jobs ?? []).length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Cola de búsquedas</h2>
          <p className="mb-3 text-xs text-slate-500">
            {jobCount("pendiente")} pendientes · {jobCount("ejecutando")} corriendo · {jobCount("listo")} listas ·{" "}
            {jobCount("error")} con error
          </p>
          <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-slate-600">
            {(jobs ?? []).map((j: any) => (
              <li key={j.id} className="flex justify-between gap-3">
                <span>
                  {j.rubro} en {j.zona}
                </span>
                <span className="text-slate-400">
                  {j.status === "listo"
                    ? `${j.result?.creados ?? 0} nuevos de ${j.result?.total ?? 0}`
                    : j.status === "error"
                      ? `error: ${j.error ?? ""}`.slice(0, 80)
                      : j.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {(bases ?? []).map((b) => (
          <Link
            key={b.id}
            href={`/panel/marketing/captacion/${b.id}`}
            className="block card-lift rounded-xl border border-slate-200 bg-white p-5 hover:border-gold-300"
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-medium text-slate-900">{b.name}</h3>
              <DeleteBaseButton baseId={b.id} baseName={b.name} />
            </div>
            <p className="text-xs text-slate-400">
              {b.source_label} · {b.total_rows} negocios · {b.created_rows} nuevos ·{" "}
              {b.duplicate_rows} ya existían · {b.invalid_rows} sin teléfono ·{" "}
              {new Date(b.created_at).toLocaleDateString("es-AR")}
            </p>
          </Link>
        ))}
        {(bases ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Todavía no hiciste ninguna búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
