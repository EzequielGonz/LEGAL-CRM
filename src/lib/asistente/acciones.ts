/**
 * Confirmar o descartar una propuesta del asistente (18/10). Solo se
 * ejecuta una vez: la propuesta pasa a «ejecutando» de forma atómica y
 * después a «ejecutada» o «error», con el resultado guardado.
 */
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { pauseCampaign, launchCampaign, CampaignNotReadyError } from "@/lib/campaigns";
import { crearCampanaBorrador, type PedidoCampana } from "@/lib/asistente/campanas";
import { asignarAgente } from "@/lib/agentes/servicio";
import { programarPiezas, type PiezaPlan } from "@/lib/redes/programar";
import { ctasDelPerfil } from "@/lib/redes/conexion";

export class AccionNoDisponible extends Error {}

/** Publicaciones por pedido: el navegador repite hasta que no queden pendientes. */
const TANDA_PUBLICACIONES = 12;

interface AvancePublicaciones {
  hechas: number;
  total: number;
  por_estado: Record<string, number>;
  en_metricool: number;
  motivos: string[];
}

async function avanzarPublicaciones(a: any): Promise<{ estado: string; resultado: AvancePublicaciones; pendientes: number }> {
  const s = createAdminClient();
  const piezas = (a.payload?.piezas ?? []) as PiezaPlan[];
  const previo: AvancePublicaciones = a.resultado?.total ? a.resultado : { hechas: 0, total: piezas.length, por_estado: {}, en_metricool: 0, motivos: [] };
  const tanda = piezas.slice(previo.hechas, previo.hechas + TANDA_PUBLICACIONES);
  const ctas = await ctasDelPerfil(a.rubro_id);
  const filas = await programarPiezas(a.rubro_id, tanda, ctas);
  const por_estado = { ...previo.por_estado };
  for (const f of filas) por_estado[f.estado] = (por_estado[f.estado] ?? 0) + 1;
  const resultado: AvancePublicaciones = {
    hechas: previo.hechas + tanda.length,
    total: piezas.length,
    por_estado,
    en_metricool: previo.en_metricool + filas.filter((f) => f.metricool === "programada").length,
    motivos: Array.from(new Set([...previo.motivos, ...(filas.map((f) => f.motivo).filter(Boolean) as string[])])).slice(0, 5),
  };
  const pendientes = Math.max(0, resultado.total - resultado.hechas);
  const estado = pendientes > 0 ? "ejecutando" : "ejecutada";
  // Avance optimista: solo si nadie más avanzó la misma tanda.
  await s.from("asistente_acciones" as any).update({ estado, resultado }).eq("id", a.id).eq("estado", "ejecutando");
  return { estado, resultado, pendientes };
}

