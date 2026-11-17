/**
 * Asistente general · lado servidor (15/11).
 *
 *  - Guardado de las filas de cada planilla adjunta: el navegador las sube
 *    como JSON al depósito privado «bases-originales» con una URL firmada
 *    (igual que el archivo original de una base), así no pasan por el límite
 *    de ~4,5 MB por pedido de Vercel. El modelo nunca las ve.
 *  - Herramientas propias: resumen de los cuatro perfiles, opciones de
 *    Wasender, análisis de una planilla y el plan de campañas (propuesta).
 *  - Ejecución del plan confirmado, de a un paso por pedido (importar cada
 *    parte, crear la campaña, sumar las otras partes, lanzar), con lo hecho
 *    anotado: si algo falla, lo hecho no se deshace y reintentar no duplica.
 *
 * Las campañas se crean llamando a /api/campaigns con la sesión de quien
 * confirma y el mismo cuerpo que el formulario de Campañas: quedan idénticas.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import type { SlugPerfil } from "@/lib/marca";
import type { Area } from "@/lib/supabase/database.types";
import { importBase, RepeatedImportError, rowsFingerprint } from "@/lib/bases/import";
import { checkRow, headersOf } from "@/lib/bases/validate";
import { detectColumns } from "@/lib/bases/mapping";
import { planRecipients } from "@/lib/campaign-recipients";
import { getProfile } from "@/lib/profiles";
import { completarTextoDeCampana, plantillasDeInicioUsables, type PlantillaCampana } from "@/lib/wasender/campanas";
import { textosDistintos } from "@/lib/wasender/ritmo";
import { launchCampaign, CampaignNotReadyError } from "@/lib/campaigns";
import { elegirPorNombre } from "@/lib/asistente/operaciones";
import { hoyEnArgentina, siguienteDia } from "@/lib/asistente/herramientas";
import type { LlamadaInterna } from "@/lib/asistente/panel-operaciones";
import {
  MAX_FILAS_ARCHIVO,
  NOMBRE_PERFIL,
  ROTULO_ORIGEN,
  areaDePerfil,
  aplicarAjustes,
  cuerpoCampanaWasender,
  diasDeEnvio,
  esIdArchivo,
  fuenteDePropuesta,
  lanzamientoVencido,
  puedeAdoptarBase,
  VENCE_LANZAMIENTO_MIN,
  nombreParte,
  normalizarLimite,
  partirFilas,
  pasosPendientes,
  recalcularBoceto,
  resolverPerfil,
  resumenPlan,
  ritmoEnPalabras,
  tituloPlan,
  type LineaBoceto,
  type PayloadPlan,
} from "@/lib/asistente/general";
import { SLUGS_PERFIL } from "@/lib/marca";

type Db = ReturnType<typeof createAdminClient>;

export const DEPOSITO = "bases-originales";
/** Tope del JSON de filas guardado (se controla al leerlo). */
export const MAX_BYTES_ARCHIVO = 60 * 1024 * 1024;
export const rutaArchivo = (id: string) => `asistente-general/${id}/filas.json`;

export interface CtxGeneral {
  /** Planillas adjuntas en esta charla (solo se puede usar una de estas). */
  archivos: Set<string>;
  guardar: (slug: SlugPerfil, tipo: string, titulo: string, resumen: string, payload: unknown) => Promise<{ id: string }>;
  resumenPerfil: (slug: SlugPerfil) => Promise<Record<string, unknown>>;
  /** Planillas ya descargadas en este pedido (cada una se baja una sola vez). */
  filas?: Map<string, Promise<ArchivoGuardado>>;
  /** Cuándo empezó el pedido (para cortar a tiempo con un mensaje claro). */
  inicio?: number;
}

/** Tiempo del pedido a partir del cual no se arma otra campaña (la ruta corta a los 60 s). */
export const PRESUPUESTO_PEDIDO_MS = 35_000;

/** Lee las filas una sola vez por pedido, aunque varias herramientas usen la misma planilla. */
function leerConCache(ctx: CtxGeneral, id: string): Promise<ArchivoGuardado> {
  if (!ctx.filas) ctx.filas = new Map();
  let p = ctx.filas.get(id);
  if (!p) {
    p = leerArchivo(id);
    ctx.filas.set(id, p);
    p.catch(() => ctx.filas?.delete(id));
  }
  return p;
}

// ---------------------------------------------------------------------------
// Filas guardadas
// ---------------------------------------------------------------------------

/**
 * Prepara la subida de las filas de una planilla (URL firmada de un solo uso).
 * El navegador no elige la ruta: la arma el servidor con un identificador
 * nuevo, dentro de «asistente-general/». Sin reemplazo (upsert apagado): la
 * URL solo sirve para crear ese objeto, no para pisar ni leer otros, y lo
 * subido no se puede cambiar después (además se compara su huella al importar).
 */
