import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, profileIdForArea } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";
import { rubroSlugDe } from "@/lib/captacion";
import { CRITERIO_POR_RUBRO } from "@/lib/captacion/reglas";
import { reglaDeRechazo } from "@/lib/captacion/insistencia";
import { GUIA_CAPTACION_Y_CIERRE } from "@/lib/agentes/guia-cierre";
import { instruccionesDeRol } from "@/lib/agentes/roles";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { bloqueHorarioAtencion } from "@/lib/horario-atencion";
import { toolsForArea } from "./tools";

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
 * Para el programador: el armado replica buildSystemPrompt y
 * criterioDelRubro de agent.ts sin tocar ese archivo (el que responde en
 * producción). Si cambian ahí, conviene mover esas dos funciones a un
 * módulo común e importarlas desde los dos lados.
 */

function criterio(area: Area, rubroId: string | null): string {
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
    ...reglaDeRechazo(slug),
    "- Si pide una persona, pregunta algo fuera de tu alcance o comparte datos sensibles: usá escalar_a_humano con la categoría que corresponda.",
  ]
    .filter(Boolean)
    .join("\n");
}

function promptBase(agent: { system_prompt: string; qualification_criteria: string[]; required_fields: string[] }, area: Area, conApertura: boolean, identidad: { presentationName: string; brandName: string }) {
  return [
    `Te presentás como ${identidad.presentationName}, de ${identidad.brandName}. No uses otro nombre ni otra marca, no inventes una persona real, matrícula ni disponibilidad humana, y si te preguntan si sos una automatización respondé con la verdad.`,
    "",
    agent.system_prompt,
    "",
    "Criterios de calificación comercial (evaluá contra esto con la herramienta evaluar_calificacion):",
    ...(agent.qualification_criteria ?? []).map((c) => `- ${c}`),
    "",
    "Datos que tenés que recolectar (usá guardar_datos_calificacion a medida que los obtengas):",
    ...(agent.required_fields ?? []).map((f) => `- ${f}`),
    "",
    "Todavía no hay datos previos cargados de este prospecto.",
    "",
    conApertura
      ? area !== "penal"
        ? "Este prospecto viene de una campaña: el mensaje inicial ya se lo mandamos nosotros en tu nombre y ahora te está respondiendo por primera vez. Seguí desde ahí, de forma natural, según el guión de tu rol."
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

let _cliente: GoogleGenAI | null = null;
function gemini() {
  if (!_cliente) _cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _cliente;
}

export interface TurnoPrueba {
  rol: "persona" | "bot";
  texto: string;
  herramientas: string[];
}

export async function probarBotReal(input: { area: Area; rubroId: string | null; baseId?: string | null; mensajes: string[]; apertura?: string | null }): Promise<{
  turnos: TurnoPrueba[];
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
  let system = promptBase(agente as any, input.area, !!apertura, identidad);
  const crit = criterio(input.area, input.rubroId);
  if (crit) system = `${system}\n\n${crit}`;
  const rol = input.baseId ? await instruccionesDeRol({ imported_base_id: input.baseId }) : "";
  if (rol) system = `${system}\n\n${rol}`;
  system = `${system}\n\n${GUIA_CAPTACION_Y_CIERRE}\n\n${bloqueHorarioAtencion(new Date())}`;

  const tools = toolsForArea(input.area);
  const modelo = identificadorModelo();
  const contents: Content[] = apertura ? [{ role: "model", parts: [{ text: apertura }] }] : [];
  const turnos: TurnoPrueba[] = apertura ? [{ rol: "bot", texto: apertura, herramientas: [] }] : [];
  const tokens = { entrada: 0, salida: 0 };
  let modeloRespuesta: string | null = null;

  for (const m of input.mensajes.slice(0, 8)) {
    contents.push({ role: "user", parts: [{ text: m }] });
    turnos.push({ rol: "persona", texto: m, herramientas: [] });
    const usadas: string[] = [];
    let texto = "";
    for (let i = 0; i < 4; i++) {
      const r = await gemini().models.generateContent({ model: modelo, contents, config: { systemInstruction: system, tools: [{ functionDeclarations: tools as any }] } });
      const u: any = (r as any).usageMetadata ?? {};
      tokens.entrada += u.promptTokenCount ?? 0;
      tokens.salida += u.candidatesTokenCount ?? 0;
      modeloRespuesta = (r as any).modelVersion ?? modeloRespuesta;
      const parts: Part[] = r.candidates?.[0]?.content?.parts ?? [];
      texto = parts
        .filter((p) => typeof p.text === "string")
        .map((p) => p.text)
        .join("\n")
        .trim();
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
              response:
                nombre === "consultar_disponibilidad"
                  ? { simulado: true, horarios: ["mañana 10:00", "mañana 16:30", "pasado mañana 11:00"] }
                  : { ok: true, simulado: true, nota: "Prueba: la herramienta no se ejecutó. Seguí la charla como si hubiera salido bien." },
            },
          };
        }),
      });
    }
    turnos.push({ rol: "bot", texto: texto || "(sin texto)", herramientas: usadas });
  }
  return { turnos, rol: rol || null, modelo: modeloRespuesta ?? modelo, tokens };
}
