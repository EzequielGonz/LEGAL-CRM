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

/**
 * Revisión 15/11: el motivo de un error propio (contacto detenido, el proveedor
 * rechazó el envío, archivo inválido) sí se muestra; uno de la base no.
 */
export function mensajeVisible(error: unknown, contexto: string): string {
  const e: any = error;
  const msg = String(e?.message ?? error ?? "");
  const deLaBase =
    (typeof e?.code === "string" && /^[0-9A-Z]{5}$|^PGRST/.test(e.code)) ||
    /relation |column |violates|duplicate key|syntax error|permission denied|JWT|row-level security|supabase|postgres/i.test(msg);
  if (deLaBase || !msg) {
    console.error(`[api] ${contexto}:`, msg);
    return TEXTO_ERROR_GENERICO;
  }
  return msg;
}
