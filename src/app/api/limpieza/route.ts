import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { deshacerMovimiento, encenderCaidos, pasoDirecto, pasoRelectura, puntuarAbiertas } from "@/lib/limpieza/servidor";

export const dynamic = "force-dynamic";
// La relectura le pide al bot que lea cada chat: trabaja por tandas dentro de este tiempo.
export const maxDuration = 60;

/**
 * Limpieza de lo ya cargado (13/11, autorizada por la responsable:
 * «Reclasificar solo»). No manda mensajes ni borra nada; cada movimiento se
 * puede deshacer.
 *
 * body: { accion, perfil?, id? }
 *  - "simular": cuenta qué se movería, sin tocar nada
 *  - "aplicar": los pasos que no necesitan releer el chat
 *  - "releer": una tanda de chats que el bot relee (llamar hasta que pendientes sea 0)
 *  - "puntuar": puntaje de interés de quienes esperan a una persona
 *  - "encender": enciende el motor de caídos (cuando la limpieza terminó)
 *  - "deshacer": { id } deshace un movimiento
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const accion = String(body?.accion ?? "");
  try {
    if (accion === "deshacer") {
      if (typeof body?.id !== "string") return NextResponse.json({ error: "Falta el movimiento." }, { status: 400 });
      const r = await deshacerMovimiento(body.id);
      return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 409 });
    }
    if (accion === "encender") {
      await encenderCaidos();
      return NextResponse.json({ ok: true });
    }
    if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Falta indicar el perfil." }, { status: 400 });
    const rubroId = RUBRO_IDS[body.perfil as keyof typeof RUBRO_IDS];
    if (accion === "simular" || accion === "aplicar") return NextResponse.json({ ok: true, resumen: await pasoDirecto(rubroId, { simular: accion === "simular" }) });
    if (accion === "releer") return NextResponse.json({ ok: true, ...(await pasoRelectura(rubroId)) });
    if (accion === "puntuar") return NextResponse.json({ ok: true, puntuadas: await puntuarAbiertas(rubroId) });
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (err: any) {
    console.error("[limpieza]", err?.message ?? err);
    return NextResponse.json({ error: "No se pudo completar. Volvé a intentar." }, { status: 500 });
  }
}
