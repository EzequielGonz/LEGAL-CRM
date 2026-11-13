/**
 * Motor de caídos (13/11): cada diez minutos, desde el latido, pasa a Caídos
 * a quienes dejaron de contestar y terminaron el circuito. La regla está en
 * ./caidos (pura). No manda ningún mensaje.
 *
 * Dos latidos a la vez no hacen el trabajo dos veces: el cambio solo se
 * aplica si la oportunidad sigue en el estado que se leyó.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { logOpportunityEvent } from "@/lib/opportunities";
import { decidirCaida, type DatosCaida, type DecisionCaida } from "./caidos";

type Db = ReturnType<typeof createAdminClient>;

export interface FilaCandidata {
  opportunity_id: string;
  rubro_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  capture_state: string;
  attention_state: string;
  followup_state: string;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  ultima_palabra: "persona" | "nosotros" | null;
  detenido: boolean;
  tarea_id: string | null;
  tarea_estado: string | null;
  tarea_base_at: string | null;
  seguimiento_enviado_at: string | null;
}

export function datosDeFila(f: FilaCandidata, ahora: Date): DatosCaida {
  return {
    ahora,
    contacto: "respondio",
    captacion: f.capture_state,
    atencion: f.attention_state,
    seguimiento: f.followup_state,
    ultimaPalabra: f.ultima_palabra,
    ultimoEntranteAt: f.last_inbound_at ? new Date(f.last_inbound_at) : null,
    ultimoSalienteAt: f.last_outbound_at ? new Date(f.last_outbound_at) : null,
    detenido: f.detenido,
    tareaAbierta: f.tarea_id && f.tarea_estado && f.tarea_base_at ? { estado: f.tarea_estado, baseAt: new Date(f.tarea_base_at) } : null,
    seguimientoEnviadoAt: f.seguimiento_enviado_at ? new Date(f.seguimiento_enviado_at) : null,
  };
}

export async function leerCandidatas(supabase: Db, ahora: Date, limite = 300): Promise<FilaCandidata[]> {
  const { data, error } = await (supabase.rpc as any)("caidos_candidatos", { p_now: ahora.toISOString(), p_limit: limite });
  if (error) throw new Error(`No se pudieron leer las candidatas a caer: ${error.message}`);
  return (data ?? []) as FilaCandidata[];
}

/**
 * Pasa una oportunidad a Caídos. Devuelve false si ya no estaba como se leyó
 * (otra ejecución la tomó o la persona escribió mientras tanto).
 */
export async function aplicarCaida(supabase: Db, f: FilaCandidata, decision: Extract<DecisionCaida, { caer: true }>, ahora: Date, actor: "sistema" | "operador" = "sistema", motivo?: string): Promise<boolean> {
  const texto = motivo ?? decision.motivo;
  const { data: cambiada, error } = await (supabase.from("opportunities") as any)
    .update({ followup_state: "caido", followup_reason: texto, followup_next_at: null, updated_at: ahora.toISOString() })
    .eq("id", f.opportunity_id)
    .eq("followup_state", f.followup_state)
    .eq("ultima_palabra", "nosotros")
    .in("capture_state", ["en_conversacion", "en_seguimiento"])
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`No se pudo pasar a Caídos: ${error.message}`);
  if (!cambiada) return false;
  if (f.tarea_id) {
    await (supabase.from("followup_tasks") as any)
      .update({ status: "cancelada", status_reason: texto, resolved_at: ahora.toISOString(), resolved_by: actor, updated_at: ahora.toISOString() })
      .eq("id", f.tarea_id)
      .in("status", ["programada", "conflicto", "pendiente"]);
  }
  await logOpportunityEvent({ opportunityId: f.opportunity_id, actor, dimension: "seguimiento", from: f.followup_state, to: "caido", reason: texto, detail: { regla: decision.regla } });
  return true;
}

/** Clave de `system_settings`: desde cuándo corre el motor. La escribe la limpieza al terminar. */
export const CLAVE_CAIDOS = "caidos_automaticos";

/**
 * El motor arranca recién cuando la limpieza del 13/11 terminó: así lo viejo
 * queda en «Movidos en la limpieza», con su deshacer, y no cae sin registro.
 */
export async function caidosEncendidos(supabase: Db): Promise<boolean> {
  const { data } = await (supabase.from("system_settings") as any).select("value").eq("key", CLAVE_CAIDOS).maybeSingle();
  return Boolean((data as any)?.value?.desde);
}

export async function cerrarCaidos(opts: { ahora?: Date; maximo?: number } = {}): Promise<{ revisadas: number; caidas: number; sinEnviar: number; apagado?: true }> {
  const ahora = opts.ahora ?? new Date();
  const supabase = createAdminClient();
  if (!(await caidosEncendidos(supabase))) return { revisadas: 0, caidas: 0, sinEnviar: 0, apagado: true };
  const filas = await leerCandidatas(supabase, ahora, opts.maximo ?? 300);
  let caidas = 0;
  let sinEnviar = 0;
  for (const f of filas) {
    const d = decidirCaida(datosDeFila(f, ahora));
    if (!d.caer) continue;
    try {
      if (await aplicarCaida(supabase, f, d, ahora)) {
        caidas++;
        if (d.regla === "no_se_pudo_enviar") sinEnviar++;
      }
    } catch (err: any) {
      console.error(`[caidos] ${f.opportunity_id}:`, err?.message ?? err);
    }
  }
  return { revisadas: filas.length, caidas, sinEnviar };
}
