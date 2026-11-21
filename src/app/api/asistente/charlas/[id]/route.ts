import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { ambitoDe, esIdCharla, MAX_CUERPO, sanearMensajes } from "@/lib/asistente/charlas";
import { agregarMensajes, archivarCharla, leerCharla } from "@/lib/asistente/charlas-servidor";

export const dynamic = "force-dynamic";

/**
 * Una charla guardada del asistente (20/11).
 * GET ?perfil=<slug> → la charla completa, con el estado actual de cada propuesta.
 * POST { perfil?, mensajes } → agrega los mensajes nuevos al final (misma lista).
 * PATCH { perfil?, archivar: true } → la saca de la lista (no se borra).
 */
type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: Props) {
  const { id } = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esIdCharla(id)) return NextResponse.json({ error: "Charla no válida." }, { status: 400 });
  const a = ambitoDe(new URL(request.url).searchParams.get("perfil"));
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: 400 });
  try {
    const charla = await leerCharla(id, a);
    if (!charla) return NextResponse.json({ error: "No encontré esa charla." }, { status: 404 });
    return NextResponse.json(charla);
  } catch (err) {
    console.error("[asistente/charlas/id]", err);
    return NextResponse.json({ error: "No se pudo abrir la charla." }, { status: 500 });
  }
}

export async function POST(request: Request, props: Props) {
  const { id } = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esIdCharla(id)) return NextResponse.json({ error: "Charla no válida." }, { status: 400 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CUERPO) return NextResponse.json({ error: "Demasiado grande para guardar." }, { status: 413 });
  const body = await request.json().catch(() => ({}));
  const a = ambitoDe(body?.perfil);
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: 400 });
  const m = sanearMensajes(body?.mensajes);
  if ("error" in m) return NextResponse.json({ error: m.error }, { status: 400 });
  try {
    if (!(await agregarMensajes(id, a, m.mensajes))) return NextResponse.json({ error: "Esa charla ya no está disponible." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[asistente/charlas/id]", err);
    return NextResponse.json({ error: "No se pudo guardar la charla." }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: Props) {
  const { id } = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esIdCharla(id)) return NextResponse.json({ error: "Charla no válida." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  if (body?.archivar !== true) return NextResponse.json({ error: "Nada para cambiar." }, { status: 400 });
  const a = ambitoDe(body?.perfil);
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: 400 });
  try {
    if (!(await archivarCharla(id, a))) return NextResponse.json({ error: "No encontré esa charla." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[asistente/charlas/id]", err);
    return NextResponse.json({ error: "No se pudo quitar la charla de la lista." }, { status: 500 });
  }
}
