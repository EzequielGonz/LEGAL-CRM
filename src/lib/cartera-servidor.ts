/**
 * Lectura de la cartera (reorganización 2, 18/10). Solo lectura: no cambia
 * estados ni envía nada. Los grupos de oportunidades cuentan y listan con
 * los mismos indicadores que sus listas completas (`/oportunidades`).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { contarIndicador, indicadorPorClave, listarIndicador } from "@/lib/indicadores";
import { estadoCorto } from "@/lib/inicio";
import { VISTAS_CARTERA, inicioDeSemana, type FiltroCitas, type GrupoCartera, type VistaCartera } from "@/lib/cartera";

export interface FichaCartera {
  id: string;
  contactId: string | null;
  conversationId: string | null;
  nombre: string;
  telefono: string | null;
  estado: string;
  actividad: string | null;
  cita: { inicio: string; fase2: boolean; reagendada: boolean } | null;
  area: string | null;
}

export const AREAS_DE_PERFIL: Record<string, string[]> = {
  juridico: ["civil", "penal"],
  agencia_0km: ["agencia_0km"],
  coberturas_medicas: ["coberturas_medicas"],
  marketing: ["marketing"],
};

async function leerCitas(rubroId: string, areas: string[], filtro: FiltroCitas, limite: number) {
  const s = createAdminClient();
  const ahora = new Date();
  let q: any = s
    .from("appointments")
    .select("*, contacts(full_name, phone)")
    .in("area", areas)
    .neq("status", "cancelada")
    .order("starts_at", { ascending: true })
    .limit(limite);
  if (filtro === "reagendadas") q = q.not("reschedule_of", "is", null).gte("starts_at", new Date(ahora.getTime() - 7 * 24 * 3600 * 1000).toISOString());
  else q = q.gte("starts_at", ahora.toISOString());
  if (filtro === "fase2") q = q.eq("kind", "ia");
  const { data, error } = await q;
  if (error) return { filas: [] as any[], error: String(error.message ?? error) };
  let filas = (data ?? []) as any[];
  if (filtro === "proximas_sin_derivar" && filas.length) {
    const ids = Array.from(new Set(filas.map((c) => c.contact_id).filter(Boolean)));
    const { data: derivados } = await s.from("opportunities").select("contact_id").eq("rubro_id", rubroId).eq("derivation_state", "derivado").in("contact_id", ids);
    const fuera = new Set(((derivados ?? []) as any[]).map((d) => d.contact_id));
    filas = filas.filter((c) => !fuera.has(c.contact_id));
  }
  return { filas, error: null as string | null };
}

const LIMITE_CONTEO_CITAS = 500;

export async function contarGrupo(rubroId: string, areas: string[], g: GrupoCartera): Promise<number | null> {
  if (g.fuente.tipo === "oportunidades") {
    const ind = indicadorPorClave(g.fuente.indicador);
    if (!ind) return null;
    return (await contarIndicador(rubroId, ind)).count;
  }
  const r = await leerCitas(rubroId, areas, g.fuente.filtro, LIMITE_CONTEO_CITAS);
  return r.error ? null : r.filas.length;
}

export async function contarVista(rubroId: string, areas: string[], vista: VistaCartera): Promise<Record<string, number | null>> {
  const grupos = VISTAS_CARTERA[vista].grupos;
  const valores = await Promise.all(grupos.map((g) => contarGrupo(rubroId, areas, g).catch(() => null)));
  return Object.fromEntries(grupos.map((g, i) => [g.clave, valores[i]]));
}

export async function listarGrupo(rubroId: string, areas: string[], g: GrupoCartera, limite = 24): Promise<{ fichas: FichaCartera[]; error: string | null }> {
  if (g.fuente.tipo === "oportunidades") {
    const ind = indicadorPorClave(g.fuente.indicador);
    if (!ind) return { fichas: [], error: "Lista desconocida" };
    const r = await listarIndicador(rubroId, ind, { orden: "reciente" });
    const filas = r.filas.slice(0, limite);
    // Cita próxima de cada uno (si tiene).
    const ids = filas.map((f: any) => f.contact_id).filter(Boolean);
    const { data: citas } = ids.length
      ? await createAdminClient().from("appointments").select("contact_id, starts_at, kind, reschedule_of, status").in("contact_id", ids).gte("starts_at", new Date().toISOString()).neq("status", "cancelada").order("starts_at", { ascending: true })
      : { data: [] as any[] };
    const citaDe = new Map<string, any>();
    for (const c of (citas ?? []) as any[]) if (!citaDe.has(c.contact_id)) citaDe.set(c.contact_id, c);
    return {
      error: r.error,
      fichas: filas.map((o: any) => {
        const c = citaDe.get(o.contact_id);
        return {
          id: o.id,
          contactId: o.contact_id ?? null,
          conversationId: o.conversation_id ?? null,
          nombre: o.contacts?.full_name ?? "Sin nombre",
          telefono: o.contacts?.phone ?? null,
          estado: estadoCorto(o).texto,
          actividad: o.updated_at ?? null,
          cita: c ? { inicio: c.starts_at, fase2: c.kind === "ia", reagendada: !!c.reschedule_of } : null,
          area: o.area ?? null,
        };
      }),
    };
  }
  const r = await leerCitas(rubroId, areas, g.fuente.filtro, limite);
  return {
    error: r.error,
    fichas: r.filas.map((c: any) => ({
      id: c.id,
      contactId: c.contact_id ?? null,
      conversationId: c.conversation_id ?? null,
      nombre: c.contacts?.full_name ?? "Sin nombre",
      telefono: c.contacts?.phone ?? null,
      estado: c.kind === "ia" ? "Fase 2 con la IA" : c.reschedule_of ? "Cita reagendada" : c.consultation_type ?? "Cita",
      actividad: c.created_at ?? null,
      cita: { inicio: c.starts_at, fase2: c.kind === "ia", reagendada: !!c.reschedule_of },
      area: c.area ?? null,
    })),
  };
}

/** Quejas y pedidos de no contacto (se muestran aparte, chicos). */
export async function contarDetenidos(rubroId: string): Promise<number | null> {
  const ind = indicadorPorClave("detencion_reciente");
  return ind ? (await contarIndicador(rubroId, ind)).count : null;
}