export async function prepararSubidaArchivo(): Promise<{ id: string; path: string; token: string }> {
  const id = crypto.randomUUID();
  const { data, error } = await createAdminClient().storage.from(DEPOSITO).createSignedUploadUrl(rutaArchivo(id), { upsert: false });
  if (error || !data) throw new Error(error?.message ?? "No se pudo preparar la subida.");
  if (data.path !== rutaArchivo(id)) throw new Error("La subida no quedó en la carpeta esperada.");
  return { id, path: data.path, token: data.token };
}

export interface ArchivoGuardado {
  archivo: string;
  hoja: string | null;
  filas: Record<string, unknown>[];
}

/** Celdas como texto, número, verdadero/falso o vacío (lo demás se pasa a texto). */
function limpiarFila(f: unknown): Record<string, unknown> | null {
  if (!f || typeof f !== "object" || Array.isArray(f)) return null;
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f as Record<string, unknown>).slice(0, 200)) {
    const clave = String(k).slice(0, 200);
    o[clave] = v === null || v === undefined ? "" : typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : String(v);
  }
  return o;
}

/** Lee las filas guardadas de una planilla. Nunca se devuelven al modelo. */
export async function leerArchivo(id: string): Promise<ArchivoGuardado> {
  if (!esIdArchivo(id)) throw new Error("Esa planilla no es válida.");
  const { data, error } = await createAdminClient().storage.from(DEPOSITO).download(rutaArchivo(id));
  if (error || !data) throw new Error("No encontré esa planilla: volvé a adjuntarla.");
  // Tope de tamaño antes de leerla: 50.000 filas razonables pesan bastante menos.
  if (data.size > MAX_BYTES_ARCHIVO) throw new Error("La planilla guardada es demasiado grande: dividila en archivos más chicos.");
  let json: any;
  try {
    json = JSON.parse(await data.text());
  } catch {
    throw new Error("La planilla guardada no se puede leer: volvé a adjuntarla.");
  }
  const filas = (Array.isArray(json?.filas) ? json.filas : []).map(limpiarFila).filter(Boolean) as Record<string, unknown>[];
  if (filas.length > MAX_FILAS_ARCHIVO) throw new Error(`La planilla tiene más de ${MAX_FILAS_ARCHIVO.toLocaleString("es-AR")} filas: dividila antes de subirla.`);
  return { archivo: String(json?.archivo ?? "planilla").slice(0, 120), hoja: typeof json?.hoja === "string" ? json.hoja.slice(0, 60) : null, filas };
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

async function lineasWasender(rubroId: string): Promise<LineaBoceto[]> {
  const { data } = await (createAdminClient().from("wasender_lineas" as any) as any)
    .select("id, nombre, estado, habilitada, limite_diario")
    .eq("rubro_id", rubroId)
    .is("archivada_at", null)
    .order("created_at");
  return ((data ?? []) as any[]).map((l) => ({ id: l.id, nombre: String(l.nombre ?? "Línea"), conectada: l.estado === "connected" && l.habilitada === true, limite: typeof l.limite_diario === "number" ? l.limite_diario : null }));
}

/** Plantillas de inicio que pueden rotar y hasta 3 textos de ejemplo (con un nombre ficticio). */
async function ejemplosDeInicio(slug: SlugPerfil): Promise<{ rotacion: { plantillas: number; textos: number }; ejemplos: string[] }> {
  const rubroId = RUBRO_IDS[slug];
  const [{ data }, perfil] = await Promise.all([
    (createAdminClient().from("wasender_plantillas" as any) as any)
      .select("id, rubro_id, nombre, cuerpo, variantes, activa, archivada_at")
      .eq("rubro_id", rubroId)
      .eq("grupo", "inicio")
      .eq("uso", "campana")
      .is("archivada_at", null),
    getProfile(rubroId).catch(() => null),
  ]);
  const usables = plantillasDeInicioUsables(
    ((data ?? []) as any[]).map((p) => ({ ...p, variantes: Array.isArray(p.variantes) ? p.variantes.filter((v: unknown) => typeof v === "string") : [] })) as PlantillaCampana[]
  );
  const datos = { nombre: "María", asesor: (perfil as any)?.agent_presentation_name ?? "", marca: (perfil as any)?.brand_name ?? NOMBRE_PERFIL[slug] };
  const textos = usables.flatMap((p) => [p.cuerpo, ...p.variantes]).filter((t) => t && t.trim());
  // De plantillas distintas primero, para mostrar ángulos distintos.
  const elegidos = [...usables.map((p) => p.cuerpo), ...textos].filter((t, i, a) => t && a.indexOf(t) === i).slice(0, 3);
  return {
    rotacion: { plantillas: usables.length, textos: usables.reduce((n, p) => n + textosDistintos(p.cuerpo, p.variantes), 0) },
    ejemplos: elegidos.map((t) => completarTextoDeCampana(t, datos).slice(0, 600)),
  };
}

async function canalDelArea(area: string): Promise<string | null> {
  const { data } = await (createAdminClient().from("channels") as any).select("id").eq("area", area).eq("type", "whatsapp").order("created_at").limit(1);
  return ((data ?? []) as any[])[0]?.id ?? null;
}

export interface AnalisisArchivo {
  archivo: string;
  hoja: string | null;
  filas: number;
  partes: number;
  columna_telefono: string | null;
  columna_nombre: string | null;
  mapping: { phone: string | null; name: string | null; dni: string | null };
  utilizables: number;
  telefonos_distintos: number;
  ya_en_el_perfil: number;
  detenidos: number;
  ya_contactados: number;
  elegibles: number;
  repetido: { base: string; fecha: string } | null;
  /** Huella de todas las filas (para comprobar al importar que no cambiaron). */
  huella: string;
}

/**
 * Cuántas personas de la planilla quedarían para contactar en ese perfil:
 * mismo cruce que la importación (identidad de WhatsApp o teléfono en el
 * área) y el mismo criterio de destinatarios (sin detenidos ni ya
 * contactados). Solo lectura.
 */
export async function analizarArchivo(id: string, area: string, leer: (id: string) => Promise<ArchivoGuardado> = leerArchivo): Promise<AnalisisArchivo> {
  const a = await leer(id);
  const s = createAdminClient();
  const columnas = headersOf(a.filas);
  const det = detectColumns(columnas);
  const telefonos = new Set<string>();
  let utilizables = 0;
  a.filas.forEach((f, i) => {
    const c = checkRow(f, i + 1, det);
    if (c.phone) {
      utilizables++;
      telefonos.add(c.phone);
    }
  });
  const lista = [...telefonos];
  const contactoPorTelefono = new Map<string, string>();
  for (let i = 0; i < lista.length; i += 500) {
    const parte = lista.slice(i, i + 500);
    const { data: ids } = await s.from("contact_identities").select("contact_id, external_user_id").eq("area", area as Area).eq("channel_type", "whatsapp").in("external_user_id", parte);
    for (const r of (ids ?? []) as any[]) contactoPorTelefono.set(r.external_user_id, r.contact_id);
    const faltan = parte.filter((p) => !contactoPorTelefono.has(p));
    if (faltan.length) {
      const { data: cs } = await s.from("contacts").select("id, phone").eq("area", area as Area).in("phone", faltan);
      for (const c of (cs ?? []) as any[]) if (c.phone) contactoPorTelefono.set(c.phone, c.id);
    }
  }
  const existentes = [...new Set(contactoPorTelefono.values())];
  const plan = existentes.length ? await planRecipients(existentes, { campaignId: null, includePreviouslyContacted: false }) : null;
  const nuevos = lista.filter((t) => !contactoPorTelefono.has(t)).length;
  // ¿Ya se cargó? Misma huella que la importación, parte por parte.
  let repetido: AnalisisArchivo["repetido"] = null;
  for (const parte of partirFilas(a.filas)) {
    const { data: previo } = await s.from("imported_bases").select("name, created_at").eq("area", area as Area).eq("file_fingerprint", rowsFingerprint(parte)).is("archived_at", null).maybeSingle();
    if (previo) {
      repetido = { base: String((previo as any).name), fecha: String((previo as any).created_at).slice(0, 10) };
      break;
    }
  }
  return {
    archivo: a.archivo,
    hoja: a.hoja,
    filas: a.filas.length,
    partes: partirFilas(a.filas).length,
    columna_telefono: det.phone,
    columna_nombre: det.name,
    mapping: { phone: det.phone, name: det.name, dni: det.dni },
    utilizables,
    telefonos_distintos: lista.length,
    ya_en_el_perfil: existentes.length,
    detenidos: plan?.detenidos ?? 0,
    ya_contactados: plan?.contactados_anteriormente ?? 0,
    elegibles: nuevos + (plan?.elegibles.length ?? 0),
    repetido,
    huella: rowsFingerprint(a.filas),
  };
}

// ---------------------------------------------------------------------------
// Herramientas del asistente general
// ---------------------------------------------------------------------------

function archivoDeLaCharla(ctx: CtxGeneral, v: unknown): string | { error: string } {
  const id = String(v ?? "").trim();
  if (!esIdArchivo(id) || !ctx.archivos.has(id)) return { error: "Esa planilla no está adjunta en esta charla. Usá el archivo_id de la lista de planillas." };
  return id;
}

export async function ejecutarHerramientaGeneral(nombre: string, args: Record<string, unknown>, ctx: CtxGeneral): Promise<Record<string, unknown>> {
  switch (nombre) {
    case "resumen_general": {
      const filas = await Promise.all(SLUGS_PERFIL.map(async (slug) => [NOMBRE_PERFIL[slug], await ctx.resumenPerfil(slug).catch(() => ({ error: "No se pudo leer." }))] as const));
      return Object.fromEntries(filas);
    }
    case "opciones_wasender": {
      const r = resolverPerfil(args.perfil);
      if ("error" in r) return { error: r.error };
      const [lineas, inicio] = await Promise.all([lineasWasender(RUBRO_IDS[r.perfil]), ejemplosDeInicio(r.perfil)]);
      return {
        perfil: NOMBRE_PERFIL[r.perfil],
        lineas: lineas.map((l) => ({ nombre: l.nombre, id: l.id, conectada: l.conectada, limite_por_dia: l.limite })),
        plantillas_de_inicio: inicio.rotacion,
        ejemplos: inicio.ejemplos,
        ritmo: ritmoEnPalabras(),
        nota: lineas.length ? "Solo una línea conectada puede lanzar; desconectada, la campaña queda en borrador." : "Este perfil no tiene líneas de Wasender: hay que conectar una en WhatsApp por QR (Wasender) antes de crear la campaña.",
      };
    }
    case "analizar_archivo": {
      const r = resolverPerfil(args.perfil);
      if ("error" in r) return { error: r.error };
      const id = archivoDeLaCharla(ctx, args.archivo_id);
      if (typeof id !== "string") return id;
      const an = await analizarArchivo(id, areaDePerfil(r.perfil, args.area), (x) => leerConCache(ctx, x));
      if (!an.columna_telefono) return { ...sinMapping(an), error: "No se reconoce ninguna columna de teléfono: esta planilla no se puede importar. Pedile a la responsable que la revise (una columna «Teléfono» o «Celular»)." };
      return { perfil: NOMBRE_PERFIL[r.perfil], ...sinMapping(an), nota: an.repetido ? `Ya se cargó como «${an.repetido.base}» el ${an.repetido.fecha}: no se vuelve a importar.` : undefined };
    }
    case "proponer_plan_campanas":
      return proponerPlan(args, ctx);
    default:
      return { error: "Herramienta desconocida." };
  }
}

function sinMapping(a: AnalisisArchivo) {
  const { mapping: _m, huella: _h, ...resto } = a;
  return resto;
}

async function proponerPlan(args: Record<string, unknown>, ctx: CtxGeneral): Promise<Record<string, unknown>> {
  const lista = Array.isArray(args.campanas) ? (args.campanas as Record<string, unknown>[]).slice(0, 12) : [];
  if (!lista.length) return { error: "Falta al menos una campaña (perfil, planilla, nombre y línea)." };
  const resultados: Record<string, unknown>[] = [];
  const inicio = ctx.inicio ?? Date.now();
  // En serie (no en paralelo): cada planilla puede pesar varios MB. Si no alcanza el tiempo
  // del pedido, las que faltan se dicen con claridad para pedirlas en otro mensaje.
  for (const c of lista) {
    if (Date.now() - inicio > PRESUPUESTO_PEDIDO_MS) {
      resultados.push({ perfil: String(c?.perfil ?? ""), error: "No alcanzó el tiempo de este pedido para armar esta campaña: pedila en otro mensaje (lo ya propuesto queda)." });
      continue;
    }
    try {
      resultados.push(await proponerUna(c ?? {}, ctx));
    } catch (err) {
      resultados.push({ perfil: String(c?.perfil ?? ""), error: String((err as Error)?.message ?? err).slice(0, 200) });
    }
  }
  return { resultados, aviso: "Lo que quedó como propuesta no hizo nada todavía: la responsable revisa el boceto y confirma." };
}

async function proponerUna(c: Record<string, unknown>, ctx: CtxGeneral): Promise<Record<string, unknown>> {
  const r = resolverPerfil(c.perfil);
  if ("error" in r) return { error: r.error };
  const perfil = r.perfil;
  const id = archivoDeLaCharla(ctx, c.archivo_id);
  if (typeof id !== "string") return { perfil, ...id };
  const nombre = String(c.nombre ?? "").trim().slice(0, 120);
  if (nombre.length < 3) return { perfil, error: "Falta el nombre de la campaña." };
  const area = areaDePerfil(perfil, c.area);
  const [an, lineas, inicio, canal] = await Promise.all([analizarArchivo(id, area, (x) => leerConCache(ctx, x)), lineasWasender(RUBRO_IDS[perfil]), ejemplosDeInicio(perfil), canalDelArea(area)]);
  if (!an.columna_telefono) return { perfil, error: `«${an.archivo}» no tiene una columna de teléfono reconocible: no se importa.` };
  if (!canal) return { perfil, error: `El perfil no tiene un canal de WhatsApp para el área ${area}.` };
  if (!lineas.length) return { perfil, error: "Este perfil no tiene líneas de Wasender: hay que conectar una antes de crear la campaña." };
  const l = elegirPorNombre(lineas, c.linea, (x) => x.nombre);
  if (!l.uno) return { perfil, error: l.varios ? "Hay varias líneas que coinciden." : "No encontré esa línea de Wasender en el perfil.", opciones: (l.varios ?? lineas).map((x) => x.nombre) };
  if (an.repetido) return { perfil, error: `«${an.archivo}» ya se cargó en este perfil como «${an.repetido.base}» (${an.repetido.fecha}). No se vuelve a importar: si querés usar esa base, armala desde el asistente del perfil o desde Campañas.` };
  if (an.elegibles === 0) return { perfil, error: "No quedaría nadie para contactar: todos están detenidos, ya contactados o sin teléfono válido." };
  const lim = normalizarLimite(c.limite_diario, c.entrenamiento);
  const nombreBase = String(c.nombre_base ?? "").trim().slice(0, 120) || an.archivo.replace(/\.(csv|xlsx|xls)$/i, "") + (an.hoja ? ` · ${an.hoja}` : "");
  let payload: PayloadPlan = {
    perfil,
    area,
    archivo_id: id,
    huella: an.huella,
    archivo_nombre: an.hoja ? `${an.archivo} › ${an.hoja}` : an.archivo,
    nombre_base: nombreBase,
    partes: an.partes,
    mapping: an.mapping,
    channel_id: canal,
    campana: { nombre, wasender_line_id: l.uno.id, run_days: diasDeEnvio(c.dias), daily_send_limit: lim.daily_send_limit, entrenamiento: lim.entrenamiento },
    lanzar: c.lanzar === true,
    boceto: {
      filas: an.filas,
      utilizables: an.utilizables,
      telefonos_distintos: an.telefonos_distintos,
      elegibles: an.elegibles,
      detenidos: an.detenidos,
      ya_contactados: an.ya_contactados,
      repetido: null,
      columna_telefono: an.columna_telefono,
      columna_nombre: an.columna_nombre,
      lineas,
      ejemplos: inicio.ejemplos,
      rotacion: inicio.rotacion,
      ritmo: ritmoEnPalabras(),
      desde: siguienteDia(hoyEnArgentina()),
      estimado: null,
    },
  };
  payload = recalcularBoceto(payload);
  const resumen = resumenPlan(payload);
  const prop = await ctx.guardar(perfil, "plan_campanas", tituloPlan(payload), resumen, payload);
  return {
    perfil: NOMBRE_PERFIL[perfil],
    propuesta: prop.id,
    resumen,
    linea_conectada: l.uno.conectada,
    plantillas_de_inicio: inicio.rotacion.plantillas,
    aviso: inicio.rotacion.plantillas === 0 ? "El perfil no tiene plantillas de inicio usables: la campaña se crea pero no se podrá lanzar hasta sumarlas." : undefined,
  };
}

/**
 * Planes de campañas de los últimos 7 días que quedaron sin confirmar, a
 * medio hacer o con un paso que falló, para retomarlos si se cerró la
 * pestaña o la sesión a mitad. Solo lectura.
 */
export async function planesParaRetomar(): Promise<{ id: string; tipo: string; titulo: string; resumen: string; estado: string; detalle: unknown; resultado: unknown }[]> {
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await (createAdminClient().from("asistente_acciones" as any) as any)
    .select("id, tipo, titulo, resumen, estado, payload, resultado")
    .eq("tipo", "plan_campanas")
    .in("estado", ["propuesta", "ejecutando", "error"])
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(24);
  return ((data ?? []) as any[]).map((a) => ({ id: a.id, tipo: a.tipo, titulo: a.titulo, resumen: a.resumen, estado: a.estado, detalle: a.payload, resultado: a.resultado }));
}

// ---------------------------------------------------------------------------
// Boceto editable (antes de confirmar)
// ---------------------------------------------------------------------------

/** Guarda los cambios del boceto (solo mientras es propuesta). Devuelve la propuesta actualizada. */
export async function ajustarPlan(id: string, ajustes: unknown): Promise<{ ok: true; titulo: string; resumen: string; detalle: PayloadPlan } | { ok: false; error: string; status: number }> {
  const s = createAdminClient();
  const { data } = await s.from("asistente_acciones" as any).select("tipo, estado, payload").eq("id", id).maybeSingle();
  const a: any = data;
  if (!a || a.tipo !== "plan_campanas") return { ok: false, error: "No encontré esa propuesta.", status: 404 };
  if (a.estado !== "propuesta") return { ok: false, error: "Esta propuesta ya se confirmó o se descartó: no se puede cambiar.", status: 409 };
  const p = a.payload as PayloadPlan;
  const r = aplicarAjustes({ ...p.campana, lanzar: p.lanzar }, ajustes, p.boceto.lineas.map((l) => l.id));
  if (!r.ok) return { ok: false, error: r.error, status: 400 };
  const { lanzar, ...campana } = r.valor;
  const nuevo = recalcularBoceto({ ...p, campana, lanzar });
  const titulo = tituloPlan(nuevo);
  const resumen = resumenPlan(nuevo);
  const { data: hecho } = await s.from("asistente_acciones" as any).update({ payload: nuevo, titulo, resumen }).eq("id", id).eq("estado", "propuesta").select("id").maybeSingle();
  if (!hecho) return { ok: false, error: "Esta propuesta ya se confirmó o se descartó: no se puede cambiar.", status: 409 };
  return { ok: true, titulo, resumen, detalle: nuevo };
}

// ---------------------------------------------------------------------------
// Ejecución del plan confirmado
// ---------------------------------------------------------------------------

interface PasosPlan {
  bases?: ({ id: string; nombre: string; creados: number; total: number } | null)[];
  /** falta_base_inicial: la campaña existe pero no se sabe si quedó con la primera base (se vuelve a sumar; no duplica). */
  campana?: { id: string; nombre: string; destinatarios: number | null; falta_base_inicial?: boolean };
  agregadas?: ({ agregados: number } | null)[];
  lanzada?: { at: string };
}

interface ResultadoPlan {
  version?: number;
  en_paso?: boolean;
  tomado_at?: string;
  pasos?: PasosPlan;
  hechos?: number;
  total?: number;
  error?: string;
  paso_con_error?: string;
  ocupado?: boolean;
}

/**
 * Si otro pedido está haciendo un paso, se espera. Vence a los 120 s por si se
 * cortó: más que el tiempo máximo de la ruta (60 s), así nunca se toma un
 * paso que todavía está corriendo.
 */
export const VENCE_PASO_MS = 120_000;

async function guardarResultado(s: Db, id: string, resultado: ResultadoPlan, estado?: string) {
  await s.from("asistente_acciones" as any).update({ resultado, ...(estado ? { estado } : {}) }).eq("id", id);
}

/** Error de una llamada al panel, en palabras (la sesión vencida se explica aparte). */
function errorDelPanel(res: Response, json: any, alternativa?: string): Error {
  if (res.status === 401 || res.status === 403) return new Error("La sesión venció o se cerró: ingresá de nuevo y tocá «Reintentar lo que falló» (lo hecho no se repite).");
  return new Error(String(alternativa ?? json?.error ?? `El panel respondió ${res.status}.`).slice(0, 280));
}

async function respuestaHttp(res: Response): Promise<any> {
  const t = await res.text();
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}

/**
 * Hace UN paso del plan (el navegador repite hasta que no quedan). Nunca
 * tira error: si un paso falla, la propuesta queda en «error» con lo hecho
 * anotado, y reintentar sigue desde el paso que falló.
 */
export async function avanzarPlanCampanas(a: any, http?: LlamadaInterna): Promise<{ estado: string; resultado: ResultadoPlan; pendientes?: number }> {
  const s = createAdminClient();
  const p = a.payload as PayloadPlan;
  const previo: ResultadoPlan = a.resultado && typeof a.resultado === "object" ? a.resultado : {};
  const pasos: PasosPlan = previo.pasos ?? {};
  const pendientesAntes = pasosPendientes({ partes: p.partes, lanzar: p.lanzar }, pasos);
  const total = pasosPendientes({ partes: p.partes, lanzar: p.lanzar }, {}).length + (pasos.campana?.falta_base_inicial ? 1 : 0);
  if (!pendientesAntes.length) {
    const fin: ResultadoPlan = { ...previo, en_paso: false, error: undefined, total, hechos: total };
    await guardarResultado(s, a.id, fin, "ejecutada");
    return { estado: "ejecutada", resultado: fin };
  }
  // Tomar el paso: solo un pedido a la vez (dos pestañas o doble clic no lo repiten).
  if (previo.en_paso && previo.tomado_at && Date.now() - Date.parse(previo.tomado_at) < VENCE_PASO_MS) {
    return { estado: "ejecutando", resultado: { ...previo, ocupado: true }, pendientes: pendientesAntes.length };
  }
  const v = Number(previo.version ?? 0);
  const tomado: ResultadoPlan = { ...previo, version: v + 1, en_paso: true, tomado_at: new Date().toISOString(), error: undefined, paso_con_error: undefined, total };
  let q: any = (s.from("asistente_acciones" as any) as any).update({ resultado: tomado }).eq("id", a.id).eq("estado", "ejecutando");
  q = v === 0 ? q.is("resultado->>version", null) : q.eq("resultado->>version", String(v));
  const { data: claim } = await q.select("id").maybeSingle();
  if (!claim) return { estado: "ejecutando", resultado: { ...previo, ocupado: true }, pendientes: pendientesAntes.length };

  const paso = pendientesAntes[0];
  try {
    // Retomado mucho después (sesión o pestaña cerrada a mitad): no se lanza con la confirmación vieja.
    if (paso === "lanzar" && lanzamientoVencido(a.decidida_at)) {
      throw new Error(`Quedó a medio hacer más de ${VENCE_LANZAMIENTO_MIN} minutos: para lanzarla, marcá de nuevo la confirmación y tocá «Reintentar lo que falló».`);
    }
    await hacerPaso(paso, a, p, pasos, http);
    const quedan = pasosPendientes({ partes: p.partes, lanzar: p.lanzar }, pasos);
    const listo: ResultadoPlan = { version: v + 1, en_paso: false, pasos, total, hechos: total - quedan.length };
    const estado = quedan.length ? "ejecutando" : "ejecutada";
    await guardarResultado(s, a.id, listo, estado);
    return { estado, resultado: listo, pendientes: quedan.length };
  } catch (err) {
    const mensaje = err instanceof CampaignNotReadyError ? `Quedó creada en borrador, pero no se lanzó: ${err.missing.join("; ")}`.slice(0, 300) : String((err as Error)?.message ?? err).slice(0, 300);
    const quedan = pasosPendientes({ partes: p.partes, lanzar: p.lanzar }, pasos);
    const fallo: ResultadoPlan = { version: v + 1, en_paso: false, pasos, total, hechos: total - quedan.length, error: mensaje, paso_con_error: paso.split(":")[0] };
    await guardarResultado(s, a.id, fallo, "error");
    return { estado: "error", resultado: fallo };
  }
}

async function hacerPaso(paso: string, a: any, p: PayloadPlan, pasos: PasosPlan, http?: LlamadaInterna): Promise<void> {
  const s = createAdminClient();
  const [tipo, n] = paso.split(":");
  const i = Number(n ?? 0);
  if (tipo === "importar") {
    const archivo = await leerArchivo(p.archivo_id);
    const partes = partirFilas(archivo.filas);
    // Se importa exactamente lo que se analizó al armar la propuesta.
    if (partes.length !== p.partes || (p.huella && rowsFingerprint(archivo.filas) !== p.huella)) throw new Error("La planilla guardada cambió desde que se armó la propuesta. Pedí el plan de nuevo.");
    let base: { id: string; nombre: string; creados: number; total: number };
    const nombre = nombreParte(p.nombre_base, i, p.partes);
    try {
      const r = await importBase({
        area: p.area as Area,
        name: nombre,
        sourceLabel: fuenteDePropuesta(a.id),
        fileName: p.archivo_nombre,
        rows: partes[i],
        importedBy: null,
        storagePath: null,
        mapping: p.mapping,
        allowRepeat: false,
      });
      base = { id: r.base_id, nombre, creados: r.creados, total: r.total };
    } catch (err) {
      if (!(err instanceof RepeatedImportError)) throw err;
      // Ya existe una base con estas mismas filas. Se usa solo si la creó ESTA propuesta en un
      // intento que se cortó y quedó completa; si no, se avisa y este perfil no sigue.
      const [{ data: previa }, { count }] = await Promise.all([
        (s.from("imported_bases") as any).select("source_label, created_at, import_summary").eq("id", err.previous.id).maybeSingle(),
        s.from("imported_base_rows").select("id", { count: "exact", head: true }).eq("base_id", err.previous.id),
      ]);
      const adoptar = puedeAdoptarBase(
        { source_label: previa?.source_label ?? null, created_at: previa?.created_at ?? err.previous.created_at, import_summary: previa?.import_summary ?? null, filas_guardadas: count ?? 0 },
        { id: a.id, created_at: a.created_at },
        partes[i].length
      );
      if (!adoptar.ok && adoptar.motivo === "ajena") throw new Error(`Esta planilla ya estaba cargada como «${err.previous.name}»: no se vuelve a importar.`);
      if (!adoptar.ok) {
        throw new Error(`Un intento anterior dejó la base «${err.previous.name}» cargada a medias (${count ?? 0} de ${partes[i].length} filas). Archivala desde Bases y tocá «Reintentar lo que falló»: se vuelve a importar entera.`);
      }
      base = { id: err.previous.id, nombre: err.previous.name, creados: 0, total: partes[i].length };
    }
    pasos.bases = [...(pasos.bases ?? [])];
    pasos.bases[i] = base;
    return;
  }
  if (tipo === "crear") {
    const baseId = pasos.bases?.[0]?.id;
    if (!baseId) throw new Error("Falta la base importada.");
    // Un intento anterior que se cortó pudo haberla creado: se busca antes de crear otra.
    const { data: previa } = await (s.from("campaigns") as any)
      .select("id, name")
      .eq("area", p.area)
      .eq("name", p.campana.nombre)
      .eq("proveedor", "wasender")
      .eq("wasender_line_id", p.campana.wasender_line_id)
      .gte("created_at", a.created_at)
      .is("archived_at", null)
      .limit(1);
    const yaCreada = ((previa ?? []) as any[])[0];
    if (yaCreada) {
      pasos.campana = { id: yaCreada.id, nombre: yaCreada.name, destinatarios: null, falta_base_inicial: true };
      return;
    }
    if (!http) throw new Error("No se pudo llamar al panel para crear la campaña.");
    const url = new URL("/api/campaigns", http.origen);
    const res = await (http.fetchImpl ?? fetch)(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(http.cookie ? { cookie: http.cookie } : {}), "x-origen-asistente": "1" },
      body: JSON.stringify(cuerpoCampanaWasender({ ...p.campana, channel_id: p.channel_id, base_id: baseId })),
      cache: "no-store",
      signal: AbortSignal.timeout(50_000),
    });
    const json = await respuestaHttp(res);
    if (json?.campaign?.id) {
      pasos.campana = {
        id: json.campaign.id,
        nombre: json.campaign.name ?? p.campana.nombre,
        destinatarios: typeof json?.destinatarios?.elegibles === "number" ? json.destinatarios.elegibles : null,
        ...(res.status === 207 ? { falta_base_inicial: true } : {}),
      };
      await rotularCampana(s, json.campaign.id, a);
    }
    if (!res.ok || res.status === 207) throw errorDelPanel(res, json, res.status === 207 ? json?.warning : undefined);
    return;
  }
  if (tipo === "agregar") {
    const campanaId = pasos.campana?.id;
    const baseId = pasos.bases?.[i]?.id;
    if (!campanaId || !baseId) throw new Error("Falta la campaña o la base para sumar.");
    if (!http) throw new Error("No se pudo llamar al panel para sumar la base.");
    const res = await (http.fetchImpl ?? fetch)(new URL(`/api/campaigns/${campanaId}/agregar-base`, http.origen), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(http.cookie ? { cookie: http.cookie } : {}), "x-origen-asistente": "1" },
      body: JSON.stringify({ base_id: baseId }),
      cache: "no-store",
      signal: AbortSignal.timeout(50_000),
    });
    const json = await respuestaHttp(res);
    if (!res.ok) throw errorDelPanel(res, json);
    pasos.agregadas = [...(pasos.agregadas ?? [])];
    pasos.agregadas[i] = { agregados: Number(json?.agregados ?? 0) };
    return;
  }
  if (tipo === "lanzar") {
    const campanaId = pasos.campana?.id;
    if (!campanaId) throw new Error("Falta la campaña para lanzar.");
    // Se lanza solo la campaña que creó este plan, en el perfil propuesto y si sigue en borrador.
    const { data: camp } = await (s.from("campaigns") as any).select("id, area, status, archived_at, proveedor").eq("id", campanaId).maybeSingle();
    if (!camp || camp.area !== p.area || camp.archived_at || camp.proveedor !== "wasender") throw new Error("La campaña ya no está como se propuso (archivada o cambiada): no se lanzó.");
    if (camp.status === "en_curso") {
      pasos.lanzada = { at: new Date().toISOString() };
      return;
    }
    if (camp.status !== "borrador") throw new Error(`La campaña ya no está en borrador (está «${camp.status}»): no se lanzó.`);
    await launchCampaign(campanaId);
    pasos.lanzada = { at: new Date().toISOString() };
    return;
  }
  throw new Error("Paso desconocido.");
}

/** Deja anotado que la campaña se creó desde el asistente general (no cambia cómo funciona). */
async function rotularCampana(s: Db, campanaId: string, a: any) {
  await (s.from("campaigns") as any)
    .update({ creada_desde: "asistente_general" })
    .eq("id", campanaId)
    .then(
      () => undefined,
      () => undefined
    );
  await s
    .from("ops_change_log")
    .insert({ actor: "asistente_general", action: "crear_campana", target: `campaigns:${campanaId}`, before: null, after: { propuesta: a.id, perfil: a.payload?.perfil }, note: ROTULO_ORIGEN })
    .then(
      () => undefined,
      () => undefined
    );
}
