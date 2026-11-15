import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { planesParaRetomar } from "@/lib/asistente/general-servidor";

export const dynamic = "force-dynamic";

/**
 * Asistente general (15/11): planes de campañas de la última semana sin
 * confirmar, a medio hacer o con un paso que falló, para retomarlos si se
 * cerró la pestaña o la sesión a mitad. Solo lectura.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ planes: await planesParaRetomar() });
  } catch (err) {
    console.error("[asistente/general/planes]", err);
    return NextResponse.json({ error: "No se pudieron leer los planes pendientes." }, { status: 500 });
  }
}
