import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";
import { cifrar, claveCifradoLista } from "@/lib/wasender/cifrado";
import { actualizarWebhook, conectarLinea, crearLinea as crearEnWasender, desconectarLinea, obtenerQr, verLinea, WasenderError, type ClienteDeps } from "@/lib/wasender/cliente";
import { qrComoImagen } from "@/lib/wasender/qr";
import { esNumeroDeMeta, pideQr, puedeHabilitar, telefonoValido, ultimosDigitos } from "@/lib/wasender/reglas";
import { direccionWebhook, recibeEnEsteEntorno } from "@/lib/wasender/webhook-url";

/**
 * Líneas de Wasender (10/11): alta, QR, estado, cambios y archivo. Todo en
 * tablas propias; nada de Meta se lee para escribir ni se modifica. Las claves
 * de cada línea se guardan cifradas y nunca salen de este módulo.
 */

type Db = ReturnType<typeof createAdminClient>;

export interface LineaVista {
  id: string;
  rubro_id: string;
  area: Area;
  nombre: string;
  telefono: string;
  estado: string;
  estado_at: string | null;
  habilitada: boolean;
  responde_con_bot: boolean;
  modo_prueba: boolean;
  ultimo_error: string | null;
  created_at: string;
  archivada_at: string | null;
  motivo_archivo: string | null;
  tiene_clave: boolean;
}

const COLUMNAS =
  "id, rubro_id, area, nombre, telefono, sesion_id, estado, estado_at, habilitada, responde_con_bot, modo_prueba, ultimo_error, created_at, archivada_at, motivo_archivo, api_key_cifrada";

function aVista(f: any): LineaVista {
  return {
    id: f.id,
    rubro_id: f.rubro_id,
    area: f.area,
    nombre: f.nombre,
    telefono: f.telefono,
    estado: f.estado,
    estado_at: f.estado_at ?? null,
    habilitada: !!f.habilitada,
    responde_con_bot: !!f.responde_con_bot,
    modo_prueba: !!f.modo_prueba,
    ultimo_error: f.ultimo_error ?? null,
    created_at: f.created_at,
    archivada_at: f.archivada_at ?? null,
    motivo_archivo: f.motivo_archivo ?? null,
    tiene_clave: !!f.api_key_cifrada,
  };
}

export async function listarLineas(rubroId: string, supabase: Db = createAdminClient()): Promise<LineaVista[]> {
  const { data, error } = await (supabase.from("wasender_lineas" as any) as any).select(COLUMNAS).eq("rubro_id", rubroId).order("created_at");
  if (error) throw new Error(`No se pudieron leer las líneas de Wasender: ${error.message}`);
  return ((data ?? []) as any[]).map(aVista);
}

async function cargar(lineaId: string, supabase: Db): Promise<any | null> {
  const { data } = await (supabase.from("wasender_lineas" as any) as any).select(COLUMNAS).eq("id", lineaId).maybeSingle();
  return data ?? null;
}

async function registrar(supabase: Db, accion: string, lineaId: string, extra: { before?: unknown; after?: unknown }) {
  await supabase.from("ops_change_log").insert({ actor: "panel", action: accion, target: `wasender_lineas:${lineaId}`, ...extra } as any);
}

/** Números de las líneas de Meta (solo para no conectar por QR una línea que está en Meta). */
async function numerosDeMeta(supabase: Db): Promise<string[]> {
  const [{ data: lineas }, { data: canales }] = await Promise.all([
    supabase.from("profile_lines").select("phone_display").eq("active", true),
    supabase.from("channels").select("phone_number").eq("type", "whatsapp"),
  ]);
  return [...((lineas ?? []) as any[]).map((l) => l.phone_display), ...((canales ?? []) as any[]).map((c) => c.phone_number)].filter(Boolean);
}

export class ErrorLinea extends Error {
  status: number;
  /** Código para que la pantalla sepa qué preguntar (por ejemplo, «numero_de_meta»). */
  codigo: string | null;
  constructor(message: string, status = 400, codigo: string | null = null) {
    super(message);
    this.status = status;
    this.codigo = codigo;
  }
}

