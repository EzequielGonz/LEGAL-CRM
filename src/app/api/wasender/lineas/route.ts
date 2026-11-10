import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { crearLinea, lineasMetaDelPerfil, listarLineas } from "@/lib/wasender/lineas";
import { perfilDe, respuestaError } from "@/lib/wasender/rutas";
import { configuracionWasender } from "@/lib/wasender/webhook-url";
import type { Area } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Líneas de Wasender del perfil y qué falta configurar (solo nombres, nunca valores). */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = perfilDe(new URL(request.url).searchParams.get("perfil"));
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  try {
    const [lineas, lineasMeta] = await Promise.all([listarLineas(perfil.rubroId), lineasMetaDelPerfil(perfil.rubroId)]);
    return NextResponse.json({ lineas, lineasMeta, areas: perfil.areas, configuracion: configuracionWasender() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return respuestaError(err);
  }
}

/** Agregar una línea: la crea en Wasender (apagada y en modo prueba) y guarda sus claves cifradas. */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  const area = (perfil.areas.length === 1 ? perfil.areas[0] : body?.area) as Area;
  if (!perfil.areas.includes(area)) return NextResponse.json({ error: "Elegí el área de la línea." }, { status: 400 });
  try {
    const linea = await crearLinea({
      rubroId: perfil.rubroId,
      area,
      nombre: String(body?.nombre ?? ""),
      telefono: String(body?.telefono ?? ""),
      // Solo si la responsable confirmó en la pantalla que ese número ya no está en Meta.
      confirmaFueraDeMeta: body?.confirma_fuera_de_meta === true,
    });
    return NextResponse.json({ ok: true, linea });
  } catch (err) {
    return respuestaError(err);
  }
}
