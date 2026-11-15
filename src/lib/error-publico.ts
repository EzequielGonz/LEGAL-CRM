import { NextResponse } from "next/server";

/**
 * 15/11 (auditoría): un error de la base no se muestra tal cual en el panel
 * (puede nombrar tablas, columnas o reglas internas). Se registra completo en
 * el servidor y se responde un texto genérico.
 */
export const TEXTO_ERROR_GENERICO = "No se pudo completar la operación. Probá de nuevo en un momento.";

export function respuestaErrorInterno(error: unknown, contexto: string, status = 500) {
  const detalle = (error as any)?.message ?? String(error);
  console.error(`[api] ${contexto}:`, detalle);
  return NextResponse.json({ error: TEXTO_ERROR_GENERICO }, { status });
}
