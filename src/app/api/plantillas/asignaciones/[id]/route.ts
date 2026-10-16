import { NextResponse } from "next/server";
import { AssignmentError, deactivateAssignment } from "@/lib/plantillas";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/** Desactiva una asignación (no se borra). Las campañas que la usaban quedan sin plantilla válida hasta elegir otra. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (body?.accion !== "desactivar") return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  try {
    await deactivateAssignment(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AssignmentError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: String((err as any)?.message ?? err) }, { status: 500 });
  }
}