export async function confirmarAccion(id: string): Promise<{ estado: string; resultado: unknown; pendientes?: number }> {
  const s = createAdminClient();
  const { data: tomada } = await s
    .from("asistente_acciones" as any)
    .update({ estado: "ejecutando", decidida_at: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", "propuesta")
    .select("*")
    .maybeSingle();
  let a: any = tomada;
  if (!a) {
    // Un calendario a medio programar sigue desde donde quedó.
    const { data: enCurso } = await s.from("asistente_acciones" as any).select("*").eq("id", id).eq("estado", "ejecutando").eq("tipo", "publicaciones").maybeSingle();
    a = enCurso;
    if (!a) throw new AccionNoDisponible("Esta propuesta ya se confirmó, se descartó o no existe.");
  }
  try {
    let resultado: unknown;
    if (a.tipo === "publicaciones") {
      return await avanzarPublicaciones(a);
    } else if (a.tipo === "cambio_agente") {
      const { agente_id, area, anterior, nuevo, pedido } = a.payload ?? {};
      const { data: ag } = await s.from("ai_agents").select("*").eq("id", agente_id).maybeSingle();
      if (!ag) throw new Error("El bot ya no existe.");
      if (String((ag as any).system_prompt ?? "") !== String(anterior ?? "")) throw new Error("Las instrucciones del bot cambiaron desde que se armó la propuesta. Pedí el cambio de nuevo.");
      await s.from("ai_agent_prompt_history").insert({
        agent_id: agente_id,
        area,
        display_name: (ag as any).display_name,
        system_prompt: anterior,
        qualification_criteria: (ag as any).qualification_criteria ?? {},
        required_fields: (ag as any).required_fields ?? [],
        active_at_capture: (ag as any).active === true,
        agent_updated_at: (ag as any).updated_at,
        prompt_sha256: createHash("sha256").update(String(anterior)).digest("hex"),
        note: `Antes del cambio del asistente: ${String(pedido ?? "").slice(0, 300)}`,
      });
      const { error } = await s.from("ai_agents").update({ system_prompt: nuevo, updated_at: new Date().toISOString() }).eq("id", agente_id);
      if (error) throw new Error(error.message);
      resultado = { area, aplicado: true, se_puede_deshacer: true };
    } else if (a.tipo === "pausar_campana") {
      await pauseCampaign(a.payload?.campana_id, a.payload?.motivo ?? "Pausada desde el asistente");
      resultado = { pausada: true };
    } else if (a.tipo === "crear_campana") {
      resultado = await crearCampanaBorrador(a.payload?.pedido as PedidoCampana);
    } else if (a.tipo === "asignar_linea_campana") {
      const { campana_id, line_id, template_id } = a.payload ?? {};
      const { data: camp } = await s.from("campaigns").select("id, area, status, archived_at").eq("id", campana_id).maybeSingle();
      if (!camp || (camp as any).archived_at) throw new Error("La campaña no existe o está archivada.");
      if ((camp as any).status === "en_curso") throw new Error("La campaña está en curso: pausala antes de cambiar la línea.");
      const { data: linea } = await s.from("profile_lines").select("id, rubro_id, active, use_for_campaigns").eq("id", line_id).maybeSingle();
      if (!linea || (linea as any).rubro_id !== a.rubro_id || !(linea as any).active || !(linea as any).use_for_campaigns) throw new Error("La línea no es de este perfil o no está habilitada para campañas.");
      const cambios: Record<string, unknown> = { line_id };
      if (template_id) {
        const { data: asig } = await s.from("template_assignments").select("template:whatsapp_templates(id, name)").eq("line_id", line_id).eq("purpose", "campana").eq("template_id", template_id).eq("active", true).maybeSingle();
        const tpl = (asig as any)?.template;
        if (!tpl) throw new Error("Esa plantilla no está asignada a la línea para campañas.");
        cambios.template_id = tpl.id;
        cambios.message_template_name = tpl.name;
      } else {
        cambios.template_id = null;
      }
      const { error } = await s.from("campaigns").update(cambios).eq("id", campana_id);
      if (error) throw new Error(error.message);
      resultado = { asignada: true, con_plantilla: !!template_id };
    } else if (a.tipo === "lanzar_campana") {
      try {
        const r = await launchCampaign(String(a.payload?.campana_id ?? ""));
        resultado = { lanzada: true, detalle: r };
      } catch (err) {
        if (err instanceof CampaignNotReadyError) throw new Error(`No está lista para enviar: ${err.missing.join("; ")}`.slice(0, 280));
        throw err;
      }
    } else if (a.tipo === "asignar_agente") {
      const { clave, version, estado, area, motivo } = a.payload ?? {};
      const asignacion = await asignarAgente({ rubroId: a.rubro_id, area, clave, version: Number(version), estado, motivo: String(motivo ?? "Desde el asistente").slice(0, 300), actor: "asistente" });
      resultado = { estado: (asignacion as any)?.estado ?? estado };
    } else {
      throw new Error("Tipo de propuesta desconocido.");
    }
    await s.from("asistente_acciones" as any).update({ estado: "ejecutada", resultado }).eq("id", id);
    return { estado: "ejecutada", resultado };
  } catch (err) {
    const resultado = { error: String((err as Error)?.message ?? err).slice(0, 300) };
    await s.from("asistente_acciones" as any).update({ estado: "error", resultado }).eq("id", id);
    return { estado: "error", resultado };
  }
}

export async function descartarAccion(id: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("asistente_acciones" as any)
    .update({ estado: "descartada", decidida_at: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", "propuesta")
    .select("id")
    .maybeSingle();
  return !!data;
}

/** Vuelve un bot a sus instrucciones anteriores (deshacer un cambio confirmado). */
export async function deshacerCambioBot(id: string): Promise<boolean> {
  const s = createAdminClient();
  const { data } = await s.from("asistente_acciones" as any).select("*").eq("id", id).eq("tipo", "cambio_agente").eq("estado", "ejecutada").maybeSingle();
  const a: any = data;
  if (!a) return false;
  const { data: ag } = await s.from("ai_agents").select("system_prompt").eq("id", a.payload?.agente_id).maybeSingle();
  if (!ag || String((ag as any).system_prompt) !== String(a.payload?.nuevo)) return false;
  const { error } = await s.from("ai_agents").update({ system_prompt: a.payload.anterior, updated_at: new Date().toISOString() }).eq("id", a.payload.agente_id);
  if (error) return false;
  await s.from("asistente_acciones" as any).update({ resultado: { ...(a.resultado ?? {}), deshecho: true, deshecho_at: new Date().toISOString() } }).eq("id", id);
  return true;
}
