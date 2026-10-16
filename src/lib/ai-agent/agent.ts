import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";
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
import { analyzeLead, type GeneradorTexto } from "@/lib/marketing/analysis";
import { aprobarPresupuesto, briefVenta, marcarAceptacion, pedirPresupuesto, registrarVenta } from "@/lib/marketing/presupuestos";
import { esAceptacion } from "@/lib/marketing/venta";
import { getAutomationPause } from "@/lib/automation-pause";
import { agentReadiness, getProfile, profileIdForArea } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";
import { ensureOpportunity } from "@/lib/opportunities";
import {
  elegirRutaJuridica,
  registrarCaptacion,
  registrarDetencion,
  registrarZona,
  rubroSlugDe,
  solicitarAtencion,
} from "@/lib/captacion";
import { clasificarAtencion, CRITERIO_POR_RUBRO, type MotivoAtencion } from "@/lib/captacion/reglas";
import { crearCitaIa } from "@/lib/citas";
import type { DetentionMotive } from "@/lib/detention";
import { instruccionReparacion, validarTextoSalida } from "@/lib/agentes/contrato";
import { armarContexto, armarResumen } from "@/lib/agentes/contexto";
import { asignacionActiva } from "@/lib/agentes/servicio";
import { generadorVertex, identificadorModelo } from "@/lib/agentes/modelo";
import { candidatoParaOportunidad, configuracionGanadora, experimentoEnCurso, registrarIncidente, registrarTurno, type CandidatoTurno } from "@/lib/experimento/servicio";

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

/**
 * Modelo del agente, separado de las decisiones para poder probar el flujo
 * completo sin llamar a la IA real. Por defecto, Gemini.
 */
export type ModeloAgente = (req: {
  contents: Content[];
  systemInstruction: string;
  tools: unknown[];
  /** Modelo pedido para este turno (comparación de agentes); sin dato, el vigente. */
  modelo?: string;
}) => Promise<{ parts: Part[]; tokensEntrada?: number; tokensSalida?: number; tokensRazonamiento?: number; modeloRespuesta?: string | null }>;

const modeloGemini: ModeloAgente = async ({ contents, systemInstruction, tools, modelo }) => {
  const response = await gemini().models.generateContent({
    model: modelo || identificadorModelo(),
    contents,
    config: { systemInstruction, tools: [{ functionDeclarations: tools as any }] },
  });
  const u: any = (response as any).usageMetadata ?? {};
  return {
    parts: response.candidates?.[0]?.content?.parts ?? [],
    tokensEntrada: u.promptTokenCount ?? 0,
    tokensSalida: u.candidatesTokenCount ?? 0,
    tokensRazonamiento: u.thoughtsTokenCount ?? 0,
    modeloRespuesta: (response as any).modelVersion ?? null,
  };
};

/** Modelo del candidato de la comparación (Gemini con otro identificador o Vertex). */
function modeloDeCandidato(c: CandidatoTurno["candidato"]): ModeloAgente {
  if (c.proveedor === "vertex") {
    const gen = generadorVertex(c.modelo ?? "");
    return async (req) => {
      const r = await gen({ contents: req.contents, systemInstruction: req.systemInstruction, tools: req.tools });
      return { parts: r.parts as Part[], tokensEntrada: r.tokensEntrada, tokensSalida: r.tokensSalida, modeloRespuesta: c.modelo };
    };
  }
  return (req) => modeloGemini({ ...req, modelo: c.modelo ?? undefined });
}

/** Texto simple con el modelo del candidato (síntesis del análisis de Marketing). */
function generadorTextoDe(c: CandidatoTurno["candidato"], acum?: { entrada: number; salida: number; modelo: string | null }): GeneradorTexto {
  const m = modeloDeCandidato(c);
  return async (prompt) => {
    const r = await m({ contents: [{ role: "user", parts: [{ text: prompt }] }], systemInstruction: "Respondé solo el JSON pedido.", tools: [] });
    if (acum) {
      acum.entrada += r.tokensEntrada ?? 0;
      acum.salida += (r.tokensSalida ?? 0) + (r.tokensRazonamiento ?? 0);
      acum.modelo = r.modeloRespuesta ?? acum.modelo;
    }
    return (r.parts ?? []).map((p) => p.text ?? "").join("");
  };
}

