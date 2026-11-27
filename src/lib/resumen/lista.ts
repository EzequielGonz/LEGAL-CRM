import { createAdminClient } from "@/lib/supabase/admin";
import { colasDeHoy } from "@/lib/hoy/colas";
import { indicadorPorClave, listarIndicador, rubroIdDe } from "@/lib/indicadores";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { enlaceConversacion } from "@/lib/cartera";
import { propuestasPendientes } from "@/lib/jarvis/servidor";
import { leerSalud } from "@/lib/salud";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import { startOfArgentinaDay } from "@/lib/horario";
import type { SlugPerfil } from "@/lib/marca";
import { haceCuanto, nombreCorto, type ClaveLista, type ItemLista } from "@/lib/resumen/lista-reglas";

const MAX = 8;

/**
 * Lista corta de quiénes hay detrás de una cifra del Resumen (22/11). Solo lectura, de un perfil por vez.
 * Devuelve nombre corto y un texto breve: nunca teléfonos ni el contenido de los mensajes.
 */
export async function leerListaCorta(slug: SlugPerfil, clave: ClaveLista, ahora = new Date()): Promise<{ items: ItemLista[]; total: number | null }> {
  const rubroId = rubroIdDe(slug);
  if (!rubroId) return { items: [], total: 0 };
  const areas = AREAS_DE_PERFIL[slug] ?? [slug];
  switch (clave) {
    case "esperan": {
      const { esperan } = await colasDeHoy(rubroId, areas);
      return {
        total: esperan.length,
        items: esperan.slice(0, MAX).map((f) => ({
          id: f.conversationId,
          nombre: nombreCorto(f.nombre),
          detalle: `Espera ${haceCuanto(f.desde, ahora) ?? "su respuesta"}`,
          oportunidadId: f.oportunidadId,
          conversationId: f.conversationId,
          contactId: f.contactId,
          chatHref: enlaceConversacion(slug, f.conversationId),
          fichaHref: f.contactId ? `/ficha/${f.contactId}` : null,
        })),
      };
    }
    case "sinDerivar": {
      const r = await listarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!, { orden: "reciente" });
      return {
        total: r.total,
        items: (r.filas ?? []).slice(0, MAX).map((o: any) => ({
          id: o.id,
          nombre: nombreCorto(o.contacts?.full_name),
          detalle: `Captado ${haceCuanto(o.captured_at ?? o.updated_at, ahora) ?? ""}`.trim(),
          oportunidadId: o.id,
          conversationId: o.conversation_id ?? null,
          contactId: o.contact_id ?? null,
          chatHref: o.conversation_id ? enlaceConversacion(slug, o.conversation_id) : null,
          fichaHref: o.contact_id ? `/ficha/${o.contact_id}` : null,
        })),
      };
    }
    case "citasHoy": {
      const desde = startOfArgentinaDay(ahora);
      const hasta = new Date(desde.getTime() + 86_400_000);
      const { data } = await createAdminClient()
        .from("appointments")
        .select("id, starts_at, contact_id, contacts(full_name)")
        .in("area", areas)
        .gte("starts_at", desde.toISOString())
        .lt("starts_at", hasta.toISOString())
        .neq("status", "cancelada")
        .order("starts_at", { ascending: true })
        .limit(MAX);
      return {
        total: (data ?? []).length,
        items: ((data ?? []) as any[]).map((a) => ({
          id: a.id,
          nombre: nombreCorto(a.contacts?.full_name),
          detalle: `Hoy ${new Date(a.starts_at).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`,
          contactId: a.contact_id ?? null,
          fichaHref: a.contact_id ? `/ficha/${a.contact_id}` : null,
        })),
      };
    }
    case "propuestas": {
      const { visibles } = await propuestasPendientes(slug, ahora);
      return {
        total: visibles.length,
        items: visibles.slice(0, MAX).map((p) => ({
          id: p.id,
          nombre: p.titulo,
          detalle: p.resumen,
          propuesta: { id: p.id, tipo: p.tipo, titulo: p.titulo, resumen: p.resumen, estado: p.estado, detalle: p.detalle },
        })),
      };
    }
    case "alertas": {
      const salud = await leerSalud(ahora);
      const items = itemsDelPerfil(salud, slug).filter((i) => i.estado === "rojo" || i.estado === "amarillo");
      return {
        total: items.length,
        items: items.slice(0, MAX).map((i) => ({ id: i.clave, nombre: i.titulo, detalle: i.accion ?? i.detalle, chatHref: null, fichaHref: i.href ?? `/salud?perfil=${encodeURIComponent(slug)}` })),
      };
    }
  }
}
