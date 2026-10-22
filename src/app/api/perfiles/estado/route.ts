import { NextResponse } from "next/server";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { AREAS_DE_PERFIL, resumenCifras } from "@/lib/cartera-servidor";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Vista previa de cada perfil (la pantalla de perfiles la consulta
 * periódicamente). Con ?cifras=1 también devuelve «Esta semana» y la
 * última base de cada perfil (22/10: antes esas cifras quedaban fijas
 * hasta recargar la página).
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfiles = await loadPerfiles();
  if (new URL(request.url).searchParams.get("cifras") !== "1") return NextResponse.json({ perfiles });
  const filas = await Promise.all(
    perfiles.map(async (p) => [p.id, await resumenCifras(p.id, AREAS_DE_PERFIL[p.slug] ?? [p.slug]).catch(() => null)] as const)
  );
  return NextResponse.json({ perfiles, cifras: Object.fromEntries(filas) }, { headers: { "Cache-Control": "no-store" } });
}
