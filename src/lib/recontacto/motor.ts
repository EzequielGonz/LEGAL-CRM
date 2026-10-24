/**
 * Recontacto del bot dentro de la ventana de 24 h (24/10): lo corre el
 * latido (/api/campaigns/tick). Las reglas están en ./reglas (puras).
 *
 * Por cada conversación donde la persona escribió en las últimas 24 h y lo
 * último fue una respuesta del bot:
 *  1. Calcula si ya toca (2 h, adelanto antes de las 21, apertura siguiente).
 *  2. Descarta estados que no se recontactan (chat tomado, captado, derivado…).
 *  3. Reserva el turno en el mensaje del bot (una sola ejecución lo toma).
 *  4. El bot revisa la charla: si no hay interés real no escribe; si lo hay,
 *     redacta el mensaje con su guion, sus reglas y su rol.
 *  5. Sale con texto libre por la misma línea (origen «recuperación»: respeta
 *     la pausa general y el horario de 8 a 21, y se revalida antes de enviar).
 */
import { GoogleGenAI, type Content } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";
import { getAutomationPause } from "@/lib/automation-pause";
import { loadContactCalendar } from "@/lib/contacto/calendario";
import { agentReadiness, getProfile, profileIdForArea } from "@/lib/profiles";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { validarTextoSalida } from "@/lib/agentes/contrato";
import { instruccionesDeRol } from "@/lib/agentes/roles";
import { modoDelContacto } from "@/lib/agentes/entrante";
import { GUIA_CAPTACION_Y_CIERRE } from "@/lib/agentes/guia-cierre";
import { perfilDeArea } from "@/lib/navegacion";
import { buildSystemPrompt, criterioDelRubro } from "@/lib/ai-agent/prompt";
import type { Area } from "@/lib/supabase/database.types";
import {
  CLAVE_RECONTACTO,
  excluidoDelRecontacto,
  instruccionRecontacto,
  leerDecision,
  planRecontacto,
  recontactoEncendido,
  type PasoRecontacto,
} from "./reglas";

let _cliente: GoogleGenAI | null = null;
function gemini() {
  if (!_cliente) _cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _cliente;
}

export interface ResultadoRecontacto {
  revisadas: number;
  enviados: number;
  esperando: number;
  descartados: number;
  errores: number;
  detalle: { conversacion: string; perfil: string; accion: string; paso?: PasoRecontacto; programado?: string; motivo?: string }[];
  estado?: string;
}

const PERFILES = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;

/**
 * Configuración por perfil: encendido (salvo que se apague a mano) y desde
 * cuándo. Solo se recontactan conversaciones cortadas después de encenderlo:
 * la primera vez que se lee se guarda la hora de publicación.
 */
export async function leerConfigRecontactoCompleta(): Promise<{ encendido: Record<string, boolean>; desde: Record<string, string> }> {
  const s = createAdminClient();
  const { data } = await s.from("system_settings").select("value").eq("key", CLAVE_RECONTACTO).maybeSingle();
  let v = (data as any)?.value ?? null;
  if (!v) {
    const ahora = new Date().toISOString();
    v = { ...Object.fromEntries(PERFILES.map((p) => [p, true])), desde: Object.fromEntries(PERFILES.map((p) => [p, ahora])) };
    await s.from("system_settings").upsert({ key: CLAVE_RECONTACTO, value: v }, { onConflict: "key" });
  }
  const desdeGuardado = (v.desde ?? {}) as Record<string, string>;
  return {
    encendido: Object.fromEntries(PERFILES.map((p) => [p, recontactoEncendido(v, p)])),
    desde: Object.fromEntries(PERFILES.map((p) => [p, desdeGuardado[p] ?? new Date().toISOString()])),
  };
}

export async function leerConfigRecontacto(): Promise<Record<string, boolean>> {
  return (await leerConfigRecontactoCompleta()).encendido;
}

export async function guardarConfigRecontacto(perfil: string, encendido: boolean): Promise<Record<string, boolean>> {
  const actual = await leerConfigRecontactoCompleta();
  const nuevo = { ...actual.encendido, [perfil]: encendido };
  const desde = { ...actual.desde, ...(encendido && !actual.encendido[perfil] ? { [perfil]: new Date().toISOString() } : {}) };
  const s = createAdminClient();
  const { error } = await s.from("system_settings").upsert({ key: CLAVE_RECONTACTO, value: { ...nuevo, desde, at: new Date().toISOString() } as any }, { onConflict: "key" });
  if (error) throw new Error("No se pudo guardar la configuración del recontacto.");
  await (s.from("ops_change_log") as any).insert({ actor: "panel", action: "recontacto_ia", target: `perfil:${perfil}`, before: { encendido: actual.encendido[perfil] }, after: { encendido } });
  return nuevo;
}

