import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { leerTablero } from "@/lib/jarvis/servidor";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Tablero de Jarvis (vuelta 6). GET ?perfil=<slug>. Gráficos de la semana de ESE perfil: mensajes y
 * captados por día, la semana contra la anterior y las campañas recientes. Solo lee conteos: no cambia nada.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  try {
    return NextResponse.json(await leerTablero(perfil));
  } catch (err) {
    console.error("[jarvis/tablero]", (err as Error)?.message ?? err);
    return NextResponse.json({ error: "No pude armar los gráficos ahora." }, { status: 502 });
  }
}
