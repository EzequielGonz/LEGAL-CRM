/**
 * Etapa 2 · Bloque 1 — Operaciones de captación, resultado posterior y
 * atención humana sobre la base. Las decisiones viven en `./reglas.ts`
 * (puras, con pruebas); acá solo se aplican.
 *
 *  - registrarCaptacion: evento único con evidencia (capture_register, atómico
 *    e idempotente), advertencias por datos faltantes, zona en tres valores,
 *    cancelación de contactos pendientes del mismo cierre y avisos internos
 *    pendientes por destinatario. Solo preguntar precio no capta: va a una
 *    persona.
 *  - registrarResultadoPosterior: otra dimensión; nunca toca la captación ni
 *    la derivación, y nunca inicia una secuencia automática.
 *  - solicitarAtencion: clasificación 12.2. Pausa el chat de forma atómica
 *    cuando corresponde, registra la detención con su motivo (archivo
 *    secundario, no es trabajo pendiente) y deja la atención principal solo
 *    para lo que necesita a una persona.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createDetention, type DetentionMotive } from "@/lib/detention";
import { ensureOpportunity, logOpportunityEvent, setOpportunityState, type Actor } from "@/lib/opportunities";
import { AREA_TO_RUBRO_ID, RUBRO_IDS } from "@/lib/rubros";
import {
  clasificarAtencion,
  evaluarCaptacion,
  normalizarZona,
  validarResultadoPosterior,
  type EvaluacionCaptacion,
  type MotivoAtencion,
  type RubroSlug,
  type TratamientoAtencion,
  type Zona,
} from "@/lib/captacion/reglas";

export class CaptacionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "CaptacionError";
  }
}

const RUBRO_SLUG_BY_ID: Record<string, RubroSlug> = Object.fromEntries(
  (Object.entries(RUBRO_IDS) as [RubroSlug, string][]).map(([slug, id]) => [id, slug])
) as Record<string, RubroSlug>;

/** Rubro de una oportunidad (por su rubro o, si falta, por el área). */
export function rubroSlugDe(opp: { rubro_id?: string | null; area?: string | null }): RubroSlug {
  if (opp.rubro_id && RUBRO_SLUG_BY_ID[opp.rubro_id]) return RUBRO_SLUG_BY_ID[opp.rubro_id];
  const byArea = opp.area ? AREA_TO_RUBRO_ID[opp.area] : undefined;
  if (byArea && RUBRO_SLUG_BY_ID[byArea]) return RUBRO_SLUG_BY_ID[byArea];
  // Nunca se supone un rubro: sin rubro reconocible no se evalúa la captación.
  throw new CaptacionError("La oportunidad no tiene un perfil reconocible.", 409);
}

export interface ResultadoCaptacion {
  captado: boolean;
  /** true solo la primera vez: repetir el cierre no crea otro evento ni otro aviso. */
  nuevo: boolean;
  eventId: string | null;
  evaluacion: EvaluacionCaptacion;
  /** Si no capta por consultar solo el precio, la atención humana que se pidió. */
  atencion?: TratamientoAtencion & { motivo: MotivoAtencion };
}

