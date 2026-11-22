import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { buscarPersonas } from "@/lib/contactos/servidor";
import { respuestaErrorInterno } from "@/lib/error-publico";

export const dynamic = "force-dynamic";

/** Busca personas del perfil por nombre o teléfono (para elegir a quién agendarle una cita). */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const rubroId = rubroIdDe(url.searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  try {
    return NextResponse.json({ personas: await buscarPersonas(rubroId, url.searchParams.get("q") ?? "") }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return respuestaErrorInterno(err, "contactos/buscar", 500);
  }
}
