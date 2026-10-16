import { NextResponse } from "next/server";
import { saveAttachment } from "@/lib/adjuntos/guardar";
import { STATUS_LABEL } from "@/lib/adjuntos/modelo";
import { isUuid } from "@/lib/adjuntos/respuesta";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** "Guardar ahora": descarga el original de Meta y lo guarda en el almacenamiento privado. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  try {
    const outcome = await saveAttachment(params.id);
    if (outcome.status === "no_existe") return NextResponse.json({ error: "No existe ese adjunto." }, { status: 404 });
    const label = outcome.status === "ocupado" ? "Se está guardando en este momento" : STATUS_LABEL[outcome.status];
    return NextResponse.json(
      { estado: outcome.status, texto: outcome.detail ? `${label}: ${outcome.detail}` : label },
      { status: outcome.status === "guardado" ? 200 : outcome.status === "ocupado" ? 409 : 422 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
