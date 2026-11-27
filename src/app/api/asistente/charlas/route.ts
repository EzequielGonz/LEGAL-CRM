import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { ambitoDe, MAX_CUERPO, sanearMensajes } from "@/lib/asistente/charlas";
import { crearCharla, listarCharlas } from "@/lib/asistente/charlas-servidor";

export const dynamic = "force-dynamic";

/**
 * Charlas guardadas del asistente (20/11).
 * GET ?perfil=<slug>  → últimas charlas (sin perfil: las del asistente general;
 *                       con perfil: las del Laboratorio de ese perfil).
 * POST { perfil?, mensajes } → crea una charla con sus primeros mensajes y devuelve { id }.
 * No envía nada a nadie ni cambia nada del panel: solo guarda la conversación.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const a = ambitoDe(new URL(request.url).searchParams.get("perfil"));
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: 400 });
  try {
    return NextResponse.json({ charlas: await listarCharlas(a) });
  } catch (err) {
    console.error("[asistente/charlas]", err);
    return NextResponse.json({ error: "No se pudieron leer las charlas anteriores." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CUERPO) return NextResponse.json({ error: "Demasiado grande para guardar." }, { status: 413 });
  const body = await request.json().catch(() => ({}));
  const a = ambitoDe(body?.perfil);
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: 400 });
  const m = sanearMensajes(body?.mensajes);
  if ("error" in m) return NextResponse.json({ error: m.error }, { status: 400 });
  try {
    return NextResponse.json({ id: await crearCharla(a, m.mensajes) });
  } catch (err) {
    console.error("[asistente/charlas]", err);
    return NextResponse.json({ error: "No se pudo guardar la charla." }, { status: 500 });
  }
}
