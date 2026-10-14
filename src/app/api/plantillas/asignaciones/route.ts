import { NextResponse } from "next/server";
import { AssignmentError, createAssignment } from "@/lib/plantillas";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Asigna una plantilla del catálogo a una línea para un propósito, con la
 * fuente de cada variable. Solo plantillas aprobadas según Meta, de la
 * cuenta de esa línea y compatibles con el envío.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  try {
    const result = await createAssignment({
      lineId: String(body?.line_id ?? ""),
      templateId: String(body?.template_id ?? ""),
      purpose: String(body?.purpose ?? ""),
      sources: body?.variable_sources,
      note: typeof body?.note === "string" ? body.note.slice(0, 300) : null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AssignmentError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: String((err as any)?.message ?? err) }, { status: 500 });
  }
}