let _modelo: ModeloAgente = modeloGemini;
/** Solo pruebas: reemplaza el modelo (null vuelve a Gemini). */
export function usarModeloAgente(modelo: ModeloAgente | null) {
  _modelo = modelo ?? modeloGemini;
}

/** Criterio de captación y límites del rubro, desde la configuración (no del prompt editable). */
function criterioDelRubro(area: Area, rubroId: string | null): string {
  let slug;
  try {
    slug = rubroSlugDe({ rubro_id: rubroId, area });
  } catch {
    return "";
  }
  const c = CRITERIO_POR_RUBRO[slug];
  return [
    "Captación (regla del sistema):",
    `- Hay captación solo con: ${c.aceptacion}. Cuando la persona lo acepte, usá la herramienta captar con la evidencia (lo que dijo).`,
    "- Agendar no es captar. Compartir datos no es derivar. Derivar lo hace una persona.",
    `- Datos deseables (si faltan no impiden captar): ${c.deseables.join(", ")}.`,
    c.zonaAplica ? "- La ubicación se registra con registrar_ubicacion (AMBA, fuera de AMBA o sin confirmar). Nunca supongas AMBA." : "",
    `- Nunca prometas ni informes: ${c.limites.join(", ")}.`,
    "- Si la persona rechaza el contacto, se enoja, es un número equivocado, ya resolvió su caso o ya tiene abogado: usá detener_contacto y respondé solo una disculpa breve.",
    "- Si pide una persona, pregunta algo fuera de tu alcance o comparte datos sensibles: usá escalar_a_humano con la categoría que corresponda.",
  ]
    .filter(Boolean)
    .join("\n");
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
  },
  identity: { presentationName: string; brandName: string }
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
    // Identidad cargada a mano en el perfil (bloque 1.4): no sale del código.
    `Te presentás como ${identity.presentationName}, de ${identity.brandName}. No uses otro nombre ni otra marca, no inventes una persona real, matrícula ni disponibilidad humana, y si te preguntan si sos una automatización respondé con la verdad.`,
    "",
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
  return runAgentTurnCon(conversationId, _modelo);
}

