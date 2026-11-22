import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil } from "@/lib/marca";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { armarCsv, idsValidos, nombreArchivoCsv, parsearFiltros, TOPE_EXPORTACION } from "@/lib/contactos/consulta";
import { filasParaCsv } from "@/lib/contactos/servidor";
import { respuestaErrorInterno } from "@/lib/error-publico";

export const dynamic = "force-dynamic";

/**
 * Exporta a CSV los contactos de UN perfil: la selección (`ids`) o lo que dejan los filtros.
 * Solo nombre, teléfono, etapa, estado, área, origen y fechas. Nunca mezcla rubros.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const perfil = url.searchParams.get("perfil");
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const ids = idsValidos(url.searchParams.get("ids"));
  try {
    const { filas, truncado } = await filasParaCsv(rubroId, ids.length ? { ids } : { filtros: parsearFiltros(Object.fromEntries(url.searchParams), AREAS_DE_PERFIL[perfil]) });
    return new NextResponse(armarCsv(filas), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombreArchivoCsv(perfil)}"`,
        "Cache-Control": "no-store",
        "X-Filas": String(filas.length),
        ...(truncado ? { "X-Truncado": String(TOPE_EXPORTACION) } : {}),
      },
    });
  } catch (err) {
    return respuestaErrorInterno(err, "contactos/exportar", 500);
  }
}
