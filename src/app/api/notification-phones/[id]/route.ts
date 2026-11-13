import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";

/** Quita un teléfono de los avisos. 13/11: no se borra la fila, se archiva con fecha. */
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esUuid(params.id)) return NextResponse.json({ error: "Teléfono no válido." }, { status: 400 });
  const { data, error } = await (createAdminClient().from("notification_phones") as any)
    .update({ archived_at: new Date().toISOString(), archived_reason: "Quitado desde el panel" })
    .eq("id", params.id)
    .is("archived_at", null)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!(data ?? []).length) return NextResponse.json({ error: "Ese teléfono no existe o ya estaba quitado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
