import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { ejecutarBase, requisitosEjecutarBase } from "@/lib/marketing/ejecutar-base";
import { leerExtraccion } from "@/lib/marketing/extraer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * «Ejecutar base» (Marketing). GET → requisitos que faltan.
 * POST { extraccionId | baseId, pin } → crea la campaña con la configuración
 * de Marketing, suma la base y la lanza. Si falta algo, queda en borrador y
 * se informa qué falta. Es la autorización expresa de la responsable: nada
 * de esto corre solo.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json(await requisitosEjecutarBase());
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  let baseId = typeof body?.baseId === "string" ? body.baseId : null;
  let nombre = "Base";
  const extraccionId = typeof body?.extraccionId === "string" ? body.extraccionId : null;
  if (extraccionId) {
    const e = await leerExtraccion(extraccionId);
    if (!e) return NextResponse.json({ error: "La extracción no existe." }, { status: 404 });
    if (e.estado === "pendiente" || e.estado === "ejecutando") return NextResponse.json({ error: "Esperá a que termine la extracción." }, { status: 409 });
    baseId = e.base_id;
    nombre = e.nombre_base;
  }
  if (!baseId) return NextResponse.json({ error: "Falta la base." }, { status: 400 });
  const pin = await confirmPin(request, body?.pin, "ejecutar_base" as any, { baseId, extraccionId });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  try {
    const r = await ejecutarBase({ baseId, extraccionId, nombre: typeof body?.nombre === "string" ? body.nombre : nombre });
    return NextResponse.json(r, { status: r.ok ? 200 : 207 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
