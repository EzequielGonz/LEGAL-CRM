import { requireSession } from "@/lib/acceso/autorizacion";
import { csvPlantillas } from "@/lib/plantillas/archivo";
import { PLANTILLAS_PROPUESTAS } from "@/lib/plantillas/propuestas";

export const dynamic = "force-dynamic";

/** Descarga las propuestas vigentes como CSV (?perfil= para un solo rubro). */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil");
  const lista = perfil ? PLANTILLAS_PROPUESTAS.filter((p) => p.rubro === perfil) : PLANTILLAS_PROPUESTAS;
  return new Response(String.fromCharCode(0xfeff) + csvPlantillas(lista), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="plantillas-${perfil ?? "todas"}.csv"` },
  });
}
