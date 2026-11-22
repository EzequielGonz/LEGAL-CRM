/**
 * Lecturas del recontacto de las 72 h por plantilla de Meta (22/11). Las reglas están en
 * ./recontacto-plantilla (puras). Acá solo se lee la base: no se envía ni se escribe nada.
 * Ante la duda (una lectura que falla), se devuelve null y la regla frena: se prefiere no escribir.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfArgentinaDay } from "@/lib/horario";
import { CLAVE_CALIDAD } from "@/lib/whatsapp/calidad-servidor";
import { motivoDeFreno } from "@/lib/wasender/ritmo";
import { VENTANA_FRENO } from "@/lib/wasender/campanas";
import { CANAL_PLANTILLA_RECONTACTO, CLAVE_RECONTACTO_PLANTILLA, claveTelefono, configDelRubro, desdeVentanaRecontacto, ESTADOS_QUE_CUENTAN, MAX_DIA_POR_DEFECTO, type ConfigRecontactoRubro } from "./recontacto-plantilla";

type Db = ReturnType<typeof createAdminClient>;

const ENVIADOS = ["enviado", "entregado", "leido", "respondio"];

/** Configuración del rubro. Sin la clave en `system_settings` (o si no se puede leer): apagado. */
export async function configRecontactoPlantilla(perfil: string, supabase: Db = createAdminClient()): Promise<ConfigRecontactoRubro> {
  const { data, error } = await (supabase.from("system_settings") as any).select("value").eq("key", CLAVE_RECONTACTO_PLANTILLA).maybeSingle();
  if (error) return { activo: false, via: "meta_plantilla", maxDia: MAX_DIA_POR_DEFECTO };
  return configDelRubro((data as any)?.value ?? null, perfil);
}

/** Último mensaje de la persona en la conversación (abre la ventana de 24 h de Meta). */
export async function ultimoEntranteDe(conversationId: string, supabase: Db = createAdminClient()): Promise<Date | null> {
  const { data } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "entrante")
    .is("duplicate_of", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as any)?.created_at ? new Date((data as any).created_at) : null;
}

/**
 * ¿La persona recibió un recontacto por plantilla en este rubro en los últimos 30 días? «Persona» es el
 * teléfono NORMALIZADO (con o sin el «9» argentino, aunque esté en dos contactos, p. ej. Civil y Penal):
 * la clave se guarda en la tarea (`telefono_clave`, migración 0640) al reservarla. Cuenta lo enviado,
 * lo que se está enviando y lo incierto. null = no se pudo saber (no se envía).
 * La palabra final la tiene `followup_recontacto_reservar` (con candado), que corre justo antes de enviar.
 */
export async function yaRecibioRecontacto(rubroId: string, telefono: string, exceptoTarea: string, ahora: Date, supabase: Db = createAdminClient()): Promise<boolean | null> {
  const clave = claveTelefono(telefono);
  if (!clave) return null;
  const desde = desdeVentanaRecontacto(ahora).toISOString();
  const { count, error } = await (supabase.from("followup_tasks") as any)
    .select("id", { count: "exact", head: true })
    .eq("rubro_id", rubroId)
    .eq("telefono_clave", clave)
    .eq("canal", CANAL_PLANTILLA_RECONTACTO)
    .in("status", ESTADOS_QUE_CUENTAN as unknown as string[])
    .or(`sent_at.gte.${desde},and(sent_at.is.null,claimed_at.gte.${desde})`)
    .neq("id", exceptoTarea);
  if (error) return null;
  return (count ?? 0) > 0;
}

/** Recontactos por plantilla del día (hora argentina) en el rubro. null = no se pudo leer. */
export async function recontactosHoyDelRubro(rubroId: string, ahora: Date, supabase: Db = createAdminClient()): Promise<number | null> {
  const desde = startOfArgentinaDay(ahora).toISOString();
  const { count, error } = await (supabase.from("followup_tasks") as any)
    .select("id", { count: "exact", head: true })
    .eq("rubro_id", rubroId)
    .eq("canal", CANAL_PLANTILLA_RECONTACTO)
    .in("status", ESTADOS_QUE_CUENTAN as unknown as string[])
    .or(`sent_at.gte.${desde},and(sent_at.is.null,claimed_at.gte.${desde})`);
  if (error) return null;
  return count ?? 0;
}

export type ReservaRecontacto = "ok" | "ya_recibio" | "tope_dia" | "reserva_perdida" | "error";

/**
 * Reserva el recontacto con candado en la base (migración 0640, RPC `followup_recontacto_reservar`): una
 * sola reserva por teléfono normalizado a la vez, y comprueba dentro del candado la ventana de 30 días y
 * el tope diario del rubro. Dos latidos simultáneos no pueden mandarle a la misma persona.
 */
