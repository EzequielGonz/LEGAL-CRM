import { NextResponse } from "next/server";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { areasForProfile } from "@/lib/profiles";
import { WasenderError } from "@/lib/wasender/cliente";
import { ErrorLinea, lineaInterna } from "@/lib/wasender/lineas";
import type { Area } from "@/lib/supabase/database.types";

/** Ayudas comunes de las rutas de Wasender (10/11). */

export function perfilDe(valor: unknown): { slug: SlugPerfil; rubroId: string; areas: Area[] } | null {
  if (!esSlugPerfil(valor)) return null;
  const rubroId = RUBRO_IDS[valor];
  return { slug: valor, rubroId, areas: areasForProfile(rubroId) };
}

/** Relación línea ↔ perfil: una línea de otro perfil no se toca desde acá. */
export async function lineaDelPerfil(lineaId: string, rubroId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(lineaId)) return false;
  const fila = await lineaInterna(lineaId);
  return !!fila && fila.rubro_id === rubroId;
}

export function respuestaError(err: unknown): NextResponse {
  if (err instanceof ErrorLinea) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof WasenderError) return NextResponse.json({ error: err.message }, { status: 502 });
  const msg = String((err as any)?.message ?? err);
  console.error("[wasender]", msg);
  return NextResponse.json({ error: msg.slice(0, 500) }, { status: 500 });
}
