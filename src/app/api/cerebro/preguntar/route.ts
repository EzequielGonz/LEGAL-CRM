import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { preguntarAlCerebro } from "@/lib/cerebro/conocimiento-servidor";

export const dynamic = "force-dynamic";

/** «Preguntale al cerebro»: busca en la memoria (.md) y en lo aprendido y devuelve cada respuesta con su fuente. Solo lee, sin IA. */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const pregunta = typeof body?.pregunta === "string" ? body.pregunta.trim().slice(0, 300) : "";
  if (pregunta.length < 3) return NextResponse.json({ error: "Escribí una pregunta (al menos 3 letras)." }, { status: 400 });
  const r = await preguntarAlCerebro(pregunta, 5);
  return NextResponse.json({ respuestas: r.map((x) => ({ fuente: x.archivo, titulo: x.titulo, texto: x.texto })) });
}
