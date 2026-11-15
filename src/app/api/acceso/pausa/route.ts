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
  comprobarPinConTope,
} from "@/lib/acceso/pin";
import { getAutomationPause } from "@/lib/automation-pause";
import { requireSession } from "@/lib/acceso/autorizacion";
import { respuestaErrorInterno } from "@/lib/error-publico";

export const dynamic = "force-dynamic";

/**
 * Pausa general (pregunta 38). Solo cambia por decisión expresa desde el
 * panel, con el PIN. Reanudar NO activa agentes ni campañas por sí solo:
 * cada agente y cada campaña se activan aparte, desde su pantalla.
 *
 * body: { pin, ai_replies_paused?: boolean, outbound_automations_paused?: boolean }
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const origin = await originHash(request);
  const device = deviceSummary(request);

  // Revisión 15/11: intento reservado antes de comprobar el código (hay sesión: no la frena la pausa general).
  const chequeo = await comprobarPinConTope(request, pin, { confiable: true });
  if (!chequeo.ok) {
    if (chequeo.hasta && chequeo.status === 429) await logAccessEvent("bloqueo_origen", { origin, device, detail: { hasta: chequeo.hasta.toISOString() } });
    return NextResponse.json({ error: chequeo.status === 429 ? "Demasiados intentos fallidos. Esperá 15 minutos." : chequeo.error }, { status: chequeo.status });
  }
  const state = await ensurePinState();

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
  if (error) return respuestaErrorInterno(error, "acceso/pausa");

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
