import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATareaOficina, leerRecorrido, puedeAprobar, validarDecision } from "@/lib/oficina/reglas";
import { COLUMNAS_OFICINA, ejecutarConGemini } from "@/lib/oficina/servidor";

export const dynamic = "force-dynamic";
// «Que lo haga Gemini» (POST) puede correr hasta 101 respuestas en tandas: el plazo largo que ya usa el laboratorio.
export const maxDuration = 300;

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * La decisión del dueño sobre una tarea «esperando tu OK».
 * body: { decision: "aprobada" | "cambios" | "rechazada", nota? }.
 *  - aprobada: queda aprobada (publicar o aplicar sigue siendo un paso aparte).
 *  - cambios: vuelve a la mesa de entrada con la nota en el recorrido.
 *  - rechazada: se descarta con motivo (nada se borra).
 * Lo que hizo Gemini no se aprueba hasta que Claude lo repase (409); pedir
 * cambios y descartar siguen disponibles.
 */
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(id)) return NextResponse.json({ error: "Tarea no válida." }, { status: 400 });
  const v = validarDecision(await request.json().catch(() => ({})));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const db = createAdminClient();
  let actual: any = await db.from("bandeja_claude" as any).select("id, estado, decision, recorrido, ejecutor, repaso").eq("id", id).maybeSingle();
  // Antes de la migración 0652 no existen ejecutor ni repaso: ahí nada lo hizo Gemini.
  if (actual.error?.code === "42703") actual = await db.from("bandeja_claude" as any).select("id, estado, decision, recorrido").eq("id", id).maybeSingle();
  if (actual.error) return NextResponse.json({ error: "No se pudo leer la tarea." }, { status: 500 });
  const fila = actual.data as any;
  if (!fila || fila.estado !== "lista" || fila.decision === "aprobada") {
    return NextResponse.json({ error: "Esta tarea no está esperando tu OK." }, { status: 409 });
  }
  if (v.decision === "aprobada") {
    const p = puedeAprobar({ estado: fila.estado, decision: fila.decision ?? null, ejecutor: fila.ejecutor ?? null, repaso: fila.repaso ?? null });
    if (!p.ok) return NextResponse.json({ error: p.motivo }, { status: 409 });
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

  let consulta = db.from("bandeja_claude" as any).update(cambios).eq("id", id).eq("estado", "lista");
  // Si Gemini la entregó, el OK solo pasa si el repaso sigue hecho al momento de guardar.
  if (v.decision === "aprobada" && fila.ejecutor === "gemini") consulta = consulta.in("repaso", ["repasada", "corregida"]);
  const { data, error } = await consulta.select(COLUMNAS_OFICINA).maybeSingle();
  if (error) {
    console.error("[oficina/decision]", error.message);
    return NextResponse.json({ error: "No se pudo guardar la decisión." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "La tarea cambió mientras tanto. Recargá la oficina." }, { status: 409 });
  return NextResponse.json({ tarea: filaATareaOficina(data) });
}

/**
 * «Que lo haga Gemini» (27/11): solo por botón del dueño en la Oficina, nunca
 * solo ni desde Jarvis. body: { accion: "gemini", candidatos? }. Corre la
 * tarea en modo arena dentro del tope de USD 30 compartido y deja el
 * resultado «Hecho por Gemini · sin repasar» (no se aprueba hasta que Claude
 * lo repase). No publica, no envía, no toca código: es un borrador.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!UUID.test(id)) return NextResponse.json({ error: "Tarea no válida." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  if (body?.accion !== "gemini") return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  const r = await ejecutarConGemini(id, { candidatos: body?.candidatos });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ tarea: r.tarea, aviso: r.aviso });
}
