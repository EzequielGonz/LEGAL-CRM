import { NextResponse } from "next/server";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Parche 2.0 (6.3) — Atención entrante 24 h de un perfil.
 * GET ?rubro_id=… → { enabled }
 * POST { rubro_id, enabled: boolean, pin } → cambia y deja registro.
 *
 * Habilitarla NO levanta la pausa general ni enciende el agente: la IA
 * responde de noche o en domingo solo si además el agente está activo, no
 * hay pausa y el chat no está tomado. Cambiarla pide el PIN.
 */
function rubroValido(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = new URL(request.url).searchParams.get("rubro_id");
  if (!rubroValido(rubroId)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const { data, error } = await createAdminClient().from("rubros").select("*").eq("id", rubroId).maybeSingle();
  if (error) return NextResponse.json({ error: "No se pudo leer el perfil." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  return NextResponse.json({ enabled: (data as any).inbound_24h_enabled === true });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = body?.rubro_id;
  if (!rubroValido(rubroId)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "Indicá si se habilita o no." }, { status: 400 });
  const pin = await confirmPin(request, body?.pin, "atencion_entrante_24h", { perfil: rubroId, activo: body.enabled });
  if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rubros")
    .update({ inbound_24h_enabled: body.enabled })
    .eq("id", rubroId)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: `No se pudo guardar: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
