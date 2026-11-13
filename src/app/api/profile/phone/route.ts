import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { leerTelefonoPrincipal } from "@/lib/rutas/comprobar";

/**
 * Teléfono principal de avisos. Con el acceso por PIN general ya no hay
 * usuario logueado: se edita el teléfono del perfil de administrador que
 * ya existía (se conserva su registro, no se crean cuentas nuevas).
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  // 13/11: un pedido mal formado ya no borra el teléfono; solo se quita si se pide a propósito.
  const leido = leerTelefonoPrincipal(await request.json().catch(() => undefined));
  if (!leido.ok) return NextResponse.json({ error: leido.error }, { status: 400 });
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json(
      { error: "No hay un perfil de administrador guardado. Usá «Números adicionales de notificación»." },
      { status: 409 }
    );
  }
  const { error } = await supabase
    .from("admin_profiles")
    .update({ phone: leido.telefono })
    .eq("id", profile.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
