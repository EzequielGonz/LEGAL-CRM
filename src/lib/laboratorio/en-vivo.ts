/**
 * Laboratorio del bot (15/11): lo que el bot en vivo lee del laboratorio.
 *
 * Lee una sola vez por minuto (caché de 60 s por instancia, igual que el
 * conocimiento) las pruebas A/B vigentes, las versiones del laboratorio y los
 * roles aplicados por tipo de consulta o perfil. Ante cualquier error (por
 * ejemplo, si las tablas todavía no existen) devuelve el estado vacío: el bot
 * responde exactamente como hoy.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { ESTADO_VACIO, estadoDesdeFilas, type EstadoLaboratorio } from "./reglas";

const TTL_MS = 60_000;
let cache: { at: number; estado: EstadoLaboratorio } | null = null;

/** Vacía la caché (después de un cambio en el laboratorio, en esta instancia). */
export function limpiarCacheLaboratorio(): void {
  cache = null;
}

export async function estadoLaboratorio(): Promise<EstadoLaboratorio> {
  if (cache && Date.now() - cache.at <= TTL_MS) return cache.estado;
  try {
    const s = createAdminClient();
    const ahora = new Date().toISOString();
    const [pruebas, versiones, nombres, aplicaciones] = await Promise.all([
      s.from("bot_lab_pruebas_ab" as any).select("id, rubro, campaign_id, version, modelo, porcentaje, inicio, fin, cortada_at").is("cortada_at", null).gt("fin", ahora).order("inicio").order("id"),
      // El nombre de la versión vive en bot_knowledge_versions (bot_lab_versiones no lo repite).
      s.from("bot_lab_versiones" as any).select("version, base_version, rubros, modelo, tono, reglas, roles, archived_at").is("archived_at", null),
      s.from("bot_knowledge_versions" as any).select("version, nombre").gte("version", 3),
      s
        .from("bot_lab_aplicaciones" as any)
        .select("tipo, rubro, tipo_consulta, agent_roles(nombre, objetivo, tono, instrucciones, archived_at)")
        .in("tipo", ["rol_perfil", "rol_tipo_consulta"])
        .is("revertida_at", null),
    ]);
    for (const r of [pruebas, versiones, nombres, aplicaciones]) if (r.error) throw r.error;
    const estado = estadoDesdeFilas({ pruebas: pruebas.data as any[], versiones: versiones.data as any[], nombres: nombres.data as any[], aplicaciones: aplicaciones.data as any[] });
    cache = { at: Date.now(), estado };
    return estado;
  } catch (err) {
    console.error("[laboratorio] No se pudo leer el laboratorio; el bot responde como siempre:", (err as Error)?.message ?? err);
    // Se guarda el estado vacío para no reintentar en cada respuesta durante el minuto.
    cache = { at: Date.now(), estado: ESTADO_VACIO };
    return ESTADO_VACIO;
  }
}

/** Deja constancia de qué variante atendió la charla (para las comparativas y la ficha). Nunca frena la respuesta. */
export async function registrarVariante(p: { pruebaId: string; conversationId: string; variante: "prueba" | "control"; version: number; modelo: string | null }): Promise<void> {
  try {
    await createAdminClient()
      .from("bot_lab_ab_asignaciones" as any)
      .upsert({ prueba_id: p.pruebaId, conversation_id: p.conversationId, variante: p.variante, version: p.version, modelo: p.modelo }, { onConflict: "prueba_id,conversation_id", ignoreDuplicates: true });
  } catch (err) {
    console.error("[laboratorio] No se pudo registrar la variante:", (err as Error)?.message ?? err);
  }
}
