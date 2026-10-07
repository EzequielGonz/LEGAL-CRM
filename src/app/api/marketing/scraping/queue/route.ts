import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_ZONES = 300;

/**
 * Cola de búsquedas de Google Maps (barrido nacional). POST carga una
 * búsqueda por cada ciudad/zona; el cron las va corriendo de a una.
 * GET lista las últimas. DELETE saca de la cola las que todavía no corrieron.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const { rubro, zonas, cantidad } = body as { rubro?: string; zonas?: string[]; cantidad?: number };

  const rubroClean = (rubro ?? "").trim();
  if (!rubroClean) return NextResponse.json({ error: "Falta el rubro a buscar" }, { status: 400 });

  const zonasClean = Array.from(
    new Set((zonas ?? []).map((z) => String(z).trim()).filter((z) => z.length > 0 && z.length <= 120))
  );
  if (zonasClean.length === 0) {
    return NextResponse.json({ error: "Cargá al menos una ciudad o zona" }, { status: 400 });
  }
  if (zonasClean.length > MAX_ZONES) {
    return NextResponse.json({ error: `Máximo ${MAX_ZONES} zonas por carga` }, { status: 400 });
  }

  const perZone = Math.min(Math.max(Math.floor(Number(cantidad)) || 40, 1), 60);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("marketing_scrape_jobs")
    .insert(zonasClean.map((zona) => ({ rubro: rubroClean, zona, cantidad: perZone })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, encoladas: zonasClean.length });
}

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("marketing_scrape_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ jobs: data ?? [] });
}

export async function DELETE() {
  const supabase = createAdminClient();
  const { error } = await supabase.from("marketing_scrape_jobs").delete().eq("status", "pendiente");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
