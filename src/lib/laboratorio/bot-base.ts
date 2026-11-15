/**
 * Bot de base de cada perfil (15/11): las instrucciones del bot que responde
 * HOY (ai_agents). Se cambian solo a mano desde el laboratorio, con
 * confirmación. Antes de cada cambio se guarda lo anterior en
 * ai_agent_prompt_history (igual que el cambio del asistente) y queda una
 * línea en ops_change_log con antes y después. «Volver a la anterior» repone
 * la última versión guardada distinta de la actual. No envía nada.
 */
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { LaboratorioError } from "./servicio";
import { limpiarCacheLaboratorio } from "./en-vivo";
import { AREAS_DEL_RUBRO, type Rubro } from "./reglas";
import { validarInstrucciones } from "./simple";

export interface BotBase {
  id: string;
  area: string;
  nombre: string;
  instrucciones: string;
  actualizado: string | null;
  sePuedeVolver: boolean;
}

async function agentesDe(rubro: Rubro) {
  const { data, error } = await createAdminClient().from("ai_agents").select("*").in("area", AREAS_DEL_RUBRO[rubro] as any);
  if (error) throw error;
  return (data ?? []) as any[];
}

async function anteriorDe(agenteId: string, actual: string): Promise<string | null> {
  const { data } = await createAdminClient().from("ai_agent_prompt_history").select("system_prompt").eq("agent_id", agenteId).order("captured_at", { ascending: false }).limit(10);
  const fila = ((data ?? []) as any[]).find((h) => String(h.system_prompt ?? "") !== actual);
  return fila ? String(fila.system_prompt) : null;
}

export async function botsDeBase(rubro: Rubro): Promise<BotBase[]> {
  const agentes = await agentesDe(rubro);
  return Promise.all(
    agentes.map(async (a) => {
      const instrucciones = String(a.system_prompt ?? "");
      return { id: a.id, area: a.area, nombre: a.display_name ?? a.area, instrucciones, actualizado: a.updated_at ?? null, sePuedeVolver: !!(await anteriorDe(a.id, instrucciones)) };
    })
  );
}

async function guardarHistoria(ag: any, nota: string) {
  const anterior = String(ag.system_prompt ?? "");
  const { error } = await createAdminClient().from("ai_agent_prompt_history").insert({
    agent_id: ag.id,
    area: ag.area,
    display_name: ag.display_name,
    system_prompt: anterior,
    qualification_criteria: ag.qualification_criteria ?? {},
    required_fields: ag.required_fields ?? [],
    active_at_capture: ag.active === true,
    agent_updated_at: ag.updated_at,
    prompt_sha256: createHash("sha256").update(anterior).digest("hex"),
    note: nota.slice(0, 300),
  } as any);
  if (error) throw error;
}

async function escribir(ag: any, nuevo: string, accion: string, nota: string, actor: string) {
  const s = createAdminClient();
  await guardarHistoria(ag, nota);
  // Solo si nadie lo cambió mientras tanto.
  const { data, error } = await s.from("ai_agents").update({ system_prompt: nuevo, updated_at: new Date().toISOString() }).eq("id", ag.id).eq("system_prompt", ag.system_prompt).select("id");
  if (error) throw error;
  if (!(data ?? []).length) throw new LaboratorioError("Las instrucciones cambiaron mientras tanto. Recargá y probá de nuevo.", 409);
  const { error: e2 } = await s.from("ops_change_log").insert({ actor, action: accion, target: `ai_agents:${ag.id}`, before: { system_prompt: ag.system_prompt }, after: { system_prompt: nuevo }, note: nota } as any);
  if (e2) throw e2;
  limpiarCacheLaboratorio();
}

async function agenteDelPerfil(rubro: Rubro, agenteId: string) {
  const ag = (await agentesDe(rubro)).find((a) => a.id === agenteId);
  if (!ag) throw new LaboratorioError("Ese bot no es de este perfil.", 404);
  return ag;
}

/** Cambia las instrucciones del bot de base. `anterior` es lo que se veía en pantalla: si no coincide, no pisa. */
export async function cambiarInstrucciones(rubro: Rubro, agenteId: string, nuevo: unknown, anterior: unknown, actor: string) {
  const ag = await agenteDelPerfil(rubro, agenteId);
  const v = validarInstrucciones(nuevo, String(ag.system_prompt ?? ""));
  if (!v.ok) throw new LaboratorioError(v.error);
  if (String(ag.system_prompt ?? "") !== String(anterior ?? "")) throw new LaboratorioError("Las instrucciones cambiaron desde que abriste la pantalla. Recargá y probá de nuevo.", 409);
  if (v.texto === String(ag.system_prompt ?? "")) throw new LaboratorioError("No cambiaste nada.");
  await escribir(ag, v.texto, "laboratorio_instrucciones_bot", "Laboratorio: instrucciones del bot de base cambiadas a mano.", actor);
  return { ok: true };
}

/** Vuelve a las instrucciones anteriores (la última guardada distinta de la actual). */
export async function volverInstrucciones(rubro: Rubro, agenteId: string, actor: string) {
  const ag = await agenteDelPerfil(rubro, agenteId);
  const anterior = await anteriorDe(ag.id, String(ag.system_prompt ?? ""));
  if (!anterior) throw new LaboratorioError("No hay instrucciones anteriores guardadas para este bot.");
  await escribir(ag, anterior, "laboratorio_volver_instrucciones_bot", "Laboratorio: el bot de base volvió a sus instrucciones anteriores.", actor);
  return { ok: true };
}

