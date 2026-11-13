import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esUuid } from "@/lib/rutas/comprobar";

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!(data ?? []).length) return NextResponse.json({ error: "Esa cita no existe." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
