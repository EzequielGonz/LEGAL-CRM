import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { destinoDeCuerpo, filaATarea, filasDeAlcance, resumenBandeja, rubroIdDePerfil, validarEnlaces, validarPedido } from "@/lib/bandeja-claude";

export const dynamic = "force-dynamic";

const COLUMNAS_BASE = "id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at";
const COLUMNAS = `${COLUMNAS_BASE}, alcance, grupo_id`;
const sinColumna = (e: any) => e?.code === "42703";

/**
 * Bandeja para Claude: las últimas 100 tareas.
 *  - ?perfil=<slug>: solo las de ese rubro (rubros separados). Lo conjunto y
 *    lo de «Todo el panel» no se ve dentro de un perfil: vive en la Oficina.
 *  - sin perfil: todas (lo usa el nivel general).
 *  - ?resumen=1: solo cuántas hay abiertas por estado (para el aviso del menú), con el mismo filtro.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const sp = new URL(request.url).searchParams;
  const perfil = sp.get("perfil");
  const rubroId = perfil ? rubroIdDePerfil(perfil) : null;
  if (perfil && !rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const db = createAdminClient();
  if (sp.get("resumen") === "1") {
    let q = db.from("bandeja_claude" as any).select("estado, motivo_espera, updated_at").in("estado", ["pendiente", "en_curso", "en_espera"]);
    if (rubroId) q = q.eq("rubro_id", rubroId);
    const { data, error } = await q.limit(500);
    if (error) return NextResponse.json({ error: "No se pudo leer la bandeja." }, { status: 500 });
    return NextResponse.json({ resumen: resumenBandeja((data ?? []) as any[]) });
  }
  const listar = (cols: string) => {
    let q = db.from("bandeja_claude" as any).select(cols);
    if (rubroId) q = q.eq("rubro_id", rubroId);
    return q.order("created_at", { ascending: false }).limit(100);
  };
  let r = await listar(COLUMNAS);
  if (sinColumna(r.error)) r = await listar(COLUMNAS_BASE);
  if (r.error) {
    console.error("[bandeja-claude/listar]", r.error.message);
    return NextResponse.json({ error: "No se pudo leer la bandeja." }, { status: 500 });
  }
  return NextResponse.json({ tareas: (r.data ?? []).map(filaATarea).filter(Boolean) });
}

/**
 * Dejar una tarea para Claude. body: { perfil, pedido, enlaces? } o, con el
 * alcance nuevo, { alcance, pedido, enlaces? }. «Por separado» crea una tarea
 * por rubro con un grupo común. Solo guarda el pedido: no ejecuta nada, no
 * envía nada y no llama a ninguna IA.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const destino = destinoDeCuerpo(body);
  if (!destino.ok) return NextResponse.json({ error: destino.error }, { status: 400 });
  const pedido = validarPedido(body?.pedido);
  if (!pedido.ok) return NextResponse.json({ error: pedido.error }, { status: 400 });
  const enlaces = validarEnlaces(body?.enlaces);
  if (!enlaces.ok) return NextResponse.json({ error: enlaces.error }, { status: 400 });

  const filas = filasDeAlcance(destino.valor);
  const grupo = filas.length > 1 ? crypto.randomUUID() : null;
  // Un solo rubro sin alcance nuevo: se guarda como antes (funciona aunque la 0651 no esté aplicada).
  const simple = filas.length === 1 && filas[0].rubro_id !== null && body?.alcance === undefined;
  const { data, error } = await createAdminClient()
    .from("bandeja_claude" as any)
    .insert(
      filas.map((f) =>
        simple
          ? { rubro_id: f.rubro_id, pedido: pedido.valor, enlaces: enlaces.valor, estado: "pendiente" }
          : { rubro_id: f.rubro_id, alcance: destino.valor, grupo_id: grupo, pedido: pedido.valor, enlaces: enlaces.valor, estado: "pendiente" },
      ),
    )
    .select(simple ? COLUMNAS_BASE : COLUMNAS);
  if (error) {
    console.error("[bandeja-claude/crear]", error.message);
    return NextResponse.json({ error: "No se pudo guardar la tarea." }, { status: 500 });
  }
  const tareas = (data ?? []).map(filaATarea).filter(Boolean);
  return NextResponse.json({ tarea: tareas[0] ?? null, tareas }, { status: 201 });
}
