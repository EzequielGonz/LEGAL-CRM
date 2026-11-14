/**
 * Informe de mejoras del bot (14/11): acceso a datos y a la IA.
 *
 * Genera el informe (lee conversaciones reales del perfil, las limpia y se
 * las pasa a Gemini) y aplica una propuesta: suma una ficha de conocimiento
 * al bot del perfil (agente base) o crea un rol nuevo sin asignar. Nunca
 * envía mensajes, nunca edita ni borra fichas, roles o instrucciones que ya
 * existen, y todo queda en ops_change_log.
 */
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { leerFichaNegocio } from "@/lib/agentes/ficha-negocio";
import { guardarRol } from "@/lib/agentes/roles";
import { limpiarCacheConocimiento } from "@/lib/conocimiento/servicio";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import {
  fichaDesdePropuesta,
  juntarTranscripciones,
  metricasDelPeriodo,
  normalizarPropuesta,
  normalizarResultado,
  promptInforme,
  type ConversacionInforme,
  type DestinoPropuesta,
  type Propuesta,
  type ResultadoInforme,
} from "./informe-mejoras-reglas";

export const AREAS_POR_PERFIL: Record<RubroSlug, string[]> = {
  juridico: ["civil", "penal"],
  agencia_0km: ["agencia_0km"],
  coberturas_medicas: ["coberturas_medicas"],
  marketing: ["marketing"],
};

export interface InformeMejora {
  id: string;
  creado_at: string;
  creado_por: string;
  dias: number;
  conversaciones: number;
  modelo: string | null;
  estado: "listo" | "error";
  resultado: ResultadoInforme | Record<string, never>;
  metricas: Record<string, number>;
  aplicadas: { indice: number; destino: DestinoPropuesta; ref: string; at: string; por: string }[];
  error: string | null;
}

const COLUMNAS = "id, creado_at, creado_por, dias, conversaciones, modelo, estado, resultado, metricas, aplicadas, error";

export class InformeError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "InformeError";
  }
}

async function enTandas<T>(ids: string[], tam: number, f: (parte: string[]) => Promise<T[]>): Promise<T[]> {
  const salida: T[] = [];
  for (let i = 0; i < ids.length; i += tam) salida.push(...(await f(ids.slice(i, i + tam))));
  return salida;
}

/** Conversaciones del período con al menos un mensaje de la persona, las más ricas primero. */
async function conversacionesDelPeriodo(slug: RubroSlug, desde: Date): Promise<ConversacionInforme[]> {
  const s = createAdminClient();
  const { data: convs, error } = await s
    .from("conversations")
    .select("id, contact_id, last_message_at")
    .in("area", AREAS_POR_PERFIL[slug] as any)
    .gte("last_message_at", desde.toISOString())
    .order("last_message_at", { ascending: false })
    .limit(400);
  if (error) throw error;
  const lista = (convs ?? []) as any[];
  if (!lista.length) return [];
  const ids = lista.map((c) => c.id as string);
  const mensajes = await enTandas(ids, 80, async (parte) => {
    const { data, error: e } = await s
      .from("messages")
      .select("conversation_id, direction, sender_type, origin, body, audio_texto, created_at")
      .in("conversation_id", parte)
      .gte("created_at", desde.toISOString())
      .order("created_at", { ascending: true })
      .limit(5000);
    if (e) throw e;
    return (data ?? []) as any[];
  });
  const contactoIds = [...new Set(lista.map((c) => c.contact_id).filter(Boolean))] as string[];
  const contactos = await enTandas(contactoIds, 120, async (parte) => {
    const { data } = await s.from("contacts").select("id, full_name, status").in("id", parte);
    return (data ?? []) as any[];
  });
  const porContacto = new Map(contactos.map((c) => [c.id, c]));
  const porConv = new Map<string, any[]>();
  for (const m of mensajes) {
    const arr = porConv.get(m.conversation_id) ?? [];
    arr.push(m);
    porConv.set(m.conversation_id, arr);
  }
  return lista
    .map((c) => {
      const contacto = porContacto.get(c.contact_id);
      return {
        id: c.id,
        estado: contacto?.status ?? null,
        nombres: contacto?.full_name ? [String(contacto.full_name)] : [],
        mensajes: porConv.get(c.id) ?? [],
      } as ConversacionInforme;
    })
    .filter((c) => c.mensajes.some((m) => m.direction === "entrante"))
    .sort((a, b) => b.mensajes.filter((m) => m.direction === "entrante").length - a.mensajes.filter((m) => m.direction === "entrante").length);
}

