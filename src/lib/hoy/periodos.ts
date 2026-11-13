import { createAdminClient } from "@/lib/supabase/admin";
import { inicioDeSemana } from "@/lib/cartera";
import { TRATAMIENTO_ATENCION, type MotivoAtencion } from "@/lib/captacion/reglas";

/**
 * Estadísticas de «Hoy» por período (12/11): la semana actual primero, y
 * detrás la semana pasada, el mes y el mes pasado, como láminas de una
 * presentación. Solo lectura.
 */

export const PERIODOS = [
  { clave: "semana", titulo: "Esta semana", bajada: "Desde el lunes" },
  { clave: "semana_pasada", titulo: "Semana pasada", bajada: "De lunes a domingo" },
  { clave: "mes", titulo: "Este mes", bajada: "Desde el día 1" },
  { clave: "mes_pasado", titulo: "Mes pasado", bajada: "El mes completo" },
] as const;
export type ClavePeriodo = (typeof PERIODOS)[number]["clave"];

const DIA = 24 * 3_600_000;

/** Primer instante del mes en hora de Argentina (UTC−3), con un desplazamiento de meses. */
function inicioDeMes(ahora: Date, meses = 0): Date {
  const ar = new Date(ahora.getTime() - 3 * 3_600_000);
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth() + meses, 1, 3, 0, 0));
}

/** Rango del período y el rango anterior de igual tipo, para comparar. Pura. */
export function rangoDePeriodo(clave: ClavePeriodo, ahora: Date = new Date()): { desde: Date; hasta: Date; antesDesde: Date; antesHasta: Date } {
  const lunes = inicioDeSemana(ahora);
  if (clave === "semana") return { desde: lunes, hasta: ahora, antesDesde: new Date(lunes.getTime() - 7 * DIA), antesHasta: new Date(ahora.getTime() - 7 * DIA) };
  if (clave === "semana_pasada") {
    const desde = new Date(lunes.getTime() - 7 * DIA);
    return { desde, hasta: lunes, antesDesde: new Date(desde.getTime() - 7 * DIA), antesHasta: desde };
  }
  if (clave === "mes") {
    const desde = inicioDeMes(ahora);
    const antesDesde = inicioDeMes(ahora, -1);
    return { desde, hasta: ahora, antesDesde, antesHasta: new Date(antesDesde.getTime() + (ahora.getTime() - desde.getTime())) };
  }
  const desde = inicioDeMes(ahora, -1);
  return { desde, hasta: inicioDeMes(ahora), antesDesde: inicioDeMes(ahora, -2), antesHasta: desde };
}

/**
 * Motivos por los que alguien queda esperando a una persona y cuenta como
 * oportunidad real (13/11): pidió hablar con alguien, preguntó precio o
 * condiciones, o es un captado que volvió a escribir. Quejas, rechazos y
 * contactos detenidos no entran.
 */
export const MOTIVOS_OPORTUNIDAD_REAL: MotivoAtencion[] = ["pide_persona", "precio_fuera_alcance", "decision_profesional", "mensaje_posterior_captado"];

/** Los mismos motivos, como empiezan escritos en el historial de la oportunidad. Pura. */
export function motivosDeOportunidadEnPalabras(): string[] {
  return MOTIVOS_OPORTUNIDAD_REAL.map((m) => TRATAMIENTO_ATENCION[m].label);
}

export type EtapaEmbudo = "conversaron" | "oportunidad" | "ventas";

/** Argumentos de la función de la base que devuelve las personas de una etapa. Pura. */
export function argumentosDeEtapa(etapa: EtapaEmbudo, rubroId: string, areas: string[], desde: Date | null, hasta: Date | null) {
  return {
    p_etapa: etapa,
    p_rubro: rubroId,
    p_areas: areas,
    p_desde: (desde ?? new Date("2020-01-01T00:00:00Z")).toISOString(),
    p_hasta: (hasta ?? new Date("2100-01-01T00:00:00Z")).toISOString(),
    p_motivos: etapa === "oportunidad" ? motivosDeOportunidadEnPalabras() : [],
  };
}

export interface CifrasPeriodo {
  contactados: number | null;
  respondieron: number | null;
  /** Escribieron dos o más mensajes. */
  conversaron: number | null;
  /** Quedaron esperando a una persona con interés, o fueron captados. */
  oportunidades: number | null;
  captados: number | null;
  /** Derivados que cerraron la operación. */
  ventas: number | null;
  derivados: number | null;
  perdidos: number | null;
}

/** Variación contra el período anterior, en palabras. Pura. */
export function variacion(actual: number | null, anterior: number | null): { texto: string; tono: "sube" | "baja" | "igual" | "nada" } {
  if (actual === null || anterior === null) return { texto: "sin dato para comparar", tono: "nada" };
  if (actual === anterior) return { texto: "igual que antes", tono: "igual" };
  const dif = actual - anterior;
  if (anterior === 0) return { texto: `antes 0`, tono: "sube" };
  const pct = Math.round((Math.abs(dif) / anterior) * 100);
  return { texto: `${dif > 0 ? "+" : "−"}${pct} % (antes ${anterior.toLocaleString("es-AR")})`, tono: dif > 0 ? "sube" : "baja" };
}

/** Tasa en porcentaje con un decimal, o null si no hay base. Pura. */
export function tasa(parte: number | null, total: number | null): string | null {
  if (parte === null || total === null || total <= 0) return null;
  return `${((parte / total) * 100).toFixed(1).replace(".", ",")} %`;
}

export async function cifrasDePeriodo(rubroId: string, areas: string[], desde: Date, hasta: Date): Promise<CifrasPeriodo> {
  const s = createAdminClient();
  const d = desde.toISOString();
  const h = hasta.toISOString();
  const cuenta = async (q: any): Promise<number | null> => {
    try {
      const { count, error } = await q;
      return error ? null : count ?? 0;
    } catch {
      return null;
    }
  };
  const { data: camps } = await s.from("campaigns").select("id").in("area", areas as any);
  const ids = ((camps ?? []) as any[]).map((c) => c.id);
  const opp = () => (s.from("opportunities") as any).select("id", { count: "exact", head: true }).eq("rubro_id", rubroId);
  const etapa = (e: EtapaEmbudo) => cuenta((s as any).rpc("embudo_etapa", argumentosDeEtapa(e, rubroId, areas, desde, hasta), { count: "exact", head: true }));
  const [contactados, respondieron, captados, derivados, perdidos, conversaron, oportunidades, ventas] = await Promise.all([
    ids.length
      ? cuenta(s.from("campaign_contacts").select("id", { count: "exact", head: true }).in("campaign_id", ids).in("status", ["enviado", "entregado", "leido", "respondio"]).gte("sent_at", d).lt("sent_at", h))
      : Promise.resolve(0),
    // Personas (no mensajes) que escribieron en el período: una fila por conversación.
    cuenta((s.from("conversations") as any).select("id, messages!inner(id)", { count: "exact", head: true }).in("area", areas).eq("messages.direction", "entrante").gte("messages.created_at", d).lt("messages.created_at", h)),
    cuenta(opp().eq("capture_state", "captado").gte("captured_at", d).lt("captured_at", h)),
    cuenta(opp().eq("derivation_state", "derivado").gte("derived_at", d).lt("derived_at", h)),
    cuenta(opp().eq("capture_state", "perdido").gte("updated_at", d).lt("updated_at", h)),
    etapa("conversaron"),
    etapa("oportunidad"),
    etapa("ventas"),
  ]);
  return { contactados, respondieron, conversaron, oportunidades, captados, derivados, ventas, perdidos };
}
