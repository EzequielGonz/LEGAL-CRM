/**
 * Seguimiento en vivo de los cuatro rubros (24/10, pedido de la responsable):
 * cifras de hoy (desde la medianoche de Argentina) o de toda la base. Solo
 * lectura, sin datos de personas.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { personasQueEscribieron } from "@/lib/estadisticas-personas";
import { argentinaMidnight, argentinaParts } from "@/lib/contacto/reglas";
import { RUBRO_IDS } from "@/lib/rubros";
import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

export type RangoEnVivo = "hoy" | "todo";

export interface CifrasRubro {
  perfil: SlugPerfil;
  campanasEnCurso: number | null;
  enviados: number | null;
  entregados: number | null;
  leidos: number | null;
  fallidos: number | null;
  escribieron: number | null;
  respuestasBot: number | null;
  captados: number | null;
  derivados: number | null;
}

/** Desde cuándo se cuenta: medianoche de hoy en Argentina, o desde siempre. */
export function desdeDelRango(rango: RangoEnVivo, ahora = new Date()): string {
  return rango === "hoy" ? argentinaMidnight(argentinaParts(ahora).day).toISOString() : "2000-01-01T00:00:00.000Z";
}

export async function cifrasEnVivo(rango: RangoEnVivo, ahora = new Date()): Promise<CifrasRubro[]> {
  const s = createAdminClient();
  const desde = desdeDelRango(rango, ahora);
  const cuenta = async (q: any): Promise<number | null> => {
    const { count, error } = await q;
    return error ? null : count ?? 0;
  };
  const envios = (areas: string[], estados: string[]) =>
    cuenta(
      (s.from("campaign_contacts") as any)
        .select("id, campaigns!inner(area)", { count: "exact", head: true })
        .in("campaigns.area", areas)
        .in("status", estados)
        .gte("sent_at", desde)
    );
  return Promise.all(
    SLUGS_PERFIL.map(async (perfil) => {
      const areas = AREAS_DE_PERFIL[perfil] ?? [perfil];
      const rubroId = RUBRO_IDS[perfil];
      const [campanasEnCurso, enviados, entregados, leidos, fallidos, escribieron, respuestasBot, captados, derivados] = await Promise.all([
        cuenta(s.from("campaigns").select("id", { count: "exact", head: true }).in("area", areas).eq("status", "en_curso").is("archived_at", null)),
        envios(areas, ["enviado", "entregado", "leido", "respondio"]),
        envios(areas, ["entregado", "leido", "respondio"]),
        envios(areas, ["leido", "respondio"]),
        envios(areas, ["fallo"]),
        personasQueEscribieron(areas, desde),
        cuenta(
          (s.from("messages") as any)
            .select("id, conversations!inner(area)", { count: "exact", head: true })
            .in("conversations.area", areas)
            .eq("direction", "saliente")
            .eq("sender_type", "agente_ia")
            .in("origin", ["respuesta_entrante", "recuperacion"])
            .gte("created_at", desde)
        ),
        cuenta(s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("capture_state", "captado").gte("captured_at", desde)),
        cuenta(s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("derivation_state", "derivado").gte("derived_at", desde)),
      ]);
      return { perfil, campanasEnCurso, enviados, entregados, leidos, fallidos, escribieron, respuestasBot, captados, derivados };
    })
  );
}
