import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { esClaveLista } from "@/lib/resumen/lista-reglas";
import { leerListaCorta } from "@/lib/resumen/lista";

export const dynamic = "force-dynamic";

/**
 * Lista corta de quiénes hay detrás de una cifra del Resumen de todo (22/11).
 * GET ?perfil=<slug>&clave=esperan|sinDerivar|citasHoy|propuestas|alertas. Solo lectura y de un perfil por vez:
 * nombre corto y texto breve, sin teléfonos ni mensajes.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const q = new URL(request.url).searchParams;
  const perfil = q.get("perfil");
  const clave = q.get("clave");
  if (!esSlugPerfil(perfil) || !esClaveLista(clave)) return NextResponse.json({ error: "Perfil o lista no válidos." }, { status: 400 });
  try {
    const r = await leerListaCorta(perfil, clave);
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[resumen/lista]", (err as Error)?.message);
    return NextResponse.json({ error: "No se pudo leer la lista ahora." }, { status: 500 });
  }
}
