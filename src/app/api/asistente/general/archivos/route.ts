import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { prepararSubidaArchivo } from "@/lib/asistente/general-servidor";

export const dynamic = "force-dynamic";

/**
 * Asistente general (15/11): prepara la subida de las filas de una planilla
 * adjunta. El navegador sube el JSON directo al depósito privado
 * «bases-originales» con esta URL firmada de un solo uso (igual que el
 * archivo original de una base), así no pasa por el límite de ~4,5 MB por
 * pedido. Subir no importa nada: se importa recién al confirmar el plan.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await prepararSubidaArchivo());
  } catch (err) {
    console.error("[asistente/general/archivos]", err);
    return NextResponse.json({ error: "No se pudo preparar la subida de la planilla." }, { status: 500 });
  }
}
