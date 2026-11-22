import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { ultimaVisitaValida } from "@/lib/jarvis/parte";
import { leerDatosParte, redactarParte } from "@/lib/jarvis/servidor";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Parte del día de Jarvis (22/11). GET ?perfil=<slug>&desde=<fecha ISO de la última visita>.
 * Las cifras salen de la base, sin IA; Gemini solo redacta las frases si hay
 * presupuesto (si no, texto por reglas). Solo datos del perfil pedido.
 * No envía ni cambia nada.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const perfil = url.searchParams.get("perfil");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const ahora = new Date();
  try {
    const { datos, pendientes, otrasEnAsistente } = await leerDatosParte(perfil, ahora, ultimaVisitaValida(url.searchParams.get("desde"), ahora.getTime()));
    const hrefChats = perfil === "juridico" ? "/inbox" : `/panel/${perfil}/chats`;
    const parte = await redactarParte(perfil, datos, hrefChats, ahora);
    return NextResponse.json({ parte, pendientes, otrasEnAsistente });
  } catch (err) {
    console.error("[jarvis/parte]", (err as Error)?.message ?? err);
    return NextResponse.json({ error: "No pude armar el parte del día ahora." }, { status: 502 });
  }
}
