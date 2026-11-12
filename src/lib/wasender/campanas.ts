import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";
import { getProfile, profileIdForArea } from "@/lib/profiles";
import { WasenderError } from "@/lib/wasender/cliente";
import { LineaWasenderNoDisponible, motivoNoDisponible, type LineaParaEnviar } from "@/lib/wasender/envio";
import { completar, elegirVariante, variablesDe } from "@/lib/wasender/plantillas";
import type { SendFailure } from "@/lib/envios/errores";
import { limiteDiarioEfectivo, MINIMO_TEXTOS_CAMPANA, motivoDeFreno, primerNombre, textosDistintos } from "@/lib/wasender/ritmo";
import { descifrar } from "@/lib/wasender/cifrado";
import { estaEnWhatsApp } from "@/lib/wasender/cliente";

/**
 * Campañas por Wasender (10/11, bloque 3). La campaña es la misma de siempre:
 * misma tabla, mismo formulario, mismos destinatarios y el mismo motor con su
 * ritmo (espera al azar entre mínimo y máximo, lotes con pausa, límite
 * diario, días y horario). Lo único que cambia es el método de envío: la
 * línea es de Wasender y el texto sale de una plantilla propia.
 */

type Db = ReturnType<typeof createAdminClient>;
type Env = Record<string, string | undefined>;

export type Proveedor = "meta" | "wasender";

export function proveedorDe(campana: { proveedor?: string | null }): Proveedor {
  return campana.proveedor === "wasender" ? "wasender" : "meta";
}

export interface LineaCampana extends LineaParaEnviar {
  rubro_id: string;
  limite_diario: number | null;
  /** Desde cuándo se cuenta el calentamiento de la línea (12/11). */
  calentamiento_desde?: string | null;
}

export interface PlantillaCampana {
  id: string;
  rubro_id: string;
  nombre: string;
  cuerpo: string;
  variantes: string[];
  activa: boolean;
  archivada_at: string | null;
}

