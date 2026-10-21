import { createAdminClient } from "@/lib/supabase/admin";
import { appsSuscriptas, lineaSinAvisos, suscribirAvisos, type ActividadLinea } from "./avisos-meta";

/**
 * Lado servidor de los avisos de Meta (21/10). Lo llama el latido: mira las
 * líneas activas y, si una manda mensajes pero no recibe avisos, suscribe su
 * cuenta al webhook del panel. Reintenta como mucho cada 6 h por línea y deja
 * el resultado en `system_settings` (clave `avisos_meta`) para el tablero.
 */
export const CLAVE_AVISOS = "avisos_meta";
const REINTENTO_MS = 6 * 3_600_000;

export interface EstadoAvisosLinea {
  area: string;
  sinAvisos: boolean;
  ultimoIntento?: string | null;
  resultado?: string | null;
  ok?: boolean | null;
  /** Diagnóstico de solo lectura: qué apps están suscriptas a la cuenta según Meta. */
  apps?: string | null;
}

async function actividad(area: string, ahora: Date): Promise<ActividadLinea> {
  const s = createAdminClient();
  const desde = new Date(ahora.getTime() - 3 * 24 * 3_600_000).toISOString();
  const hace15 = new Date(ahora.getTime() - 15 * 60_000).toISOString();
  const base = () => s.from("messages").select("id, conversations!inner(area)", { count: "exact", head: true }).eq("conversations.area", area).gte("created_at", desde);
  const [viejos, conEstado, entrantes] = await Promise.all([
    base().eq("direction", "saliente").lte("created_at", hace15),
    base().eq("direction", "saliente").in("delivery_status", ["entregado", "leido", "fallido"]),
    base().eq("direction", "entrante"),
  ]);
  return { salientesViejos: viejos.count ?? 0, conEstado: conEstado.count ?? 0, entrantes: entrantes.count ?? 0 };
}

async function leerGuardado(): Promise<{ at: string | null; lineas: Record<string, EstadoAvisosLinea> }> {
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", CLAVE_AVISOS).maybeSingle();
  const v = (data as any)?.value ?? {};
  return { at: v.at ?? null, lineas: (v.lineas ?? {}) as Record<string, EstadoAvisosLinea> };
}

export async function leerEstadoAvisos(): Promise<Record<string, EstadoAvisosLinea>> {
  return (await leerGuardado()).lineas;
}

export async function asegurarAvisosDeLineas(ahora = new Date()): Promise<Record<string, EstadoAvisosLinea>> {
  const s = createAdminClient();
  const guardado = await leerGuardado().catch(() => ({ at: null, lineas: {} as Record<string, EstadoAvisosLinea> }));
  // Se mira cada 10 minutos, no en cada latido.
  if (guardado.at && ahora.getTime() - new Date(guardado.at).getTime() < 10 * 60_000) return guardado.lineas;
  const previo = guardado.lineas;
  const { data: lineas } = await s.from("profile_lines").select("area, credential_key, active").eq("active", true);
  const estado: Record<string, EstadoAvisosLinea> = {};
  for (const l of (lineas ?? []) as { area: string; credential_key: string }[]) {
    const clave = l.credential_key;
    const a = await actividad(l.area, ahora);
    const sin = lineaSinAvisos(a);
    const antes = previo[clave];
    const e: EstadoAvisosLinea = { area: l.area, sinAvisos: sin, ultimoIntento: antes?.ultimoIntento ?? null, resultado: antes?.resultado ?? null, ok: antes?.ok ?? null };
    const tocaReintento = !antes?.ultimoIntento || ahora.getTime() - new Date(antes.ultimoIntento).getTime() > REINTENTO_MS;
    if (sin && tocaReintento) {
      const r = await suscribirAvisos(clave);
      e.ultimoIntento = ahora.toISOString();
      e.resultado = r.mensaje;
      e.ok = r.ok;
      console.log(`[avisos-meta] ${clave}: ${r.ok ? "suscripta" : "no se pudo"} (${r.http ?? "-"})`);
    }
    if (sin) {
      const d = await appsSuscriptas(clave);
      e.apps = d.ok ? (d.apps ?? []).join(", ") || "ninguna" : d.mensaje;
    }
    estado[clave] = e;
  }
  await s.from("system_settings").upsert({ key: CLAVE_AVISOS, value: { at: ahora.toISOString(), lineas: estado } as any }, { onConflict: "key" });
  return estado;
}

/** Suscripción pedida a mano desde Líneas (ignora la espera de 6 h). */
export async function suscribirLineaAhora(credentialKey: string): Promise<{ ok: boolean; mensaje: string }> {
  const r = await suscribirAvisos(credentialKey);
  const s = createAdminClient();
  const previo = await leerEstadoAvisos().catch(() => ({} as Record<string, EstadoAvisosLinea>));
  const area = previo[credentialKey]?.area ?? "";
  previo[credentialKey] = { ...(previo[credentialKey] ?? { area, sinAvisos: true }), ultimoIntento: new Date().toISOString(), resultado: r.mensaje, ok: r.ok };
  await s.from("system_settings").upsert({ key: CLAVE_AVISOS, value: { at: new Date().toISOString(), lineas: previo } as any }, { onConflict: "key" });
  return { ok: r.ok, mensaje: r.mensaje };
}
