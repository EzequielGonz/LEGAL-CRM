import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { candidatosAhoraNo, reabrirAhoraNo } from "@/lib/agentes/reabrir-ahora-no";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Corrección del «Ahora no» (24/10).
 * GET  → cuántos contactos tocaron «Ahora no» y quedaron detenidos por el bot.
 * POST { confirmacion: "LEVANTAR" } → levanta esas detenciones (con motivo),
 *      vuelve la oportunidad a «En conversación» y reactiva el bot del chat.
 *      Quien después pidió la baja no se toca. No envía mensajes.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const lista = await candidatosAhoraNo();
  const porArea: Record<string, { reabrir: number; pidieron_baja: number }> = {};
  for (const c of lista) {
    porArea[c.area] ??= { reabrir: 0, pidieron_baja: 0 };
    if (c.pidioBajaDespues) porArea[c.area].pidieron_baja++;
    else porArea[c.area].reabrir++;
  }
  return NextResponse.json({ total: lista.length, por_area: porArea });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (body?.confirmacion !== "LEVANTAR") {
    return NextResponse.json({ error: "Incluye detenciones por pedido de no contacto: confirmá con LEVANTAR.", requiere_confirmacion: true }, { status: 409 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await reabrirAhoraNo("operador")) });
  } catch (err) {
    return NextResponse.json({ error: String((err as Error)?.message ?? err).slice(0, 300) }, { status: 500 });
  }
}
