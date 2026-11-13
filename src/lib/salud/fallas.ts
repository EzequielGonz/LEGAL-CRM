/**
 * Fallas del sistema (13/11). Decisión de la responsable: «la falla del
 * sistema, intentá ubicar dónde avisarnos, pero separado». Son problemas
 * nuestros (mensajes que no salieron, seguimientos trabados, el bot que no
 * pudo contestar, archivos sin guardar, eventos retenidos), no de la persona:
 * por eso no van con las incidencias. Cada perfil ve las suyas y, aparte, las
 * de todo el sistema. Solo lee.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { rutaDePerfil } from "@/lib/perfil-ruta";
import type { SlugPerfil } from "@/lib/marca";

export interface Falla {
  clave: string;
  /** Qué pasó, en palabras. */
  titulo: string;
  cantidad: number;
  /** Qué hacer. */
  accion: string;
  href: string;
  alcance: "perfil" | "sistema";
}

const AREAS: Record<SlugPerfil, string[]> = { juridico: ["civil", "penal"], agencia_0km: ["agencia_0km"], coberturas_medicas: ["coberturas_medicas"], marketing: ["marketing"] };

/** Arma la lista a partir de los conteos. Pura: se prueba sola. */
export function armarFallas(slug: SlugPerfil, c: { fallidos24h: number; seguimientos: number; bot24h: number; archivos: number; retenidos: number }): Falla[] {
  const n = (x: number, uno: string, varios: string) => (x === 1 ? uno : varios.replace("{n}", x.toLocaleString("es-AR")));
  const lista: Falla[] = [];
  if (c.fallidos24h > 0) lista.push({ clave: "fallidos", titulo: n(c.fallidos24h, "1 mensaje no salió en las últimas 24 horas", "{n} mensajes no salieron en las últimas 24 horas"), cantidad: c.fallidos24h, accion: "Ver las campañas", href: rutaDePerfil(slug, "campanas"), alcance: "perfil" });
  if (c.seguimientos > 0) lista.push({ clave: "seguimientos", titulo: n(c.seguimientos, "1 seguimiento no pudo salir", "{n} seguimientos no pudieron salir"), cantidad: c.seguimientos, accion: "Ver el seguimiento", href: rutaDePerfil(slug, "seguimiento"), alcance: "perfil" });
  if (c.bot24h > 0) lista.push({ clave: "bot", titulo: n(c.bot24h, "El bot no pudo contestar 1 vez en las últimas 24 horas", "El bot no pudo contestar {n} veces en las últimas 24 horas"), cantidad: c.bot24h, accion: "Ver los chats que esperan", href: `/conversaciones?perfil=${slug}&grupo=escribieron`, alcance: "perfil" });
  if (c.archivos > 0) lista.push({ clave: "archivos", titulo: n(c.archivos, "1 archivo recibido todavía no se guardó", "{n} archivos recibidos todavía no se guardaron"), cantidad: c.archivos, accion: "Guardarlos", href: `/incidencias?perfil=${slug}&vista=adjuntos`, alcance: "perfil" });
  if (c.retenidos > 0) lista.push({ clave: "retenidos", titulo: n(c.retenidos, "1 mensaje entrante quedó retenido por seguridad", "{n} mensajes entrantes quedaron retenidos por seguridad"), cantidad: c.retenidos, accion: "Revisarlos", href: `/incidencias?perfil=${slug}&vista=retenidos`, alcance: "sistema" });
  return lista;
}

export async function leerFallas(slug: SlugPerfil, ahora: Date = new Date()): Promise<Falla[]> {
  const s = createAdminClient();
  const rubroId = RUBRO_IDS[slug];
  const desde = new Date(ahora.getTime() - 24 * 3_600_000).toISOString();
  const cuenta = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
    const r = await q;
    return r.error ? 0 : r.count ?? 0;
  };
  const [fallidos24h, seguimientos, bot24h, archivos, retenidos] = await Promise.all([
    cuenta((s.from("messages") as any).select("id, conversations!inner(area)", { count: "exact", head: true }).eq("direction", "saliente").eq("delivery_status", "fallido").gte("created_at", desde).in("conversations.area", AREAS[slug])),
    cuenta((s.from("followup_tasks") as any).select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).in("status", ["fallida", "a_revisar", "conflicto", "pendiente"])),
    cuenta((s.from("agent_turn_logs") as any).select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).not("error", "is", null).gte("created_at", desde)),
    cuenta((s.from("message_attachments") as any).select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).in("status", ["pendiente", "error"])),
    cuenta((s.from("webhook_quarantine") as any).select("id", { count: "exact", head: true }).is("reviewed_at", null)),
  ]);
  return armarFallas(slug, { fallidos24h, seguimientos, bot24h, archivos, retenidos });
}
