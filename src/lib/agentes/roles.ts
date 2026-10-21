/**
 * Roles del agente por base (21/10).
 *
 * Un rol es un comportamiento guardado (nombre, objetivo, tono e
 * instrucciones) que se carga a una base para abordar a ese tipo de cliente.
 * El agente del perfil sigue respondiendo; el rol se suma a sus instrucciones
 * solo para los contactos de esa base. Se reutiliza en otras bases y se
 * edita cuando se quiera (desde Agentes o como propuesta de «Pedile algo»).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { bloqueDeRol, validarRol, type PedidoRol } from "./roles-reglas";

export { validarRol, bloqueDeRol, type PedidoRol } from "./roles-reglas";

export interface Rol {
  id: string;
  rubro_id: string;
  area: string;
  nombre: string;
  objetivo: string;
  tono: string;
  instrucciones: string;
  archived_at?: string | null;
  updated_at?: string;
}

/** Instrucciones del rol de la base del contacto (o "" si no tiene). */
export async function instruccionesDeRol(contact: { imported_base_id?: string | null }): Promise<string> {
  if (!contact?.imported_base_id) return "";
  try {
    const s = createAdminClient();
    const { data: base } = await s.from("imported_bases" as any).select("name, agent_role_id").eq("id", contact.imported_base_id).maybeSingle();
    const rolId = (base as any)?.agent_role_id;
    if (!rolId) return "";
    const { data: rol } = await s.from("agent_roles" as any).select("nombre, objetivo, tono, instrucciones, archived_at").eq("id", rolId).maybeSingle();
    if (!rol || (rol as any).archived_at) return "";
    return bloqueDeRol(rol as any, (base as any)?.name ?? null);
  } catch (err) {
    console.error("[roles] No se pudo leer el rol de la base:", err);
    return "";
  }
}

export async function listarRoles(rubroId: string, incluirArchivados = false): Promise<Rol[]> {
  let q = createAdminClient().from("agent_roles" as any).select("*").eq("rubro_id", rubroId).order("updated_at", { ascending: false });
  if (!incluirArchivados) q = q.is("archived_at", null);
  const { data } = await q;
  return (data ?? []) as unknown as Rol[];
}

/** Crea o edita un rol. Con `id`, edita (tiene que ser del mismo perfil). */
export async function guardarRol(rubroId: string, area: string, pedido: PedidoRol & { id?: string | null }, actor = "operador"): Promise<Rol> {
  const v = validarRol(pedido);
  if (!v.ok) throw new Error(v.error);
  const s = createAdminClient();
  if (pedido.id) {
    const { data, error } = await s
      .from("agent_roles" as any)
      .update({ ...v.rol, updated_at: new Date().toISOString() })
      .eq("id", String(pedido.id))
      .eq("rubro_id", rubroId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Ese rol no existe en este perfil.");
    return data as unknown as Rol;
  }
  const { data, error } = await s.from("agent_roles" as any).insert({ ...v.rol, rubro_id: rubroId, area, creado_por: actor }).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as Rol;
}

export async function archivarRol(rubroId: string, id: string, nota: string): Promise<void> {
  const s = createAdminClient();
  const { error } = await s
    .from("agent_roles" as any)
    .update({ archived_at: new Date().toISOString(), archived_note: nota.slice(0, 300) || "Archivado desde el panel" })
    .eq("id", id)
    .eq("rubro_id", rubroId);
  if (error) throw new Error(error.message);
  // Las bases que lo usaban vuelven al agente del perfil.
  await s.from("imported_bases" as any).update({ agent_role_id: null } as any).eq("agent_role_id", id);
}

/** Carga (o saca, con rolId null) un rol a una base del mismo perfil. */
export async function asignarRolABase(rubroId: string, areas: string[], baseId: string, rolId: string | null): Promise<void> {
  const s = createAdminClient();
  const { data: base } = await s.from("imported_bases" as any).select("id, area").eq("id", baseId).maybeSingle();
  if (!base || !areas.includes((base as any).area)) throw new Error("La base no es de este perfil.");
  if (rolId) {
    const { data: rol } = await s.from("agent_roles" as any).select("id, rubro_id, archived_at").eq("id", rolId).maybeSingle();
    if (!rol || (rol as any).rubro_id !== rubroId || (rol as any).archived_at) throw new Error("El rol no es de este perfil o está archivado.");
  }
  const { error } = await s.from("imported_bases" as any).update({ agent_role_id: rolId } as any).eq("id", baseId);
  if (error) throw new Error(error.message);
}