export async function crearLinea(
  datos: { rubroId: string; area: Area; nombre: string; telefono: string; confirmaFueraDeMeta?: boolean },
  deps: ClienteDeps & { supabase?: Db } = {}
): Promise<LineaVista> {
  const supabase = deps.supabase ?? createAdminClient();
  const env = deps.env ?? process.env;
  const nombre = (datos.nombre ?? "").trim().slice(0, 80);
  if (!nombre) throw new ErrorLinea("Poné un nombre para la línea.");
  const telefono = telefonoValido(datos.telefono);
  if (!telefono) throw new ErrorLinea("El número tiene que tener entre 8 y 15 dígitos, con el código de país (por ejemplo +54 9 11 …).");
  if (!(env.WASENDER_PAT ?? "").trim()) throw new ErrorLinea("Falta cargar el token de la cuenta de Wasender (WASENDER_PAT) en Vercel.");
  if (!claveCifradoLista(env)) throw new ErrorLinea("Falta cargar la clave de cifrado (WASENDER_CLAVE_CIFRADO) en Vercel.");
  // Un número que figura en Meta solo se conecta si la responsable confirma que ya lo sacó de Meta
  // (en WhatsApp Manager). Así no se escanea por error una línea que sigue funcionando en Meta.
  const deMeta = esNumeroDeMeta(telefono, await numerosDeMeta(supabase));
  if (deMeta && datos.confirmaFueraDeMeta !== true) {
    throw new ErrorLinea(
      "Ese número figura como línea de Meta. Si todavía está en Meta, no lo conectes: dejaría de funcionar allá. Si ya lo sacaste de Meta (WhatsApp Manager → eliminar el número), confirmalo para seguir.",
      409,
      "numero_de_meta"
    );
  }

  const id = randomUUID();
  const webhook = direccionWebhook(id, env);
  if (!webhook.url) throw new ErrorLinea(`Falta: ${webhook.falta.join(" y ")}.`);

  const { error: errInsert } = await (supabase.from("wasender_lineas" as any) as any).insert({
    id,
    rubro_id: datos.rubroId,
    area: datos.area,
    nombre,
    telefono,
    estado: "creando",
    estado_at: new Date().toISOString(),
  });
  if (errInsert) {
    const msg = (errInsert as any).code === "23505" ? "Ese número ya está en otra línea de Wasender activa." : errInsert.message;
    throw new ErrorLinea(msg);
  }

  try {
    const creada = await crearEnWasender({ nombre, telefono, webhookUrl: webhook.url }, deps);
    let { apiKey, webhookSecret } = creada;
    if (!apiKey || !webhookSecret) {
      const det = await verLinea(creada.sesionId, deps);
      apiKey = apiKey ?? det.apiKey;
      webhookSecret = webhookSecret ?? det.webhookSecret;
    }
    await (supabase.from("wasender_lineas" as any) as any)
      .update({
        sesion_id: creada.sesionId,
        estado: creada.estado,
        estado_at: new Date().toISOString(),
        api_key_cifrada: apiKey ? cifrar(apiKey, env) : null,
        webhook_secret_cifrado: webhookSecret ? cifrar(webhookSecret, env) : null,
        ultimo_error: !apiKey || !webhookSecret ? "Wasender no devolvió la clave o el secreto de la línea: se piden al conectar." : null,
      })
      .eq("id", id);
  } catch (err: any) {
    const detalle = err instanceof WasenderError ? err.message : String(err?.message ?? err);
    await (supabase.from("wasender_lineas" as any) as any)
      .update({
        estado: "error",
        ultimo_error: detalle.slice(0, 500),
        habilitada: false,
        archivada_at: new Date().toISOString(),
        motivo_archivo: `No se pudo crear en Wasender: ${detalle}`.slice(0, 500),
      })
      .eq("id", id);
    await registrar(supabase, "wasender_crear_linea_error", id, { after: { rubro_id: datos.rubroId, area: datos.area, nombre, telefono: ultimosDigitos(telefono), detalle: detalle.slice(0, 300) } });
    throw new ErrorLinea(`No se pudo crear la línea en Wasender: ${detalle}`, 502);
  }

  await registrar(supabase, "wasender_crear_linea", id, {
    after: { rubro_id: datos.rubroId, area: datos.area, nombre, telefono: ultimosDigitos(telefono), ...(deMeta ? { confirmo_fuera_de_meta: true } : {}) },
  });
  return aVista(await cargar(id, supabase));
}

/** Guarda la clave y el secreto si Wasender los devuelve más tarde (al conectar). */
async function completarClaves(supabase: Db, fila: any, det: { apiKey: string | null; webhookSecret: string | null }, env: Record<string, string | undefined>) {
  const cambios: Record<string, unknown> = {};
  if (!fila.api_key_cifrada && det.apiKey) cambios.api_key_cifrada = cifrar(det.apiKey, env);
  if (det.webhookSecret && !fila.webhook_secret_cifrado) cambios.webhook_secret_cifrado = cifrar(det.webhookSecret, env);
  if (Object.keys(cambios).length) await (supabase.from("wasender_lineas" as any) as any).update(cambios).eq("id", fila.id);
}

