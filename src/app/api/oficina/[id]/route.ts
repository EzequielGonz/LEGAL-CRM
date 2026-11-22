import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATareaOficina, leerRecorrido, validarDecision } from "@/lib/oficina/reglas";
import { COLUMNAS_OFICINA } from "@/lib/oficina/servidor";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * La decisión del dueño sobre una tarea «esperando tu OK».
 * body: { decision: "aprobada" | "cambios" | "rechazada", nota? }.
 *  - aprobada: queda aprobada (publicar o aplicar sigue siendo un paso aparte).
 *  - cambios: vuelve a la mesa de entrada con la nota en el recorrido.
 *  - rechazada: se descarta con motivo (nada se borra).
 */
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(id)) return NextResponse.json({ error: "Tarea no válida." }, { status: 400 });
  const v = validarDecision(await request.json().catch(() => ({})));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const db = createAdminClient();
  const actual = await db.from("bandeja_claude" as any).select("id, estado, decision, recorrido").eq("id", id).maybeSingle();
  if (actual.error) return NextResponse.json({ error: "No se pudo leer la tarea." }, { status: 500 });
  const fila = actual.data as any;
  if (!fila || fila.estado !== "lista" || fila.decision === "aprobada") {
    return NextResponse.json({ error: "Esta tarea no está esperando tu OK." }, { status: 409 });
  }
  const ahora = new Date().toISOString();
  const cambios =
    v.decision === "aprobada"
      ? { decision: "aprobada", decision_nota: v.nota || null, decision_at: ahora }
      : v.decision === "cambios"
        ? {
            estado: "pendiente",
            decision: "cambios",
            decision_nota: v.nota,
            decision_at: ahora,
            cerrada_at: null,
            recorrido: [...leerRecorrido(fila.recorrido), { area: "duenos", agente: "Dueños", nota: `Pidieron cambios: ${v.nota}`, at: ahora }],
          }
        : { estado: "descartada", decision: "rechazada", decision_nota: v.nota, decision_at: ahora, motivo_descarte: v.nota, cerrada_at: ahora };

  const { data, error } = await db.from("bandeja_claude" as any).update(cambios).eq("id", id).eq("estado", "lista").select(COLUMNAS_OFICINA).maybeSingle();
  if (error) {
    console.error("[oficina/decision]", error.message);
    return NextResponse.json({ error: "No se pudo guardar la decisión." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "La tarea cambió mientras tanto. Recargá la oficina." }, { status: 409 });
  return NextResponse.json({ tarea: filaATareaOficina(data) });
}
