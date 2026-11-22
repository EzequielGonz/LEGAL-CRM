import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEXTO_ARRANQUE, puedeArrancar } from "@/lib/oficina/reglas";
import { disparar } from "@/lib/oficina/servidor";

export const dynamic = "force-dynamic";

/**
 * «Arrancar ahora»: despierta a los agentes de Claude para que procesen la
 * Oficina. Cada vuelta usa el plan de Claude, así que no se arranca dos
 * veces en menos de 15 minutos ni si no hay nada para hacer.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const db = createAdminClient();

  const [ultimo, pendientes] = await Promise.all([
    db.from("oficina_arranques" as any).select("id, pedido_at, estado").order("pedido_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("bandeja_claude" as any).select("id", { count: "exact", head: true }).in("estado", ["pendiente", "en_espera"]),
  ]);
  if (ultimo.error || pendientes.error) return NextResponse.json({ error: "No se pudo leer la oficina." }, { status: 500 });
  if (!pendientes.count) return NextResponse.json({ error: "No hay tareas en la mesa de entrada: dejá una primero." }, { status: 409 });
  const espera = puedeArrancar(ultimo.data as any);
  if (!espera.ok) return NextResponse.json({ error: `Los agentes ya están trabajando. Probá de nuevo en ${espera.minutos} min.` }, { status: 429 });

  const disparo = await disparar(TEXTO_ARRANQUE);
  const { data, error } = await db
    .from("oficina_arranques" as any)
    .insert({ origen: "panel", estado: disparo.estado, nota: disparo.nota, tareas: pendientes.count })
    .select("pedido_at, estado, nota, tareas, terminado_at")
    .single();
  if (error) {
    console.error("[oficina/arrancar]", error.message);
    return NextResponse.json({ error: "No se pudo registrar el arranque." }, { status: 500 });
  }
  return NextResponse.json({ arranque: data }, { status: disparo.estado === "fallo" ? 502 : 200 });
}
