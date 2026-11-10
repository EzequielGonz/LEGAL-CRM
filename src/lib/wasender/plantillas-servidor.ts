import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { ErrorLinea } from "@/lib/wasender/lineas";
import { copiarDesdeMeta, perfilPorNombreMeta, usoDesdeMeta, validarPlantilla, type UsoPlantilla } from "@/lib/wasender/plantillas";

/**
 * Plantillas propias de Wasender (10/11): lista, alta, edición, archivo y
 * copia desde las plantillas aprobadas de Meta. Las de Meta solo se leen:
 * no se cambia ni se borra nada de ellas.
 */

type Db = ReturnType<typeof createAdminClient>;

export interface PlantillaVista {
  id: string;
  nombre: string;
  uso: UsoPlantilla;
  cuerpo: string;
  variantes: string[];
  activa: boolean;
  origen: "panel" | "meta";
  meta_nombre: string | null;
  updated_at: string;
  archivada_at: string | null;
  motivo_archivo: string | null;
}

const COLUMNAS = "id, nombre, uso, cuerpo, variantes, activa, origen, meta_nombre, updated_at, archivada_at, motivo_archivo";
const tabla = (s: Db) => s.from("wasender_plantillas" as any) as any;

function aVista(f: any): PlantillaVista {
  return { ...f, variantes: Array.isArray(f.variantes) ? f.variantes.filter((v: unknown) => typeof v === "string") : [] };
}

export async function listarPlantillas(rubroId: string, supabase: Db = createAdminClient()): Promise<PlantillaVista[]> {
  const { data, error } = await tabla(supabase).select(COLUMNAS).eq("rubro_id", rubroId).order("nombre");
  if (error) throw new Error(`No se pudieron leer las plantillas: ${error.message}`);
  return ((data ?? []) as any[]).map(aVista);
}

function limpiar(body: any) {
  const variantes = Array.isArray(body?.variantes) ? body.variantes.map((v: unknown) => String(v ?? "")).filter((v: string) => v.trim()) : [];
  const uso: UsoPlantilla = ["campana", "seguimiento", "manual"].includes(body?.uso) ? body.uso : "manual";
  return {
    nombre: String(body?.nombre ?? "").trim().slice(0, 80),
    uso,
    cuerpo: String(body?.cuerpo ?? ""),
    variantes: variantes.slice(0, 10),
    activa: body?.activa !== false,
  };
}

async function registrar(supabase: Db, accion: string, id: string, extra: { before?: unknown; after?: unknown }) {
  await supabase.from("ops_change_log").insert({ actor: "panel", action: accion, target: `wasender_plantillas:${id}`, ...extra } as any);
}

export async function crearPlantilla(rubroId: string, body: unknown, supabase: Db = createAdminClient()): Promise<PlantillaVista> {
  const p = limpiar(body);
  const problemas = validarPlantilla(p);
  if (problemas.length) throw new ErrorLinea(problemas.map((x) => `${x.campo}: ${x.texto}`).join(" "));
  const { data, error } = await tabla(supabase).insert({ rubro_id: rubroId, ...p, origen: "panel" }).select(COLUMNAS).single();
  if (error) throw new ErrorLinea((error as any).code === "23505" ? "Ya hay una plantilla activa con ese nombre." : error.message);
  await registrar(supabase, "wasender_crear_plantilla", data.id, { after: { nombre: p.nombre, uso: p.uso } });
  return aVista(data);
}

export async function editarPlantilla(rubroId: string, id: string, body: unknown, supabase: Db = createAdminClient()): Promise<PlantillaVista> {
  const { data: antes } = await tabla(supabase).select(COLUMNAS).eq("id", id).eq("rubro_id", rubroId).maybeSingle();
  if (!antes) throw new ErrorLinea("Plantilla no encontrada en este perfil.", 404);
  if (antes.archivada_at) throw new ErrorLinea("La plantilla está archivada.");
  const p = limpiar(body);
  const problemas = validarPlantilla(p);
  if (problemas.length) throw new ErrorLinea(problemas.map((x) => `${x.campo}: ${x.texto}`).join(" "));
  const { data, error } = await tabla(supabase).update(p).eq("id", id).select(COLUMNAS).single();
  if (error) throw new ErrorLinea((error as any).code === "23505" ? "Ya hay una plantilla activa con ese nombre." : error.message);
  await registrar(supabase, "wasender_editar_plantilla", id, { before: { nombre: antes.nombre, cuerpo: antes.cuerpo, variantes: antes.variantes, activa: antes.activa }, after: p });
  return aVista(data);
}

