import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { AccionNoDisponible, confirmarAccion, descartarAccion } from "@/lib/asistente/acciones";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { faltaParaConfirmar, nivelDeAccion } from "@/lib/asistente/permisos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Confirmar una propuesta del asistente (se ejecuta una sola vez).
 * Según el nivel (ver permisos.ts): «contacto» exige { confirmar_envio: true }
 * y «pin» exige { pin }. El nivel sale de la propuesta guardada, nunca del pedido.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Propuesta no válida." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const { data: guardada } = await createAdminClient().from("asistente_acciones" as any).select("tipo, payload, estado").eq("id", params.id).maybeSingle();
  const g: any = guardada;
  if (!g) return NextResponse.json({ error: "Esta propuesta ya se confirmó, se descartó o no existe." }, { status: 409 });
  // Una propuesta ya en marcha (tandas de publicaciones) no vuelve a pedir PIN.
  if (g.estado === "propuesta") {
    const nivel = nivelDeAccion(g.tipo, g.payload ?? {});
    const falta = faltaParaConfirmar(nivel, body);
    if (falta) return NextResponse.json({ error: falta.mensaje, requiere: falta.codigo }, { status: 428 });
    if (nivel === "pin") {
      const pin = await confirmPin(request, body?.pin, "asignacion_agente", { origen: "asistente", tipo: g.tipo, propuesta: params.id });
      if (!pin.ok) return NextResponse.json({ error: pin.error, requiere: "pin" }, { status: pin.status });
    }
  }
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
