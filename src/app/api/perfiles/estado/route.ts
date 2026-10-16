import { NextResponse } from "next/server";
import { loadPerfiles } from "@/lib/perfiles-stats";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/** Vista previa de cada perfil (la pantalla de Computadora la consulta periódicamente). */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ perfiles: await loadPerfiles() });
}
