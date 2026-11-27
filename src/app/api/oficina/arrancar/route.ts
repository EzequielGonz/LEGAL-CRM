import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEXTO_ARRANQUE, TEXTO_SIN_CLAUDE, puedeArrancar } from "@/lib/oficina/reglas";
import { disparar, disparoConectado } from "@/lib/oficina/servidor";

export const dynamic = "force-dynamic";

/**
 * «Arrancar ahora»: despierta a los agentes de Claude para que procesen la
 * Oficina (las tareas nuevas y la cola «Para repasar» de lo que hizo Gemini).
 * Cada vuelta usa el plan de Claude, así que no se arranca dos veces en menos
 * de 15 minutos ni si no hay nada para hacer.
 *
 * Honesto (27/11): si el disparo no está conectado responde 503 y lo dice;
 * nunca «arrancó» cuando no arrancó. El intento queda en el historial.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const db = createAdminClient();

  const [ultimo, pendientes, repasar] = await Promise.all([
    db.from("oficina_arranques" as any).select("id, pedido_at, estado").order("pedido_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("bandeja_claude" as any).select("id", { count: "exact", head: true }).in("estado", ["pendiente", "en_espera"]),
    db.from("bandeja_claude" as any).select("id", { count: "exact", head: true }).eq("ejecutor", "gemini").eq("repaso", "sin_repasar").eq("estado", "lista"),
  ]);
  if (ultimo.error || pendientes.error) return NextResponse.json({ error: "No se pudo leer la oficina." }, { status: 500 });
  // «Para repasar» = solo las «lista» (27/11, igual que colasDeTareas). Antes de la migración 0652 no hay columna «repaso»: se cuenta 0.
  const total = (pendientes.count ?? 0) + (repasar.error ? 0 : repasar.count ?? 0);
  if (!total) return NextResponse.json({ error: "No hay tareas en la mesa de entrada ni para repasar: dejá una primero." }, { status: 409 });
  const espera = puedeArrancar(ultimo.data as any);
  if (!espera.ok) return NextResponse.json({ error: `Los agentes ya están trabajando. Probá de nuevo en ${espera.minutos} min.` }, { status: 429 });

  const conectado = disparoConectado();
  const disparo = conectado ? await disparar(TEXTO_ARRANQUE) : { estado: "sin_disparador" as const, nota: TEXTO_SIN_CLAUDE };
  const { data, error } = await db
    .from("oficina_arranques" as any)
    .insert({ origen: "panel", estado: disparo.estado, nota: disparo.nota, tareas: total })
    .select("pedido_at, estado, nota, tareas, terminado_at")
    .single();
  if (error) {
    console.error("[oficina/arrancar]", error.message);
    return NextResponse.json({ error: "No se pudo registrar el arranque." }, { status: 500 });
  }
  if (disparo.estado === "sin_disparador") return NextResponse.json({ error: TEXTO_SIN_CLAUDE, arranque: data, disparo: { conectado: false } }, { status: 503 });
  if (disparo.estado === "fallo") return NextResponse.json({ error: disparo.nota, arranque: data, disparo: { conectado } }, { status: 502 });
  return NextResponse.json({ arranque: data, disparo: { conectado } });
}
