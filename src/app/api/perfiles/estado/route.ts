import { NextResponse } from "next/server";
import { loadPerfiles } from "@/lib/perfiles-stats";

export const dynamic = "force-dynamic";

/** Vista previa de cada perfil (la pantalla de Computadora la consulta periódicamente). */
export async function GET() {
  return NextResponse.json({ perfiles: await loadPerfiles() });
}
