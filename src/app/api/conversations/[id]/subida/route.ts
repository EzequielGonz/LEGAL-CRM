import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { urlSubidaSaliente } from "@/lib/adjuntos/salientes";

export const dynamic = "force-dynamic";

/** Enlace firmado para subir una foto o un video que se manda desde el chat (22/10). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Conversación inválida." }, { status: 400 });
  const { nombre } = await request.json().catch(() => ({ nombre: "" }));
  try {
    return NextResponse.json(await urlSubidaSaliente(params.id, String(nombre ?? "")));
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }
}
