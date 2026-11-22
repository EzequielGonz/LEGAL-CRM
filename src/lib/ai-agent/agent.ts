import { bloqueHorarioAtencion } from "@/lib/horario-atencion";
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { AutomaticSendBlockedError, sendOutboundMessage } from "@/lib/messaging";
import { getAvailableSlots, createAppointment, horarioOfrecido } from "@/lib/agenda";
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
import { clasificarAtencion, type MotivoAtencion } from "@/lib/captacion/reglas";
import { crearCitaIa } from "@/lib/citas";
import { contactBlockReason, type DetentionMotive } from "@/lib/detention";
import { instruccionReparacion, validarTextoSalida } from "@/lib/agentes/contrato";
import { cierreDeReserva, esCierreValido, instruccionCierre, pedidoDeCierre } from "@/lib/agentes/cierre-captacion";
import { armarContexto, armarResumen } from "@/lib/agentes/contexto";
import { asignacionActiva } from "@/lib/agentes/servicio";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { evidenciaDeCaptacion, NOTA_SIN_EVIDENCIA, type MensajeParaEvidencia } from "@/lib/captacion/evidencia";
import { registrarTurno } from "@/lib/experimento/servicio";
import { instruccionesDeRol } from "@/lib/agentes/roles";
import { buildSystemPrompt, criterioDelRubro, REGLAS_ESTRICTAS } from "./prompt";
import { GUIA_CAPTACION_Y_CIERRE } from "@/lib/agentes/guia-cierre";
import { conTiempoYReintento, esFallaTransitoria, MARCA_FALLA_MODELO } from "@/lib/ai-agent/reintento";
import { marcaDeTiempo } from "@/lib/agentes/tiempo-historial";
import { modoDelContacto } from "@/lib/agentes/entrante";
import { historialConPlantillas } from "@/lib/agentes/historial-servidor";
import { esPostergaFirme, instruccionUltimaRespuesta } from "@/lib/agentes/plantillas-en-historial";
import { motivoParaNoResponder, TEXTO_SIN_RESPUESTA } from "@/lib/agentes/automaticos";
import { bloqueFichaNegocio, leerFichaNegocio } from "@/lib/agentes/ficha-negocio";
import { conocimientoParaTurno, rubroDeConocimiento } from "@/lib/conocimiento/servicio";
import { estadoLaboratorio, registrarVariante } from "@/lib/laboratorio/en-vivo";
import { ajustesDeVersion, bloqueRolLaboratorio, componerInstrucciones, esModeloNoEncontrado, pedidoConModelo, planDelTurno, varianteRegistrable } from "@/lib/laboratorio/reglas";
import { NOTA_AUDIO_PARA_AGENTE, cuerpoParaAgente, hayAudioSinContestar } from "@/lib/audios/reglas";

const MAX_TOOL_ITERATIONS = 6;

/** 21/10: guía común de captación y cierre (todo mensaje se responde, venga de donde venga). */
export const BLOQUE_RESPONDER_SIEMPRE = GUIA_CAPTACION_Y_CIERRE;
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
  /** Modelo pedido; sin dato, el vigente (Gemini 3.8 Flash o GEMINI_MODEL). */
  modelo?: string;
}) => Promise<{ parts: Part[]; tokensEntrada?: number; tokensSalida?: number; tokensRazonamiento?: number; modeloRespuesta?: string | null }>;

const modeloGemini: ModeloAgente = async ({ contents, systemInstruction, tools, modelo }) => {
  // 15/11: tiempo máximo de 20 s y un reintento (ver ./reintento).
  const response = await conTiempoYReintento(
    () =>
      gemini().models.generateContent({
        model: modelo || identificadorModelo(),
        contents,
        config: { systemInstruction, tools: [{ functionDeclarations: tools as any }] },
      }),
    { debeReintentar: esFallaTransitoria }
  );
  const u: any = (response as any).usageMetadata ?? {};
  return {
    parts: response.candidates?.[0]?.content?.parts ?? [],
    tokensEntrada: u.promptTokenCount ?? 0,
    tokensSalida: u.candidatesTokenCount ?? 0,
    tokensRazonamiento: u.thoughtsTokenCount ?? 0,
    modeloRespuesta: (response as any).modelVersion ?? null,
  };
};

let _modelo: ModeloAgente = modeloGemini;
/** Solo pruebas: reemplaza el modelo (null vuelve a Gemini). */
export function usarModeloAgente(modelo: ModeloAgente | null) {
  _modelo = modelo ?? modeloGemini;
}

