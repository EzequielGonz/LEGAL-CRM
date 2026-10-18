import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { normalizarFilasPlantillas } from "@/lib/plantillas/archivo";
import { enviarPlantillasDeArchivo } from "@/lib/plantillas/enviar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Plantillas desde un archivo (18/10). body: { filas: [...], confirmar }.
 * Sin `confirmar: true` muestra qué se mandaría a cada línea. No envía
 * mensajes a nadie: solo registra las plantillas para que Meta las revise.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const { validas, errores } = normalizarFilasPlantillas(body?.filas);
  if (validas.length === 0) return NextResponse.json({ error: "El archivo no tiene plantillas válidas.", errores }, { status: 400 });
  const envios = await enviarPlantillasDeArchivo(validas, body?.confirmar === true);
  return NextResponse.json({ ok: true, confirmar: body?.confirmar === true, errores, envios });
}
