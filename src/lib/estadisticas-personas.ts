/** Estadísticas por personas: lectura en el servidor (reglas en estadisticas-personas-reglas.ts). */
import { createAdminClient } from "@/lib/supabase/admin";
import { esTrabaReal, grupoPorMotivo, seEnfrio, type GrupoPersonas } from "./estadisticas-personas-reglas";

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

  // 3) Se enfrió: respondieron alguna vez, lo último fue nuestro y pasaron +48 h.
  try {
    const { data: opps, error } = await s
      .from("opportunities")
      .select("conversation_id, contact_id, contact_state, capture_state, attention_reason, contacts(full_name)")
      .eq("rubro_id", rubroId)
      .eq("contact_state", "respondio")
      .is("attention_reason", null)
      .not("capture_state", "in", "(captado,perdido)")
      .gte("updated_at", hace30)
      .limit(400);
    if (error) throw error;
    const filas = ((opps ?? []) as any[]).filter((o) => o.conversation_id);
    const ids = filas.map((o) => o.conversation_id);
    const ultimos = new Map<string, { direction: string; created_at: string }>();
    for (let i = 0; i < ids.length; i += 100) {
      const lote = ids.slice(i, i + 100);
      const { data: msgs } = await s
        .from("messages")
        .select("conversation_id, direction, created_at")
        .in("conversation_id", lote)
        .gte("created_at", hace30)
        .order("created_at", { ascending: false })
        .limit(2000);
      for (const m of (msgs ?? []) as any[]) if (!ultimos.has(m.conversation_id)) ultimos.set(m.conversation_id, m);
    }
    const frias = filas.filter((o) => {
      const u = ultimos.get(o.conversation_id);
      return seEnfrio({ respondio: true, ultimoEsNuestro: u?.direction === "saliente", ultimoAt: u?.created_at ?? null }, ahora);
    });
    conteos.se_enfrio = frias.length;
    listas.se_enfrio = frias.slice(0, LIMITE_LISTA).map((o) => ({
      contactId: o.contact_id ?? null,
      conversationId: o.conversation_id,
      nombre: o.contacts?.full_name ?? null,
      motivo: "No contesta desde hace más de 48 h",
      at: ultimos.get(o.conversation_id)?.created_at ?? null,
    }));
  } catch (err) {
    console.error("[personas] No se pudo leer los que se enfriaron:", err);
  }

  return { conteos, listas };
}

/** Personas distintas que escribieron desde una fecha (en lugar de contar mensajes). */
export async function personasQueEscribieron(areas: string[], desde: string): Promise<number | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("messages")
      .select("conversation_id, conversations!inner(area)")
      .eq("direction", "entrante")
      .gte("created_at", desde)
      .in("conversations.area", areas)
      .limit(20000);
    if (error) throw error;
    return new Set(((data ?? []) as any[]).map((m) => m.conversation_id)).size;
  } catch (err) {
    console.error("[personas] No se pudo contar quiénes escribieron:", err);
    return null;
  }
}
