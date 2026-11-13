import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { ACCESOS, type ClaveAcceso } from "@/lib/redes/accesos";
import { guardarAcceso } from "@/lib/redes/accesos-servidor";

/** Guarda la dirección de un acceso de redes del perfil (12/11). Solo direcciones https del dominio que corresponde. */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  const clave = body?.clave as ClaveAcceso;
  if (!ACCESOS.some((a) => a.clave === clave)) return NextResponse.json({ error: "Acceso inválido." }, { status: 400 });
  const r = await guardarAcceso(body.perfil, clave, body?.url);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, guardados: r.guardados });
}
