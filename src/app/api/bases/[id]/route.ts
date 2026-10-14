import { NextResponse } from "next/server";
import { setBaseArchived } from "@/lib/archive";
import { requireSession } from "@/lib/acceso/autorizacion";

/**
 * Las bases ya no se eliminan (pregunta 20): un DELETE la archiva. Se
 * conservan el archivo original, las filas, los contactos y sus vínculos;
 * desde Bases → "Ver archivadas" se consulta y se recupera.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  try {
    await setBaseArchived(params.id, true, "Archivada desde el panel");
    return NextResponse.json({ ok: true, archivada: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 400 });
  }
}