// criterioDelRubro y buildSystemPrompt viven en ./prompt (los comparte «Probar el bot real»).

/** Convierte el historial de `messages` al formato de contenidos de Gemini
 *  (`role: "user" | "model"`, cada uno con `parts`), fusionando mensajes
 *  consecutivos del mismo rol. */
function buildHistory(rows: { direction: string; body: string | null; created_at?: string | null }[]): Content[] {
  const history: Content[] = [];
  let anterior: string | null = null;
  let huboEntrante = false;

  for (const row of rows) {
    if (!row.body) continue;
    const role: "user" | "model" = row.direction === "entrante" ? "user" : "model";
    // 15/11: si la persona vuelve a escribir después de más de un día, el bot lo ve.
    // Revisión: solo si la persona ya había escrito antes (la primera respuesta a una campaña vieja no se marca).
    const marca = role === "user" && huboEntrante ? marcaDeTiempo(anterior, row.created_at ?? null) : null;
    if (row.created_at) anterior = row.created_at;
    if (role === "user") huboEntrante = true;
    const body: string = marca ? `${marca}\n${row.body}` : row.body;
    const last = history[history.length - 1];
    const lastPart = last?.parts?.length === 1 ? last.parts[0] : undefined;
    if (last && last.role === role && lastPart && typeof lastPart.text === "string") {
      lastPart.text += `\n${body}`;
    } else {
      history.push({ role, parts: [{ text: body }] });
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

async function runAgentTurnCon(conversationId: string, modelo: ModeloAgente): Promise<void> {
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
    .select("id, direction, sender_type, body, metadata, created_at, audio_texto, audio_texto_estado")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  // Se piden los ÚLTIMOS mensajes (antes se tomaban los primeros 30 y en
  // charlas largas el agente no veía lo más reciente) y se ordenan.
  // 13/11: un audio que se pudo pasar a texto se lee como lo que dijo la persona.
  const ordenados = [...((messageRows ?? []) as any[])].reverse().map((m) => ({ ...m, body: cuerpoParaAgente(m) }));
  const conAudio = hayAudioSinContestar(ordenados);
  // 24/10: las plantillas se ven con su texto real y sus botones, y la
  // respuesta con botón queda marcada y clasificada (vale para cualquier plantilla).
  const { filas: conPlantillas, ultima: ultimaRespuesta } = await historialConPlantillas(ordenados as any[]);

  const messages = buildHistory(conPlantillas);
  // 24/10: para no responder dos veces cuando llegan dos mensajes seguidos.
  const inicioTurno = new Date().toISOString();
  const ultimoEntranteVisto = [...ordenados].reverse().find((m: any) => m.direction === "entrante")?.created_at ?? null;
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    // No hay nada nuevo del prospecto para responder.
    return;
  }

  // 24/10: del otro lado hay un contestador automático (o un bucle con uno):
  // no se responde, no se usan herramientas, no se deriva a una persona y no
  // se guardan datos. Cuando escriba una persona real, el bot responde.
  const sinResponder = motivoParaNoResponder(ordenados as any[], new Date());
  if (sinResponder) {
    await registrarTurno({
      experimentId: null,
      candidato: null,
      precio: null,
      opportunityId: null,
      conversationId,
      rubroId: contact.rubro_id ?? null,
      proveedor: "gemini_api",
      modeloPedido: identificadorModelo(),
      modeloRespuesta: null,
      llamadas: 0,
      tokensEntrada: 0,
      tokensSalida: 0,
      tokensRazonamiento: 0,
      latenciaMs: 0,
      herramientas: [],
      resultado: "bloqueado",
      error: TEXTO_SIN_RESPUESTA[sinResponder],
    });
    return;
  }

  // 24/10: un contacto detenido que vuelve a escribir sí recibe respuesta, salvo el número de una menor.
  const bloqueo = await contactBlockReason(contact.id);
  if (bloqueo && (bloqueo.minorReported || !bloqueo.detentionId)) return;

  // ¿Viene de una campaña? Se busca en campaign_contacts por contact_id (no
  // por contacts.campaign_id, que solo queda seteado en el flujo viejo de
  // importación directa a una campaña) la más reciente en la que participó.
  // Si su estado todavía es "esperando respuesta" (lo dejamos así al mandar
  // la plantilla), esta es su primera respuesta.
  const { data: latestCampaignContact } = await supabase
    .from("campaign_contacts")
    .select("campaign_id, sent_at, campaigns(name, agent_role_id)")
    .eq("contact_id", contact.id)
    .order("sent_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const campaignName = (latestCampaignContact as any)?.campaigns?.name ?? null;
  const isFirstReplyToCampaign =
    !!campaignName && contact.status === "esperando_respuesta_prospecto";
  // 24/10: sin base ni campaña, escribió por su cuenta → bot general con venta consultiva.
  const modo = modoDelContacto({ importedBaseId: contact.imported_base_id ?? null, campaignName, campaignId: (latestCampaignContact as any)?.campaign_id ?? null });
  const rolDeCampana = (latestCampaignContact as any)?.campaigns?.agent_role_id ?? null;

  // Sacamos al contacto de "esperando respuesta" apenas responde: si no,
  // un segundo mensaje suyo antes de que la IA llegue a calificarlo dispara
  // de nuevo la pregunta de "¿segue vigente tu consulta?" en cada turno.
  if (contact.status === "esperando_respuesta_prospecto") {
    await supabase.from("contacts").update({ status: "en_conversacion" }).eq("id", contact.id);
  }

  // Oportunidad (21/10: ya no hay comparación de agentes; responde siempre el modelo vigente).
  let opportunityId: string | null = null;
  try {
    opportunityId = (await ensureOpportunity({ contactId: contact.id, conversationId })).id;
  } catch (err) {
    console.error("[agente] No se pudo leer la oportunidad:", err);
  }
  const modeloPedido = identificadorModelo();

  const system = buildSystemPrompt(agentConfig as any, {
    area,
    fullName: contact.full_name,
    dniCuil: contact.dni_cuil,
    qualificationData: contact.qualification_data ?? {},
    campaignName,
    isFirstReplyToCampaign,
    modo,
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
          await Promise.race([analyzeLead(lead.id, { investigar: true }), new Promise((r) => setTimeout(r, 20_000))]);
        }
      }
    } catch (err) {
      console.error("[agente] No se pudo iniciar el análisis al aceptar:", err);
    }
  }
  // Marketing: se suma lo que el sistema sabe del negocio (análisis), la guía de venta y cómo registrar el resultado.
  const marketingBrief =
    area === "marketing" ? [await buildMarketingBrief(contact.id), await briefVenta(contact.id).catch(() => "")].filter(Boolean).join("\n\n") : "";
  const criterio = criterioDelRubro(area, contact.rubro_id ?? null, modo);
  const withCriterio = criterio ? `${system}\n\n${criterio}` : system;
  let systemWithBrief = marketingBrief ? `${withCriterio}\n\n${marketingBrief}` : withCriterio;
  // Etapa 3: si hay una asignación ACTIVA de la biblioteca para esta área, el
  // contexto sale de los módulos versionados (principal + derivado). Sin
  // asignación activa, responde exactamente como hoy.
  try {
    const asignacion = await asignacionActiva(area);
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
      // 15/11: la biblioteca reemplaza el armado del prompt, pero las reglas estrictas
      // y las de rechazos y origen del contacto (criterio del rubro) siguen valiendo.
      const conReglas = [ctx.systemInstruction, REGLAS_ESTRICTAS, criterio].filter(Boolean).join("\n\n");
      systemWithBrief = marketingBrief ? `${conReglas}\n\n${marketingBrief}` : conReglas;
    }
  } catch (err) {
    console.error("[agente] No se pudo leer la asignación de la biblioteca; se usa la configuración actual:", err);
  }
  // 25/10: conocimiento del bot por versiones (v1 = sin cambios; v2 = biblioteca de ventas
  // y del rubro). Va por debajo de las reglas, el rol y la ficha, que se suman después.
  // 15/11: Laboratorio del bot. Una prueba A/B vigente de la campaña de esta charla
  // decide versión y modelo; un rol aplicado desde el laboratorio (tipo de consulta o
  // perfil) entra solo si no hay rol de campaña ni de base. Sin nada de eso, el plan
  // es vacío y el pedido al modelo es idéntico al de siempre (ver src/lib/laboratorio/reglas.ts).
  const estadoLab = await estadoLaboratorio();
  const planLab = planDelTurno(estadoLab, {
    rubro: rubroDeConocimiento(contact.rubro_id ?? null, area),
    area,
    modo,
    campaignId: (latestCampaignContact as any)?.campaign_id ?? null,
    conversationId,
    envioCampanaAt: (latestCampaignContact as any)?.sent_at ?? null,
    ahora: new Date(),
  });
  const conocimiento = await conocimientoParaTurno({
    rubroId: contact.rubro_id ?? null,
    area,
    conversationId,
    entrantes: ordenados.filter((m: any) => m.direction === "entrante" && m.body).map((m: any) => String(m.body)),
    ...(planLab.forzarVersion != null ? { forzarVersion: planLab.forzarVersion } : {}),
  });
  const ajustesLab = ajustesDeVersion(estadoLab, planLab, conocimiento.version);
  if (planLab.prueba && varianteRegistrable(planLab, conocimiento.version)) {
    await registrarVariante({ pruebaId: planLab.prueba.id, conversationId, variante: planLab.prueba.variante, version: conocimiento.version, modelo: ajustesLab.modelo });
  }
  // Rol de la base (21/10): si la base del contacto tiene un rol cargado, se suma.
  // 24/10: manda el rol de la campaña; si la campaña no tiene, el de la base.
  const rol = await instruccionesDeRol(contact, { rolId: rolDeCampana, campana: campaignName });
  // Mismo orden de siempre: conocimiento → (ajustes de la versión del laboratorio) → rol.
  systemWithBrief = componerInstrucciones({
    system: systemWithBrief,
    conocimiento: conocimiento.texto,
    extras: ajustesLab.extras,
    rol,
    rolLaboratorio: planLab.rol ? bloqueRolLaboratorio(planLab.rol) : "",
  });
  // Modelo de la variante o de la versión del laboratorio; sin eso, el de siempre.
  // Si Gemini no conoce ese modelo, se reintenta una vez con el de siempre (ver llamarModelo).
  let modeloLab: string | null = ajustesLab.modelo;
  let avisoModeloLab: string | null = null;
  // 24/10: contacto detenido que vuelve a escribir: el agente lo atiende, sin ofrecer ni insistir.
  if (bloqueo) {
    systemWithBrief = `${systemWithBrief}\n\nContacto detenido (regla del sistema): esta persona ya pidió no recibir mensajes o cerró la gestión (${bloqueo.label}). Ahora volvió a escribir: respondé con respeto a lo que dice. Si trae una consulta o algo relevante, atendela como siempre; si no, contestá breve y quedá a disposición. No le ofrezcas servicios por tu cuenta, no insistas y no repitas la disculpa si ya la diste.`;
  }
  // 24/10: ficha del negocio del rubro (datos reales cargados por el equipo, editable en Bot IA).
  const ficha = await leerFichaNegocio(contact.rubro_id ?? profileIdForArea(area) ?? null);
  if (ficha) systemWithBrief = `${systemWithBrief}\n\n${bloqueFichaNegocio(ficha)}`;
  // Responder siempre (21/10): llegue por campaña, landing, redes o un «hola» suelto.
  systemWithBrief = `${systemWithBrief}\n\n${BLOQUE_RESPONDER_SIEMPRE}`;
  // 13/11: la persona mandó un audio que se pudo pasar a texto. Se suma una nota; el rol no se toca.
  if (conAudio) systemWithBrief = `${systemWithBrief}\n\n${NOTA_AUDIO_PARA_AGENTE}`;
  // 24/10: qué hacer con la respuesta a la plantilla (botón o equivalente).
  const instruccionRespuesta = instruccionUltimaRespuesta(ultimaRespuesta);
  if (instruccionRespuesta) systemWithBrief = `${systemWithBrief}\n\nRespuesta a la plantilla (regla del sistema, manda sobre el guion):\n${instruccionRespuesta}`;
  const tools = toolsForArea(area);
  let escalated = false;
  let finalText = "";
  // Registro del turno (costo, demora, modelo informado y resultado).
  const t0 = Date.now();
  const uso = { llamadas: 0, entrada: 0, salida: 0, razonamiento: 0, modeloRespuesta: null as string | null, herramientas: [] as string[] };
  const llamarModelo: ModeloAgente = async (req) => {
    let r: Awaited<ReturnType<ModeloAgente>>;
    try {
      r = await modelo(pedidoConModelo(req, modeloLab));
    } catch (err) {
      if (!modeloLab || !esModeloNoEncontrado(err)) throw err;
      avisoModeloLab = `Laboratorio: el modelo ${modeloLab} no está disponible; respondió el modelo de siempre (${modeloPedido}).`;
      console.error(`[agente] ${avisoModeloLab}`);
      modeloLab = null;
      r = await modelo(req);
    }
    uso.llamadas++;
    uso.entrada += r.tokensEntrada ?? 0;
    uso.salida += r.tokensSalida ?? 0;
    uso.razonamiento += r.tokensRazonamiento ?? 0;
    uso.modeloRespuesta = r.modeloRespuesta ?? uso.modeloRespuesta;
    return r;
  };
  const registrar = (resultado: "enviado" | "retenido" | "sin_texto" | "bloqueado" | "error", extra: { motivos?: string[]; error?: string } = {}) =>
    registrarTurno({
      experimentId: null,
      candidato: null,
      precio: null,
      opportunityId,
      conversationId,
      rubroId: contact.rubro_id ?? null,
      proveedor: "gemini_api",
      modeloPedido: modeloLab ?? modeloPedido,
      modeloRespuesta: uso.modeloRespuesta,
      llamadas: uso.llamadas,
      tokensEntrada: uso.entrada,
      tokensSalida: uso.salida,
      tokensRazonamiento: uso.razonamiento,
      latenciaMs: Date.now() - t0,
      herramientas: uso.herramientas,
      resultado,
      knowledgeVersion: conocimiento.version,
      knowledgeItems: conocimiento.claves,
      ...extra,
      ...(avisoModeloLab && !extra.error ? { error: avisoModeloLab } : {}),
    });
  // Contexto de las herramientas. Si la IA deriva a una persona, la
  // herramienta deja acá el permiso de un solo uso para el acuse final.
  const toolCtx: ToolContext = { area, contact, conversationId, cierre: false, finalAckToken: null, opportunityId, pendingDetention: null, postergo: esPostergaFirme(ultimaRespuesta), ultimoEntrante: [...ordenados].reverse().find((m: any) => m.direction === "entrante")?.body ?? null, historialEvidencia: ordenados.map((m: any) => ({ id: m.id ?? null, direction: m.direction, sender_type: m.sender_type ?? null, body: m.body ?? null, created_at: m.created_at ?? null })) };
  // Horario de atención (18/10, todos los perfiles): fuera de la franja de asesores igual se capta.
  systemWithBrief = `${systemWithBrief}\n\n${bloqueHorarioAtencion(new Date())}`;

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

  // 15/11: después de captar, la respuesta es la última del bot (el chat pasa a
  // una persona). Tiene que agradecer y cerrar sin preguntas; si no, se pide una
  // corrección y, si tampoco sirve, sale el cierre fijo del rubro.
  if (toolCtx.cierre && !esCierreValido(finalText)) {
    try {
      messages.push({ role: "user", parts: [{ text: pedidoDeCierre(area) }] });
      const r3 = await llamarModelo({ contents: messages, systemInstruction: systemWithBrief, tools });
      const t3 = (r3.parts ?? []).filter((p) => typeof p.text === "string").map((p) => p.text).join("\n").trim();
      finalText = esCierreValido(t3) && validarTextoSalida(t3).ok ? t3 : cierreDeReserva(area, contact.full_name);
    } catch (err) {
      console.error("[agente] No se pudo pedir el cierre:", err);
      finalText = cierreDeReserva(area, contact.full_name);
    }
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
        if (v2.ok && t2 && (!toolCtx.cierre || esCierreValido(t2))) finalText = t2;
        else v = v2;
      } catch (err) {
        console.error("[agente] No se pudo reparar la respuesta:", err);
      }
      if (!validarTextoSalida(finalText).ok && toolCtx.cierre) {
        // El cierre después de captar no se retiene: sale el del rubro.
        finalText = cierreDeReserva(area, contact.full_name);
      } else if (!validarTextoSalida(finalText).ok) {
        console.warn(`[agente] Respuesta retenida en ${conversationId}: ${v.motivos.join(", ")}`);
        await atencionDelAgente(toolCtx, "consulta_fuera_alcance", `Respuesta retenida por el validador: ${v.motivos.join(", ")}`);
        finalText = "";
        retenido = v.motivos;
      }
    }
  }
  } catch (err: any) {
    // Falla del modelo: se registra y se deja para atención humana.
    // Revisión 15/11: la marca «falla_modelo» separa la falla de la IA (se puede reintentar)
    // de la falla de un envío (podría haber salido: no se reintenta).
    const detalle = `${MARCA_FALLA_MODELO} ${String(err?.message ?? err)}`.slice(0, 400);
    await registrar("error", { error: detalle });
    // 15/11: si el mismo mensaje ya tuvo un turno con error (el rescate lo
    // reintentó), el chat pasa a una persona: no queda nadie sin respuesta.
    await derivarSiFallaDeNuevo({ conversationId, contactId: contact.id, opportunityId, desde: ultimoEntranteVisto });
    throw err;
  }

  // 24/10: si mientras tanto llegó otro mensaje de la persona (lo responde ese
  // turno, con todo el contexto) o ya salió otra respuesta del bot, esta no sale.
  if (finalText && !escalated) {
    const { data: ultimoAhora } = await supabase
      .from("messages")
      .select("direction, sender_type, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const u: any = ultimoAhora;
    const otraRespuesta = u && u.direction === "saliente" && u.sender_type === "agente_ia" && Date.parse(u.created_at) > Date.parse(inicioTurno);
    const otroEntrante = u && u.direction === "entrante" && ultimoEntranteVisto && Date.parse(u.created_at) > Date.parse(ultimoEntranteVisto);
    if (otraRespuesta || otroEntrante) {
      await registrar("bloqueado", { error: otraRespuesta ? "Ya salió otra respuesta del bot en este chat: no se duplica." : "Llegó otro mensaje: lo responde el turno siguiente." });
      return;
    }
  }

  try {
    if (finalText) {
      try {
        const enviado = await sendOutboundMessage({
          conversationId,
          senderType: "agente_ia",
          body: finalText,
          origin: "respuesta_entrante",
          // Solo el acuse que sigue a una derivación de esta misma respuesta.
          finalAckToken: escalated ? toolCtx.finalAckToken : null,
        });
        // 24/10: después de un «ahora no» no se recontacta (la persona sigue disponible para seguimientos y campañas).
        if (esPostergaFirme(ultimaRespuesta) && (enviado as any)?.messageId) {
          await (supabase.from("messages") as any)
            .update({ metadata: { recontacto_estado: "descartado", recontacto_motivo: "pidió «ahora no»" } })
            .eq("id", (enviado as any).messageId);
        }
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
  /** 15/11: en esta respuesta se captó; el texto tiene que ser el cierre */
  cierre: boolean;
  /** permiso de un solo uso para el acuse final tras derivar a una persona */
  finalAckToken: string | null;
  opportunityId: string | null;
  /** detención a registrar después de la disculpa */
  pendingDetention: { motivo: DetentionMotive; menor: boolean; nota: string; motivoAtencion: string } | null;
  /** 24/10: respondió «ahora no» a la plantilla: no se detiene ni se califica */
  postergo?: boolean;
  /** 15/11: texto del último mensaje de la persona (segunda llave antes de captar) */
  ultimoEntrante?: string | null;
  /** 22/11: historial de la conversación con id de cada mensaje, para guardar el mensaje real de la persona como evidencia. */
  historialEvidencia?: MensajeParaEvidencia[];
}

const NOTA_AHORA_NO =
  "Es un «ahora no»: no se detiene ni se califica (regla del 24/10). Respondé solo un cierre corto y cálido: quedás a disposición por acá cuando quiera retomarlo.";

/** Atención humana o detención pedida por el agente (clasificación 12.2). */
async function atencionDelAgente(ctx: ToolContext, motivoAtencion: MotivoAtencion, detalle: string) {
  const t = clasificarAtencion(motivoAtencion);
  if (t.pausarChat) {
    await pauseWithFinalAck(ctx, t.principal ? "requiere_atencion_humana" : "cerrado_perdido");
  } else if (t.detener) {
    // 24/10: la detención no apaga al agente en el chat (por si la persona dice algo más relevante).
    await createAdminClient().from("conversations").update({ status: "cerrado_perdido" }).eq("id", ctx.conversationId);
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
  disculpa_datos: "Respondé solo esta disculpa, sin explicar ni inventar de dónde salió su contacto (no tenés ese dato): «Te pido disculpas por la molestia. Desde acá no tengo el detalle de cómo nos llegó tu contacto, pero ya registré tu pedido y no te vamos a volver a escribir. ¡Que tengas un buen día!»",
  ninguna: "No respondas nada más.",
};

/** Pausa la IA en la conversación y otorga el permiso para el acuse final de esta respuesta. */
async function pauseWithFinalAck(
  ctx: ToolContext,
  status: "requiere_atencion_humana" | "cerrado_perdido",
  intakeStep: string | null = null
) {
  const supabase = createAdminClient();
  // 14/11: si esta misma respuesta ya obtuvo el permiso (por ejemplo, «captar» y
  // después «finalizar_consulta»), pedirlo de nuevo lo borraba (el chat ya está
  // pausado) y la confirmación a la persona no salía. Se conserva el permiso y
  // solo se actualiza el estado.
  if (ctx.finalAckToken) {
    await supabase
      .from("conversations")
      .update({ ai_enabled: false, status, ...(intakeStep ? { intake_step: intakeStep } : {}) })
      .eq("id", ctx.conversationId);
    return;
  }
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
      if (ctx.postergo) return { output: { ok: false, nota: NOTA_AHORA_NO } };
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
            // 24/10: en hora de Buenos Aires y 24 h (el servidor corre en UTC).
            etiqueta: new Date(s.starts_at).toLocaleString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              hourCycle: "h23",
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
      // 15/11: solo un horario libre y futuro de los que da la agenda (no uno inventado).
      const libre = horarioOfrecido(input.starts_at, await getAvailableSlots(ctx.area, { limit: 400 }));
      if (!libre) {
        return {
          output: {
            ok: false,
            error: "Ese horario no está libre o ya pasó. Usá consultar_disponibilidad y ofrecé dos de los horarios que devuelve.",
          },
        };
      }
      const appointment = await createAppointment({
        contactId: ctx.contact.id,
        conversationId: ctx.conversationId,
        area: ctx.area,
        startsAt: libre.starts_at,
        endsAt: libre.ends_at,
      });
      // Revisión 15/11: si otro chat tomó el mismo horario al mismo tiempo, la cita más nueva se cancela
      // (queda con motivo, no se borra) y se ofrece otro horario.
      const { data: choques } = await (supabase.from("appointments") as any)
        .select("id, created_at, kind, status")
        .eq("area", ctx.area)
        .neq("status", "cancelada")
        .lt("starts_at", libre.ends_at)
        .gt("ends_at", libre.starts_at)
        .neq("id", appointment.id);
      const otraPrimero = ((choques ?? []) as any[]).some((c) => c.kind !== "ia" && Date.parse(c.created_at) <= Date.parse((appointment as any).created_at ?? new Date().toISOString()));
      if (otraPrimero) {
        await (supabase.from("appointments") as any).update({ status: "cancelada" }).eq("id", appointment.id);
        return { output: { ok: false, error: "Ese horario se acaba de ocupar. Usá consultar_disponibilidad y ofrecé otros dos." } };
      }

      await supabase
        .from("conversations")
        .update({ status: "agendado" })
        .eq("id", ctx.conversationId);

      try {
        await notifyAdminOfClosedAppointment(appointment.id);
      } catch (err) {
        console.error("No se pudo notificar al administrador:", err);
      }

      return { output: { ok: true, appointment_id: appointment.id, instruccion: "Confirmale con calidez el día y la hora que quedaron agendados y agradecé. No hagas otra pregunta sobre el horario." } };
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
            const ev = evidenciaDeCaptacion(ctx.historialEvidencia ?? [], `Aceptó el contacto del profesional. Disponibilidad: ${disponibilidad}`, { exigirAceptacion: false });
            if (!ev.ok) throw new Error(`Sin evidencia de la persona (${ev.motivo}): no se registra la captación.`);
            await registrarCaptacion({
              opportunityId: ctx.opportunityId,
              actor: "ia",
              aceptacion: true,
              evidencia: ev.evidencia,
              evidenciaMensajeId: ev.messageId,
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

        ctx.cierre = true;
        return { output: { ok: true, instruccion: instruccionCierre(ctx.area) }, escalated: true };
      }

      if (resultado === "caso_resuelto" || resultado === "no_interesado") {
        // 24/10: se cierra sin apagar al agente en el chat (por si la persona dice algo más relevante).
        await supabase.from("conversations").update({ status: "cerrado_perdido", intake_step: "resuelto" }).eq("id", ctx.conversationId);
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
          const ev = evidenciaDeCaptacion(ctx.historialEvidencia ?? [], motivo, { exigirAceptacion: false });
          if (!ev.ok) throw new Error(`Sin evidencia de la persona (${ev.motivo}): no se registra la captación.`);
          await registrarCaptacion({ opportunityId: ctx.opportunityId, actor: "ia", aceptacion: true, evidencia: ev.evidencia, evidenciaMensajeId: ev.messageId });
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
        ctx.cierre = true;
        return {
          output: {
            ok: true,
            instruccion:
              "Avisale al prospecto, con calidez, que queda aprobado y que lo derivás al equipo técnico para empezar a trabajar en el proyecto. Agradecé y despedite breve, sin preguntas: es tu última respuesta.",
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
            "Decile con naturalidad que quedás atento por acá para cuando quiera retomarlo. No prometas escribirle en unos días ni presiones.",
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
            const ev = evidenciaDeCaptacion(ctx.historialEvidencia ?? [], `Pidió presupuesto: ${detalle}`, { exigirAceptacion: false });
            if (!ev.ok) throw new Error(`Sin evidencia de la persona (${ev.motivo}): no se registra la captación.`);
            await registrarCaptacion({ opportunityId: ctx.opportunityId, actor: "ia", aceptacion: true, evidencia: ev.evidencia, evidenciaMensajeId: ev.messageId });
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
      ctx.cierre = true;
      return {
        output: { ok: true, instruccion: "Agradecé, confirmale que queda aprobado y que el equipo lo contacta para arrancar. Despedite breve, sin preguntas: es tu última respuesta." },
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
      // 20/10: también sirve para los negocios de una base extraída que dijeron que sí:
      // ya tenemos su ficha (web o Google Maps), así que no hace falta pedir nada.
      const existente: any = await getLeadByContact(ctx.contact.id);
      const tieneDatos = !!existente && (!!existente.website || !!existente.place_id || (existente.maps_data && Object.keys(existente.maps_data).length > 0));
      if (!sitioWeb && !nombreYZona && !tieneDatos) {
        return { output: { error: "Necesito el sitio web o el nombre y la zona del negocio." } };
      }

      const lead = existente ?? (await ensureLead({
        contactId: ctx.contact.id,
        sourceKind: "directa",
        sourceDetail: sourceDetailFor(ctx.contact.source),
      })).lead;

      const analyzed: any = await analyzeLead(lead.id, {
        force: true,
        websiteOverride: sitioWeb || null,
        mapsQuery: nombreYZona || null,
        investigar: true,
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
      // 22/11: la evidencia es el mensaje real de la persona (con su id): un contestador, un rechazo, una
      // pregunta sin aceptación o la falta de mensaje no captan.
      const ev = evidenciaDeCaptacion(ctx.historialEvidencia ?? [], String(input.evidencia ?? ""));
      if (!ev.ok) {
        return { output: { ok: false, captado: false, motivo: ev.motivo, nota: NOTA_SIN_EVIDENCIA[ev.motivo] } };
      }
      const r = await registrarCaptacion({
        opportunityId: ctx.opportunityId,
        actor: "ia",
        aceptacion: input.aceptacion === true,
        evidencia: ev.evidencia,
        evidenciaMensajeId: ev.messageId,
      });
      if (!r.captado) {
        return { output: { ok: false, captado: false, motivo: r.evaluacion.motivo, nota: "Sin aceptación con evidencia no hay captación. Seguí la conversación." } };
      }
      // Después de captar se detiene la gestión comercial: lo que siga lo atiende una persona.
      await pauseWithFinalAck(ctx, "requiere_atencion_humana");
      ctx.cierre = true;
      return {
        output: {
          ok: true,
          captado: true,
          advertencias: r.evaluacion.advertencias,
          instruccion: instruccionCierre(ctx.area),
        },
        escalated: true,
      };
    }

    case "detener_contacto": {
      if (ctx.postergo) return { output: { ok: false, nota: NOTA_AHORA_NO } };
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

/** 15/11: segunda falla del modelo para el mismo mensaje → atención humana. */
async function derivarSiFallaDeNuevo(input: { conversationId: string; contactId: string; opportunityId: string | null; desde: string | null }) {
  if (!input.desde) return;
  try {
    const supabase = createAdminClient();
    const { count } = await (supabase.from("agent_turn_logs" as any) as any)
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", input.conversationId)
      .eq("resultado", "error")
      .like("error", `${MARCA_FALLA_MODELO}%`)
      .gte("created_at", input.desde);
    if ((count ?? 0) < 2) return;
    await solicitarAtencion({
      opportunityId: input.opportunityId,
      contactId: input.contactId,
      conversationId: input.conversationId,
      motivo: "consulta_fuera_alcance",
      actor: "sistema",
      nota: "El bot no pudo responder: la IA falló dos veces con el mismo mensaje",
    });
  } catch (e) {
    console.error("[agente] No se pudo derivar tras la falla del modelo:", e);
  }
}
