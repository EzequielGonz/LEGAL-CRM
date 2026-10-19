import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { DESCARTABLES, filaATarea, validarMotivo } from "@/lib/bandeja-claude";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Descartar una tarea de la bandeja con motivo (nada se borra).
 * body: { accion: "descartar", motivo }. Solo vale si está pendiente o en
 * espera: lo que Claude está trabajando o ya terminó no se descarta desde acá.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Tarea no válida." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  if (body?.accion !== "descartar") return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  const motivo = validarMotivo(body?.motivo);
  if (!motivo.ok) return NextResponse.json({ error: motivo.error }, { status: 400 });

  // Actualización condicional: si Claude la tomó mientras tanto, no se pisa.
  const { data, error } = await createAdminClient()
    .from("bandeja_claude" as any)
    .update({ estado: "descartada", motivo_descarte: motivo.valor, cerrada_at: new Date().toISOString() })
    .eq("id", params.id)
    .in("estado", DESCARTABLES)
    .select("id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at")
    .maybeSingle();
  if (error) {
    console.error("[bandeja-claude/descartar]", error.message);
    return NextResponse.json({ error: "No se pudo descartar la tarea." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Esta tarea ya no se puede descartar: Claude la está trabajando, ya terminó o no existe." }, { status: 409 });
  return NextResponse.json({ tarea: filaATarea(data) });
}