function historial(filas: { direction: string; body: string | null }[]): Content[] {
  const h: Content[] = [];
  for (const f of filas) {
    if (!f.body) continue;
    const role: "user" | "model" = f.direction === "entrante" ? "user" : "model";
    const ultimo = h[h.length - 1];
    const parte = ultimo?.parts?.length === 1 ? ultimo.parts[0] : undefined;
    if (ultimo && ultimo.role === role && parte && typeof parte.text === "string") parte.text += `\n${f.body}`;
    else h.push({ role, parts: [{ text: f.body }] });
  }
  return h;
}

/** Marca el mensaje del bot con el estado del recontacto (no se vuelve a evaluar). */
async function marcar(s: ReturnType<typeof createAdminClient>, msg: { id: string; metadata: any }, estado: string, motivo?: string) {
  await (s.from("messages") as any)
    .update({ metadata: { ...(msg.metadata ?? {}), recontacto_estado: estado, recontacto_motivo: motivo ?? null, recontacto_at: new Date().toISOString() } })
    .eq("id", msg.id);
}

/**
 * Revisa las conversaciones y manda los recontactos que tocan. Con
 * `enviar: false` solo informa qué haría (no llama al modelo ni envía).
 */
export async function procesarRecontactos(opts: { enviar?: boolean; presupuestoMs?: number; perfil?: string; ahora?: Date } = {}): Promise<ResultadoRecontacto> {
  const enviar = opts.enviar !== false;
  const inicio = Date.now();
  const presupuesto = opts.presupuestoMs ?? 15_000;
  const r: ResultadoRecontacto = { revisadas: 0, enviados: 0, esperando: 0, descartados: 0, errores: 0, detalle: [] };

  const pausa = await getAutomationPause();
  if (enviar && (pausa.outboundPaused || pausa.aiRepliesPaused)) return { ...r, estado: "pausa general activa" };
  const { encendido: config, desde: desdePerfil } = await leerConfigRecontactoCompleta();
  const ahora = opts.ahora ?? new Date();
  const { calendar, error: errCal } = await loadContactCalendar(ahora);
  if (errCal) return { ...r, estado: errCal };

  const s = createAdminClient();
  const desde = new Date(ahora.getTime() - 24 * 3_600_000).toISOString();
  const { data: convs, error } = await s
    .from("conversations")
    .select("id, area, status, ai_enabled, contact_id, contacts(*)")
    .eq("ai_enabled", true)
    .gte("last_message_at", desde)
    .order("last_message_at", { ascending: true })
    .limit(300);
  if (error) return { ...r, estado: `No se pudieron leer las conversaciones: ${error.message}` };

  for (const c of (convs ?? []) as any[]) {
    if (Date.now() - inicio > presupuesto) break;
    const perfil = perfilDeArea(c.area);
    if (opts.perfil && opts.perfil !== perfil) continue;
    if (!config[perfil]) continue;
    r.revisadas++;

    const { data: msgs } = await s
      .from("messages")
      .select("id, direction, sender_type, origin, body, metadata, created_at")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: false })
      .limit(30);
    const lista = (msgs ?? []) as any[];
    const ultimo = lista[0];
    if (!ultimo || ultimo.direction !== "saliente" || ultimo.sender_type !== "agente_ia") continue;
    if (!["respuesta_entrante", "recuperacion"].includes(String(ultimo.origin ?? ""))) continue;
    if (ultimo.metadata?.recontacto_estado) continue;
    // Solo conversaciones cortadas después de encenderlo en el perfil.
    if (new Date(ultimo.created_at).getTime() < Date.parse(desdePerfil[perfil])) continue;
    const iEntrante = lista.findIndex((m) => m.direction === "entrante");
    if (iEntrante < 0) continue;
    const entrante = lista[iEntrante];
    const hechos = lista.slice(0, iEntrante).filter((m) => m.origin === "recuperacion" && m.metadata?.recontacto).length;

    const plan = planRecontacto(
      { ultimoEntrante: new Date(entrante.created_at), ultimoSaliente: new Date(ultimo.created_at), recontactosHechos: hechos },
      ahora,
      calendar
    );
    if (plan.accion === "nada") continue;
    if (plan.accion === "esperar") {
      r.esperando++;
      r.detalle.push({ conversacion: c.id, perfil, accion: "esperar", paso: plan.paso, programado: plan.programado.toISOString() });
      continue;
    }

    const { data: opp } = await s
      .from("opportunities")
      .select("capture_state, derivation_state, attention_state")
      .eq("contact_id", c.contact_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const excluido = excluidoDelRecontacto({
      aiEnabled: c.ai_enabled,
      estadoConversacion: c.status,
      captacion: (opp as any)?.capture_state,
      derivacion: (opp as any)?.derivation_state,
      atencion: (opp as any)?.attention_state,
    });
    if (excluido) {
      if (enviar) await marcar(s, ultimo, "descartado", excluido);
      r.descartados++;
      r.detalle.push({ conversacion: c.id, perfil, accion: "descartado", paso: plan.paso, motivo: excluido });
      continue;
    }
    if (!enviar) {
      r.detalle.push({ conversacion: c.id, perfil, accion: "tocaria", paso: plan.paso, programado: plan.programado.toISOString() });
      continue;
    }

    // Reserva: una sola ejecución toma este turno.
    const { data: tomado } = await (s.from("messages") as any)
      .update({ metadata: { ...(ultimo.metadata ?? {}), recontacto_estado: "en_curso", recontacto_at: new Date().toISOString() } })
      .eq("id", ultimo.id)
      .is("metadata->>recontacto_estado", null)
      .select("id");
    if (!tomado || !tomado.length) continue;
    const reservado = { id: ultimo.id, metadata: { ...(ultimo.metadata ?? {}), recontacto_estado: "en_curso" } };

    try {
      const area = c.area as Area;
      const { data: agente } = await s.from("ai_agents").select("*").eq("area", area).maybeSingle();
      const listo = await agentReadiness(area);
      if (!agente || !(agente as any).active || !listo.ready) {
        await marcar(s, reservado, "descartado", "agente apagado o sin identidad");
        r.descartados++;
        continue;
      }
      const profile = await getProfile(profileIdForArea(area)!);
      const identidad = { presentationName: profile?.agent_presentation_name?.trim() ?? "", brandName: profile?.brand_name?.trim() ?? "" };
      const contacto = c.contacts ?? {};
      // 24/10: mismo modo y rol que el agente en vivo (campaña o escribió por su cuenta).
      const { data: ultimaCampana } = await s
        .from("campaign_contacts")
        .select("campaign_id, campaigns(name, agent_role_id)")
        .eq("contact_id", c.contact_id)
        .order("sent_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      const campNombre = (ultimaCampana as any)?.campaigns?.name ?? null;
      const modo = modoDelContacto({ importedBaseId: contacto.imported_base_id ?? null, campaignName: campNombre, campaignId: (ultimaCampana as any)?.campaign_id ?? null });
      let system = buildSystemPrompt(
        agente as any,
        { area, fullName: contacto.full_name ?? null, dniCuil: contacto.dni_cuil ?? null, qualificationData: contacto.qualification_data ?? {}, campaignName: null, isFirstReplyToCampaign: false, modo },
        identidad
      );
      const crit = criterioDelRubro(area, contacto.rubro_id ?? null, modo);
      if (crit) system = `${system}\n\n${crit}`;
      const rol = await instruccionesDeRol(contacto, { rolId: (ultimaCampana as any)?.campaigns?.agent_role_id ?? null, campana: campNombre });
      if (rol) system = `${system}\n\n${rol}`;
      system = `${system}\n\n${GUIA_CAPTACION_Y_CIERRE}`;

      const contents = historial([...lista].reverse());
      const horas = (ahora.getTime() - new Date(ultimo.created_at).getTime()) / 3_600_000;
      contents.push({ role: "user", parts: [{ text: instruccionRecontacto(plan.paso, horas) }] });
      const resp = await gemini().models.generateContent({
        model: identificadorModelo(),
        contents,
        config: { systemInstruction: system, responseMimeType: "application/json" },
      });
      const crudo = (resp.candidates?.[0]?.content?.parts ?? []).map((p: any) => (typeof p.text === "string" ? p.text : "")).join("");
      const decision = leerDecision(crudo);
      if (!decision) {
        await marcar(s, reservado, "error", "respuesta del modelo ilegible");
        r.errores++;
        continue;
      }
      if (!decision.escribir) {
        await marcar(s, reservado, "descartado", decision.motivo || "sin interés");
        r.descartados++;
        r.detalle.push({ conversacion: c.id, perfil, accion: "descartado", paso: plan.paso, motivo: decision.motivo });
        continue;
      }
      if (!validarTextoSalida(decision.texto).ok) {
        await marcar(s, reservado, "descartado", "el texto no pasó el validador");
        r.descartados++;
        continue;
      }
      // Si la persona escribió mientras tanto, no sale (le responde el agente).
      const { data: nuevo } = await s.from("messages").select("id").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if ((nuevo as any)?.id !== ultimo.id) {
        await marcar(s, reservado, "cancelado", "la persona volvió a escribir");
        continue;
      }
      const enviado = await sendOutboundMessage({ conversationId: c.id, senderType: "agente_ia", body: decision.texto, origin: "recuperacion" });
      if (enviado.messageId) {
        await (s.from("messages") as any).update({ metadata: { recontacto: plan.paso, recontacto_motivo: decision.motivo || null } }).eq("id", enviado.messageId);
      }
      await marcar(s, reservado, "hecho", `recontacto ${plan.paso}`);
      r.enviados++;
      r.detalle.push({ conversacion: c.id, perfil, accion: "enviado", paso: plan.paso });
    } catch (err: any) {
      const bloqueado = err instanceof AutomaticSendBlockedError;
      await marcar(s, reservado, bloqueado ? "bloqueado" : "error", String(err?.message ?? err).slice(0, 200));
      if (bloqueado) r.descartados++;
      else r.errores++;
      console.error(`[recontacto] ${c.id}:`, err?.message ?? err);
    }
  }
  return r;
}
