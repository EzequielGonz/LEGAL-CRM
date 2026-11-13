/** Estadísticas por personas: lectura en el servidor (reglas en estadisticas-personas-reglas.ts). */
import { createAdminClient } from "@/lib/supabase/admin";
import { esTrabaReal, grupoPorMotivo, type GrupoPersonas } from "./estadisticas-personas-reglas";
import { indicadorPorClave, listarIndicador } from "@/lib/indicadores";

export * from "./estadisticas-personas-reglas";

export interface PersonaGrupo {
  contactId: string | null;
  conversationId: string | null;
  nombre: string | null;
  motivo: string | null;
  at: string | null;
}

export interface ResumenPersonas {
  conteos: Record<GrupoPersonas, number | null>;
  listas: Partial<Record<GrupoPersonas, PersonaGrupo[]>>;
}

const LIMITE_LISTA = 30;

/** Lee los cinco grupos de un perfil. Cada lectura falla por separado (queda «—»). */
export async function resumenPersonas(rubroId: string, areas: string[], ahora = new Date()): Promise<ResumenPersonas> {
  const s = createAdminClient();
  const conteos: ResumenPersonas["conteos"] = { por_cerrar: null, pide_persona: null, bot_trabado: null, se_enfrio: null, no_interesado: null };
  const listas: ResumenPersonas["listas"] = {};
  const hace30 = new Date(ahora.getTime() - 30 * 24 * 3_600_000).toISOString();
  const hace7 = new Date(ahora.getTime() - 7 * 24 * 3_600_000).toISOString();

  // 1) Atención: por cerrar, pidió una persona, no interesados.
  try {
    const { data, error } = await s
      .from("opportunities")
      .select("id, contact_id, conversation_id, attention_state, attention_reason, capture_state, updated_at, contacts(full_name)")
      .eq("rubro_id", rubroId)
      .not("attention_reason", "is", null)
      .gte("updated_at", hace30)
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    const filas = (data ?? []) as any[];
    const de = (g: GrupoPersonas) =>
      filas.filter((o) => {
        const grupo = grupoPorMotivo(o.attention_reason);
        if (grupo !== g) return false;
        // Los pendientes de una persona: solo si siguen esperando (no perdidos ni ya atendidos).
        if (g === "no_interesado") return true;
        return o.attention_state === "requiere_humano" && o.capture_state !== "perdido";
      });
    for (const g of ["por_cerrar", "pide_persona", "no_interesado"] as GrupoPersonas[]) {
      const lista = de(g);
      conteos[g] = lista.length;
      if (g !== "no_interesado") {
        listas[g] = lista.slice(0, LIMITE_LISTA).map((o) => ({
          contactId: o.contact_id ?? null,
          conversationId: o.conversation_id ?? null,
          nombre: o.contacts?.full_name ?? null,
          motivo: o.attention_reason ?? null,
          at: o.updated_at ?? null,
        }));
      }
    }
  } catch (err) {
    console.error("[personas] No se pudo leer la atención:", err);
  }

  // 1 bis) 13/11: «Pidieron una persona» usa la misma cuenta que «Oportunidades reales».
  try {
    const r = await listarIndicador(rubroId, indicadorPorClave("piden_persona")!);
    if (!r.error) {
      conteos.pide_persona = r.total;
      listas.pide_persona = (r.filas as any[]).slice(0, LIMITE_LISTA).map((o) => ({ contactId: o.contact_id ?? null, conversationId: o.conversation_id ?? null, nombre: o.contacts?.full_name ?? null, motivo: o.attention_reason ?? null, at: o.last_inbound_at ?? o.updated_at ?? null }));
    }
  } catch (err) {
    console.error("[personas] No se pudieron leer las oportunidades reales:", err);
  }

  // 2) Bot trabado: turnos retenidos o con error real en los últimos 7 días, por conversación.
  try {
    const { data, error } = await s
      .from("agent_turn_logs" as any)
      .select("conversation_id, resultado, error, created_at")
      .eq("rubro_id", rubroId)
      .in("resultado", ["retenido", "error"])
      .gte("created_at", hace7)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const vistos = new Map<string, any>();
    for (const t of (data ?? []) as any[]) {
      if (!t.conversation_id || vistos.has(t.conversation_id)) continue;
      if (esTrabaReal(t.resultado, t.error)) vistos.set(t.conversation_id, t);
    }
    const ids = Array.from(vistos.keys());
    conteos.bot_trabado = ids.length;
    if (ids.length) {
      const { data: convs } = await s.from("conversations").select("id, contact_id, contacts(full_name)").in("id", ids.slice(0, LIMITE_LISTA));
      listas.bot_trabado = ((convs ?? []) as any[]).map((c) => ({
        contactId: c.contact_id ?? null,
        conversationId: c.id,
        nombre: c.contacts?.full_name ?? null,
        motivo: vistos.get(c.id)?.resultado === "retenido" ? "Respuesta retenida por el control de calidad" : "El bot no pudo responder",
        at: vistos.get(c.id)?.created_at ?? null,
      }));
    }
  } catch (err) {
    console.error("[personas] No se pudo leer el bot trabado:", err);
  }

  // 3) Se enfriaron. 13/11: una sola definición, la del indicador «En seguimiento» (no escriben
  //    hace más de 3 días y el sistema todavía lo intenta). Antes contaba también a los que ya
  //    habían caído: después de la limpieza mostraba cientos.
  try {
    const r = await listarIndicador(rubroId, indicadorPorClave("dejaron_de_responder")!);
    if (r.error) throw new Error(r.error);
    conteos.se_enfrio = r.total;
    listas.se_enfrio = (r.filas as any[]).slice(0, LIMITE_LISTA).map((o) => ({
      contactId: o.contact_id ?? null,
      conversationId: o.conversation_id ?? null,
      nombre: o.contacts?.full_name ?? null,
      motivo: o.followup_next_at ? "Tiene un mensaje de seguimiento programado" : "No contesta hace más de 3 días",
      at: o.last_inbound_at ?? null,
    }));
  } catch (err) {
    console.error("[personas] No se pudo leer los que se enfriaron:", err);
  }

  return { conteos, listas };
}

/**
 * Personas distintas que escribieron desde una fecha (en lugar de contar
 * mensajes). Cuenta contactos, no conversaciones, y lee de a 1000 filas
 * (el tope de Supabase) para no quedarse corta cuando hay muchos mensajes.
 */
export async function personasQueEscribieron(areas: string[], desde: string): Promise<number | null> {
  try {
    const s = createAdminClient();
    const personas = new Set<string>();
    const LOTE = 1000;
    for (let desdeFila = 0; desdeFila < 50_000; desdeFila += LOTE) {
      const { data, error } = await s
        .from("messages")
        .select("id, conversation_id, conversations!inner(area, contact_id)")
        .eq("direction", "entrante")
        .gte("created_at", desde)
        .in("conversations.area", areas)
        .order("id", { ascending: true })
        .range(desdeFila, desdeFila + LOTE - 1);
      if (error) throw error;
      const filas = (data ?? []) as any[];
      for (const m of filas) personas.add(m.conversations?.contact_id ?? m.conversation_id);
      if (filas.length < LOTE) break;
    }
    return personas.size;
  } catch (err) {
    console.error("[personas] No se pudo contar quiénes escribieron:", err);
    return null;
  }
}
