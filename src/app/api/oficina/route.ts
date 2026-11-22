import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { rubroIdDePerfil, validarPedido } from "@/lib/bandeja-claude";
import { filaATareaOficina } from "@/lib/oficina/reglas";
import { COLUMNAS_OFICINA, leerOficina, triar } from "@/lib/oficina/servidor";

export const dynamic = "force-dynamic";

/** Estado de la Oficina: tareas, escritorios y último arranque. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const oficina = await leerOficina();
  if (!oficina) return NextResponse.json({ error: "No se pudo leer la oficina." }, { status: 500 });
  return NextResponse.json(oficina);
}

/**
 * Dejar una tarea en la Oficina. body: { perfil, pedido }. Gemini la ordena
 * (áreas y orden) y queda en la mesa de entrada hasta que el dueño toque
 * «Arrancar ahora». No ejecuta nada ni manda mensajes.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDePerfil(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const pedido = validarPedido(body?.pedido);
  if (!pedido.ok) return NextResponse.json({ error: pedido.error }, { status: 400 });

  const triaje = await triar(pedido.valor);
  const { data, error } = await createAdminClient()
    .from("bandeja_claude" as any)
    .insert({
      rubro_id: rubroId,
      pedido: pedido.valor,
      estado: "pendiente",
      origen: "oficina",
      titulo: triaje.titulo,
      area: triaje.ruta[0],
      ruta: triaje.ruta,
      triaje: triaje.plan || null,
    })
    .select(COLUMNAS_OFICINA)
    .single();
  if (error) {
    console.error("[oficina/crear]", error.message);
    return NextResponse.json({ error: "No se pudo guardar la tarea." }, { status: 500 });
  }
  return NextResponse.json({ tarea: filaATareaOficina(data), plan: triaje.plan, rapida: triaje.rapida, ordenadaPor: triaje.fuente }, { status: 201 });
}