async function runAgentTurnCon(conversationId: string, modeloBase: ModeloAgente, forzarActual = false): Promise<void> {
  // Pausa general de respuestas de la IA (Configuración → Pausa general).
  // Mientras está activa, los mensajes quedan para atención manual.
  if ((await getAutomationPause()).aiRepliesPaused) return;

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

  // Sin nombre de presentación o marca cargados en el perfil, el agente no responde.
  const readiness = await agentReadiness(area);
  if (!readiness.ready) {
    console.warn(`[agente] No responde en ${area}: falta configurar ${readiness.missing.join(", ")}`);
    return;
  }
  const profile = await getProfile(profileIdForArea(area)!);
  const identity = {
    presentationName: profile?.agent_presentation_name?.trim() ?? "",
    brandName: profile?.brand_name?.trim() ?? "",
  };

  const { data: messageRows } = await supabase
    .from("messages")
    .select("direction, body")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  // Se piden los ÚLTIMOS mensajes (antes se tomaban los primeros 30 y en
  // charlas largas el agente no veía lo más reciente) y se ordenan.
  const ordenados = [...(messageRows ?? [])].reverse();

  const messages = buildHistory(ordenados);
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

  // Oportunidad (antes de armar el contexto: decide el candidato de la comparación).
  let opportunityId: string | null = null;
  try {
    opportunityId = (await ensureOpportunity({ contactId: contact.id, conversationId })).id;
  } catch (err) {
    console.error("[agente] No se pudo leer la oportunidad:", err);
  }
  // Comparación de agentes: candidato fijo de esta oportunidad. Sin
  // experimento en curso responde exactamente como hoy.
  let cand: CandidatoTurno | null = null;
  if (opportunityId) {
    try {
      cand = await candidatoParaOportunidad(opportunityId);
      if (cand && forzarActual && cand.letra !== "A") {
        // Reemplazo por falla del candidato: responde A (bot actual) en este turno.
        const enCurso = await experimentoEnCurso();
        const a = enCurso?.candidatos.find((c) => c.letra === "A" && c.estado === "listo");
        cand = a ? { ...cand, letra: "A", reemplazo: true, candidato: a } : null;
      }
    } catch (err) {
      console.error("[agente] No se pudo resolver el candidato de la comparación:", err);
    }
  }
  // Sin experimento: si ya se aplicó un ganador, responde con su configuración.
  let config: CandidatoTurno["candidato"] | null = cand?.candidato ?? null;
  if (!cand) {
    try {
      const g = await configuracionGanadora();
      if (g) config = { ...g, estado: "listo" } as unknown as CandidatoTurno["candidato"];
    } catch {
      config = null;
    }
  }
  // En pruebas (modelo inyectado) se respeta el modelo inyectado.
  const modelo: ModeloAgente = config && modeloBase === modeloGemini ? modeloDeCandidato(config) : modeloBase;
  const modeloPedido = config?.modelo ?? identificadorModelo();

  const system = buildSystemPrompt(agentConfig as any, {
    area,
    fullName: contact.full_name,
    dniCuil: contact.dni_cuil,
    qualificationData: contact.qualification_data ?? {},
    campaignName,
    isFirstReplyToCampaign,
  }, identity);
  // Marketing (16/10): si la persona acepta escuchar la propuesta, recién ahí
  // se hace el análisis profundo con fuentes reales (con el modelo del
  // candidato durante la comparación). Se espera hasta ~20 s; si tarda más,
  // sigue desde el latido y el agente pregunta mientras tanto.
  if (area === "marketing") {
    try {
      const ultimoTexto = ordenados.filter((m: any) => m.direction === "entrante").slice(-1)[0]?.body ?? "";
      if (esAceptacion(ultimoTexto) && (await marcarAceptacion(contact.id))) {
        const lead = await getLeadByContact(contact.id);
        if (lead) {
          const acum = { entrada: 0, salida: 0, modelo: null as string | null };
          const generar: GeneradorTexto | null = config ? generadorTextoDe(config, acum) : null;
          const t0a = Date.now();
          await Promise.race([
            analyzeLead(lead.id, { investigar: true, generar, modeloSintesis: config?.modelo ?? null }),
            new Promise((r) => setTimeout(r, 20_000)),
          ]);
          if (cand && acum.entrada + acum.salida > 0) {
            await registrarTurno({
              experimentId: cand.experimentId, candidato: cand.letra, precio: config, opportunityId, conversationId, rubroId: contact.rubro_id ?? null,
              proveedor: config?.proveedor ?? "gemini_api", modeloPedido: config?.modelo ?? identificadorModelo(), modeloRespuesta: acum.modelo,
              llamadas: 1, tokensEntrada: acum.entrada, tokensSalida: acum.salida, tokensRazonamiento: 0, latenciaMs: Date.now() - t0a,
              herramientas: [], resultado: "enviado", uso: "analisis",
            });
          }
        }
      }
    } catch (err) {
      console.error("[agente] No se pudo iniciar el análisis al aceptar:", err);
    }
  }
  // Marketing: se suma lo que el sistema sabe del negocio (análisis), la guía de venta y cómo registrar el resultado.
  const marketingBrief =
    area === "marketing" ? [await buildMarketingBrief(contact.id), await briefVenta(contact.id).catch(() => "")].filter(Boolean).join("\n\n") : "";
  const criterio = criterioDelRubro(area, contact.rubro_id ?? null);
  const withCriterio = criterio ? `${system}\n\n${criterio}` : system;
  let systemWithBrief = marketingBrief ? `${withCriterio}\n\n${marketingBrief}` : withCriterio;
  // Etapa 3: si hay una asignación ACTIVA de la biblioteca para esta área, el
  // contexto sale de los módulos versionados (principal + derivado). Sin
  // asignación activa, responde exactamente como hoy.
  try {
    // Candidato «actual» (A): el prompt de hoy aunque haya asignación de biblioteca.
    // Candidato «biblioteca» (B y C): manual + módulos aunque no haya asignación activa.
    const asignacionLeida = config?.contexto === "actual" ? null : await asignacionActiva(area);
    const claveBiblioteca = asignacionLeida?.agente_clave ?? (config?.contexto === "biblioteca" ? rubroSlugDe({ rubro_id: contact.rubro_id ?? null, area }) : null);
    const asignacion = claveBiblioteca ? { agente_clave: claveBiblioteca } : null;
    if (asignacion) {
      const { data: ag } = await supabase.from("agent_library").select("instrucciones, limites").eq("clave", asignacion.agente_clave).maybeSingle();
      const { data: principal } = await supabase.from("agent_library").select("instrucciones").eq("clave", "principal").maybeSingle();
      const ultimo = ordenados.filter((m: any) => m.direction === "entrante").slice(-1)[0]?.body ?? "";
      const slug = rubroSlugDe({ rubro_id: contact.rubro_id ?? null, area });
      const ctx = armarContexto({
        rubro: slug,
        modo: isFirstReplyToCampaign ? "frio" : "consulta_actual",
        identidad: identity,
        instruccionesAgente: [principal?.instrucciones ?? "", ag?.instrucciones ?? ""].filter(Boolean).join("\n\n"),
        limites: (ag?.limites as string[]) ?? [],
        resumen: armarResumen({ rubro: slug, qualificationData: contact.qualification_data ?? {} }),
        ultimoMensaje: ultimo,
        primerTurno: isFirstReplyToCampaign,
      });
      systemWithBrief = marketingBrief ? `${ctx.systemInstruction}\n\n${marketingBrief}` : ctx.systemInstruction;
    }
  } catch (err) {
    console.error("[agente] No se pudo leer la asignación de la biblioteca; se usa la configuración actual:", err);
  }
  const tools = toolsForArea(area);
  let escalated = false;
  let finalText = "";
  // Registro del turno (costo, demora, modelo informado y resultado).
  const t0 = Date.now();
  const uso = { llamadas: 0, entrada: 0, salida: 0, razonamiento: 0, modeloRespuesta: null as string | null, herramientas: [] as string[] };
  const llamarModelo: ModeloAgente = async (req) => {
    const r = await modelo(req);
    uso.llamadas++;
    uso.entrada += r.tokensEntrada ?? 0;
    uso.salida += r.tokensSalida ?? 0;
    uso.razonamiento += r.tokensRazonamiento ?? 0;
    uso.modeloRespuesta = r.modeloRespuesta ?? uso.modeloRespuesta;
    return r;
  };
  const registrar = (resultado: "enviado" | "retenido" | "sin_texto" | "bloqueado" | "error", extra: { motivos?: string[]; error?: string } = {}) =>
    registrarTurno({
      experimentId: cand?.experimentId ?? null,
      candidato: cand?.letra ?? null,
      precio: config,
      opportunityId,
      conversationId,
      rubroId: contact.rubro_id ?? null,
      proveedor: config?.proveedor ?? "gemini_api",
      modeloPedido,
      modeloRespuesta: uso.modeloRespuesta,
      llamadas: uso.llamadas,
      tokensEntrada: uso.entrada,
      tokensSalida: uso.salida,
      tokensRazonamiento: uso.razonamiento,
      latenciaMs: Date.now() - t0,
      herramientas: uso.herramientas,
      resultado,
      ...extra,
    });
  // Contexto de las herramientas. Si la IA deriva a una persona, la
  // herramienta deja acá el permiso de un solo uso para el acuse final.
  const toolCtx: ToolContext = { area, contact, conversationId, finalAckToken: null, opportunityId, pendingDetention: null };

  let retenido: string[] | null = null;
  try {
  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await llamarModelo({ contents: messages, systemInstruction: systemWithBrief, tools });

    const candidateParts: Part[] = response.parts ?? [];
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
      uso.herramientas.push(call.name ?? "");
      const result = await executeTool(call.name ?? "", call.args ?? {}, toolCtx);
      responseParts.push({
        functionResponse: {
          // Gemini 3.x: la respuesta referencia la llamada por id y nombre.
          ...(call.id ? { id: call.id } : {}),
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

  // Etapa 3 (R07): validación determinista del texto antes de enviar. Si no
  // pasa, se pide UNA reparación; si vuelve a fallar, se retiene y va a una persona.
  if (finalText) {
    let v = validarTextoSalida(finalText);
    if (!v.ok) {
      try {
        messages.push({ role: "user", parts: [{ text: instruccionReparacion(v) }] });
        const r2 = await llamarModelo({ contents: messages, systemInstruction: systemWithBrief, tools });
        const t2 = (r2.parts ?? []).filter((p) => typeof p.text === "string").map((p) => p.text).join("\n").trim();
        const v2 = validarTextoSalida(t2);
        if (v2.ok && t2) finalText = t2;
        else v = v2;
      } catch (err) {
        console.error("[agente] No se pudo reparar la respuesta:", err);
      }
      if (!validarTextoSalida(finalText).ok) {
        console.warn(`[agente] Respuesta retenida en ${conversationId}: ${v.motivos.join(", ")}`);
        await atencionDelAgente(toolCtx, "consulta_fuera_alcance", `Respuesta retenida por el validador: ${v.motivos.join(", ")}`);
        finalText = "";
        retenido = v.motivos;
      }
    }
  }
  } catch (err: any) {
    // Falla del modelo: se registra; si es un candidato de la comparación
    // distinto de A, se anota el incidente (fatal si el modelo no está
    // disponible, lo que lo detiene) y el turno se responde con el bot actual.
    const detalle = String(err?.message ?? err).slice(0, 400);
    await registrar("error", { error: detalle });
    if (cand) {
      const fatal = err?.name === "ModeloNoDisponibleError" || /404|not found|permission|403/i.test(detalle);
      await registrarIncidente({
        experimentId: cand.experimentId,
        candidato: cand.letra,
        gravedad: fatal ? "fatal" : "grave",
        tipo: "error_modelo",
        detalle,
        opportunityId,
        conversationId,
      }).catch((e) => console.error("[agente] No se pudo registrar el incidente:", e));
      if (cand.letra !== "A" && !forzarActual && uso.herramientas.length === 0) {
        return runAgentTurnCon(conversationId, modeloBase, true);
      }
    }
    throw err;
  }

  try {
    if (finalText) {
      try {
        await sendOutboundMessage({
          conversationId,
          senderType: "agente_ia",
          body: finalText,
          origin: "respuesta_entrante",
          // Solo el acuse que sigue a una derivación de esta misma respuesta.
          finalAckToken: escalated ? toolCtx.finalAckToken : null,
        });
      } catch (err) {
        if (err instanceof AutomaticSendBlockedError) {
          // Al revalidar antes de enviar ya no correspondía (pausa general o
          // chat tomado por una persona): la respuesta no sale.
          console.warn(`[agente] Respuesta no enviada en ${conversationId}: ${err.message}`);
          await registrar("bloqueado", { error: err.message });
          return;
        }
        await registrar("error", { error: String((err as any)?.message ?? err) });
        throw err;
      }
      await registrar("enviado");
    } else {
      await registrar(retenido ? "retenido" : "sin_texto", { motivos: retenido ?? [] });
    }
  } finally {
    // La detención se registra DESPUÉS de la disculpa (si no, la disculpa no
    // podría salir). Se registra igual aunque la disculpa no haya salido.
    if (toolCtx.pendingDetention) {
      try {
        await registrarDetencion({
          contactId: contact.id,
          motivo: toolCtx.pendingDetention.motivo,
          menor: toolCtx.pendingDetention.menor,
          actor: "ia",
          nota: toolCtx.pendingDetention.nota,
          motivoAtencion: toolCtx.pendingDetention.motivoAtencion,
        });
      } catch (err) {
        console.error("[agente] No se pudo registrar la detención:", err);
      }
    }
  }
}

interface ToolContext {
  area: Area;
  contact: any;
  conversationId: string;
  /** permiso de un solo uso para el acuse final tras derivar a una persona */
  finalAckToken: string | null;
  opportunityId: string | null;
  /** detención a registrar después de la disculpa */
  pendingDetention: { motivo: DetentionMotive; menor: boolean; nota: string; motivoAtencion: string } | null;
}

/** Atención humana o detención pedida por el agente (clasificación 12.2). */
async function atencionDelAgente(ctx: ToolContext, motivoAtencion: MotivoAtencion, detalle: string) {
  const t = clasificarAtencion(motivoAtencion);
  if (t.pausarChat) {
    await pauseWithFinalAck(ctx, t.principal ? "requiere_atencion_humana" : "cerrado_perdido");
  }
  const r = await solicitarAtencion({
    opportunityId: ctx.opportunityId,
    contactId: ctx.contact.id,
    conversationId: ctx.conversationId,
    motivo: t.motivo,
    actor: "ia",
    nota: detalle || null,
    chatYaPausado: true,
    diferirDetencion: true,
  });
  if (r.detencionPendiente) {
    ctx.pendingDetention = { motivo: r.detencionPendiente, menor: r.menor, nota: detalle || r.label, motivoAtencion: r.motivo };
  }
  return r;
}

const INSTRUCCION_RESPUESTA: Record<string, string> = {
  disculpa_breve: "Respondé solo una disculpa breve y cordial, sin insistir ni ofrecer nada más.",
  aviso_de_persona: "Avisale con calidez que una persona del equipo va a seguir la conversación. No prometas plazos.",
  explicar_procedencia: "Explicá con la verdad de dónde proviene el contacto, sin inventar datos.",
  reconocer_sin_inventar: "Reconocé su pedido, decile que una persona lo va a revisar y no inventes de dónde salió su contacto.",
  ninguna: "No respondas nada más.",
};

/** Pausa la IA en la conversación y otorga el permiso para el acuse final de esta respuesta. */
async function pauseWithFinalAck(
  ctx: ToolContext,
  status: "requiere_atencion_humana" | "cerrado_perdido",
  intakeStep: string | null = null
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("grant_ai_final_ack", {
    p_conversation: ctx.conversationId,
    p_status: status,
    p_intake_step: intakeStep,
    p_minutes: 5,
  });
  if (error) {
    // Sin permiso el acuse no sale, pero la conversación igual queda pausada.
    console.error("[agente] No se pudo otorgar el permiso del acuse final:", error.message);
    await supabase
      .from("conversations")
      .update({ ai_enabled: false, status, ...(intakeStep ? { intake_step: intakeStep } : {}) })
      .eq("id", ctx.conversationId);
    ctx.finalAckToken = null;
    return;
  }
  ctx.finalAckToken = typeof data === "string" ? data : null;
}

async function executeTool(
  name: string,
  input: Record<string, any>,
  ctx: ToolContext
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
      const categoria = clasificarAtencion(input.categoria ?? "pide_persona");
      if (categoria.detener || !categoria.pausarChat) {
        // Detenciones y consultas de procedencia tienen su propio tratamiento.
        const r = await atencionDelAgente(ctx, categoria.motivo, String(input.motivo ?? ""));
        return { output: { ok: true, instruccion: INSTRUCCION_RESPUESTA[r.respuesta] }, escalated: r.pausarChat };
      }
      await atencionDelAgente(ctx, categoria.motivo, String(input.motivo ?? ""));
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

        await pauseWithFinalAck(ctx, "requiere_atencion_humana", "completado");
        await supabase.from("contacts").update({ status: "cerrado_ganado" }).eq("id", ctx.contact.id);
        if (ctx.opportunityId) {
          try {
            await registrarCaptacion({
              opportunityId: ctx.opportunityId,
              actor: "ia",
              aceptacion: true,
              evidencia: `Aceptó el contacto del profesional. Disponibilidad: ${disponibilidad}`,
              datos: merged,
            });
          } catch (err) {
            console.error("[agente] No se pudo registrar la captación:", err);
          }
        }

        try {
          await notifyAdminOfQualifiedIntake(ctx.contact.id);
        } catch (err) {
          console.error("No se pudo notificar al administrador del caso calificado:", err);
        }

        return { output: { ok: true }, escalated: true };
      }

      if (resultado === "caso_resuelto" || resultado === "no_interesado") {
        await pauseWithFinalAck(ctx, "cerrado_perdido", "resuelto");
        await supabase.from("contacts").update({ status: "no_califica" }).eq("id", ctx.contact.id);
        // Disculpa breve y detención con motivo (archivo secundario).
        const r = await solicitarAtencion({
          opportunityId: ctx.opportunityId,
          contactId: ctx.contact.id,
          conversationId: ctx.conversationId,
          motivo: resultado === "caso_resuelto" ? "caso_resuelto" : "desinteres",
          actor: "ia",
          chatYaPausado: true,
          diferirDetencion: true,
        });
        if (r.detencionPendiente) {
          ctx.pendingDetention = { motivo: r.detencionPendiente, menor: false, nota: r.label, motivoAtencion: r.motivo };
        }
        return { output: { ok: true, instruccion: INSTRUCCION_RESPUESTA.disculpa_breve }, escalated: true };
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

      if (resultado === "aprobado" && ctx.opportunityId) {
        try {
          await registrarCaptacion({ opportunityId: ctx.opportunityId, actor: "ia", aceptacion: true, evidencia: motivo });
        } catch (err) {
          console.error("[agente] No se pudo registrar la captación de Marketing:", err);
        }
      }
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
        if (ctx.opportunityId) {
          const r = await solicitarAtencion({
            opportunityId: ctx.opportunityId,
            contactId: ctx.contact.id,
            conversationId: ctx.conversationId,
            motivo: "desinteres",
            actor: "ia",
            nota: motivo,
            chatYaPausado: true,
            diferirDetencion: true,
          });
          if (r.detencionPendiente) {
            ctx.pendingDetention = { motivo: r.detencionPendiente, menor: false, nota: motivo, motivoAtencion: r.motivo };
          }
        }
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

    case "pedir_presupuesto": {
      if (ctx.area !== "marketing") return { output: { error: "Esta herramienta solo está disponible en Marketing." } };
      const detalle = String(input.detalle ?? "").trim();
      if (!detalle) return { output: { error: "Contame qué necesita la persona (detalle)." } };
      const r = await pedirPresupuesto({
        contactId: ctx.contact.id,
        opportunityId: ctx.opportunityId,
        conversationId: ctx.conversationId,
        detalle,
        servicios: Array.isArray(input.servicios) ? input.servicios.map(String) : [],
        presupuestoMencionado: typeof input.presupuesto_mencionado === "string" ? input.presupuesto_mencionado : null,
        urgencia: typeof input.urgencia === "string" ? input.urgencia : null,
      });
      if (r.nuevo) {
        // «Pide presupuesto» cuenta como captado (decisión del 16/10).
        if (ctx.opportunityId) {
          try {
            await registrarCaptacion({ opportunityId: ctx.opportunityId, actor: "ia", aceptacion: true, evidencia: `Pidió presupuesto: ${detalle}`.slice(0, 500) });
          } catch (err) {
            console.error("[agente] No se pudo registrar la captación por presupuesto:", err);
          }
        }
        try {
          await notifyMarketingHandoff(ctx.contact.id, `🧾 PIDIÓ PRESUPUESTO — prepararlo y cargarlo en «Pide presupuesto» en menos de 24 h. Lo que pidió: ${detalle}`, "atender");
        } catch (err) {
          console.error("[agente] No se pudo avisar el pedido de presupuesto:", err);
        }
      }
      return {
        output: {
          ok: true,
          instruccion: "Confirmale con calidez que el presupuesto va a estar listo en menos de 24 horas y que se lo mandás por acá. No des montos ni condiciones.",
        },
      };
    }

    case "presupuesto_aprobado": {
      if (ctx.area !== "marketing") return { output: { error: "Esta herramienta solo está disponible en Marketing." } };
      const evidencia = String(input.evidencia ?? "").trim() || "(sin detalle)";
      await aprobarPresupuesto({ contactId: ctx.contact.id, evidencia });
      try {
        await notifyMarketingHandoff(ctx.contact.id, `Presupuesto aprobado: ${evidencia}`, "cierre");
      } catch (err) {
        console.error("[agente] No se pudo avisar el cierre:", err);
      }
      return {
        output: { ok: true, instruccion: "Agradecé, confirmale que queda aprobado y que el equipo lo contacta para arrancar. Despedite breve." },
        escalated: true,
      };
    }

    case "registrar_venta": {
      if (ctx.area !== "marketing") return { output: { error: "Esta herramienta solo está disponible en Marketing." } };
      const lista = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, 10) : undefined);
      await registrarVenta(ctx.contact.id, {
        etapa: input.etapa === "propuesta" ? "propuesta" : undefined,
        datos: {
          necesidad: typeof input.necesidad === "string" ? input.necesidad.slice(0, 500) : undefined,
          servicios_conversados: lista(input.servicios_conversados),
          precios_mencionados: lista(input.precios_mencionados),
          objeciones: lista(input.objeciones),
          plazo_deseado: typeof input.plazo_deseado === "string" ? input.plazo_deseado.slice(0, 200) : undefined,
        },
      });
      return { output: { ok: true } };
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

    case "captar": {
      if (!ctx.opportunityId) return { output: { error: "No hay oportunidad para registrar." } };
      if (input.solo_precio === true) {
        // Solo preguntó el precio: va a una persona y no capta. El chat se
        // pausa con el permiso del acuse antes de clasificar.
        await atencionDelAgente(ctx, "precio_fuera_alcance", String(input.evidencia ?? "Consultó solo el precio"));
        return { output: { ok: true, captado: false, instruccion: INSTRUCCION_RESPUESTA.aviso_de_persona }, escalated: true };
      }
      const r = await registrarCaptacion({
        opportunityId: ctx.opportunityId,
        actor: "ia",
        aceptacion: input.aceptacion === true,
        evidencia: String(input.evidencia ?? ""),
      });
      if (!r.captado) {
        return { output: { ok: false, captado: false, motivo: r.evaluacion.motivo, nota: "Sin aceptación con evidencia no hay captación. Seguí la conversación." } };
      }
      // Después de captar se detiene la gestión comercial: lo que siga lo atiende una persona.
      await pauseWithFinalAck(ctx, "requiere_atencion_humana");
      return {
        output: {
          ok: true,
          captado: true,
          advertencias: r.evaluacion.advertencias,
          instruccion: "Confirmale con calidez que una persona del equipo lo va a contactar. No prometas resultados, plazos ni precios.",
        },
        escalated: true,
      };
    }

    case "detener_contacto": {
      const motivoAtencion = String(input.motivo ?? "");
      const t = clasificarAtencion(motivoAtencion);
      if (!t.detener) return { output: { error: "Motivo de detención no válido." } };
      const r = await atencionDelAgente(ctx, t.motivo, String(input.detalle ?? ""));
      return { output: { ok: true, instruccion: INSTRUCCION_RESPUESTA[r.respuesta] }, escalated: true };
    }

    case "registrar_ubicacion": {
      if (!ctx.opportunityId) return { output: { error: "No hay oportunidad para registrar." } };
      const zona = await registrarZona({ opportunityId: ctx.opportunityId, zona: input.zona, actor: "ia" });
      return { output: { ok: true, zona } };
    }

    case "elegir_ruta_juridica": {
      if (ctx.area !== "civil" && ctx.area !== "penal") return { output: { error: "Solo para Jurídico." } };
      if (!ctx.opportunityId) return { output: { error: "No hay oportunidad para registrar." } };
      const ruta = input.ruta === "directa" ? "directa" : "fases";
      await elegirRutaJuridica({ opportunityId: ctx.opportunityId, ruta, actor: "ia" });
      return { output: { ok: true, ruta } };
    }

    case "programar_fase2": {
      if (ctx.area !== "civil" && ctx.area !== "penal") return { output: { error: "Solo para Jurídico." } };
      const cita = await crearCitaIa({
        contactId: ctx.contact.id,
        conversationId: ctx.conversationId,
        area: ctx.area,
        opportunityId: ctx.opportunityId,
        elegido: typeof input.horario === "string" ? input.horario : null,
      });
      return { output: { ok: true, cita_id: cita.id, inicio: cita.starts_at, nota: "Agendar no capta: la captación llega cuando acepte el análisis y el contacto del profesional." } };
    }

    default:
      return { output: { error: `Herramienta desconocida: ${name}` } };
  }
}
