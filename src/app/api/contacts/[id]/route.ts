import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EDITABLE_FIELDS = [
  "full_name",
  "phone",
  "email",
  "dni_cuil",
  "notes",
  "status",
  "assigned_studio_id",
  // Se marca desde la pantalla de Teléfono ("Casos para derivar") al tocar
  // "Enviar a WhatsApp" — es solo un tilde visual de "ya lo mandé", no una
  // confirmación real de entrega.
  "derived_at",
] as const;

/**
 * Edición manual de un prospecto desde el panel (ficha de prospecto / CRM):
 * corregir datos de contacto, cambiar el estado a mano (ej. cerrarlo como
 * ganado/perdido) o derivarlo a un estudio jurídico. Solo toca los campos
 * que vengan en el body — no pisa el resto del registro.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      const value = body[field];
      patch[field] = typeof value === "string" && value.trim() === "" ? null : value;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, contact: data });
}
