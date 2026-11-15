import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, profileIdForArea } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";
import { buildSystemPrompt, criterioDelRubro } from "./prompt";
import { GUIA_CAPTACION_Y_CIERRE } from "@/lib/agentes/guia-cierre";
import { instruccionesDeRol } from "@/lib/agentes/roles";
import { modoDelContacto } from "@/lib/agentes/entrante";
import { bloqueBoton, clasificarRespuesta, instruccionUltimaRespuesta } from "@/lib/agentes/plantillas-en-historial";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { bloqueHorarioAtencion } from "@/lib/horario-atencion";
import { toolsForArea } from "./tools";
import { bloqueFichaNegocio, leerFichaNegocio } from "@/lib/agentes/ficha-negocio";
import { conocimientoParaTurno } from "@/lib/conocimiento/servicio";
import { esCrisis, esEnojoConNosotros, TEXTO_CRISIS, TEXTO_DISCULPA_AMENAZA, TEXTO_DISCULPA_ENOJO } from "@/lib/agentes/crisis-y-enojo";
import { esRespuestaAutomatica } from "@/lib/agentes/automaticos";
import { reclamoEnMensaje } from "@/lib/atencion/reclamos";
import { cierreDeReserva, esCierreValido, instruccionCierre, pedidoDeCierre } from "@/lib/agentes/cierre-captacion";
import { aceptacionReal } from "@/lib/agentes/aceptacion";
import { instruccionReparacion, validarTextoSalida } from "@/lib/agentes/contrato";

/** 15/11: herramientas que, si salen bien, dejan la respuesta como cierre (igual que en vivo). */
const CIERRAN = new Set(["captar", "finalizar_consulta", "registrar_resultado_marketing", "presupuesto_aprobado"]);

/**
 * «Probar el bot real» (24/10). Arma el prompt con las MISMAS piezas que
 * usa el agente en vivo (agent.ts): identidad del perfil, prompt editable
 * del área (ai_agents), criterios y datos, reglas estrictas, criterio del
 * rubro con las reglas de rechazo y origen, rol de la base (si se elige),
 * guía de captación y cierre, y horario. Usa el modelo vigente.
 *
 * Las herramientas no se ejecutan: se contestan como simuladas, así que no
 * escribe a nadie, no agenda y no cambia estados.
 *
 * 15/11: también corre la capa fija del bot en vivo antes del modelo (crisis,
 * enojo, amenaza y contestadores) y, después, la llave de aceptación al captar,
 * el cierre del rubro y el validador con su única reparación.
 *
 * El prompt sale de ./prompt, el mismo módulo que usa agent.ts: lo que
 * cambie ahí se prueba igual acá.
 */

let _cliente: GoogleGenAI | null = null;
function gemini() {
  if (!_cliente) _cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _cliente;
}

export interface TurnoPrueba {
  rol: "persona" | "bot";
  texto: string;
  herramientas: string[];
  /** 25/10: ítems de conocimiento usados en esa respuesta (v2). */
  conocimiento?: string[];
}