export async function archivarPlantilla(rubroId: string, id: string, motivo: unknown, supabase: Db = createAdminClient()): Promise<PlantillaVista> {
  const m = typeof motivo === "string" ? motivo.trim().slice(0, 500) : "";
  if (!m) throw new ErrorLinea("Para archivar la plantilla escribí el motivo.");
  const { data: antes } = await tabla(supabase).select(COLUMNAS).eq("id", id).eq("rubro_id", rubroId).maybeSingle();
  if (!antes) throw new ErrorLinea("Plantilla no encontrada en este perfil.", 404);
  const { data } = await tabla(supabase).update({ archivada_at: new Date().toISOString(), motivo_archivo: m, activa: false }).eq("id", id).select(COLUMNAS).single();
  await registrar(supabase, "wasender_archivar_plantilla", id, { after: { motivo: m } });
  return aVista(data);
}

export interface ResultadoCopia {
  copiadas: number;
  yaEstaban: number;
  paraRevisar: string[];
}

/**
 * Copia como base las plantillas aprobadas de Meta del perfil (las asignadas
 * al perfil y las que por su nombre son del perfil). No copia los avisos
 * internos ni la de ejemplo de Meta. Repetirla no duplica.
 */
export async function copiarDesdeMetaAlPerfil(rubroId: string, supabase: Db = createAdminClient()): Promise<ResultadoCopia> {
  const slug = (Object.entries(RUBRO_IDS).find(([, id]) => id === rubroId)?.[0] ?? null) as keyof typeof RUBRO_IDS | null;
  const { data: plantillas, error } = await supabase
    .from("whatsapp_templates")
    .select("id, name, body_text, variables")
    .eq("status", "APPROVED")
    .is("missing_since", null);
  if (error) throw new Error(`No se pudieron leer las plantillas de Meta: ${error.message}`);
  const { data: asignaciones } = await supabase.from("template_assignments").select("template_id, rubro_id, purpose, variable_sources, active").eq("active", true);
  const { data: existentes } = await tabla(supabase).select("meta_nombre").eq("rubro_id", rubroId).not("meta_nombre", "is", null);
  const ya = new Set(((existentes ?? []) as any[]).map((e) => e.meta_nombre));

  const res: ResultadoCopia = { copiadas: 0, yaEstaban: 0, paraRevisar: [] };
  const vistas = new Set<string>();
  for (const t of (plantillas ?? []) as any[]) {
    const nombre: string = t.name;
    if (vistas.has(nombre) || /^aviso_/.test(nombre) || nombre === "hello_world") continue;
    const asig = ((asignaciones ?? []) as any[]).find((a) => a.template_id === t.id && a.rubro_id === rubroId) ?? null;
    if (!asig && perfilPorNombreMeta(nombre) !== slug) continue;
    vistas.add(nombre);
    if (ya.has(nombre)) {
      res.yaEstaban++;
      continue;
    }
    const botones = Array.isArray(t.variables?.buttons) ? t.variables.buttons.filter((b: any) => b?.type === "QUICK_REPLY").map((b: any) => String(b.text ?? "")) : [];
    const fuentes = Array.isArray(asig?.variable_sources) ? asig.variable_sources : null;
    const copia = copiarDesdeMeta(String(t.body_text ?? t.variables?.bodyText ?? ""), fuentes, botones);
    const { error: e } = await tabla(supabase).insert({
      rubro_id: rubroId,
      nombre,
      uso: usoDesdeMeta(asig?.purpose, nombre),
      cuerpo: copia.cuerpo,
      variantes: [],
      // Si quedó una variable sin traducir, la plantilla queda inactiva hasta revisarla.
      activa: copia.sinTraducir.length === 0,
      origen: "meta",
      meta_nombre: nombre,
    });
    if (e) {
      if ((e as any).code === "23505") res.yaEstaban++;
      else throw new Error(`No se pudo copiar «${nombre}»: ${e.message}`);
      continue;
    }
    res.copiadas++;
    if (copia.sinTraducir.length) res.paraRevisar.push(nombre);
  }
  await supabase.from("ops_change_log").insert({ actor: "panel", action: "wasender_copiar_plantillas_meta", target: `rubros:${rubroId}`, after: res } as any);
  return res;
}

/** La misma copia para los cuatro perfiles de una vez. */
export async function copiarDesdeMetaTodos(supabase: Db = createAdminClient()): Promise<ResultadoCopia> {
  const total: ResultadoCopia = { copiadas: 0, yaEstaban: 0, paraRevisar: [] };
  for (const rubroId of Object.values(RUBRO_IDS)) {
    const r = await copiarDesdeMetaAlPerfil(rubroId, supabase);
    total.copiadas += r.copiadas;
    total.yaEstaban += r.yaEstaban;
    total.paraRevisar.push(...r.paraRevisar);
  }
  return total;
}