export async function reservarRecontacto(
  d: { tarea: string; token: string; telefono: string; maxDia: number; ahora: Date },
  supabase: Db = createAdminClient()
): Promise<ReservaRecontacto> {
  const { data, error } = await supabase.rpc("followup_recontacto_reservar" as any, {
    p_task: d.tarea,
    p_token: d.token,
    p_clave: claveTelefono(d.telefono),
    p_desde: desdeVentanaRecontacto(d.ahora).toISOString(),
    p_max_dia: d.maxDia,
    p_desde_dia: startOfArgentinaDay(d.ahora).toISOString(),
  } as any);
  if (error) return "error";
  return data === "ok" || data === "ya_recibio" || data === "tope_dia" || data === "reserva_perdida" ? (data as ReservaRecontacto) : "error";
}

/** Cuánto tiempo vale la última lectura de calidad (la guarda el latido cada 10 minutos). */
const CALIDAD_VIGENTE_MS = 3 * 3_600_000;

/**
 * Calidad de la línea según la última consulta a Meta. null = no se pudo leer (error de lectura, sin
 * registro de la línea, sin dato o lectura vieja): en ese caso NO se envía.
 */
export async function calidadDeLinea(lineId: string, ahora: Date = new Date(), supabase: Db = createAdminClient()): Promise<string | null> {
  const { data, error } = await (supabase.from("system_settings") as any).select("value").eq("key", CLAVE_CALIDAD).maybeSingle();
  if (error) return null;
  const v = (data as any)?.value;
  if (!v || typeof v !== "object") return null;
  const at = Date.parse(String(v.at ?? ""));
  if (!Number.isFinite(at) || ahora.getTime() - at > CALIDAD_VIGENTE_MS) return null;
  const calidad = v.lineas?.[lineId]?.calidad;
  return typeof calidad === "string" && calidad.trim() ? calidad : null;
}

/** Campañas de Meta de la línea. */
async function campanasMetaDeLinea(lineId: string, supabase: Db): Promise<string[] | null> {
  const { data, error } = await supabase.from("campaigns").select("id").eq("line_id", lineId);
  if (error) return null;
  return ((data ?? []) as { id: string }[]).map((c) => c.id);
}

/**
 * El freno de entrega de siempre (`motivoDeFreno`: muchos fallidos o sin entregar en los últimos envíos),
 * mirado sobre los envíos de campaña de la línea de Meta. null = puede seguir.
 */
export async function frenoDeLineaMeta(lineId: string, ahora: Date, supabase: Db = createAdminClient()): Promise<string | null> {
  const ids = await campanasMetaDeLinea(lineId, supabase);
  if (ids === null) return "No se pudo leer el estado de los envíos de la línea: no se envía.";
  if (!ids.length) return null;
  const hasta = new Date(ahora.getTime() - VENTANA_FRENO.esperaMin * 60_000);
  const inicio = new Date(ahora.getTime() - VENTANA_FRENO.horas * 3_600_000);
  const { data, error } = await supabase
    .from("campaign_contacts")
    .select("status")
    .in("campaign_id", ids)
    .in("status", [...ENVIADOS, "fallo"])
    .gte("sent_at", inicio.toISOString())
    .lte("sent_at", hasta.toISOString())
    .order("sent_at", { ascending: false })
    .limit(VENTANA_FRENO.cantidad);
  if (error) return "No se pudo leer el estado de los envíos de la línea: no se envía.";
  const filas = (data ?? []) as { status: string }[];
  return motivoDeFreno({
    enviados: filas.length,
    fallidos: filas.filter((f) => f.status === "fallo").length,
    sinEntregar: filas.filter((f) => f.status === "enviado").length,
  });
}

/**
 * Lo que ya salió hoy por la línea y cuenta para su límite diario: primeros mensajes de campaña y
 * recontactos por plantilla. null = no se pudo leer.
 */
export async function enviadosHoyPorLinea(lineId: string, ahora: Date, supabase: Db = createAdminClient()): Promise<number | null> {
  const desde = startOfArgentinaDay(ahora).toISOString();
  const ids = await campanasMetaDeLinea(lineId, supabase);
  if (ids === null) return null;
  let total = 0;
  if (ids.length) {
    const { count, error } = await supabase.from("campaign_contacts").select("id", { count: "exact", head: true }).in("campaign_id", ids).in("status", ENVIADOS).gte("sent_at", desde);
    if (error) return null;
    total += count ?? 0;
  }
  const { count: recontactos, error } = await (supabase.from("followup_tasks") as any)
    .select("id", { count: "exact", head: true })
    .eq("line_id", lineId)
    .eq("canal", CANAL_PLANTILLA_RECONTACTO)
    .eq("status", "enviada")
    .gte("sent_at", desde);
  if (error) return null;
  return total + (recontactos ?? 0);
}
