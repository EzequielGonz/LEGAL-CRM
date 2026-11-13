import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { validarReglasDeAgenda } from "@/lib/rutas/comprobar";

/**
 * Reemplaza los horarios de un área (días, horarios, duración). 13/11: se
 * revisan antes y el cambio va en una sola operación de la base: si algo
 * falla, quedan los horarios que había. Los anteriores no se borran, quedan
 * inactivos.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const area = body?.area;
  if (area !== "civil" && area !== "penal") {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  const v = validarReglasDeAgenda(body?.rules ?? []);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const { error } = await (createAdminClient() as any).rpc("reemplazar_disponibilidad", { p_area: area, p_reglas: v.reglas });
  if (error) {
    console.error("[agenda/availability]", error.message);
    return NextResponse.json({ error: "No se pudieron guardar los horarios. Quedaron los que había." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
