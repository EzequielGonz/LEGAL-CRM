/**
 * Marketing · Extraer negocios (16/10). Una extracción = una base.
 *
 * El pedido se valida contra los topes de gasto de Outscraper
 * (system_settings.limites_outscraper). Se corre una zona por vez: la
 * primera en el momento del pedido y el resto desde el latido del
 * servidor (sigue aunque nadie tenga el panel abierto). Deduplica igual
 * que la captación de siempre (lugar de Google y teléfono). No contacta a
 * nadie: para eso está «Ejecutar base».
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { searchGooglePlaces } from "./google-places";
import { importScrapedPlaces } from "./import-scrape";
import { cantidadParaZona, consultaZona, validarExtraccion, zonasDeExtraccion, type LimitesOutscraper } from "./venta";

export class ExtraccionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "ExtraccionError";
  }
}

const ahora = () => new Date().toISOString();
const STALE_MIN = 5;

export async function leerLimites(): Promise<LimitesOutscraper> {
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", "limites_outscraper").maybeSingle();
  const v = ((data as any)?.value ?? {}) as Partial<LimitesOutscraper>;
  return {
    por_extraccion: Number.isFinite(v.por_extraccion) && (v.por_extraccion as number) > 0 ? (v.por_extraccion as number) : 500,
    por_dia: Number.isFinite(v.por_dia) && (v.por_dia as number) > 0 ? (v.por_dia as number) : 1000,
  };
}

/** Negocios reservados hoy (topes pedidos en extracciones no canceladas). */
export async function usadosHoy(): Promise<number> {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const { data } = await createAdminClient()
    .from("marketing_extracciones" as any)
    .select("cantidad_max, encontrados, estado")
    .gte("created_at", inicio.toISOString())
    .neq("estado", "cancelado");
  return ((data ?? []) as any[]).reduce((a, r) => a + (r.estado === "listo" || r.estado === "error" ? r.encontrados : r.cantidad_max), 0);
}

export async function crearExtraccion(input: { tipo: string; zonas: string[]; cantidad: number; nombre: string; actor?: string }) {
  if (!(process.env.OUTSCRAPER_API_KEY ?? "").trim()) throw new ExtraccionError("Falta OUTSCRAPER_API_KEY en Vercel: sin esa clave no se puede extraer.", 409);
  const limites = await leerLimites();
  const errores = validarExtraccion(input, limites, await usadosHoy());
  if (errores.length) throw new ExtraccionError(errores.join(" "), 400);
  const zonas = zonasDeExtraccion(input.zonas);
  const s = createAdminClient();
  const { data: base, error: eb } = await s
    .from("imported_bases")
    .insert({ area: "marketing", name: input.nombre.trim().slice(0, 120), source_label: "Google Maps · Extraer negocios", file_name: null, total_rows: 0 })
    .select("id")
    .single();
  if (eb || !base) throw new ExtraccionError(`No se pudo crear la base: ${eb?.message}`, 500);
  const { data, error } = await s
    .from("marketing_extracciones" as any)
    .insert({
      nombre_base: input.nombre.trim().slice(0, 120),
      tipo_negocio: input.tipo.trim().slice(0, 120),
      zonas,
      cantidad_max: input.cantidad,
      base_id: (base as any).id,
      progreso: { hechas: [], pendientes: zonas, consultas: 0 },
      creado_por: input.actor ?? "operador",
    })
    .select("*")
    .single();
  if (error) throw new ExtraccionError(error.message, 500);
  return data as any;
}

