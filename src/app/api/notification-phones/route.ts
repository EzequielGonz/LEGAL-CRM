import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Teléfonos adicionales que reciben notificaciones de WhatsApp (caso
 * calificado / cita agendada), sin necesitar una cuenta de login en el
 * panel — a diferencia del teléfono de "Configuración → Notificaciones"
 * (uno por usuario logueado), acá se pueden cargar tantos como haga falta.
 */
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_phones")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ phones: data });
}

export async function POST(request: Request) {
  const { phone, label } = await request.json();

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "Falta el teléfono" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_phones")
    .insert({ phone: phone.trim(), label: label?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ phone: data });
}