async function contextoDelBot(slug: RubroSlug): Promise<{ ficha: string; instrucciones: string; fichas: string[] }> {
  const s = createAdminClient();
  const [ficha, agentes, items] = await Promise.all([
    leerFichaNegocio(RUBRO_IDS[slug]),
    s.from("ai_agents").select("area, system_prompt").in("area", AREAS_POR_PERFIL[slug] as any),
    s.from("bot_knowledge_items" as any).select("titulo, rubro, activo").eq("version", 2).eq("activo", true),
  ]);
  const instrucciones = ((agentes.data ?? []) as any[]).map((a) => `[${a.area}]\n${String(a.system_prompt ?? "")}`).join("\n\n");
  const fichas = ((items.data ?? []) as any[]).filter((i) => i.rubro === slug || i.rubro === "comun" || i.rubro === null).map((i) => String(i.titulo));
  return { ficha, instrucciones, fichas };
}

/** Genera y guarda un informe. Llama a la IA una vez. No envía mensajes ni cambia el bot. */
export async function generarInforme(slug: RubroSlug, dias: number, actor: string): Promise<InformeMejora> {
  const d = Math.max(1, Math.min(90, Math.round(Number(dias) || 14)));
  const desde = new Date(Date.now() - d * 86_400_000);
  const s = createAdminClient();
  const [convs, ctx] = await Promise.all([conversacionesDelPeriodo(slug, desde), contextoDelBot(slug)]);
  const metricas = metricasDelPeriodo(convs);
  const { texto, usadas } = juntarTranscripciones(convs);
  if (usadas < 3) throw new InformeError(`En los últimos ${d} días hay ${usadas} conversación(es) con respuesta de personas: hacen falta al menos 3 para un informe útil. Probá con más días.`);
  if (!(process.env.GEMINI_API_KEY ?? "").trim()) throw new InformeError("La IA no está configurada en este entorno.", 503);
  const modelo = identificadorModelo();
  const fila: Record<string, unknown> = { rubro_id: RUBRO_IDS[slug], creado_por: actor, dias: d, conversaciones: usadas, modelo, metricas };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const r: any = await ai.models.generateContent({
      model: modelo,
      contents: [{ role: "user", parts: [{ text: promptInforme({ slug, dias: d, ficha: ctx.ficha, instrucciones: ctx.instrucciones, fichasExistentes: ctx.fichas, transcripciones: texto, usadas }) }] }],
      config: { responseMimeType: "application/json" },
    });
    const crudo = (r.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
    const u = r.usageMetadata ?? {};
    Object.assign(fila, {
      estado: "listo",
      resultado: normalizarResultado(crudo),
      tokens_entrada: u.promptTokenCount ?? null,
      tokens_salida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) || null,
    });
  } catch (err) {
    console.error("[informe-bot] Falló la IA:", err);
    Object.assign(fila, { estado: "error", error: String((err as Error)?.message ?? err).slice(0, 300) });
  }
  const { data, error } = await (s.from("bot_informes_mejora" as any) as any).insert(fila).select(COLUMNAS).single();
  if (error) throw error;
  return data as InformeMejora;
}

export async function listarInformes(slug: RubroSlug, limite = 5): Promise<InformeMejora[]> {
  const { data, error } = await (createAdminClient().from("bot_informes_mejora" as any) as any)
    .select(COLUMNAS)
    .eq("rubro_id", RUBRO_IDS[slug])
    .order("creado_at", { ascending: false })
    .limit(Math.max(1, Math.min(20, limite)));
  if (error) throw error;
  return (data ?? []) as InformeMejora[];
}

/**
 * Aplica una propuesta del informe. «conocimiento» suma una ficha nueva al bot
 * del perfil (activa en la versión 2); «rol» crea un rol nuevo sin asignar.
 * `cambios` permite corregir el texto a mano antes de aplicar.
 */