/** Qué falta para que la campaña pueda enviar por Wasender. Pura: se prueba sola. */
export function faltantesWasender(
  d: {
    area: Area;
    rubroId: string | null;
    perfil: { brand_name?: string | null; agent_presentation_name?: string | null } | null;
    linea: LineaCampana | null;
    lineaAsignada: boolean;
    plantilla: PlantillaCampana | null;
    plantillaAsignada: boolean;
  },
  env: Env = process.env
): string[] {
  const missing: string[] = [];
  if (!d.perfil) missing.push("Perfil del área");
  if (!d.lineaAsignada) missing.push("Línea de Wasender asignada a la campaña");
  else if (!d.linea) missing.push("La línea de Wasender asignada no existe");
  else {
    if (d.rubroId && d.linea.rubro_id !== d.rubroId) missing.push(`La línea «${d.linea.nombre}» es de otro perfil`);
    const motivo = motivoNoDisponible(d.linea, env);
    if (motivo) missing.push(motivo.replace(/: no se envió\.$/, ""));
  }
  if (!d.plantillaAsignada) missing.push("Plantilla de Wasender de la campaña");
  else if (!d.plantilla) missing.push("La plantilla de Wasender asignada no existe");
  else {
    const p = d.plantilla;
    if (d.rubroId && p.rubro_id !== d.rubroId) missing.push(`La plantilla «${p.nombre}» es de otro perfil`);
    if (p.archivada_at) missing.push(`La plantilla «${p.nombre}» está archivada`);
    else if (!p.activa) missing.push(`La plantilla «${p.nombre}» está inactiva`);
    const textos = [p.cuerpo, ...p.variantes];
    if (textos.some((t) => /\[revisar/i.test(t))) missing.push(`La plantilla «${p.nombre}» tiene partes «[revisar]» sin completar`);
    const usadas = new Set(textos.flatMap((t) => variablesDe(t)));
    // 12/11: sin variantes todos reciben el mismo texto, y eso es lo primero que WhatsApp detecta.
    const distintos = textosDistintos(p.cuerpo, p.variantes);
    if (distintos < MINIMO_TEXTOS_CAMPANA) {
      missing.push(`La plantilla «${p.nombre}» necesita ${MINIMO_TEXTOS_CAMPANA} textos distintos para salir en una campaña (tiene ${distintos}): sumale variantes en Wasender → Plantillas`);
    }
    if (d.perfil && usadas.has("marca") && !d.perfil.brand_name?.trim()) missing.push("Nombre del perfil o marca (perfil)");
    if (d.perfil && usadas.has("asesor") && !d.perfil.agent_presentation_name?.trim()) missing.push("Nombre de presentación del agente (perfil)");
  }
  return missing;
}

/**
 * Texto que recibe una persona. Cada persona recibe siempre la misma variante
 * (por su id). Se saluda con el primer nombre (12/11): nombre y dos apellidos
 * delata que el mensaje salió de una base. Si la persona no tiene un nombre
 * usable, se saca la variable sin dejar el saludo roto.
 */
export function textoDeCampana(p: { cuerpo: string; variantes: string[] }, datos: { nombre: string; asesor: string; marca: string }, semilla: string): string {
  return completar(elegirVariante(p.cuerpo, p.variantes, semilla), { ...datos, nombre: primerNombre(datos.nombre) }).trim();
}

/**
 * Traduce un error de Wasender a las mismas categorías que usa el motor con
 * Meta, así la campaña reacciona igual: problema de la línea → pendiente y
 * pausa; falla temporal → vuelve a la cola; sin confirmación → a revisión.
 */
export function clasificarFallaWasender(err: unknown): SendFailure {
  const detail = String((err as any)?.message ?? err ?? "Error desconocido").slice(0, 1000);
  if (err instanceof LineaWasenderNoDisponible) return { kind: "cuenta", code: null, httpStatus: null, certainNotSent: true, detail };
  if (err instanceof WasenderError && err.status !== null) {
    const s = err.status;
    if (s === 429) return { kind: "transitorio", code: null, httpStatus: s, certainNotSent: true, detail };
    if (s === 401 || s === 403) return { kind: "cuenta", code: null, httpStatus: s, certainNotSent: true, detail };
    if (s === 422 || s === 400) {
      // Número inválido o que no tiene WhatsApp: es de ese destinatario.
      return /n[uú]mero|number|phone|whatsapp|exist|registered|jid/i.test(detail)
        ? { kind: "contacto", code: null, httpStatus: s, certainNotSent: true, detail }
        : { kind: "desconocido", code: null, httpStatus: s, certainNotSent: true, detail };
    }
    if (s >= 500) return { kind: "incierto", code: null, httpStatus: s, certainNotSent: false, detail };
    return { kind: "desconocido", code: null, httpStatus: s, certainNotSent: true, detail };
  }
  return { kind: "incierto", code: null, httpStatus: null, certainNotSent: false, detail };
}

/** Texto corto para el panel, con las palabras de Wasender (no de Meta). */
export function notaFallaWasender(f: SendFailure): string {
  const http = f.httpStatus ? ` (HTTP ${f.httpStatus})` : "";
  switch (f.kind) {
    case "contacto":
      return `Wasender no pudo entregarle a este destinatario${http}: ${f.detail}`;
    case "cuenta":
      return `La línea de Wasender no puede enviar${http}: ${f.detail} El envío quedó pendiente.`;
    case "transitorio":
      return `Wasender pidió esperar antes de seguir${http}. El envío quedó pendiente.`;
    case "incierto":
      return `No se sabe si Wasender aceptó el mensaje${http}: queda para revisión y no se reenvía solo.`;
    default:
      return `Wasender rechazó el envío${http}: ${f.detail}`;
  }
}

export interface PreparacionWasender {
  ready: boolean;
  missing: string[];
  linea: LineaCampana | null;
  plantilla: PlantillaCampana | null;
  perfil: { brand_name?: string | null; agent_presentation_name?: string | null } | null;
}

const COLUMNAS_LINEA = "id, rubro_id, nombre, habilitada, estado, api_key_cifrada, archivada_at, limite_diario, calentamiento_desde";
const COLUMNAS_PLANTILLA = "id, rubro_id, nombre, cuerpo, variantes, activa, archivada_at";

/** Lee la línea y la plantilla de la campaña y dice qué falta. */
export async function preparacionWasender(
  campana: { area: Area; wasender_line_id?: string | null; wasender_plantilla_id?: string | null },
  supabase: Db = createAdminClient(),
  env: Env = process.env
): Promise<PreparacionWasender> {
  const rubroId = profileIdForArea(campana.area);
  const [perfil, linea, plantilla] = await Promise.all([
    rubroId ? getProfile(rubroId) : Promise.resolve(null),
    campana.wasender_line_id
      ? (supabase.from("wasender_lineas" as any) as any).select(COLUMNAS_LINEA).eq("id", campana.wasender_line_id).maybeSingle().then((r: any) => r.data ?? null)
      : Promise.resolve(null),
    campana.wasender_plantilla_id
      ? (supabase.from("wasender_plantillas" as any) as any).select(COLUMNAS_PLANTILLA).eq("id", campana.wasender_plantilla_id).maybeSingle().then((r: any) => r.data ?? null)
      : Promise.resolve(null),
  ]);
  const p = plantilla ? { ...plantilla, variantes: Array.isArray(plantilla.variantes) ? plantilla.variantes.filter((v: unknown) => typeof v === "string") : [] } : null;
  const missing = faltantesWasender(
      {
        area: campana.area,
        rubroId,
        perfil: perfil as any,
        linea,
        lineaAsignada: !!campana.wasender_line_id,
        plantilla: p,
        plantillaAsignada: !!campana.wasender_plantilla_id,
      },
      env
    );
  return { ready: missing.length === 0, missing, linea, plantilla: p, perfil: perfil as any };
}

/** Líneas y plantillas de Wasender de un perfil, para elegir al crear o configurar una campaña. */
export async function opcionesWasender(rubroId: string, supabase: Db = createAdminClient()) {
  const [{ data: lineas }, { data: plantillas }] = await Promise.all([
    (supabase.from("wasender_lineas" as any) as any)
      .select("id, nombre, telefono, estado, habilitada, limite_diario")
      .eq("rubro_id", rubroId)
      .is("archivada_at", null)
      .order("created_at"),
    (supabase.from("wasender_plantillas" as any) as any)
      .select("id, nombre, uso, activa")
      .eq("rubro_id", rubroId)
      .is("archivada_at", null)
      .order("nombre"),
  ]);
  return {
    lineas: ((lineas ?? []) as any[]).map((l) => ({
      id: l.id as string,
      label: `${l.nombre}${l.estado === "connected" ? "" : " (desconectada)"}${l.habilitada ? "" : " (apagada)"}${l.limite_diario ? ` · ${l.limite_diario}/día` : ""}`,
    })),
    plantillas: ((plantillas ?? []) as any[])
      .filter((p) => p.activa)
      .sort((a, b) => (a.uso === "campana" ? 0 : 1) - (b.uso === "campana" ? 0 : 1))
      .map((p) => ({ id: p.id as string, label: `${p.nombre}${p.uso === "campana" ? "" : ` (${p.uso})`}` })),
  };
}

/** Comprueba que la línea y la plantilla elegidas sean del perfil. Devuelve el error o null. */
export async function validarEleccionWasender(
  rubroId: string,
  eleccion: { lineaId?: string | null; plantillaId?: string | null },
  supabase: Db = createAdminClient()
): Promise<string | null> {
  if (eleccion.lineaId) {
    const { data } = await (supabase.from("wasender_lineas" as any) as any).select("rubro_id, archivada_at").eq("id", eleccion.lineaId).maybeSingle();
    if (!data || data.rubro_id !== rubroId || data.archivada_at) return "La línea de Wasender no es de este perfil o está archivada.";
  }
  if (eleccion.plantillaId) {
    const { data } = await (supabase.from("wasender_plantillas" as any) as any).select("rubro_id, archivada_at").eq("id", eleccion.plantillaId).maybeSingle();
    if (!data || data.rubro_id !== rubroId || data.archivada_at) return "La plantilla de Wasender no es de este perfil o está archivada.";
  }
  return null;
}

/** Línea y plantilla de una campaña de Wasender, con la forma que muestra el detalle de campañas. */
export async function detalleWasender(
  campana: { wasender_line_id?: string | null; wasender_plantilla_id?: string | null },
  supabase: Db = createAdminClient()
): Promise<{ line: { label: string; phone_display: string | null } | null; template: { name: string; language: string; status: string } | null }> {
  const [l, p] = await Promise.all([
    campana.wasender_line_id
      ? (supabase.from("wasender_lineas" as any) as any).select("nombre, telefono").eq("id", campana.wasender_line_id).maybeSingle().then((r: any) => r.data)
      : null,
    campana.wasender_plantilla_id
      ? (supabase.from("wasender_plantillas" as any) as any).select("nombre, activa").eq("id", campana.wasender_plantilla_id).maybeSingle().then((r: any) => r.data)
      : null,
  ]);
  return {
    line: l ? { label: `Wasender · ${l.nombre}`, phone_display: l.telefono ?? null } : null,
    template: p ? { name: p.nombre, language: "es", status: p.activa ? "WASENDER" : "WASENDER INACTIVA" } : null,
  };
}

const ENVIADOS = ["enviado", "entregado", "leido", "respondio"];

async function campanasDeLinea(lineaId: string, supabase: Db): Promise<string[]> {
  const { data } = await (supabase.from("campaigns") as any).select("id").eq("wasender_line_id", lineaId);
  return ((data ?? []) as any[]).map((c) => c.id as string);
}

/**
 * Límite del día de la línea (12/11): el menor entre el elegido y el del
 * calentamiento, contando lo que ya salió hoy por todas sus campañas.
 */
export async function cupoDeLinea(
  linea: LineaCampana,
  inicioDelDia: Date,
  ahora: Date,
  supabase: Db = createAdminClient()
): Promise<{ limite: number; dia: number; porCalentamiento: boolean; enviadosHoy: number; agotado: boolean; detalle: string }> {
  const efectivo = limiteDiarioEfectivo({ limiteDiario: linea.limite_diario, calentamientoDesde: linea.calentamiento_desde ?? null }, ahora);
  const ids = await campanasDeLinea(linea.id, supabase);
  let enviadosHoy = 0;
  if (ids.length) {
    const { count } = await supabase
      .from("campaign_contacts")
      .select("id", { count: "exact", head: true })
      .in("campaign_id", ids)
      .in("status", ENVIADOS)
      .gte("sent_at", inicioDelDia.toISOString());
    enviadosHoy = count ?? 0;
  }
  const detalle = efectivo.porCalentamiento
    ? `La línea «${linea.nombre}» está en el día ${efectivo.dia} de calentamiento: hasta ${efectivo.limite} envíos por día. Mañana sigue sola.`
    : `La línea «${linea.nombre}» llegó a su límite de ${efectivo.limite} envíos por hoy.`;
  return { ...efectivo, enviadosHoy, agotado: enviadosHoy >= efectivo.limite, detalle };
}

/** Cuántos envíos se miran para el freno y cuánto se espera a que se entreguen. */
export const VENTANA_FRENO = { cantidad: 20, esperaMin: 15, horas: 12 };

/**
 * Freno automático (12/11): mira los últimos envíos de la línea que ya tuvieron
 * tiempo de entregarse. Devuelve el motivo para pausar, o null si puede seguir.
 * La ventana es de 12 horas: si se reanuda antes, la misma tanda vuelve a
 * frenar. Es a propósito: la línea necesita ese descanso.
 */
export async function frenoDeLinea(lineaId: string, ahora: Date, supabase: Db = createAdminClient()): Promise<string | null> {
  const ids = await campanasDeLinea(lineaId, supabase);
  if (!ids.length) return null;
  const hasta = new Date(ahora.getTime() - VENTANA_FRENO.esperaMin * 60_000);
  const inicio = new Date(ahora.getTime() - VENTANA_FRENO.horas * 3_600_000);
  const { data } = await supabase
    .from("campaign_contacts")
    .select("status")
    .in("campaign_id", ids)
    .in("status", [...ENVIADOS, "fallo"])
    .gte("sent_at", inicio.toISOString())
    .lte("sent_at", hasta.toISOString())
    .order("sent_at", { ascending: false })
    .limit(VENTANA_FRENO.cantidad);
  const filas = (data ?? []) as { status: string }[];
  return motivoDeFreno({
    enviados: filas.length,
    fallidos: filas.filter((f) => f.status === "fallo").length,
    sinEntregar: filas.filter((f) => f.status === "enviado").length,
  });
}

/** Consulta si el número tiene WhatsApp con la clave de la línea. null = no se pudo saber. */
export async function numeroConWhatsApp(linea: LineaCampana, telefono: string, env: Env = process.env): Promise<boolean | null> {
  const apiKey = descifrar(linea.api_key_cifrada, env);
  if (!apiKey) return null;
  return estaEnWhatsApp(apiKey, telefono, { env });
}
