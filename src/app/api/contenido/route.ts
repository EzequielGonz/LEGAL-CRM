import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { ContenidoError, panoramaContenido, registrarPedido } from "@/lib/contenido/panel";

export const dynamic = "force-dynamic";

/** GET ?perfil= → panorama del contenido. POST { perfil, tipo, pedido } → pedido de mejora. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  return NextResponse.json(await panoramaContenido(rubroId));
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  try {
    const id = await registrarPedido(rubroId, body?.tipo, body?.pedido);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const e = err as ContenidoError;
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
