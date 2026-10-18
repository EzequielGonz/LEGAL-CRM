import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { AccionNoDisponible, confirmarAccion, descartarAccion } from "@/lib/asistente/acciones";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/i;

/** Confirmar una propuesta del asistente (se ejecuta una sola vez). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Propuesta no válida." }, { status: 400 });
  try {
    return NextResponse.json(await confirmarAccion(params.id));
  } catch (err) {
    if (err instanceof AccionNoDisponible) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("[asistente/confirmar]", err);
    return NextResponse.json({ error: "No se pudo ejecutar la propuesta." }, { status: 500 });
  }
}

/** Descartar una propuesta (no se ejecuta). */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Propuesta no válida." }, { status: 400 });
  const ok = await descartarAccion(params.id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Esta propuesta ya no se puede descartar." }, { status: 409 });
}
