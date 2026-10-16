/**
 * Etapa 2 · Bloque 5 — Lo que muestra y hace el módulo «Contenido automático».
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { CANALES, type Canal } from "@/lib/contenido/politica";

export class ContenidoError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function panoramaContenido(rubroId: string) {
  const s = createAdminClient();
  const [pol, proximas, publicadas, atencion, pedidos, gsc] = await Promise.all([
    s.from("content_policies").select("canal, habilitada, calendario_pausado, objetivos, temas, frecuencia_semanal, destino_ref, proveedor, zona_horaria, version, updated_at").eq("rubro_id", rubroId),
    s.from("content_pieces").select("id, canal, formato, titulo, texto, estado, programada_para, zona_horaria").eq("rubro_id", rubroId).in("estado", ["programada", "lista", "publicando"]).order("programada_para", { ascending: true, nullsFirst: false }).limit(50),
    s.from("content_pieces").select("id, canal, formato, titulo, texto, publicada_at, url_publicada, proveedor_id, content_results(medido_at, alcance, interacciones, clics, consultas)").eq("rubro_id", rubroId).eq("estado", "publicada").order("publicada_at", { ascending: false }).limit(50),
    s.from("content_pieces").select("id, canal, formato, titulo, texto, estado, motivo, updated_at").eq("rubro_id", rubroId).in("estado", ["retenida", "error", "incierta"]).order("updated_at", { ascending: false }).limit(50),
    s.from("content_requests").select("id, tipo, pedido, estado, resolucion, created_at").eq("rubro_id", rubroId).order("created_at", { ascending: false }).limit(20),
    s.from("search_console_connections").select("estado, propiedad, conectado_at, ultimo_error").eq("rubro_id", rubroId).maybeSingle(),
  ]);
  const error = [pol, proximas, publicadas, atencion, pedidos].find((r) => r.error)?.error ?? null;
  return {
    error: error ? String(error.message ?? error) : null,
    politicas: pol.data ?? [],
    proximas: proximas.data ?? [],
    publicadas: publicadas.data ?? [],
    atencion: atencion.data ?? [],
    pedidos: pedidos.data ?? [],
    searchConsole: gsc.data ?? { estado: "sin_conectar" },
  };
}

export const TIPOS_PEDIDO = ["mejorar_contenido", "cambiar_objetivos", "mejora_seo", "otro"] as const;

export async function registrarPedido(rubroId: string, tipo: unknown, pedido: unknown) {
  const t = (TIPOS_PEDIDO as readonly string[]).includes(String(tipo)) ? String(tipo) : "otro";
  const texto = typeof pedido === "string" ? pedido.trim() : "";
  if (texto.length < 3) throw new ContenidoError("Escribí qué querés mejorar.");
  const { data, error } = await createAdminClient().from("content_requests").insert({ rubro_id: rubroId, tipo: t, pedido: texto.slice(0, 2000) }).select("id").single();
  if (error) throw new ContenidoError(`No se pudo guardar el pedido: ${error.message}`, 500);
  return data.id as string;
}

export interface CambioPolitica {
  habilitada?: boolean;
  calendario_pausado?: boolean;
  objetivos?: string;
  temas?: string[];
  frecuencia_semanal?: number;
}

/** Habilitar la autopublicación o reanudar el calendario pide el PIN; pausar, nunca. */
export function cambioPidePin(c: CambioPolitica): boolean {
  return c.habilitada === true || c.calendario_pausado === false;
}

export function validarCambioPolitica(c: any): { ok: true; cambio: CambioPolitica } | { ok: false; error: string } {
  const out: CambioPolitica = {};
  if (c?.habilitada !== undefined) {
    if (typeof c.habilitada !== "boolean") return { ok: false, error: "Valor no válido." };
    out.habilitada = c.habilitada;
  }
  if (c?.calendario_pausado !== undefined) {
    if (typeof c.calendario_pausado !== "boolean") return { ok: false, error: "Valor no válido." };
    out.calendario_pausado = c.calendario_pausado;
  }
  if (c?.objetivos !== undefined) out.objetivos = String(c.objetivos).trim().slice(0, 1000);
  if (c?.temas !== undefined) {
    if (!Array.isArray(c.temas)) return { ok: false, error: "Temas no válidos." };
    out.temas = c.temas.map((x: unknown) => String(x).trim().slice(0, 120)).filter(Boolean).slice(0, 30);
  }
  if (c?.frecuencia_semanal !== undefined) {
    const n = Number(c.frecuencia_semanal);
    if (!Number.isInteger(n) || n < 0 || n > 14) return { ok: false, error: "La frecuencia va de 0 a 14 piezas por semana." };
    out.frecuencia_semanal = n;
  }
  if (Object.keys(out).length === 0) return { ok: false, error: "No hay cambios." };
  return { ok: true, cambio: out };
}

export async function cambiarPolitica(rubroId: string, canal: Canal | "todos", cambio: CambioPolitica) {
  const s = createAdminClient();
  if (cambio.habilitada === true || cambio.calendario_pausado === false) {
    // No se habilita ni reanuda un canal sin destino conectado y sin CTA configurado.
    const { data } = await s.from("content_policies").select("canal, destino_ref, ctas").eq("rubro_id", rubroId);
    const afectadas = (data ?? []).filter((p: any) => canal === "todos" || p.canal === canal);
    const sinConexion = afectadas.filter((p: any) => !p.destino_ref || !Array.isArray(p.ctas) || p.ctas.length === 0);
    if (sinConexion.length > 0) {
      throw new ContenidoError(`Falta conectar la cuenta o cargar el llamado a la acción en: ${sinConexion.map((p: any) => p.canal).join(", ")}.`, 409);
    }
  }
  let q: any = s.from("content_policies").update({ ...cambio, updated_at: new Date().toISOString(), updated_by: "operador" }).eq("rubro_id", rubroId);
  if (canal !== "todos") q = q.eq("canal", canal);
  const { data, error } = await q.select("canal, habilitada, calendario_pausado");
  if (error) throw new ContenidoError(`No se pudo guardar: ${error.message}`, 500);
  return data ?? [];
}

export function esCanalOTodos(v: unknown): v is Canal | "todos" {
  return v === "todos" || (CANALES as readonly string[]).includes(String(v));
}
