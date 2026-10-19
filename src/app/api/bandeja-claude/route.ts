import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, resumenBandeja, rubroIdDePerfil, validarEnlaces, validarPedido } from "@/lib/bandeja-claude";

export const dynamic = "force-dynamic";

const COLUMNAS = "id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at";

/**
 * Bandeja para Claude: las últimas 100 tareas de todos los perfiles.
 * Con ?resumen=1, solo cuántas hay abiertas por estado (para el aviso del menú).
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (new URL(request.url).searchParams.get("resumen") === "1") {
    const { data, error } = await createAdminClient().from("bandeja_claude" as any).select("estado, motivo_espera, updated_at").in("estado", ["pendiente", "en_curso", "en_espera"]).limit(500);
    if (error) return NextResponse.json({ error: "No se pudo leer la bandeja." }, { status: 500 });
    return NextResponse.json({ resumen: resumenBandeja((data ?? []) as any[]) });
  }
  const { data, error } = await createAdminClient().from("bandeja_claude" as any).select(COLUMNAS).order("created_at", { ascending: false }).limit(100);
  if (error) {
    console.error("[bandeja-claude/listar]", error.message);
    return NextResponse.json({ error: "No se pudo leer la bandeja." }, { status: 500 });
  }
  return NextResponse.json({ tareas: (data ?? []).map(filaATarea).filter(Boolean) });
}

/**
 * Dejar una tarea para Claude. body: { perfil, pedido, enlaces? }.
 * Solo guarda el pedido: no ejecuta nada, no envía nada y no llama a ninguna IA.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDePerfil(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const pedido = validarPedido(body?.pedido);
  if (!pedido.ok) return NextResponse.json({ error: pedido.error }, { status: 400 });
  const enlaces = validarEnlaces(body?.enlaces);
  if (!enlaces.ok) return NextResponse.json({ error: enlaces.error }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from("bandeja_claude" as any)
    .insert({ rubro_id: rubroId, pedido: pedido.valor, enlaces: enlaces.valor, estado: "pendiente" })
    .select(COLUMNAS)
    .single();
  if (error) {
    console.error("[bandeja-claude/crear]", error.message);
    return NextResponse.json({ error: "No se pudo guardar la tarea." }, { status: 500 });
  }
  return NextResponse.json({ tarea: filaATarea(data) }, { status: 201 });
}
