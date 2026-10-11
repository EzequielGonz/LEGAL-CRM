import { NextResponse } from "next/server";
import { MissingAccessError, syncLineTemplates } from "@/lib/plantillas";

export const dynamic = "force-dynamic";

/**
 * Lee de Meta las plantillas de la cuenta de WhatsApp Business de una línea
 * y actualiza el catálogo (pregunta 22). Solo lee: no crea, no cambia ni
 * envía nada. Si falta el acceso privado, informa qué falta.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const lineId = typeof body?.line_id === "string" ? body.line_id : "";
  if (!lineId) return NextResponse.json({ error: "Falta la línea" }, { status: 400 });
  try {
    const result = await syncLineTemplates(lineId);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    if (err instanceof MissingAccessError) {
      return NextResponse.json({ error: err.message, faltantes: err.missing }, { status: 409 });
    }
    const message = String((err as any)?.message ?? err);
    return NextResponse.json({ error: message }, { status: message === "Línea no encontrada" ? 404 : 500 });
  }
}
