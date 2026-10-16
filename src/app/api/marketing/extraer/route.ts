import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { avanzarExtraccion, cancelarExtraccion, crearExtraccion, ExtraccionError, leerExtraccion, leerLimites, listarExtracciones, usadosHoy } from "@/lib/marketing/extraer";
import { requisitosEjecutarBase } from "@/lib/marketing/ejecutar-base";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Extraer negocios (Marketing).
 * GET ?id= → estado de una extracción; sin id → últimas, topes y requisitos de «Ejecutar base».
 * POST { tipo, zonas[], cantidad, nombre } → crea la base y corre la primera zona.
 * POST { accion: "cancelar", id } → corta una extracción en curso.
 * No contacta a nadie.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const e = await leerExtraccion(id);
    if (!e) return NextResponse.json({ error: "No existe." }, { status: 404 });
    return NextResponse.json({ extraccion: e });
  }
  const [lista, limites, usados, requisitos] = await Promise.all([listarExtracciones(), leerLimites(), usadosHoy(), requisitosEjecutarBase()]);
  return NextResponse.json({ extracciones: lista, limites, usadosHoy: usados, requisitos });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  try {
    if (body?.accion === "cancelar") return NextResponse.json(await cancelarExtraccion(String(body?.id ?? "")));
    const zonas = Array.isArray(body?.zonas) ? body.zonas.map((z: unknown) => String(z).slice(0, 120)) : [];
    const ext = await crearExtraccion({
      tipo: String(body?.tipo ?? ""),
      zonas,
      cantidad: Number(body?.cantidad),
      nombre: String(body?.nombre ?? ""),
    });
    // Primera zona en el momento; el resto, desde el latido del servidor.
    const paso = await avanzarExtraccion(ext.id).catch((e) => String(e?.message ?? e));
    return NextResponse.json({ extraccion: await leerExtraccion(ext.id), paso });
  } catch (err: any) {
    const status = err instanceof ExtraccionError ? err.status : 500;
    return NextResponse.json({ error: String(err?.message ?? err) }, { status });
  }
}
