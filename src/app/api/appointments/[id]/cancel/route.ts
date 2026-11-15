import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";
import { respuestaErrorInterno } from "@/lib/error-publico";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  if (!esUuid(params.id)) return NextResponse.json({ error: "Cita no válida." }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelada" })
    .eq("id", params.id)
    .select("id");

  if (error) return respuestaErrorInterno(error, "appointments/[id]/cancel");
  if (!(data ?? []).length) return NextResponse.json({ error: "Esa cita no existe." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