/** Corre la próxima zona de la extracción indicada (o de la más vieja pendiente). */
export async function avanzarExtraccion(id?: string): Promise<string> {
  const s = createAdminClient();
  // Recupera las que quedaron «ejecutando» por un corte.
  await s
    .from("marketing_extracciones" as any)
    .update({ estado: "pendiente", updated_at: ahora() })
    .eq("estado", "ejecutando")
    .lt("updated_at", new Date(Date.now() - STALE_MIN * 60_000).toISOString());
  let q = s.from("marketing_extracciones" as any).select("*").eq("estado", "pendiente").order("created_at").limit(1);
  if (id) q = s.from("marketing_extracciones" as any).select("*").eq("id", id).eq("estado", "pendiente").limit(1);
  const { data: filas } = await q;
  const ext = ((filas ?? []) as any[])[0];
  if (!ext) return "sin extracciones pendientes";
  const { data: tomada } = await s
    .from("marketing_extracciones" as any)
    .update({ estado: "ejecutando", started_at: ext.started_at ?? ahora(), updated_at: ahora() })
    .eq("id", ext.id)
    .eq("estado", "pendiente")
    .select("id")
    .maybeSingle();
  if (!tomada) return "otra ejecución tomó la extracción";

  const progreso = { hechas: [] as string[], pendientes: [] as string[], consultas: 0, ...(ext.progreso ?? {}) };
  const zona = progreso.pendientes[0];
  const cantidad = zona ? cantidadParaZona({ maxTotal: ext.cantidad_max, encontrados: ext.encontrados, zonasRestantes: progreso.pendientes.length }) : 0;
  if (!zona || cantidad === 0) {
    await s.from("marketing_extracciones" as any).update({ estado: "listo", finished_at: ahora(), updated_at: ahora() }).eq("id", ext.id);
    return `${ext.nombre_base}: lista`;
  }
  try {
    const places = await searchGooglePlaces({ query: consultaZona(ext.tipo_negocio, zona), maxResults: cantidad });
    const tomar = places.slice(0, Math.max(0, ext.cantidad_max - ext.encontrados));
    const r = tomar.length
      ? await importScrapedPlaces({ rubroBuscado: ext.tipo_negocio, zona, places: tomar, baseId: ext.base_id, extraccionId: ext.id })
      : { total: 0, creados: 0, duplicados: 0, invalidos: 0 };
    const nuevoProgreso = { hechas: [...progreso.hechas, zona], pendientes: progreso.pendientes.slice(1), consultas: progreso.consultas + 1 };
    const encontrados = ext.encontrados + r.total;
    const terminada = nuevoProgreso.pendientes.length === 0 || encontrados >= ext.cantidad_max;
    await s
      .from("marketing_extracciones" as any)
      .update({
        estado: terminada ? "listo" : "pendiente",
        progreso: nuevoProgreso,
        encontrados,
        creados: ext.creados + r.creados,
        duplicados: ext.duplicados + r.duplicados,
        invalidos: ext.invalidos + r.invalidos,
        error: null,
        finished_at: terminada ? ahora() : null,
        updated_at: ahora(),
      })
      .eq("id", ext.id);
    return `${ext.nombre_base} · ${zona}: ${r.creados} nuevos`;
  } catch (err: any) {
    const msg = String(err?.message ?? err).slice(0, 500);
    // Un fallo en una zona no frena el resto: se anota y se sigue con la próxima.
    const nuevoProgreso = { hechas: [...progreso.hechas, `${zona} (error)`], pendientes: progreso.pendientes.slice(1), consultas: progreso.consultas + 1 };
    const terminada = nuevoProgreso.pendientes.length === 0;
    await s
      .from("marketing_extracciones" as any)
      .update({ estado: terminada ? (ext.encontrados > 0 ? "listo" : "error") : "pendiente", progreso: nuevoProgreso, error: msg, finished_at: terminada ? ahora() : null, updated_at: ahora() })
      .eq("id", ext.id);
    return `error en ${zona}: ${msg}`;
  }
}

export async function cancelarExtraccion(id: string) {
  const { data } = await createAdminClient()
    .from("marketing_extracciones" as any)
    .update({ estado: "cancelado", finished_at: ahora(), updated_at: ahora() })
    .eq("id", id)
    .in("estado", ["pendiente", "ejecutando"])
    .select("id");
  if (!(data ?? []).length) throw new ExtraccionError("La extracción ya terminó.", 409);
  return { ok: true };
}

export async function leerExtraccion(id: string) {
  const { data } = await createAdminClient().from("marketing_extracciones" as any).select("*").eq("id", id).maybeSingle();
  return data as any;
}

export async function listarExtracciones(limite = 20) {
  const { data } = await createAdminClient().from("marketing_extracciones" as any).select("*").order("created_at", { ascending: false }).limit(limite);
  return (data ?? []) as any[];
}
