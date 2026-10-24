import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, profileIdForArea } from "@/lib/profiles";
import type { Area } from "@/lib/supabase/database.types";
import { buildSystemPrompt, criterioDelRubro } from "./prompt";
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
  let system = buildSystemPrompt(
    agente as any,
    { area: input.area, fullName: null, dniCuil: null, qualificationData: {}, campaignName: null, isFirstReplyToCampaign: !!apertura },
    identidad
  );
  const crit = criterioDelRubro(input.area, input.rubroId);
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