export interface ResumenCifras {
  ultimaBase: { nombre: string; fecha: string; cargados: number; contactados: number; respondieron: number; captados: number } | null;
  semana: { desde: string; respuestas: number | null; captados: number | null; citas: number | null; derivados: number | null };
}

/** Cifras chicas del Inicio: la última base cargada y la semana en curso. */
export async function resumenCifras(rubroId: string, areas: string[], ahora = new Date()): Promise<ResumenCifras> {
  const s = createAdminClient();
  const desde = inicioDeSemana(ahora).toISOString();
  const cuenta = async (q: any) => {
    const { count, error } = await q;
    return error ? null : count ?? 0;
  };
  const [{ data: base }, respuestas, captados, citas, derivados] = await Promise.all([
    // 20/10: la última base con contactos nuevos (un archivo repetido queda con 0 y no cuenta).
    s.from("imported_bases").select("id, name, file_name, created_at, created_rows, total_rows").in("area", areas).is("archived_at", null).gt("created_rows", 0).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    cuenta(s.from("messages").select("id, conversations!inner(area)", { count: "exact", head: true }).eq("direction", "entrante").gte("created_at", desde).in("conversations.area", areas)),
    cuenta(s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("capture_state", "captado").gte("captured_at", desde)),
    cuenta(s.from("appointments").select("id", { count: "exact", head: true }).in("area", areas).gte("created_at", desde).neq("status", "cancelada")),
    cuenta(s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("derivation_state", "derivado").gte("derived_at", desde)),
  ]);
  let ultimaBase: ResumenCifras["ultimaBase"] = null;
  if (base) {
    const b: any = base;
    const deBase = () => s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).eq("imported_base_id", b.id);
    const [cargados, contactados, respondieron, capt] = await Promise.all([
      cuenta(deBase()),
      cuenta(deBase().neq("contact_state", "sin_contactar")),
      cuenta(deBase().eq("contact_state", "respondio")),
      cuenta(deBase().eq("capture_state", "captado")),
    ]);
    ultimaBase = {
      nombre: b.name || b.file_name || "Base sin nombre",
      fecha: b.created_at,
      cargados: cargados ?? b.created_rows ?? 0,
      contactados: contactados ?? 0,
      respondieron: respondieron ?? 0,
      captados: capt ?? 0,
    };
  }
  return { ultimaBase, semana: { desde, respuestas, captados, citas, derivados } };
}
