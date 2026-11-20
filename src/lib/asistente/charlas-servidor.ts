import { createAdminClient } from "@/lib/supabase/admin";
import { CHARLAS_EN_LISTA, idsDePropuestas, refrescarPropuestas, tituloDeCharla, type AmbitoCharla, type MensajeGuardado } from "@/lib/asistente/charlas";

/**
 * Charlas guardadas del asistente (20/11): acceso a datos, solo en el
 * servidor con la clave de servicio. Las reglas están en charlas.ts.
 */

export interface CharlaEnLista {
  id: string;
  titulo: string;
  actualizada: string;
}

const tabla = (nombre: string) => createAdminClient().from(nombre as any) as any;

/** Últimas charlas sin archivar de una lista (general o Laboratorio de un perfil). */
export async function listarCharlas(a: AmbitoCharla): Promise<CharlaEnLista[]> {
  let q = tabla("asistente_charlas").select("id, titulo, updated_at").eq("ambito", a.ambito).is("archivada_at", null);
  q = a.perfil ? q.eq("perfil", a.perfil) : q.is("perfil", null);
  const { data, error } = await q.order("updated_at", { ascending: false }).limit(CHARLAS_EN_LISTA);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((c) => ({ id: c.id, titulo: c.titulo, actualizada: c.updated_at }));
}

/** Crea la charla con sus primeros mensajes. Devuelve el id. */
export async function crearCharla(a: AmbitoCharla, mensajes: MensajeGuardado[]): Promise<string> {
  // Charla y mensajes en una sola transacción (no quedan charlas vacías).
  const { data, error } = await createAdminClient().rpc("asistente_charla_crear" as any, { p_ambito: a.ambito, p_perfil: a.perfil, p_titulo: tituloDeCharla(mensajes), p_mensajes: mensajes } as any);
  if (error || !data) throw new Error(error?.message ?? "sin respuesta");
  return data as unknown as string;
}

/** Agrega mensajes a una charla existente de la misma lista. false si no existe, está archivada o es de otra lista. */
export async function agregarMensajes(id: string, a: AmbitoCharla, mensajes: MensajeGuardado[]): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("asistente_charla_agregar" as any, { p_charla: id, p_ambito: a.ambito, p_perfil: a.perfil, p_mensajes: mensajes } as any);
  if (error) throw new Error(error.message);
  return data === true;
}

/**
 * Una charla con todos sus mensajes, en orden, y cada propuesta con su
 * estado actual. null si no existe, está archivada o es de otra lista.
 */
export async function leerCharla(id: string, a: AmbitoCharla): Promise<{ id: string; titulo: string; mensajes: MensajeGuardado[] } | null> {
  const { data: c, error } = await tabla("asistente_charlas").select("id, titulo, ambito, perfil, archivada_at").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!c || c.archivada_at || c.ambito !== a.ambito || (c.perfil ?? null) !== a.perfil) return null;
  const { data: filas, error: e2 } = await tabla("asistente_charla_mensajes").select("rol, texto, propuestas, enlaces").eq("charla_id", id).order("id", { ascending: true }).limit(500);
  if (e2) throw new Error(e2.message);
  const mensajes = ((filas ?? []) as any[]).map((m) => ({ rol: m.rol, texto: m.texto, propuestas: Array.isArray(m.propuestas) ? m.propuestas : [], enlaces: Array.isArray(m.enlaces) ? m.enlaces : [] })) as MensajeGuardado[];
  const ids = idsDePropuestas(mensajes);
  if (!ids.length) return { id: c.id, titulo: c.titulo, mensajes };
  const actuales = new Map<string, any>();
  for (let i = 0; i < ids.length; i += 100) {
    const { data: acciones, error: e3 } = await tabla("asistente_acciones").select("id, tipo, titulo, resumen, estado, resultado, payload").in("id", ids.slice(i, i + 100));
    // Si falla, las propuestas se muestran como se guardaron (el servidor igual controla al confirmar).
    if (e3) console.error("[asistente/charlas] propuestas", e3.message);
    for (const x of (acciones ?? []) as any[]) actuales.set(x.id, x);
  }
  return { id: c.id, titulo: c.titulo, mensajes: mensajes.map((m) => (m.propuestas.length ? { ...m, propuestas: refrescarPropuestas(m.propuestas, actuales) } : m)) };
}

/** Archiva la charla (deja de listarse; no se borra). false si no existe, ya estaba archivada o es de otra lista. */
export async function archivarCharla(id: string, a: AmbitoCharla): Promise<boolean> {
  let q = tabla("asistente_charlas").update({ archivada_at: new Date().toISOString() }).eq("id", id).eq("ambito", a.ambito).is("archivada_at", null);
  q = a.perfil ? q.eq("perfil", a.perfil) : q.is("perfil", null);
  const { data, error } = await q.select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}
