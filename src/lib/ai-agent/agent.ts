import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOutboundMessage } from "@/lib/messaging";
import { getAvailableSlots, createAppointment } from "@/lib/agenda";
import { notifyAdminOfClosedAppointment } from "@/lib/notify";
import { AGENT_TOOLS } from "./tools";
import type { Area } from "@/lib/supabase/database.types";

const MAX_TOOL_ITERATIONS = 6;
const HISTORY_LIMIT = 30;

// Agente IA basado en Google Gemini (antes usaba la API de Anthropic/Claude;
// se migró por un problema de facturación con la tarjeta en Anthropic
// Console — Gemini tiene un nivel gratuito para arrancar sin cargar tarjeta).
let _client: GoogleGenAI | null = null;
function gemini() {
  if (!_client) _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _client;
}

function buildSystemPrompt(
  agent: {
    system_prompt: string;
    qualification_criteria: string[];
    required_fields: string[];
  },
  contactContext: {
    fullName: string | null;
    dniCuil: string | null;
    qualificationData: Record<string, unknown>;
    campaignName: string | null;
    isFirstReplyToCampaign: boolean;
  }
) {
  const knownFacts: string[] = [];
  if (contactContext.fullName) knownFacts.push(`- Nombre: ${contactContext.fullName}`);
  if (contactContext.dniCuil) knownFacts.push(`- DNI/CUIL: ${contactContext.dniCuil}`);
  for (const [key, value] of Object.entries(contactContext.qualificationData)) {
    if (value) knownFacts.push(`- ${key.replaceAll("_", " ")}: ${value}`);
  }
  if (contactContext.campaignName) {
    knownFacts.push(`- Viene de la campaña: "${contactContext.campaignName}"`);
  }

  return [
    agent.system_prompt,
    "",
    "Criterios de calificación comercial (evaluá contra esto con la herramienta evaluar_calificacion):",
    ...agent.qualification_criteria.map((c) => `- ${c}`),
    "",
    "Datos que tenés que recolectar (usá guardar_datos_calificacion a medida que los obtengas):",
    ...agent.required_fields.map((f) => `- ${f}`),
    "",
    knownFacts.length > 0
      ? [
          "Datos que YA tenés de este prospecto (no se los vuelvas a preguntar, dalos por sabidos):",
          ...knownFacts,
        ].join("\n")
      : "Todavía no hay datos previos cargados de este prospecto.",
    "",
    contactContext.isFirstReplyToCampaign
      ? "Este prospecto viene de una campaña (le escribiste vos primero con un mensaje inicial y ahora te está respondiendo por primera vez). Antes de seguir calificando, arrancá preguntando si su situación sigue vigente o si ya la resolvió — si ya la resolvió, agradecé y cerrá la conversación amablemente sin insistir."
      : "",
    "Reglas estrictas:",
    "- NUNCA inventes información, plazos, montos ni asesoramiento legal específico.",
    "- NUNCA te presentes como abogado/a: sos un asistente que organiza la consulta.",
    "- Si piden hablar con una persona, o la situación lo amerita, usá escalar_a_humano.",
    "- Antes de ofrecer un turno, usá consultar_disponibilidad para ver horarios reales.",
    "- Para confirmar un turno, usá agendar_cita con el horario exacto elegido.",
    "- Respondé en español rioplatense, de forma breve, clara y empática.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Convierte el historial de `messages` al formato de contenidos de Gemini
 *  (`role: "user" | "model"`, cada uno con `parts`), fusionando mensajes
 *  consecutivos del mismo rol. */
function buildHistory(rows: { direction: string; body: string | null }[]): Content[] {
  const history: Content[] = [];

  for (const row of rows) {
    if (!row.body) continue;
    const role: "user" | "model" = row.direction === "entrante" ? "user" : "model";
    const last = history[history.length - 1];
    const lastPart = last?.parts?.length === 1 ? last.parts[0] : undefined;
    if (last && last.role === role && lastPart && typeof lastPart.text === "string") {
      lastPart.text += `\n${row.body}`;
    } else {
      history.push({ role, parts: [{ text: row.body }] });
    }
  }

  return history;
}

/**
 * Corre un turno completo del agente IA para una conversación: arma el
 * contexto, deja que el modelo use herramientas (guardar datos, consultar
 * agenda, agendar, escalar) y finalmente envía la respuesta de texto al
 * prospecto por el canal correspondiente.
 */
export async function runAgentTurn(conversationId: string) {
  const supabase = createAdminClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, contacts(*)")
    .eq("id", conversationId)
    .single();

  if (!conversation || !conversation.ai_enabled) return;

  const area: Area = conversation.area;
  const contact = (conversation as any).contacts;

  const { data: agentConfig } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("area", area)
    .single();

  if (!agentConfig || !agentConfig.active) return;

  const { data: messageRows } = await supabase
    .from("messages")
    .select("direction, body")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT);

  const messages = buildHistory(messageRows ?? []);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    // No hay nada nuevo del prospecto para responder.
    return;
  }

  // ¿Viene de una campaña? Se busca en campaign_contacts por contact_id (no
  // por contacts.campaign_id, que solo queda seteado en el flujo viejo de
  // importación directa a una campaña) la más reciente en la que participó.
  // Si su estado todavía es "esperando respuesta" (lo dejamos así al mandar
  // la plantilla), esta es su primera respuesta.
  const { data: latestCampaignContact } = await supabase
    .from("campaign_contacts")
    .select("campaigns(name)")
    .eq("contact_id", contact.id)
    .order("sent_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const campaignName = (latestCampaignContact as any)?.campaigns?.name ?? null;
  const isFirstReplyToCampaign =
    !!campaignName && contact.status === "esperando_respuesta_prospecto";

  // Sacamos al contacto de "esperando respuesta" apenas responde: si no,
  // un segundo mensaje suyo antes de que la IA llegue a calificarlo dispara
  // de nuevo la pregunta de "¿segue vigente tu consulta?" en cada turno.
  if (contact.status === "esperando_respuesta_prospecto") {
    await supabase.from("contacts").update({ status: "en_conversacion" }).eq("id", contact.id);
  }

  const system = buildSystemPrompt(agentConfig as any, {
    fullName: contact.full_name,
    dniCuil: contact.dni_cuil,
    qualificationData: contact.qualification_data ?? {},
    campaignName,
    isFirstReplyToCampaign,
  });
  let escalated = false;
  let finalText = "";

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await gemini().models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: system,
        tools: [{ functionDeclarations: AGENT_TOOLS }],
      },
    });

    const candidateParts: Part[] = response.candidates?.[0]?.content?.parts ?? [];
    const textParts = candidateParts.filter((p) => typeof p.text === "string");
    finalText = textParts.map((p) => p.text).join("\n").trim();

    const functionCallParts = candidateParts.filter((p) => !!p.functionCall);
    if (functionCallParts.length === 0) break;

    // Guardamos el turno del modelo tal cual vino (texto + llamadas a
    // función) para mantener el historial consistente en la próxima vuelta.
    messages.push({ role: "model", parts: candidateParts });

    const responseParts: Part[] = [];
    for (const part of functionCallParts) {
      const call = part.functionCall!;
      const result = await executeTool(call.name ?? "", call.args ?? {}, {
        area,
        contact,
        conversationId,
      });
      responseParts.push({
        functionResponse: {
          name: call.name,
          response: result.output as Record<string, unknown>,
        },
      });
      if (result.escalated) escalated = true;
    }

    messages.push({ role: "user", parts: responseParts });

    // No cortamos el loop apenas se escala: dejamos que el modelo haga una
    // última pasada (sin más llamadas a función, ya que ai_enabled quedó en
    // false) para que le confirme al prospecto que lo va a contactar una
    // persona. El tope de MAX_TOOL_ITERATIONS sigue protegiendo contra loops
    // largos.
    if (escalated && i === MAX_TOOL_ITERATIONS - 1) break;
  }

  if (finalText) {
    await sendOutboundMessage({ conversationId, senderType: "agente_ia", body: finalText });
  }
}

