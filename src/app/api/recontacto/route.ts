import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { esSlugPerfil } from "@/lib/marca";
import { guardarConfigRecontacto, leerConfigRecontacto, procesarRecontactos } from "@/lib/recontacto/motor";

export const dynamic = "force-dynamic";

/**
 * Recontacto del bot dentro de las 24 h (24/10).
 * GET ?perfil=…           → si está encendido y qué haría ahora (vista previa: no llama al modelo ni envía).
 * POST { perfil, encendido, pin? } → encenderlo pide el PIN (hace salir mensajes); apagarlo no.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil") ?? undefined;
  if (perfil && !esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const [config, vista] = await Promise.all([leerConfigRecontacto(), procesarRecontactos({ enviar: false, perfil, presupuestoMs: 20_000 })]);
  return NextResponse.json({ config, vista });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  if (typeof body?.encendido !== "boolean") return NextResponse.json({ error: "Falta encendido." }, { status: 400 });
  if (body.encendido) {
    const pin = await confirmPin(request, body?.pin, "seguimiento_automatico", { perfil: body.perfil, recontacto_24h: true });
    if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  }
  try {
    const config = await guardarConfigRecontacto(body.perfil, body.encendido);
    return NextResponse.json({ ok: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
