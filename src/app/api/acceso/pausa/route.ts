import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deviceSummary,
  ensurePinState,
  isValidPinFormat,
  lockedUntil,
  logAccessEvent,
  originHash,
  registerFailure,
  verifyPin,
} from "@/lib/acceso/pin";
import { getAutomationPause } from "@/lib/automation-pause";

export const dynamic = "force-dynamic";

/**
 * Pausa general (pregunta 38). Solo cambia por decisión expresa desde el
 * panel, con el PIN. Reanudar NO activa agentes ni campañas por sí solo:
 * cada agente y cada campaña se activan aparte, desde su pantalla.
 *
 * body: { pin, ai_replies_paused?: boolean, outbound_automations_paused?: boolean }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const origin = await originHash(request);
  const device = deviceSummary(request);

  if (await lockedUntil(origin)) {
    return NextResponse.json({ error: "Demasiados intentos fallidos. Esperá 15 minutos." }, { status: 429 });
  }
  const state = await ensurePinState();
  if (!state.pinHash || !(isValidPinFormat(pin) && (await verifyPin(pin, state.pinHash)))) {
    const until = await registerFailure(origin);
    return NextResponse.json({ error: "PIN incorrecto." }, { status: until ? 429 : 401 });
  }

  const before = await getAutomationPause();
  const after = {
    ai_replies_paused:
      typeof body.ai_replies_paused === "boolean" ? body.ai_replies_paused : before.aiRepliesPaused,
    outbound_automations_paused:
      typeof body.outbound_automations_paused === "boolean"
        ? body.outbound_automations_paused
        : before.outboundPaused,
  };

  const supabase = createAdminClient();
  const value = {
    ...after,
    since: new Date().toISOString(),
    reason:
      after.ai_replies_paused || after.outbound_automations_paused
        ? "Pausa general activa por decisión desde el panel."
        : "Pausa general levantada desde el panel.",
    reactivation: "Solo por decisión expresa desde el panel.",
  };
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key: "automation_pause", value, updated_at: new Date().toISOString(), updated_by: "panel" }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // La tarea programada de campañas acompaña al interruptor de envíos.
  const { error: cronErr } = await supabase.rpc("set_campaign_tick_active", {
    p_active: !after.outbound_automations_paused,
  });

  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "pausa_general",
    target: "system_settings.automation_pause",
    before: { ai_replies_paused: before.aiRepliesPaused, outbound_automations_paused: before.outboundPaused },
    after,
    note: cronErr ? `No se pudo cambiar la tarea programada: ${cronErr.message}` : null,
  });
  await logAccessEvent("pausa_general", { origin, device, detail: after });

  return NextResponse.json({ ok: true, ...after, cron_error: cronErr?.message ?? null });
}
