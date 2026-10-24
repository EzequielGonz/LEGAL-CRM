import { NextResponse } from "next/server";
import { MissingAccessError, syncLineTemplates } from "@/lib/plantillas";
import { requireSession } from "@/lib/acceso/autorizacion";
import { autoAsignarLinea } from "@/lib/plantillas/auto-asignar";

export const dynamic = "force-dynamic";

/**
 * Lee de Meta las plantillas de la cuenta de WhatsApp Business de una línea
 * y actualiza el catálogo (pregunta 22). Solo lee: no crea, no cambia ni
 * envía nada. Si falta el acceso privado, informa qué falta.
 * 24/10: después de leer, asigna sola cada plantilla aprobada que sigue la
 * convención de nombres (ver plantillas/auto-reglas.ts). Asignar no envía.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const lineId = typeof body?.line_id === "string" ? body.line_id : "";
  if (!lineId) return NextResponse.json({ error: "Falta la línea" }, { status: 400 });
  try {
    const result = await syncLineTemplates(lineId);
    const auto = result.ok ? await autoAsignarLinea(lineId).catch(() => null) : null;
    return NextResponse.json({ ...result, asignadas_solas: auto?.asignadas ?? [] }, { status: result.ok ? 200 : 502 });
  } catch (err) {
    if (err instanceof MissingAccessError) {
      return NextResponse.json({ error: err.message, faltantes: err.missing }, { status: 409 });
    }
    const message = String((err as any)?.message ?? err);
    return NextResponse.json({ error: message }, { status: message === "Línea no encontrada" ? 404 : 500 });
  }
}