export interface EstadoConQr {
  linea: LineaVista;
  qrImagen: string | null;
  /** Si la línea le avisa a este entorno (producción o la Preview). null si no se pudo saber. */
  recibeAqui?: boolean | null;
}

/** Consulta el estado en Wasender y, si hace falta escanear, el QR. */
export async function estadoYQr(lineaId: string, deps: ClienteDeps & { supabase?: Db } = {}): Promise<EstadoConQr> {
  const supabase = deps.supabase ?? createAdminClient();
  const env = deps.env ?? process.env;
  const fila = await cargar(lineaId, supabase);
  if (!fila) throw new ErrorLinea("Línea no encontrada.", 404);
  if (!fila.sesion_id || fila.archivada_at) return { linea: aVista(fila), qrImagen: null };
  const det = await verLinea(fila.sesion_id, deps);
  await completarClaves(supabase, fila, det, env);
  if (det.estado !== fila.estado) {
    // Si la línea se cayó (sesión cerrada, vencida, desconectada o pide QR), queda apagada:
    // al reconectarla hay que volver a habilitarla a mano (nada se prende solo).
    const caida = ["logged_out", "expired", "disconnected", "need_scan"].includes(det.estado);
    await (supabase.from("wasender_lineas" as any) as any)
      .update({ estado: det.estado, estado_at: new Date().toISOString(), ...(caida ? { habilitada: false } : {}) })
      .eq("id", lineaId);
  }
  let qrImagen: string | null = null;
  if (det.estado === "need_scan") {
    const qr = await obtenerQr(fila.sesion_id, deps).catch(() => null);
    if (qr) qrImagen = qrComoImagen(qr);
  }
  return { linea: aVista(await cargar(lineaId, supabase)), qrImagen, recibeAqui: recibeEnEsteEntorno(det.webhookUrl, lineaId, env) };
}

/**
 * Hace que la línea le avise a este entorno (10/11: al pasar de la Preview a
 * producción). Solo cambia la dirección en Wasender: la conexión, el QR y los
 * interruptores quedan igual. Si Wasender renovó el secreto, se guarda cifrado.
 */
export async function recibirAqui(lineaId: string, deps: ClienteDeps & { supabase?: Db } = {}): Promise<EstadoConQr> {
  const supabase = deps.supabase ?? createAdminClient();
  const env = deps.env ?? process.env;
  const fila = await cargar(lineaId, supabase);
  if (!fila) throw new ErrorLinea("Línea no encontrada.", 404);
  if (fila.archivada_at) throw new ErrorLinea("La línea está archivada.");
  if (!fila.sesion_id) throw new ErrorLinea("La línea no se llegó a crear en Wasender.");
  if (!claveCifradoLista(env)) throw new ErrorLinea("Falta la clave de cifrado (WASENDER_CLAVE_CIFRADO) en este entorno.");
  const webhook = direccionWebhook(lineaId, env);
  if (!webhook.url) throw new ErrorLinea(`Falta: ${webhook.falta.join(" y ")}.`);
  await actualizarWebhook(fila.sesion_id, webhook.url, deps);
  const det = await verLinea(fila.sesion_id, deps);
  if (det.webhookSecret) {
    await (supabase.from("wasender_lineas" as any) as any).update({ webhook_secret_cifrado: cifrar(det.webhookSecret, env) }).eq("id", lineaId);
  }
  await registrar(supabase, "wasender_recibir_en_este_entorno", lineaId, {
    after: { entorno: webhook.esPreview ? "preview" : "produccion", servidor: new URL(webhook.url).host },
  });
  return { linea: aVista(await cargar(lineaId, supabase)), qrImagen: null, recibeAqui: recibeEnEsteEntorno(det.webhookUrl, lineaId, env) };
}

/** Pide a Wasender conectar la línea (genera el QR). */
export async function conectar(lineaId: string, deps: ClienteDeps & { supabase?: Db } = {}): Promise<EstadoConQr> {
  const supabase = deps.supabase ?? createAdminClient();
  const fila = await cargar(lineaId, supabase);
  if (!fila) throw new ErrorLinea("Línea no encontrada.", 404);
  if (fila.archivada_at) throw new ErrorLinea("La línea está archivada.");
  if (!fila.sesion_id) throw new ErrorLinea("La línea no se llegó a crear en Wasender.");
  const r = await conectarLinea(fila.sesion_id, deps);
  await (supabase.from("wasender_lineas" as any) as any).update({ estado: r.estado, estado_at: new Date().toISOString(), ultimo_error: null }).eq("id", lineaId);
  await registrar(supabase, "wasender_conectar_linea", lineaId, { after: { estado: r.estado } });
  const qr = r.qr ?? (pideQr(r.estado) ? await obtenerQr(fila.sesion_id, deps).catch(() => null) : null);
  return { linea: aVista(await cargar(lineaId, supabase)), qrImagen: qr ? qrComoImagen(qr) : null };
}

