import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { areasForProfile } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";
import { requireSession } from "@/lib/acceso/autorizacion";

export const dynamic = "force-dynamic";

/**
 * Registrar una línea de WhatsApp en el perfil (a mano). Las credenciales
 * quedan en la configuración privada: acá solo va el prefijo de sus
 * variables (p. ej. WHATSAPP_CIVIL).
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const areas = areasForProfile(params.id);
  const area = body?.area as Area;
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 80) : "";
  const key = typeof body?.credential_key === "string" ? body.credential_key.trim().toUpperCase() : "";
  if (!areas.includes(area)) return NextResponse.json({ error: "Área inválida para este perfil." }, { status: 400 });
  if (!label) return NextResponse.json({ error: "Poné un nombre para la línea." }, { status: 400 });
  if (!/^[A-Z][A-Z0-9_]{2,60}$/.test(key)) {
    return NextResponse.json({ error: "El prefijo de las variables tiene que ser algo como WHATSAPP_CIVIL." }, { status: 400 });
  }
  const dailyLimit = body?.daily_limit ? Number(body.daily_limit) : null;
  if (dailyLimit !== null && (!Number.isInteger(dailyLimit) || dailyLimit <= 0)) {
    return NextResponse.json({ error: "El límite diario tiene que ser un número entero positivo." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("area", area)
    .eq("type", "whatsapp")
    .maybeSingle();
  const { data, error } = await supabase
    .from("profile_lines")
    .insert({
      rubro_id: params.id,
      area,
      label,
      phone_display: typeof body?.phone_display === "string" ? body.phone_display.trim().slice(0, 40) || null : null,
      credential_key: key,
      channel_id: channel?.id ?? null,
      answers_with_agent: body?.answers_with_agent !== false,
      use_for_campaigns: body?.use_for_campaigns !== false,
      daily_limit: dailyLimit,
    })
    .select("id")
    .single();
  if (error) {
    const msg = (error as any).code === "23505" ? "Esa conexión ya está registrada en una línea activa." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "registrar_linea",
    target: `profile_lines:${data.id}`,
    after: { rubro_id: params.id, area, label, credential_key: key },
  });
  return NextResponse.json({ ok: true, id: data.id });
}
