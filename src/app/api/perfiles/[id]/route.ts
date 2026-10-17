import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

function clean(v: unknown, max = 120): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t ? t : null;
}

/**
 * Datos del perfil que se cargan a mano (bloque 1.4). El identificador del
 * perfil no cambia: renombrar conserva todos los vínculos. Los perfiles no
 * se eliminan.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  const name = clean(body?.name, 80);
  if (name !== undefined) {
    if (!name) return NextResponse.json({ error: "El perfil necesita un nombre." }, { status: 400 });
    update.name = name;
  }
  const brand = clean(body?.brand_name);
  if (brand !== undefined) update.brand_name = brand;
  const presentation = clean(body?.agent_presentation_name, 80);
  if (presentation !== undefined) update.agent_presentation_name = presentation;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada para guardar" }, { status: 400 });
  update.settings_updated_at = new Date().toISOString();

  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from("rubros")
    .select("id, name, brand_name, agent_presentation_name")
    .eq("id", params.id)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const { error } = await supabase.from("rubros").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "editar_perfil",
    target: `rubros:${params.id}`,
    before,
    after: update,
  });
  revalidateTag("marca-perfil");
  return NextResponse.json({ ok: true });
}
