import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPush, vapidConfig } from "@/lib/webpush";

/**
 * Dispositivos con avisos web y envío con historial (bloque 1.9). Con PIN
 * general no hay cuentas: cada navegador que activa los avisos queda como un
 * dispositivo con nombre, que se puede desactivar o retirar desde el panel.
 */
export interface PushDevice {
  id: string;
  label: string | null;
  status: "activo" | "desactivado" | "retirado" | "vencido";
  user_agent: string | null;
  created_at: string;
  last_success_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
}

export async function listDevices(): Promise<PushDevice[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, label, status, user_agent, created_at, last_success_at, last_error, last_error_at")
    .neq("status", "retirado")
    .order("created_at", { ascending: false });
  return (data ?? []) as PushDevice[];
}

export async function registerDevice(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  label: string | null;
  userAgent: string | null;
}): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        label: input.label,
        user_agent: input.userAgent,
        status: "activo",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    )
    .select("id")
    .single();
  if (error || !data) throw new Error(`No se pudo registrar el dispositivo: ${error?.message}`);
  return data.id as string;
}

export async function setDeviceStatus(id: string, status: "activo" | "desactivado" | "retirado"): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export interface DeliveryResult {
  deviceId: string;
  label: string | null;
  status: "enviado" | "error";
  detail?: string;
}

/**
 * Envía un aviso a los dispositivos activos (o a uno), dejando registro por
 * dispositivo. Con `eventKey`, un reintento del mismo evento no se vuelve a
 * mandar a un dispositivo que ya lo recibió (para los avisos de cierre).
 */
export async function sendToDevices(input: {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  kind: "prueba" | "aviso";
  deviceId?: string | null;
  eventKey?: string | null;
}): Promise<{ results: DeliveryResult[]; missing: string[] }> {
  const { config, missing } = vapidConfig();
  if (!config) return { results: [], missing };
  const supabase = createAdminClient();
  let q = supabase.from("push_subscriptions").select("id, label, endpoint, p256dh, auth").eq("status", "activo");
  if (input.deviceId) q = q.eq("id", input.deviceId);
  const { data: devices } = await q;
  const results: DeliveryResult[] = [];

  for (const d of (devices ?? []) as any[]) {
    const { data: delivery, error: insErr } = await supabase
      .from("push_deliveries")
      .insert({
        subscription_id: d.id,
        kind: input.kind,
        event_key: input.eventKey ?? null,
        title: input.title,
        url: input.url ?? null,
        status: "pendiente",
      })
      .select("id")
      .single();
    if (insErr) {
      // Mismo evento ya registrado para este dispositivo: no se duplica.
      if ((insErr as any).code === "23505") continue;
      results.push({ deviceId: d.id, label: d.label, status: "error", detail: insErr.message });
      continue;
    }
    const r = await sendWebPush(
      { endpoint: d.endpoint, p256dh: d.p256dh, auth: d.auth },
      { title: input.title, body: input.body, url: input.url, tag: input.tag },
      config
    );
    const now = new Date().toISOString();
    await supabase
      .from("push_deliveries")
      .update({ status: r.ok ? "enviado" : "error", http_status: r.status || null, error: r.ok ? null : r.error ?? null, updated_at: now })
      .eq("id", delivery.id);
    await supabase
      .from("push_subscriptions")
      .update(
        r.ok
          ? { last_success_at: now, updated_at: now }
          : { last_error: r.error ?? `Error ${r.status}`, last_error_at: now, updated_at: now, ...(r.gone ? { status: "vencido" } : {}) }
      )
      .eq("id", d.id);
    results.push({
      deviceId: d.id,
      label: d.label,
      status: r.ok ? "enviado" : "error",
      detail: r.ok ? undefined : r.gone ? "El dispositivo ya no acepta avisos (se marcó vencido)" : r.error,
    });
  }
  return { results, missing: [] };
}
