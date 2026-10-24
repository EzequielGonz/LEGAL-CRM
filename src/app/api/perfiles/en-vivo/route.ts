import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { cifrasEnVivo } from "@/lib/en-vivo";

export const dynamic = "force-dynamic";

/** Seguimiento en vivo de los cuatro rubros (24/10). GET ?rango=hoy|todo. Solo lectura. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rango = new URL(request.url).searchParams.get("rango") === "todo" ? "todo" : "hoy";
  try {
    return NextResponse.json({ rango, at: new Date().toISOString(), rubros: await cifrasEnVivo(rango) });
  } catch (err) {
    return NextResponse.json({ error: String((err as Error)?.message ?? err).slice(0, 200) }, { status: 500 });
  }
}
