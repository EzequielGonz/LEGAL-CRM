import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { guardarConexion, leerConexion } from "@/lib/redes/conexion";

export const dynamic = "force-dynamic";

/** Conexión de redes del perfil: marca de Metricool y publicación automática. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  return NextResponse.json(await leerConexion(rubroId));
}

export async function PUT(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const blogId = typeof body?.blogId === "string" ? body.blogId.trim() : "";
  if (blogId && !/^\d{3,15}$/.test(blogId)) return NextResponse.json({ error: "El número de la marca de Metricool son solo dígitos.", campo: "blogId" }, { status: 400 });
  try {
    return NextResponse.json(await guardarConexion(rubroId, { blogId: blogId || null, publicarSolo: body?.publicarSolo === true }));
  } catch (err) {
    return NextResponse.json({ error: String((err as Error)?.message ?? err) }, { status: 500 });
  }
}
