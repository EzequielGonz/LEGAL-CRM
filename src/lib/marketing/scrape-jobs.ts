import { createAdminClient } from "@/lib/supabase/admin";
import { searchGooglePlaces } from "./google-places";
import { importScrapedPlaces } from "./import-scrape";

/**
 * Cola de búsquedas de Google Maps para el barrido a nivel nacional.
 * Cada búsqueda (rubro + ciudad) es un "job". El cron corre UNO por vez
 * (cada búsqueda puede tardar hasta ~45 s) y solo cuando la cola de
 * análisis no está saturada, así los negocios nuevos se van analizando a
 * medida que entran y no se acumulan miles sin analizar.
 */

const MAX_ATTEMPTS = 2;
const ANALYSIS_BACKLOG_LIMIT = 20;
const STALE_MINUTES = 5;

export async function hasRunnableScrapeJob(): Promise<boolean> {
  const supabase = createAdminClient();

  const staleBefore = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();
  await supabase
    .from("marketing_scrape_jobs")
    .update({ status: "pendiente" })
    .eq("status", "ejecutando")
    .lt("started_at", staleBefore)
    .lt("attempts", MAX_ATTEMPTS);
  await supabase
    .from("marketing_scrape_jobs")
    .update({ status: "error", error: "Se cortó la ejecución varias veces", finished_at: new Date().toISOString() })
    .eq("status", "ejecutando")
    .lt("started_at", staleBefore)
    .gte("attempts", MAX_ATTEMPTS);

  const { count: backlog } = await supabase
    .from("marketing_leads")
    .select("*", { count: "exact", head: true })
    .in("analysis_status", ["pendiente", "analizando"]);
  if ((backlog ?? 0) >= ANALYSIS_BACKLOG_LIMIT) return false;

  const { count: pending } = await supabase
    .from("marketing_scrape_jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendiente");
  return (pending ?? 0) > 0;
}

/** Corre la búsqueda pendiente más vieja. Devuelve un texto con lo que pasó. */
export async function runNextScrapeJob(): Promise<string> {
  const supabase = createAdminClient();

  const { data: next } = await supabase
    .from("marketing_scrape_jobs")
    .select("*")
    .eq("status", "pendiente")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return "sin búsquedas pendientes";

  // Reclamar: si otra ejecución lo tomó primero, esta no devuelve fila.
  const { data: claimed } = await supabase
    .from("marketing_scrape_jobs")
    .update({ status: "ejecutando", started_at: new Date().toISOString(), attempts: next.attempts + 1 })
    .eq("id", next.id)
    .eq("status", "pendiente")
    .select("id")
    .maybeSingle();
  if (!claimed) return "otra ejecución tomó la búsqueda";

  try {
    const places = await searchGooglePlaces({
      query: `${next.rubro} en ${next.zona}`,
      maxResults: next.cantidad,
    });

    const summary =
      places.length > 0
        ? await importScrapedPlaces({ rubroBuscado: next.rubro, zona: next.zona, places })
        : { base_id: null, total: 0, creados: 0, duplicados: 0, invalidos: 0, new_contact_ids: [] as string[] };

    await supabase
      .from("marketing_scrape_jobs")
      .update({
        status: "listo",
        finished_at: new Date().toISOString(),
        result: {
          base_id: summary.base_id,
          total: summary.total,
          creados: summary.creados,
          duplicados: summary.duplicados,
          invalidos: summary.invalidos,
        },
      })
      .eq("id", next.id);
    return `${next.rubro} en ${next.zona}: ${summary.creados} negocios nuevos`;
  } catch (err: any) {
    const message = String(err?.message ?? err).slice(0, 500);
    const finalFailure = next.attempts + 1 >= MAX_ATTEMPTS;
    await supabase
      .from("marketing_scrape_jobs")
      .update(
        finalFailure
          ? { status: "error", error: message, finished_at: new Date().toISOString() }
          : { status: "pendiente", error: message }
      )
      .eq("id", next.id);
    return `error en ${next.rubro} en ${next.zona}: ${message}`;
  }
}
