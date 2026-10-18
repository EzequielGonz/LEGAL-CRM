/**
 * Conexión de cada perfil con sus redes (18/10): marca de Metricool, si se
 * publica solo o no, y los llamados a la acción con origen. Se guarda en la
 * política de contenido de Instagram y Facebook del perfil (la misma que
 * revisa la cola antes de publicar).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { credencialesMetricool } from "@/lib/redes/metricool";
import { enlaceWhatsAppOrigen, identificadoresDeRedes, unirIdentificadores } from "@/lib/redes/ctas";
import type { CtaCanal } from "@/lib/redes/programar";

export const CANALES_REDES = ["instagram", "facebook"] as const;
export type CanalRed = (typeof CANALES_REDES)[number];

export interface EstadoConexion {
  metricoolConfigurado: boolean;
  blogId: string | null;
  publicarSolo: boolean;
  whatsapp: string | null;
  enlaces: Record<CanalRed | "landing", string | null>;
  canales: Record<CanalRed, { habilitada: boolean; pausada: boolean; proveedor: string | null }>;
}

async function whatsappDelPerfil(rubroId: string): Promise<string | null> {
  const { data } = await createAdminClient().from("brand_briefs").select("contacto").eq("rubro_id", rubroId).maybeSingle();
  const c = (data as any)?.contacto ?? {};
  return typeof c.whatsapp === "string" && c.whatsapp.trim() ? c.whatsapp.trim() : typeof c.telefono === "string" ? c.telefono : null;
}

export async function leerConexion(rubroId: string): Promise<EstadoConexion> {
  const [{ data: pols }, whatsapp] = await Promise.all([
    createAdminClient().from("content_policies").select("canal, habilitada, calendario_pausado, proveedor, destino_ref").eq("rubro_id", rubroId).in("canal", CANALES_REDES as unknown as string[]),
    whatsappDelPerfil(rubroId),
  ]);
  const por = new Map(((pols ?? []) as any[]).map((p) => [p.canal, p]));
  const canales = Object.fromEntries(
    CANALES_REDES.map((c) => {
      const p = por.get(c);
      return [c, { habilitada: p?.habilitada === true, pausada: p ? p.calendario_pausado !== false : true, proveedor: p?.proveedor ?? null }];
    })
  ) as EstadoConexion["canales"];
  const blogId = (por.get("instagram")?.destino_ref ?? por.get("facebook")?.destino_ref ?? null) as string | null;
  return {
    metricoolConfigurado: !!credencialesMetricool(),
    blogId,
    publicarSolo: CANALES_REDES.every((c) => canales[c].habilitada && !canales[c].pausada),
    whatsapp,
    enlaces: {
      instagram: enlaceWhatsAppOrigen(whatsapp, "instagram"),
      facebook: enlaceWhatsAppOrigen(whatsapp, "facebook"),
      landing: enlaceWhatsAppOrigen(whatsapp, "landing"),
    },
    canales,
  };
}

/** Guarda la marca de Metricool y si se publica solo. Suma los identificadores de origen. */
export async function guardarConexion(rubroId: string, input: { blogId: string | null; publicarSolo: boolean }): Promise<EstadoConexion> {
  const supabase = createAdminClient();
  const blogId = input.blogId && /^\d{3,15}$/.test(input.blogId.trim()) ? input.blogId.trim() : null;
  const whatsapp = await whatsappDelPerfil(rubroId);
  const ahora = new Date().toISOString();
  for (const canal of CANALES_REDES) {
    const enlace = enlaceWhatsAppOrigen(whatsapp, canal);
    const fila = {
      rubro_id: rubroId,
      canal,
      proveedor: "metricool",
      destino_ref: blogId,
      habilitada: input.publicarSolo && !!blogId,
      calendario_pausado: !(input.publicarSolo && !!blogId),
      ctas: enlace ? [{ tipo: "whatsapp", url: enlace }] : [],
      updated_at: ahora,
      updated_by: "panel",
    };
    const { error } = await supabase.from("content_policies").upsert(fila, { onConflict: "rubro_id,canal" });
    if (error) throw new Error(`No se pudo guardar la conexión de ${canal}: ${error.message}`);
  }
  const { data: rubro } = await supabase.from("rubros").select("source_identifiers").eq("id", rubroId).maybeSingle();
  await supabase
    .from("rubros")
    .update({ source_identifiers: unirIdentificadores((rubro as any)?.source_identifiers, identificadoresDeRedes()) })
    .eq("id", rubroId);
  return leerConexion(rubroId);
}

/** Llamado a la acción de cada red (el enlace autorizado y la línea del texto). */
export async function ctasDelPerfil(rubroId: string): Promise<Record<CanalRed, CtaCanal | null>> {
  const whatsapp = await whatsappDelPerfil(rubroId);
  const ig = enlaceWhatsAppOrigen(whatsapp, "instagram");
  const fb = enlaceWhatsAppOrigen(whatsapp, "facebook");
  return {
    instagram: ig ? { url: ig, linea: "Escribinos por WhatsApp desde el enlace de nuestro perfil." } : null,
    facebook: fb ? { url: fb, linea: `Escribinos por WhatsApp: ${fb}` } : null,
  };
}
