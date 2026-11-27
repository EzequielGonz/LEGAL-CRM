import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { destinoDeCuerpo, filasDeAlcance, validarPedido } from "@/lib/bandeja-claude";
import { claseFinal } from "@/lib/oficina/clases";
import { normalizarCandidatos } from "@/lib/oficina/ejecucion";
import { esArea, filaATareaOficina, normalizarRuta } from "@/lib/oficina/reglas";
import { COLUMNAS_OFICINA, leerOficina, triar } from "@/lib/oficina/servidor";
import { marcaDe } from "@/lib/marca";

export const dynamic = "force-dynamic";

/** Estado de la Oficina: tareas, último arranque, si Claude está conectado y el gasto de Gemini. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const oficina = await leerOficina();
  if (!oficina) return NextResponse.json({ error: "No se pudo leer la oficina." }, { status: 500 });
  return NextResponse.json(oficina);
}

/**
 * Dejar una tarea en la Oficina.
 * body: { alcance, pedido, departamento?, candidatos? } (o el formato viejo { perfil, pedido }).
 *  - alcance: un rubro, varios, los 4 juntos (una tarea, un resultado), los 4
 *    por separado (una tarea por rubro, con grupo) o «Todo el panel».
 *  - departamento: si viene, es la primera área de la ruta (manda sobre el triaje).
 *  - candidatos: cuántas respuestas compiten si la corre Gemini (por defecto 3).
 * Gemini ordena una sola vez aunque sean varias filas. No ejecuta nada.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const destino = destinoDeCuerpo(body);
  if (!destino.ok) return NextResponse.json({ error: destino.error }, { status: 400 });
  const pedido = validarPedido(body?.pedido);
  if (!pedido.ok) return NextResponse.json({ error: pedido.error }, { status: 400 });
  const depto = esArea(body?.departamento) && body.departamento !== "direccion" ? body.departamento : null;

  const alcance = destino.valor;
  const filas = filasDeAlcance(alcance);
  const triaje = await triar(pedido.valor, alcance, filas.length === 1 ? filas[0].rubro_id : null);
  const ruta = depto ? normalizarRuta([depto, ...triaje.ruta]) : triaje.ruta;
  const clase = claseFinal(triaje.clase, pedido.valor, ruta);
  const grupo = filas.length > 1 ? crypto.randomUUID() : null;
  const candidatos = body?.candidatos === undefined ? null : normalizarCandidatos(body.candidatos);

  const { data, error } = await createAdminClient()
    .from("bandeja_claude" as any)
    .insert(
      filas.map((f) => ({
        rubro_id: f.rubro_id,
        alcance,
        grupo_id: grupo,
        pedido: pedido.valor,
        estado: "pendiente",
        origen: "oficina",
        titulo: (filas.length > 1 && f.slug ? `${triaje.titulo} · ${marcaDe(f.slug).nombre}` : triaje.titulo).slice(0, 120),
        area: ruta[0],
        ruta,
        triaje: triaje.plan || null,
        clase,
        arena_candidatos: candidatos,
      })),
    )
    .select(COLUMNAS_OFICINA);
  if (error) {
    console.error("[oficina/crear]", error.message);
    return NextResponse.json({ error: "No se pudo guardar la tarea." }, { status: 500 });
  }
  const tareas = (data ?? []).map(filaATareaOficina).filter(Boolean);
  // `tarea` se mantiene para quienes leen una sola (barra del Cerebro).
  return NextResponse.json({ tareas, tarea: tareas[0] ?? null, grupo_id: grupo, plan: triaje.plan, rapida: triaje.rapida, ordenadaPor: triaje.fuente }, { status: 201 });
}
