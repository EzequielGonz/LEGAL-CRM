import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOutboundMessage } from "@/lib/messaging";
import { getAvailableSlots, createAppointment } from "@/lib/agenda";
import { notifyAdminOfClosedAppointment, notifyAdminOfQualifiedIntake } from "@/lib/notify";
import { notifyMarketingHandoff } from "@/lib/notify-marketing";
import { toolsForArea } from "./tools";
import {
  buildMarketingBrief,
  ensureLead,
  getLeadByContact,
  logMarketingEvent,
  setMarketingOutcome,
  sourceDetailFor,
  type MarketingOutcome,
} from "@/lib/marketing/leads";
import { analyzeLead } from "@/lib/marketing/analysis";
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
    area: Area;
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
      ? contactContext.area === "civil" || contactContext.area === "marketing"
        ? // Civil (accidentes laborales) y Marketing (venta consultiva): el guión de apertura y de
          // preguntas vive completo en el prompt del agente (panel Agentes IA).
          // Acá NO se fuerza la vieja pregunta de "¿sigue vigente o ya lo
          // resolviste?", porque ahora la charla es más natural y no hay botones.
          "Este prospecto viene de una campaña: el mensaje inicial ya se lo mandamos nosotros en tu nombre y ahora te está respondiendo por primera vez. Seguí desde ahí, de forma natural, según el guión de tu rol."
        : "Este prospecto viene de una campaña (le escribiste vos primero con un mensaje inicial y ahora te está respondiendo por primera vez). Antes de seguir calificando, arrancá preguntando si su situación sigue vigente o si ya la resolvió — si ya la resolvió, agradecé y cerrá la conversación amablemente sin insistir."
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
    area,
    fullName: contact.full_name,
    dniCuil: contact.dni_cuil,
    qualificationData: contact.qualification_data ?? {},
    campaignName,
    isFirstReplyToCampaign,
  });
  // Marketing: se suma lo que el sistema sabe del negocio (análisis) y cómo registrar el resultado.
  const marketingBrief = area === "marketing" ? await buildMarketingBrief(contact.id) : "";
  const systemWithBrief = marketingBrief ? `${system}\n\n${marketingBrief}` : system;
  const tools = toolsForArea(area);
  let escalated = false;
  let finalText = "";

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await gemini().models.generateContent({
            model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
      contents: messages,
      config: {
        systemInstruction: systemWithBrief,
        tools: [{ functionDeclarations: tools }],
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

      // Solo Marketing: aviso inmediato por WhatsApp al equipo humano.
      if (ctx.area === "marketing") {
        try {
          await notifyMarketingHandoff(ctx.contact.id, String(input.motivo ?? ""));
        } catch (err) {
          console.error("No se pudo avisar al equipo del lead de Marketing:", err);
        }
        const lead = await getLeadByContact(ctx.contact.id);
        await logMarketingEvent({
          leadId: lead?.id ?? null,
          contactId: ctx.contact.id,
          type: "escalado_a_humano",
          detail: { motivo: String(input.motivo ?? "") },
        });
      }

      return { output: { ok: true }, escalated: true };
    }

    case "finalizar_consulta": {
      // Solo para la campaña de accidentes laborales (área Civil). Reproduce
      // los mismos estados finales que tenía el cuestionario fijo anterior
      // (intake-flow.ts), para que /derivar, Casos cerrados y los avisos al
      // administrador sigan funcionando igual.
      if (ctx.area !== "civil") {
        return { output: { error: "Esta herramienta solo está disponible en el área Civil." } };
      }

      const resultado = String(input.resultado ?? "");

      if (resultado === "completado") {
        const disponibilidad = String(input.disponibilidad_para_reunion ?? "").trim();
        if (!disponibilidad) {
          return {
            output: {
              error:
                "Falta disponibilidad_para_reunion: preguntale cuándo le queda cómodo que la contacten y volvé a llamar esta herramienta.",
            },
          };
        }

        const merged = {
          ...(ctx.contact.qualification_data ?? {}),
          disponibilidad_para_reunion: disponibilidad,
        };
        await supabase.from("contacts").update({ qualification_data: merged }).eq("id", ctx.contact.id);
        ctx.contact.qualification_data = merged;

        await supabase
          .from("conversations")
          .update({ intake_step: "completado", status: "requiere_atencion_humana", ai_enabled: false })
          .eq("id", ctx.conversationId);
        await supabase.from("contacts").update({ status: "cerrado_ganado" }).eq("id", ctx.contact.id);

        try {
          await notifyAdminOfQualifiedIntake(ctx.contact.id);
        } catch (err) {
          console.error("No se pudo notificar al administrador del caso calificado:", err);
        }

        return { output: { ok: true }, escalated: true };
      }

      if (resultado === "caso_resuelto" || resultado === "no_interesado") {
        await supabase
          .from("conversations")
          .update({ intake_step: "resuelto", status: "cerrado_perdido", ai_enabled: false })
          .eq("id", ctx.conversationId);
        await supabase.from("contacts").update({ status: "no_califica" }).eq("id", ctx.contact.id);
        return { output: { ok: true }, escalated: true };
      }

      return { output: { error: `resultado inválido: ${resultado}` } };
    }

    case "registrar_resultado_marketing": {
      if (ctx.area !== "marketing") {
        return { output: { error: "Esta herramienta solo está disponible en Marketing." } };
      }
      const resultado = String(input.resultado ?? "") as MarketingOutcome;
      if (!["aprobado", "en_duda", "no_interesado"].includes(resultado)) {
        return { output: { error: `resultado inválido: ${resultado}` } };
      }
      const motivo = String(input.motivo ?? "").trim() || "(sin detalle)";

      await setMarketingOutcome({
        contactId: ctx.contact.id,
        conversationId: ctx.conversationId,
        resultado,
        motivo,
      });

      if (resultado === "aprobado") {
        try {
          await notifyMarketingHandoff(ctx.contact.id, motivo, "cierre");
        } catch (err) {
          console.error("No se pudo avisar al equipo del cierre de Marketing:", err);
        }
        return {
          output: {
            ok: true,
            instruccion:
              "Avisale al prospecto, con calidez, que queda aprobado y que lo derivás al equipo técnico para empezar a trabajar en el proyecto. Despedite breve.",
          },
          escalated: true,
        };
      }
      if (resultado === "no_interesado") {
        return {
          output: { ok: true, instruccion: "Agradecé y despedite con respeto, sin insistir." },
          escalated: true,
        };
      }
      return {
        output: {
          ok: true,
          instruccion:
            "Decile con naturalidad que quedás atento y que le escribimos en unos días para retomar. No presiones.",
        },
      };
    }

    case "analizar_negocio": {
      if (ctx.area !== "marketing") {
        return { output: { error: "Esta herramienta solo está disponible en Marketing." } };
      }
      const sitioWeb = typeof input.sitio_web === "string" ? input.sitio_web.trim() : "";
      const nombreYZona = typeof input.nombre_y_zona === "string" ? input.nombre_y_zona.trim() : "";
      if (!sitioWeb && !nombreYZona) {
        return { output: { error: "Necesito el sitio web o el nombre y la zona del negocio." } };
      }

      const { lead } = await ensureLead({
        contactId: ctx.contact.id,
        sourceKind: "directa",
        sourceDetail: sourceDetailFor(ctx.contact.source),
      });

      const analyzed: any = await analyzeLead(lead.id, {
        force: true,
        websiteOverride: sitioWeb || null,
        mapsQuery: nombreYZona || null,
      });
      if (!analyzed || analyzed.analysis_status === "omitido") {
        return {
          output: {
            error:
              "No pude obtener datos de ese negocio. Pedile al prospecto su sitio web o el nombre exacto y la zona, o seguí la charla con lo que él te cuente.",
          },
        };
      }

      const a = analyzed.analysis ?? {};
      return {
        output: {
          puntaje_oportunidad: analyzed.lead_score,
          prioridad: analyzed.priority,
          resumen: analyzed.summary,
          hallazgos: (a.hallazgos ?? []).slice(0, 8).map((h: any) => ({
            problema: h.problema,
            impacto: h.impacto,
            mejora: h.mejora,
          })),
          servicios_sugeridos: a.servicios_sugeridos ?? [],
          nota: "Presentá solo estos hallazgos, con transparencia sobre de dónde salen. No inventes otros.",
        },
      };
    }

    default:
      return { output: { error: `Herramienta desconocida: ${name}` } };
  }
}
