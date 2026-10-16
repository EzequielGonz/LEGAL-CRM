import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { configuracionSearchConsole, firmarEstado, urlAutorizacion } from "@/lib/seo/search-console";
import { rubroIdDe } from "@/lib/indicadores";

export const dynamic = "force-dynamic";

/**
 * Inicio de la conexión con Search Console (OAuth). Mientras falten las
 * variables del servidor o SEARCH_CONSOLE_ENABLED no sea «true», responde
 * qué falta y no redirige a ningún lado.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const cfg = configuracionSearchConsole();
  if (!cfg.lista) {
    return NextResponse.json(
      { error: "Search Console todavía no está habilitado en el servidor.", faltan: cfg.habilitada ? cfg.faltan : [...cfg.faltan, "SEARCH_CONSOLE_ENABLED=true"] },
      { status: 409 }
    );
  }
  return NextResponse.redirect(urlAutorizacion(firmarEstado(rubroId, Date.now())));
}