export async function aplicarPropuesta(input: {
  slug: RubroSlug;
  informeId: string;
  indice: number;
  destino: DestinoPropuesta;
  cambios?: { titulo?: unknown; contenido?: unknown; disparadores?: unknown };
  actor: string;
}): Promise<{ destino: DestinoPropuesta; ref: string; titulo: string }> {
  const s = createAdminClient();
  const { data: inf, error } = await (s.from("bot_informes_mejora" as any) as any).select("id, rubro_id, resultado, aplicadas").eq("id", input.informeId).maybeSingle();
  if (error) throw error;
  if (!inf || inf.rubro_id !== RUBRO_IDS[input.slug]) throw new InformeError("Ese informe no es de este perfil.", 404);
  const original = (inf.resultado?.propuestas ?? [])[input.indice];
  if (!original) throw new InformeError("Esa propuesta no existe en el informe.", 404);
  const aplicadas = Array.isArray(inf.aplicadas) ? inf.aplicadas : [];
  if (aplicadas.some((a: any) => a.indice === input.indice && a.destino === input.destino)) throw new InformeError("Esta propuesta ya se aplicó así. Si querés otra versión, editala desde Conocimiento o Roles.", 409);
  const c = input.cambios ?? {};
  const propuesta: Propuesta | null = normalizarPropuesta({
    ...original,
    destino: input.destino,
    ...(typeof c.titulo === "string" && c.titulo.trim() ? { titulo: c.titulo } : {}),
    ...(typeof c.contenido === "string" && c.contenido.trim() ? { contenido: c.contenido } : {}),
    ...(Array.isArray(c.disparadores) ? { disparadores: c.disparadores } : {}),
  });
  if (!propuesta) throw new InformeError("El texto no es válido: revisá que tenga título, al menos una frase, dos disparadores (si es una ficha) y ningún teléfono, documento ni correo.");

  let ref: string;
  const ahora = new Date();
  if (input.destino === "conocimiento") {
    const fila = fichaDesdePropuesta(propuesta, { informeId: inf.id, indice: input.indice, rubro: input.slug, fecha: ahora, actor: input.actor });
    const { error: e } = await (s.from("bot_knowledge_items" as any) as any).insert(fila);
    if (e) throw new InformeError(e.code === "23505" ? "Esta propuesta ya se sumó al bot." : "No se pudo sumar la ficha.", e.code === "23505" ? 409 : 500);
    limpiarCacheConocimiento();
    ref = fila.clave;
    await s.from("ops_change_log" as any).insert({ actor: input.actor, action: "conocimiento_alta_informe", target: fila.clave, before: null, after: fila, note: `Ficha sumada al bot de ${input.slug} desde el informe de mejoras ${inf.id}. Para apagarla: Conocimiento → desactivar.` });
  } else {
    const rol = await guardarRol(RUBRO_IDS[input.slug], AREAS_POR_PERFIL[input.slug][0], { nombre: propuesta.titulo, objetivo: propuesta.objetivo, tono: propuesta.tono, instrucciones: propuesta.contenido }, input.actor);
    ref = rol.id;
    await s.from("ops_change_log" as any).insert({ actor: input.actor, action: "rol_alta_informe", target: rol.id, before: null, after: rol, note: `Rol nuevo de ${input.slug} desde el informe de mejoras ${inf.id}. Queda sin asignar: se carga a una base o campaña desde Bot IA.` });
  }
  const nueva = { indice: input.indice, destino: input.destino, ref, at: ahora.toISOString(), por: input.actor };
  await (s.from("bot_informes_mejora" as any) as any).update({ aplicadas: [...aplicadas, nueva] }).eq("id", inf.id);
  return { destino: input.destino, ref, titulo: propuesta.titulo };
}

/**
 * Suma una ficha de conocimiento nueva al bot del perfil sin informe de por
 * medio (la usa el asistente del panel). Solo alta: nunca edita las que hay.
 */
export async function sumarFichaDirecta(input: {
  slug: RubroSlug;
  titulo: unknown;
  contenido: unknown;
  capa?: unknown;
  disparadores?: unknown;
  actor: string;
}): Promise<{ clave: string; titulo: string }> {
  const propuesta = normalizarPropuesta({ titulo: input.titulo, contenido: input.contenido, capa: input.capa, disparadores: input.disparadores, destino: "conocimiento" });
  if (!propuesta) throw new InformeError("La ficha no es válida: tiene que tener título, al menos una frase, dos disparadores (salvo que valga para todas las charlas) y ningún teléfono, documento ni correo.");
  const ahora = new Date();
  const fila = fichaDesdePropuesta(propuesta, { informeId: crypto.randomUUID(), indice: 0, rubro: input.slug, fecha: ahora, actor: input.actor });
  fila.fuente = `asistente ${fila.fuente.replace(/^informe IA /, "")}`;
  const s = createAdminClient();
  const { error } = await (s.from("bot_knowledge_items" as any) as any).insert(fila);
  if (error) throw new InformeError("No se pudo sumar la ficha.", 500);
  limpiarCacheConocimiento();
  await s.from("ops_change_log" as any).insert({ actor: input.actor, action: "conocimiento_alta_asistente", target: fila.clave, before: null, after: fila, note: `Ficha sumada al bot de ${input.slug} desde el asistente. Para apagarla: Conocimiento → desactivar.` });
  return { clave: fila.clave, titulo: fila.titulo };
}
