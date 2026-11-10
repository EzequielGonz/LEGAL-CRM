import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";
import { envPrefixForArea } from "@/lib/rubros";
import { profileIdForArea } from "@/lib/profiles";

/**
 * Paso de líneas de Meta a Wasender (10/11, bloque 2).
 *
 * Cuando un número sale de Meta y se conecta en Wasender, la responsable
 * marca en la línea de Wasender qué línea de Meta reemplaza. Desde ese
 * momento, todo lo que el panel le escribe a los chats de esa línea de Meta
 * (bot, chat manual, citas, recontacto) sale por la línea de Wasender. Es una
 * decisión explícita: el panel nunca pasa solo un chat de una línea a otra.
 * La línea de Meta no se modifica ni se borra.
 */

type Db = ReturnType<typeof createAdminClient>;

/** Prefijo de la conexión de siempre del área (la que usa Meta cuando el chat no tiene línea). */
export function claveMetaDelArea(area: Area | string): string {
  return envPrefixForArea(area);
}

/**
 * Línea de Meta por la que hoy sale un chat. Pura: se prueba sola.
 * Igual que el envío por Meta: la línea del chat si está activa; si no, la
 * conexión de siempre del área.
 */
export function lineaMetaEfectiva(
  conv: { area: Area | string; line_id: string | null; linea: { active: boolean } | null },
  lineasMeta: { id: string; credential_key: string }[]
): string | null {
  if (conv.line_id && conv.linea?.active) return conv.line_id;
  const clave = claveMetaDelArea(conv.area);
  return lineasMeta.find((l) => l.credential_key === clave)?.id ?? null;
}

/** Línea de Wasender que reemplaza a la línea de Meta de este chat, o null si no hay equivalencia. */
export async function reemplazoDeConversacion(conversationId: string, supabase: Db = createAdminClient()): Promise<string | null> {
  const { data: conv, error } = await supabase
    .from("conversations")
    .select("area, line_id, profile_lines(active)")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!conv) return null;
  const { data: lineasMeta } = await supabase.from("profile_lines").select("id, credential_key");
  const metaId = lineaMetaEfectiva(
    { area: (conv as any).area, line_id: (conv as any).line_id ?? null, linea: (conv as any).profile_lines ?? null },
    ((lineasMeta ?? []) as any[]).map((l) => ({ id: l.id, credential_key: l.credential_key }))
  );
  if (!metaId) return null;
  return lineaQueReemplaza(metaId, supabase);
}

export async function lineaQueReemplaza(lineaMetaId: string, supabase: Db = createAdminClient()): Promise<string | null> {
  const { data } = await (supabase.from("wasender_lineas" as any) as any)
    .select("id")
    .eq("reemplaza_linea_meta_id", lineaMetaId)
    .is("archivada_at", null)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

/** Línea de Meta de la conexión de siempre del área (la que reciben los chats sin línea). */
async function lineaMetaDelArea(area: Area, supabase: Db): Promise<string | null> {
  const { data } = await supabase.from("profile_lines").select("id").eq("credential_key", claveMetaDelArea(area)).limit(1).maybeSingle();
  return (data as any)?.id ?? null;
}

export type DestinoAviso = { proveedor: "wasender"; lineaId: string; obligatorio: boolean } | { proveedor: "meta" };

/**
 * Por dónde salen los avisos internos al equipo de un área. Pura: se prueba sola.
 * 1) La línea de Wasender marcada «para avisos» en el perfil.
 * 2) Si no hay, la que reemplaza a la conexión de siempre del área.
 * 3) Si no hay ninguna, por Meta, como siempre.
 * «obligatorio»: la conexión de Meta del área ya fue reemplazada, así que si
 * la línea de Wasender no puede enviar no tiene sentido intentar por Meta.
 */
export function decidirDestinoAviso(d: { lineaAvisos: string | null; reemplazoDelArea: string | null }): DestinoAviso {
  if (d.lineaAvisos) return { proveedor: "wasender", lineaId: d.lineaAvisos, obligatorio: !!d.reemplazoDelArea };
  if (d.reemplazoDelArea) return { proveedor: "wasender", lineaId: d.reemplazoDelArea, obligatorio: true };
  return { proveedor: "meta" };
}

export async function destinoAviso(area: Area, supabase: Db = createAdminClient()): Promise<DestinoAviso> {
  const rubroId = profileIdForArea(area);
  const [avisos, metaArea] = await Promise.all([
    rubroId
      ? (supabase.from("wasender_lineas" as any) as any)
          .select("id")
          .eq("rubro_id", rubroId)
          .eq("para_avisos", true)
          .is("archivada_at", null)
          .maybeSingle()
          .then((r: any) => r.data?.id ?? null)
      : Promise.resolve(null),
    lineaMetaDelArea(area, supabase),
  ]);
  const reemplazo = metaArea ? await lineaQueReemplaza(metaArea, supabase) : null;
  return decidirDestinoAviso({ lineaAvisos: avisos, reemplazoDelArea: reemplazo });
}