export async function probarBotReal(input: { area: Area; rubroId: string | null; baseId?: string | null; campaignId?: string | null; mensajes: string[]; apertura?: string | null; boton?: boolean; version?: number | null;
  /** 15/11 (laboratorio): modelo de Gemini a probar; sin dato, el vigente. */
  modelo?: string | null;
  /** 15/11 (laboratorio): ajustes de una versión del laboratorio (tono, reglas, roles copiados), en el mismo lugar que en vivo. */
  extras?: string | null;
  /** 15/11 (laboratorio): rol aplicado por tipo de consulta o perfil; en vivo entra solo si no hay rol de campaña ni de base. */
  rolLaboratorio?: string | null;
}): Promise<{
  turnos: TurnoPrueba[];
  version: number;
  rol: string | null;
  modelo: string | null;
  tokens: { entrada: number; salida: number };
}> {
  const s = createAdminClient();
  const { data: agente } = await s.from("ai_agents").select("*").eq("area", input.area).maybeSingle();
  if (!agente) throw new Error("No hay un agente configurado para esta área.");
  const profile = await getProfile(profileIdForArea(input.area)!);
  const identidad = {
    presentationName: profile?.agent_presentation_name?.trim() || "Asistente",
    brandName: profile?.brand_name?.trim() || "la marca",
  };
  const apertura = input.apertura?.trim() || "";
  // 24/10: con base, campaña o apertura se prueba como contacto de campaña; si no, como alguien que escribe por su cuenta.
  let campana: { name: string; agent_role_id: string | null } | null = null;
  if (input.campaignId) {
    const { data } = await s.from("campaigns" as any).select("name, agent_role_id").eq("id", input.campaignId).maybeSingle();
    campana = (data as any) ?? null;
  }
  const modo = modoDelContacto({ importedBaseId: input.baseId ?? null, campaignId: campana ? input.campaignId : null, campaignName: apertura ? "prueba" : null });
  let system = buildSystemPrompt(
    agente as any,
    { area: input.area, fullName: null, dniCuil: null, qualificationData: {}, campaignName: campana?.name ?? null, isFirstReplyToCampaign: !!apertura, modo },
    identidad
  );
  const crit = criterioDelRubro(input.area, input.rubroId, modo);
  if (crit) system = `${system}\n\n${crit}`;
  // 25/10: igual que en vivo, el conocimiento va después del criterio y antes del rol y la ficha.
  const antes = system;
  system = "";
  const rol = await instruccionesDeRol({ imported_base_id: input.baseId ?? null }, { rolId: campana?.agent_role_id ?? null, campana: campana?.name ?? null });
  if (rol) system = `${system}\n\n${rol}`;
  else if (input.rolLaboratorio) system = `${system}\n\n${input.rolLaboratorio}`;
  const ficha = await leerFichaNegocio(input.rubroId ?? profileIdForArea(input.area) ?? null);
  if (ficha) system = `${system}\n\n${bloqueFichaNegocio(ficha)}`;
  system = `${system}\n\n${GUIA_CAPTACION_Y_CIERRE}\n\n${bloqueHorarioAtencion(new Date())}`;
  const despues = system;
  let versionUsada = 1;

  const tools = toolsForArea(input.area);
  const modelo = input.modelo?.trim() || identificadorModelo();
  const contents: Content[] = apertura ? [{ role: "model", parts: [{ text: apertura }] }] : [];
  const turnos: TurnoPrueba[] = apertura ? [{ rol: "bot", texto: apertura, herramientas: [] }] : [];
  const tokens = { entrada: 0, salida: 0 };
  let modeloRespuesta: string | null = null;

  let systemActual = "";
  const pedir = async (cs: Content[]) => {
    const r = await gemini().models.generateContent({ model: modelo, contents: cs, config: { systemInstruction: systemActual, tools: [{ functionDeclarations: tools as any }] } });
    const u: any = (r as any).usageMetadata ?? {};
    tokens.entrada += u.promptTokenCount ?? 0;
    tokens.salida += u.candidatesTokenCount ?? 0;
    modeloRespuesta = (r as any).modelVersion ?? modeloRespuesta;
    const parts: Part[] = r.candidates?.[0]?.content?.parts ?? [];
    const texto = parts
      .filter((p) => typeof p.text === "string")
      .map((p) => p.text)
      .join("\n")
      .trim();
    return { parts, texto };
  };

  const lista = input.mensajes.slice(0, 8);
  for (let idx = 0; idx < lista.length; idx++) {
    const m = lista[idx];
    // 24/10: la primera respuesta a la apertura puede ser un botón de la plantilla (igual que en vivo).
    const esBoton = !!input.boton && !!apertura && idx === 0;
    const instr = instruccionUltimaRespuesta({ texto: m, esBoton, aPlantilla: !!apertura && idx === 0, clase: clasificarRespuesta(m) });
    const con = await conocimientoParaTurno({ rubroId: input.rubroId, area: input.area, conversationId: null, entrantes: lista.slice(0, idx + 1), forzarVersion: input.version ?? null });
    versionUsada = con.version;
    const system = `${antes}${con.texto ? `\n\n${con.texto}` : ""}${input.extras ? `\n\n${input.extras}` : ""}${despues}`;
    const systemTurno = instr ? `${system}\n\nRespuesta a la plantilla (regla del sistema, manda sobre el guion):\n${instr}` : system;
    systemActual = systemTurno;
    contents.push({ role: "user", parts: [{ text: esBoton ? bloqueBoton(m) : m }] });
    turnos.push({ rol: "persona", texto: m, herramientas: [] });
    // 15/11: capa fija, en el mismo orden que el bot en vivo (inbound.ts).
    if (!esBoton) {
      if (esCrisis(m)) {
        turnos.push({ rol: "bot", texto: TEXTO_CRISIS, herramientas: ["sistema: crisis (líneas de ayuda, cartel urgente y chat a una persona)"] });
        break;
      }
      const reclamo = reclamoEnMensaje(m, { captado: false });
      if (reclamo?.tipo === "amenaza_legal") {
        turnos.push({ rol: "bot", texto: TEXTO_DISCULPA_AMENAZA, herramientas: ["sistema: amenaza (disculpa, se detiene y avisa)"] });
        break;
      }
      if (esEnojoConNosotros(m)) {
        turnos.push({ rol: "bot", texto: TEXTO_DISCULPA_ENOJO, herramientas: ["sistema: enojo (disculpa y se detiene)"] });
        break;
      }
      if (esRespuestaAutomatica(m)) {
        contents.pop();
        turnos.push({ rol: "bot", texto: "(no responde: es un contestador automático)", herramientas: ["sistema: contestador"] });
        continue;
      }
    }
    const usadas: string[] = [];
    let texto = "";
    let cierre = false;
    for (let i = 0; i < 4; i++) {
      const { parts, texto: t } = await pedir(contents);
      texto = t;
      const llamadas = parts.filter((p) => !!p.functionCall);
      if (!llamadas.length) {
        contents.push({ role: "model", parts: [{ text: texto || "…" }] });
        break;
      }
      contents.push({ role: "model", parts });
      contents.push({
        role: "user",
        parts: llamadas.map((p) => {
          const nombre = p.functionCall!.name ?? "";
          usadas.push(nombre);
          return {
            functionResponse: {
              ...(p.functionCall!.id ? { id: p.functionCall!.id } : {}),
              name: nombre,
              response: respuestaSimulada(input.area, nombre, p.functionCall!.args ?? {}, m, () => (cierre = true)),
            },
          };
        }),
      });
    }
    // 15/11: después de captar, cierre del rubro sin preguntas (igual que en vivo).
    const base = contents.length;
    if (cierre && !esCierreValido(texto)) {
      contents.push({ role: "user", parts: [{ text: pedidoDeCierre(input.area) }] });
      const r3 = await pedir(contents);
      texto = esCierreValido(r3.texto) && validarTextoSalida(r3.texto).ok ? r3.texto : cierreDeReserva(input.area, null);
      usadas.push("sistema: cierre del rubro");
    }
    // Validador con una sola reparación; si vuelve a fallar, en vivo se retiene y va a una persona.
    if (texto) {
      const v = validarTextoSalida(texto);
      if (!v.ok) {
        contents.push({ role: "user", parts: [{ text: instruccionReparacion(v) }] });
        const r2 = await pedir(contents);
        if (validarTextoSalida(r2.texto).ok && r2.texto && (!cierre || esCierreValido(r2.texto))) {
          texto = r2.texto;
          usadas.push("sistema: reparada por el validador");
        } else if (cierre) {
          texto = cierreDeReserva(input.area, null);
        } else {
          texto = `(retenida por el validador: ${v.motivos.join(", ")}; en vivo pasa a una persona)`;
        }
      }
    }
    // Los pedidos de corrección no quedan en la charla: queda solo el texto final.
    contents.splice(base);
    const ultimoModelo = contents[contents.length - 1];
    if (ultimoModelo?.role === "model" && ultimoModelo.parts?.length === 1 && typeof ultimoModelo.parts[0].text === "string") ultimoModelo.parts[0].text = texto || "…";
    else contents.push({ role: "model", parts: [{ text: texto || "…" }] });
    turnos.push({ rol: "bot", texto: texto || "(sin texto)", herramientas: usadas, conocimiento: con.titulos });
    if (cierre) break;
  }
  return { turnos, version: versionUsada, rol: rol || null, modelo: modeloRespuesta ?? modelo, tokens };
}