export async function registrarCaptacion(input: {
  opportunityId: string;
  actor: Actor;
  aceptacion: boolean;
  evidencia: string;
  datos?: Record<string, unknown>;
  zona?: unknown;
  soloPrecio?: boolean;
}): Promise<ResultadoCaptacion> {
  const supabase = createAdminClient();
  const { data: opp } = await supabase
    .from("opportunities")
    .select("id, rubro_id, area, contact_id, conversation_id, capture_state, location_zone")
    .eq("id", input.opportunityId)
    .maybeSingle();
  if (!opp) throw new CaptacionError("Oportunidad no encontrada", 404);

  let datos = input.datos;
  if (!datos) {
    const { data: contact } = await supabase.from("contacts").select("qualification_data").eq("id", opp.contact_id).maybeSingle();
    datos = (contact?.qualification_data as Record<string, unknown>) ?? {};
  }
  const zona = input.zona === undefined ? opp.location_zone : input.zona;
  const evaluacion = evaluarCaptacion({
    rubro: rubroSlugDe(opp),
    aceptacion: input.aceptacion,
    evidencia: input.evidencia,
    datos,
    zona,
    soloPrecio: input.soloPrecio,
  });

  if (!evaluacion.captar) {
    if (evaluacion.motivo === "solo_precio") {
      const atencion = await solicitarAtencion({
        opportunityId: opp.id,
        motivo: "precio_fuera_alcance",
        actor: input.actor,
        nota: input.evidencia || "Consultó solo el precio",
      });
      return { captado: false, nuevo: false, eventId: null, evaluacion, atencion };
    }
    return { captado: false, nuevo: false, eventId: null, evaluacion };
  }

  const { data, error } = await supabase.rpc("capture_register", {
    p_opportunity: opp.id,
    p_actor: input.actor,
    p_evidence: input.evidencia,
    p_warnings: evaluacion.advertencias,
    p_zone: evaluacion.zona,
  });
  if (error) throw new CaptacionError(`No se pudo registrar la captación: ${error.message}`, 500);
  const row = Array.isArray(data) ? data[0] : data;
  return { captado: true, nuevo: !!row?.created, eventId: row?.event_id ?? null, evaluacion };
}

/** Zona explícita en tres valores (nunca se infiere AMBA). */
export async function registrarZona(input: { opportunityId: string; zona: unknown; actor: Actor }): Promise<Zona> {
  const zona = normalizarZona(input.zona);
  await setOpportunityState({
    opportunityId: input.opportunityId,
    dimension: "ficha",
    field: "location_zone",
    value: zona,
    actor: input.actor,
    reason: "Ubicación registrada",
  });
  return zona;
}

/** Ruta jurídica: Fase 1/Fase 2 (caso frío) o directa (consulta actual). */
export async function elegirRutaJuridica(input: { opportunityId: string; ruta: "fases" | "directa"; actor: Actor; motivo?: string }) {
  await setOpportunityState({
    opportunityId: input.opportunityId,
    dimension: "captacion",
    field: "legal_route",
    value: input.ruta,
    actor: input.actor,
    reason: input.motivo ?? (input.ruta === "directa" ? "Consulta actual: ruta rápida" : "Caso frío: Fase 1 y Fase 2"),
  });
}

export async function registrarResultadoPosterior(input: {
  opportunityId: string;
  resultado: unknown;
  fuente: unknown;
  motivo?: unknown;
  nota?: unknown;
  contactoPrevistoAt?: unknown;
  actor?: Actor;
}) {
  const supabase = createAdminClient();
  const { data: opp } = await supabase
    .from("opportunities")
    .select("id, derivation_state, post_derivation_state")
    .eq("id", input.opportunityId)
    .maybeSingle();
  if (!opp) throw new CaptacionError("Oportunidad no encontrada", 404);
  const v = validarResultadoPosterior({
    derivado: opp.derivation_state === "derivado",
    resultado: input.resultado,
    fuente: input.fuente,
    motivo: input.motivo,
    nota: input.nota,
  });
  if (!v.ok) throw new CaptacionError(v.error);
  let previsto: string | null = null;
  if (typeof input.contactoPrevistoAt === "string" && input.contactoPrevistoAt) {
    const d = new Date(input.contactoPrevistoAt);
    if (Number.isNaN(d.getTime())) throw new CaptacionError("Fecha de contacto previsto no válida.");
    previsto = d.toISOString();
  }
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("opportunities")
    .update({
      post_derivation_state: v.resultado,
      post_derivation_at: now,
      post_derivation_source: v.fuente,
      post_derivation_reason: v.motivo,
      post_derivation_note: v.nota,
      post_derivation_contact_expected_at: previsto,
      updated_at: now,
    })
    .eq("id", opp.id);
  if (error) throw new CaptacionError(`No se pudo guardar el resultado: ${error.message}`, 500);
  await logOpportunityEvent({
    opportunityId: opp.id,
    actor: input.actor ?? "operador",
    dimension: "resultado_posterior",
    from: opp.post_derivation_state ?? null,
    to: v.resultado,
    reason: v.nota ?? v.motivo ?? null,
    detail: { fuente: v.fuente, motivo: v.motivo, contacto_previsto: previsto },
  });
  return v;
}

