import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { bloqueDeRol, listarRoles } from "@/lib/agentes/roles";
import { probarBotReal } from "@/lib/ai-agent/probar-real";
import { chequearTopeGemini } from "@/lib/presupuesto/servidor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Simulador del bot (22/11). POST { perfil, mensajes: string[], roles: (string|null)[] } con 1 o 2 variantes
 * (null = el bot general, sin rol). Arma el prompt con las MISMAS piezas que el bot en vivo (`probarBotReal`),
 * con mensajes ficticios y herramientas simuladas: no escribe a nadie, no agenda y no cambia estados.
 * Respeta el tope de gasto de IA. Cada rol tiene que ser de ese perfil y no estar archivado.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const perfil: SlugPerfil = body.perfil;
  const mensajes: string[] = Array.isArray(body?.mensajes) ? body.mensajes.filter((m: unknown) => typeof m === "string" && m.trim()).map((m: string) => m.trim().slice(0, 600)).slice(0, 4) : [];
  if (!mensajes.length) return NextResponse.json({ error: "Escribí lo que diría la persona." }, { status: 400 });
  const pedidos: (string | null)[] = Array.isArray(body?.roles) && body.roles.length ? body.roles.slice(0, 2).map((r: unknown) => (typeof r === "string" && r ? r : null)) : [null];
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Falta la clave de Gemini en el servidor." }, { status: 503 });
  const rubroId = RUBRO_IDS[perfil];
  const tope = await chequearTopeGemini({ rubroId });
  if (tope.bloquea) return NextResponse.json({ error: "Se llegó al tope de gasto de IA configurado: por ahora no se puede simular." }, { status: 429 });

  const roles = await listarRoles(rubroId);
  const area = (AREAS_DE_PERFIL[perfil] ?? [perfil])[0];
  const variantes: { rol: string | null; turnos: unknown; modelo: string | null }[] = [];
  try {
    for (const id of pedidos) {
      const rol = id ? roles.find((r) => r.id === id) : null;
      if (id && !rol) return NextResponse.json({ error: "Ese rol no es de este perfil o está archivado." }, { status: 400 });
      const r = await probarBotReal({ area: area as any, rubroId, mensajes, rolLaboratorio: rol ? bloqueDeRol(rol, null) : null, timeoutMs: 25_000 });
      variantes.push({ rol: rol?.nombre ?? null, turnos: r.turnos, modelo: r.modelo });
    }
  } catch (err) {
    console.error("[laboratorio/simular]", (err as Error)?.message ?? err);
    return NextResponse.json({ error: "No se pudo simular ahora. Probá de nuevo en unos segundos." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, variantes });
}