async function executeTool(
  name: string,
  input: Record<string, any>,
  ctx: { area: Area; contact: any; conversationId: string }
): Promise<{ output: unknown; escalated?: boolean }> {
  const supabase = createAdminClient();

  switch (name) {
    case "guardar_datos_calificacion": {
      const merged = { ...(ctx.contact.qualification_data ?? {}), ...input.datos };
      await supabase.from("contacts").update({ qualification_data: merged }).eq("id", ctx.contact.id);
      ctx.contact.qualification_data = merged;
      return { output: { ok: true } };
    }

    case "evaluar_calificacion": {
      await supabase
        .from("contacts")
        .update({
          meets_criteria: input.cumple_criterios,
          status: input.cumple_criterios ? "calificado" : "no_califica",
          notes: input.justificacion,
        })
        .eq("id", ctx.contact.id);
      return { output: { ok: true } };
    }

    case "consultar_disponibilidad": {
      const slots = await getAvailableSlots(ctx.area, { limit: 8 });
      return {
        output: {
          slots: slots.map((s) => ({
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            etiqueta: new Date(s.starts_at).toLocaleString("es-AR", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        },
      };
    }

    case "agendar_cita": {
      const appointment = await createAppointment({
        contactId: ctx.contact.id,
        conversationId: ctx.conversationId,
        area: ctx.area,
        startsAt: input.starts_at,
        endsAt: input.ends_at,
      });

      await supabase
        .from("conversations")
        .update({ status: "agendado" })
        .eq("id", ctx.conversationId);

      try {
        await notifyAdminOfClosedAppointment(appointment.id);
      } catch (err) {
        console.error("No se pudo notificar al administrador:", err);
      }

      return { output: { ok: true, appointment_id: appointment.id } };
    }

    case "escalar_a_humano": {
      await supabase
        .from("conversations")
        .update({ ai_enabled: false, status: "requiere_atencion_humana" })
        .eq("id", ctx.conversationId);
      await supabase
        .from("contacts")
        .update({
          notes: ctx.contact.notes
            ? `${ctx.contact.notes}\n\n[Escalado] ${input.motivo}`
            : `[Escalado] ${input.motivo}`,
        })
        .eq("id", ctx.contact.id);
      return { output: { ok: true }, escalated: true };
    }

    default:
      return { output: { error: `Herramienta desconocida: ${name}` } };
  }
}
