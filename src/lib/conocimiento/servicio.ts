/**
 * Conocimiento del bot por versiones (25/10): lectura de la base con caché
 * corta, bloque para cada respuesta y estadísticas para comparar versiones.
 * Nunca frena una respuesta: ante cualquier error, el bot responde como v1.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_TO_RUBRO_ID, RUBRO_IDS } from "@/lib/rubros";
import { seleccionar, versionParaConversacion, type Asignacion, type ItemConocimiento, type RubroConocimiento } from "./seleccion";

const TTL_MS = 60_000;
let cacheItems: { at: number; porVersion: Map<number, ItemConocimiento[]> } | null = null;
let cacheAsig: { at: number; porRubro: Map<string, Asignacion> } | null = null;

const SLUG_POR_ID: Record<string, RubroConocimiento> = Object.fromEntries(
  Object.entries(RUBRO_IDS).map(([slug, id]) => [id, slug as RubroConocimiento])
);

export function rubroDeConocimiento(rubroId: string | null | undefined, area: string | null | undefined): RubroConocimiento | null {
  if (rubroId && SLUG_POR_ID[rubroId]) return SLUG_POR_ID[rubroId];
  const porArea = area ? AREA_TO_RUBRO_ID[area] : undefined;
  return porArea ? SLUG_POR_ID[porArea] ?? null : null;
}

/** Vacía la caché (después de editar un ítem o cambiar la versión). */
export function limpiarCacheConocimiento(): void {
  cacheItems = null;
  cacheAsig = null;
}

async function itemsDeVersion(version: number): Promise<ItemConocimiento[]> {
  if (!cacheItems || Date.now() - cacheItems.at > TTL_MS) cacheItems = { at: Date.now(), porVersion: new Map() };
  const hit = cacheItems.porVersion.get(version);
  if (hit) return hit;
  const { data, error } = await createAdminClient()
    .from("bot_knowledge_items" as any)
    .select("clave, capa, rubro, titulo, disparadores, contenido, activo, orden")
    .eq("version", version)
    .eq("activo", true);
  if (error) throw error;
  const items = ((data as any[]) ?? []).map((r) => ({ ...r, disparadores: r.disparadores ?? [] })) as ItemConocimiento[];
  cacheItems.porVersion.set(version, items);
  return items;
}

export async function asignaciones(): Promise<Map<string, Asignacion>> {
  if (cacheAsig && Date.now() - cacheAsig.at <= TTL_MS) return cacheAsig.porRubro;
  const { data, error } = await createAdminClient().from("bot_knowledge_assignment" as any).select("rubro, version, comparar_con, porcentaje");
  if (error) throw error;
  const porRubro = new Map<string, Asignacion>();
  for (const r of (data as any[]) ?? []) porRubro.set(r.rubro, { version: r.version, comparar_con: r.comparar_con, porcentaje: r.porcentaje });
  cacheAsig = { at: Date.now(), porRubro };
  return porRubro;
}

export interface ConocimientoTurno {
  version: number;
  texto: string;
  claves: string[];
  /** Títulos de los temas y fichas elegidos (sin la base general ni la del rubro). */
  titulos: string[];
}

/**
 * Bloque de conocimiento para esta respuesta. `forzarVersion` lo usa
 * «Probar el bot real» para comparar v1 y v2 con los mismos mensajes.
 */
export async function conocimientoParaTurno(input: {
  rubroId: string | null | undefined;
  area: string | null | undefined;
  conversationId: string | null;
  entrantes: string[];
  forzarVersion?: number | null;
}): Promise<ConocimientoTurno> {
  try {
    const rubro = rubroDeConocimiento(input.rubroId, input.area);
    if (!rubro) return { version: 1, texto: "", claves: [], titulos: [] };
    const version = input.forzarVersion ?? versionParaConversacion((await asignaciones()).get(rubro) ?? null, input.conversationId);
    if (version <= 1) return { version: 1, texto: "", claves: [], titulos: [] };
    const sel = seleccionar({ items: await itemsDeVersion(version), rubro, entrantes: input.entrantes });
    return { version, texto: sel.texto, claves: sel.claves, titulos: sel.items.filter((i) => i.capa === "tema" || i.capa === "objecion").map((i) => i.titulo) };
  } catch (err) {
    console.error("[conocimiento] No se pudo armar el bloque; responde como v1:", err);
    return { version: 1, texto: "", claves: [], titulos: [] };
  }
}
