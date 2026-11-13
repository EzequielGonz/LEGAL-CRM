import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import type { ItemSalud } from "@/lib/salud/reglas";
import { limiteDiarioEfectivo } from "@/lib/wasender/ritmo";

/**
 * Líneas de Wasender en «Salud del sistema» (12/11). Antes una línea caída no
 * aparecía en ningún control: la campaña figuraba enviando y nadie se enteraba.
 */

export interface LineaParaSalud {
  id: string;
  rubro_id: string;
  nombre: string;
  estado: string | null;
  estado_at: string | null;
  habilitada: boolean;
  limite_diario: number | null;
  calentamiento_desde: string | null;
}

const NOMBRE_PERFIL: Record<string, string> = { juridico: "Jurídico", agencia_0km: "Autos 0 km", coberturas_medicas: "Coberturas médicas", marketing: "Marketing" };

function slugDe(rubroId: string): string {
  return (Object.entries(RUBRO_IDS).find(([, id]) => id === rubroId)?.[0] as string | undefined) ?? "juridico";
}

/** Un control por línea. Pura: se prueba sola. */
export function saludDeLineas(lineas: LineaParaSalud[], campanasPausadas: Record<string, number> = {}, ahora: Date = new Date()): ItemSalud[] {
  return lineas.map((l) => {
    const slug = slugDe(l.rubro_id);
    const perfil = NOMBRE_PERFIL[slug] ?? slug;
    const href = `/wasender?perfil=${slug}`;
    const clave = `wasender_${l.id}`;
    if ((l.estado ?? "") !== "connected") {
      const desde = l.estado_at ? ` desde el ${new Date(l.estado_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}` : "";
      const pausadas = campanasPausadas[l.id] ?? 0;
      return {
        clave,
        perfil: slug,
        estado: "rojo",
        titulo: `${perfil}: la línea de Wasender «${l.nombre}» está desconectada`,
        detalle: `No envía ni recibe${desde}.${pausadas ? ` ${pausadas} campaña(s) quedaron en pausa por esto.` : ""} Hay que volver a vincular el número con el QR.`,
        accion: "Conectar con QR",
        href,
      };
    }
    if (!l.habilitada) {
      return { clave, perfil: slug, estado: "amarillo", titulo: `${perfil}: la línea de Wasender «${l.nombre}» está conectada con los envíos apagados`, detalle: "Recibe mensajes, pero no sale nada por ella: ni el bot ni las campañas.", accion: "Prender los envíos", href };
    }
    const c = limiteDiarioEfectivo({ limiteDiario: l.limite_diario, calentamientoDesde: l.calentamiento_desde }, ahora);
    return {
      clave,
      perfil: slug,
      estado: "verde",
      titulo: `${perfil}: la línea de Wasender «${l.nombre}» está conectada`,
      detalle: c.porCalentamiento ? `Día ${c.dia} de calentamiento: hasta ${c.limite} mensajes de campaña por día.` : `Hasta ${c.limite} mensajes de campaña por día.`,
    };
  });
}

export async function leerSaludWasender(): Promise<ItemSalud[]> {
  const s = createAdminClient();
  const { data } = await (s.from("wasender_lineas" as any) as any)
    .select("id, rubro_id, nombre, estado, estado_at, habilitada, limite_diario, calentamiento_desde")
    .is("archivada_at", null)
    .order("created_at");
  const lineas = (data ?? []) as LineaParaSalud[];
  if (!lineas.length) return [];
  const { data: camps } = await (s.from("campaigns") as any).select("wasender_line_id").eq("status", "pausada").is("archived_at", null).in("wasender_line_id", lineas.map((l) => l.id));
  const pausadas: Record<string, number> = {};
  for (const c of (camps ?? []) as any[]) pausadas[c.wasender_line_id] = (pausadas[c.wasender_line_id] ?? 0) + 1;
  return saludDeLineas(lineas, pausadas);
}