/**
 * Atención humana con su clasificación (12.2). Devuelve el tratamiento para
 * que quien llama sepa qué responder (disculpa breve, aviso de persona…).
 *
 * `diferirDetencion`: el agente registra la detención DESPUÉS de mandar la
 * disculpa (si la registrara antes, la disculpa ya no podría salir).
 */
export async function solicitarAtencion(input: {
  opportunityId?: string | null;
  contactId?: string | null;
  conversationId?: string | null;
  motivo: unknown;
  actor: Actor;
  nota?: string | null;
  /** El chat ya fue pausado por quien llama (p. ej. con el acuse final del agente). */
  chatYaPausado?: boolean;
  diferirDetencion?: boolean;
}): Promise<TratamientoAtencion & { motivo: MotivoAtencion; detencionPendiente: DetentionMotive | null }> {
  const supabase = createAdminClient();
  const t = clasificarAtencion(input.motivo);

  let opp: any = null;
  if (input.opportunityId) {
    const { data } = await supabase.from("opportunities").select("*").eq("id", input.opportunityId).maybeSingle();
    opp = data;
  } else if (input.contactId) {
    opp = (await ensureOpportunity({ contactId: input.contactId, conversationId: input.conversationId ?? null })).row;
  }
  const conversationId = input.conversationId ?? opp?.conversation_id ?? null;
  const contactId = input.contactId ?? opp?.contact_id ?? null;

  // Pausa del chat: la IA deja de responder en esa conversación.
  if (t.pausarChat && conversationId && !input.chatYaPausado) {
    await supabase
      .from("conversations")
      .update({
        ai_enabled: false,
        ai_ack_token: null,
        ai_ack_expires_at: null,
        ...(t.principal ? { status: "requiere_atencion_humana" } : {}),
      })
      .eq("id", conversationId);
  }

  if (opp) {
    const extra = { attention_category: t.categoria, attention_reason: t.motivo };
    if (t.principal) {
      await setOpportunityState({
        opportunityId: opp.id,
        dimension: "atencion",
        field: "attention_state",
        value: opp.attention_state === "humano_en_curso" ? "humano_en_curso" : "requiere_humano",
        actor: input.actor,
        reason: input.nota ? `${t.label}: ${input.nota}` : t.label,
        extra,
        detail: { categoria: t.categoria, motivo: t.motivo },
      });
    } else {
      // Detención, procedencia, incidencia o registro: queda clasificado sin
      // aparecer como trabajo pendiente en la atención principal.
      await supabase.from("opportunities").update({ ...extra, updated_at: new Date().toISOString() }).eq("id", opp.id);
      await logOpportunityEvent({
        opportunityId: opp.id,
        actor: input.actor,
        dimension: t.detener ? "detencion" : "atencion",
        to: t.motivo,
        reason: input.nota ? `${t.label}: ${input.nota}` : t.label,
        detail: { categoria: t.categoria },
      });
    }
  }

  let detencionPendiente: DetentionMotive | null = null;
  if (t.detener && contactId) {
    if (input.diferirDetencion) {
      detencionPendiente = t.detener;
    } else {
      await registrarDetencion({ contactId, motivo: t.detener, menor: t.menor, actor: input.actor, nota: input.nota ?? t.label, motivoAtencion: t.motivo });
    }
  }
  return { ...t, detencionPendiente };
}

export async function registrarDetencion(input: {
  contactId: string;
  motivo: DetentionMotive;
  menor?: boolean;
  actor: Actor;
  nota?: string | null;
  motivoAtencion?: string;
}) {
  const supabase = createAdminClient();
  // Una sola detención vigente por contacto y motivo (repetir no duplica).
  const { data: vigente } = await supabase
    .from("contact_detentions")
    .select("id")
    .eq("contact_id", input.contactId)
    .eq("status", "vigente")
    .eq("motive", input.motivo)
    .limit(1)
    .maybeSingle();
  if (vigente) return vigente.id as string;
  return createDetention({
    contactId: input.contactId,
    motive: input.motivo,
    source: input.actor === "ia" ? "agente" : "operador",
    minorReported: !!input.menor,
    evidence: { nota: input.nota ?? null, motivo_atencion: input.motivoAtencion ?? null },
  });
}
