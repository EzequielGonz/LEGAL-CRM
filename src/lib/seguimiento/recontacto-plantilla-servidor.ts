/**
 * Lecturas del recontacto de las 72 h por plantilla de Meta (22/11). Las reglas están en
 * ./recontacto-plantilla (puras). Acá solo se lee la base: no se envía ni se escribe nada.
 * Ante la duda (una lectura que falla), se devuelve null y la regla frena: se prefiere no escribir.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfArgentinaDay } from "@/lib/horario";
import { leerEstadoCalidad } from "@/lib/whatsapp/calidad-servidor";
import { motivoDeFreno } from "@/lib/wasender/ritmo";
import { VENTANA_FRENO } from "@/lib/wasender/campanas";
import { CANAL_PLANTILLA_RECONTACTO, CLAVE_RECONTACTO_PLANTILLA, configDelRubro, ESTADOS_QUE_CUENTAN, type ConfigRecontactoRubro } from "./recontacto-plantilla";

type Db = ReturnType<typeof createAdminClient>;

const ENVIADOS = ["enviado", "entregado", "leido", "respondio"];

/** Configuración del rubro. Sin la clave en `system_settings` (o si no se puede leer): apagado. */
export async function configRecontactoPlantilla(perfil: string, supabase: Db = createAdminClient()): Promise<ConfigRecontactoRubro> {
  const { data, error } = await (supabase.from("system_settings") as any).select("value").eq("key", CLAVE_RECONTACTO_PLANTILLA).maybeSingle();
  if (error) return { activo: false, via: "meta_plantilla" };
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
 * ¿La persona ya recibió el recontacto por plantilla en este rubro? «Por persona» es por teléfono
 * (hay un contacto por perfil con el mismo número), como el tope de automáticos. null = no se pudo saber.
 */
export async function yaRecibioRecontacto(rubroId: string, contactId: string, exceptoTarea: string, supabase: Db = createAdminClient()): Promise<boolean | null> {
  const { data: yo, error: e0 } = await supabase.from("contacts").select("phone").eq("id", contactId).maybeSingle();
  if (e0) return null;
  let contactos = [contactId];
  if ((yo as any)?.phone) {
    const { data: mismos, error: e1 } = await supabase.from("contacts").select("id").eq("phone", (yo as any).phone).limit(20);
    if (e1) return null;
    contactos = Array.from(new Set([contactId, ...((mismos ?? []) as { id: string }[]).map((c) => c.id)]));
  }
  const { count, error } = await (supabase.from("followup_tasks") as any)
    .select("id", { count: "exact", head: true })
    .eq("rubro_id", rubroId)
    .in("contact_id", contactos)
    .eq("canal", CANAL_PLANTILLA_RECONTACTO)
    .in("status", ESTADOS_QUE_CUENTAN as unknown as string[])
    .neq("id", exceptoTarea);
  if (error) return null;
  return (count ?? 0) > 0;
}

/** Calidad de la línea según la última consulta a Meta (la guarda el latido cada 10 minutos). */
export async function calidadDeLinea(lineId: string): Promise<string | null> {
  const estado = await leerEstadoCalidad();
  return estado.lineas[lineId]?.calidad ?? null;
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