/** 15/11: respuesta simulada de una herramienta, con la llave de aceptación y la instrucción de cierre reales. */
function respuestaSimulada(area: Area, nombre: string, args: Record<string, unknown>, ultimo: string, marcarCierre: () => void): Record<string, unknown> {
  if (nombre === "consultar_disponibilidad") return { simulado: true, horarios: ["mañana 10:00", "mañana 16:30", "pasado mañana 11:00"] };
  if (nombre === "captar" && args.solo_precio !== true) {
    const llave = aceptacionReal(ultimo);
    if (!llave.ok && llave.motivo !== "vacio") {
      return { ok: false, captado: false, simulado: true, motivo: llave.motivo, nota: "Su último mensaje no es una aceptación. No captes: seguí la charla." };
    }
  }
  // Revisión 15/11: «captar» con solo_precio no cierra (en vivo pasa a una persona sin cierre).
  if (CIERRAN.has(nombre) && !(nombre === "captar" && args.solo_precio === true)) {
    const completa =
      nombre === "finalizar_consulta" ? args.resultado === "completado" : nombre === "registrar_resultado_marketing" ? args.resultado === "aprobado" : true;
    if (completa) {
      marcarCierre();
      return { ok: true, simulado: true, instruccion: instruccionCierre(area) };
    }
  }
  return { ok: true, simulado: true, nota: "Prueba: la herramienta no se ejecutó. Seguí la charla como si hubiera salido bien." };
}