export async function desconectar(lineaId: string, deps: ClienteDeps & { supabase?: Db } = {}): Promise<LineaVista> {
  const supabase = deps.supabase ?? createAdminClient();
  const fila = await cargar(lineaId, supabase);
  if (!fila) throw new ErrorLinea("Línea no encontrada.", 404);
  if (!fila.sesion_id) throw new ErrorLinea("La línea no se llegó a crear en Wasender.");
  await desconectarLinea(fila.sesion_id, deps);
  await (supabase.from("wasender_lineas" as any) as any).update({ estado: "disconnected", estado_at: new Date().toISOString(), habilitada: false }).eq("id", lineaId);
  await registrar(supabase, "wasender_desconectar_linea", lineaId, { before: { estado: fila.estado, habilitada: fila.habilitada }, after: { estado: "disconnected", habilitada: false } });
  return aVista(await cargar(lineaId, supabase));
}

export async function editarLinea(
  lineaId: string,
  cambios: { nombre?: unknown; habilitada?: unknown; responde_con_bot?: unknown; modo_prueba?: unknown },
  supabase: Db = createAdminClient()
): Promise<LineaVista> {
  const fila = await cargar(lineaId, supabase);
  if (!fila) throw new ErrorLinea("Línea no encontrada.", 404);
  if (fila.archivada_at) throw new ErrorLinea("La línea está archivada.");
  const update: Record<string, unknown> = {};
  if (typeof cambios.nombre === "string") {
    const n = cambios.nombre.trim().slice(0, 80);
    if (!n) throw new ErrorLinea("La línea necesita un nombre.");
    update.nombre = n;
  }
  if (typeof cambios.habilitada === "boolean") {
    if (cambios.habilitada && !puedeHabilitar(fila.estado)) throw new ErrorLinea("Primero conectá la línea escaneando el QR.");
    if (cambios.habilitada && !fila.api_key_cifrada) throw new ErrorLinea("La línea todavía no tiene su clave guardada: tocá «Ver estado» y volvé a intentar.");
    update.habilitada = cambios.habilitada;
  }
  if (typeof cambios.responde_con_bot === "boolean") update.responde_con_bot = cambios.responde_con_bot;
  if (typeof cambios.modo_prueba === "boolean") update.modo_prueba = cambios.modo_prueba;
  if (!Object.keys(update).length) throw new ErrorLinea("Nada para guardar.");
  const { error } = await (supabase.from("wasender_lineas" as any) as any).update(update).eq("id", lineaId);
  if (error) throw new ErrorLinea(error.message);
  const before = Object.fromEntries(Object.keys(update).map((k) => [k, fila[k]]));
  await registrar(supabase, "wasender_editar_linea", lineaId, { before, after: update });
  return aVista(await cargar(lineaId, supabase));
}

export async function archivarLinea(lineaId: string, motivo: unknown, supabase: Db = createAdminClient()): Promise<LineaVista> {
  const m = typeof motivo === "string" ? motivo.trim().slice(0, 500) : "";
  if (!m) throw new ErrorLinea("Para archivar la línea escribí el motivo.");
  const fila = await cargar(lineaId, supabase);
  if (!fila) throw new ErrorLinea("Línea no encontrada.", 404);
  if (fila.archivada_at) return aVista(fila);
  await (supabase.from("wasender_lineas" as any) as any).update({ archivada_at: new Date().toISOString(), motivo_archivo: m, habilitada: false }).eq("id", lineaId);
  await registrar(supabase, "wasender_archivar_linea", lineaId, { before: { habilitada: fila.habilitada }, after: { archivada: true, motivo: m } });
  return aVista(await cargar(lineaId, supabase));
}

/** Línea con sus datos internos (para el webhook y los envíos). Nunca se devuelve al navegador. */
export async function lineaInterna(lineaId: string, supabase: Db = createAdminClient()): Promise<any | null> {
  const { data } = await (supabase.from("wasender_lineas" as any) as any)
    .select("id, rubro_id, area, nombre, telefono, sesion_id, estado, habilitada, responde_con_bot, modo_prueba, api_key_cifrada, webhook_secret_cifrado, archivada_at")
    .eq("id", lineaId)
    .maybeSingle();
  return data ?? null;
}
