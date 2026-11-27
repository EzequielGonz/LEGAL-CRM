/**
 * Lectura de Contactos en el servidor (22/11). Siempre acotada a UN rubro. Solo lectura:
 * los cambios van por `/api/oportunidades/[id]`, que ya deja el historial.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { aplicarCondiciones } from "@/lib/indicadores";
import { estadoCorto } from "@/lib/inicio";
import { FUENTE_LABEL, esFuente } from "@/lib/fuente";
import { armarConsulta, etapaDe, rotuloEtapa, type ConsultaContactos, type FilaCsv, type FiltrosContactos, TAMANO_PAGINA_CONTACTOS, TOPE_EXPORTACION } from "@/lib/contactos/consulta";

export interface FilaContacto {
  id: string;
  contactId: string | null;
  conversationId: string | null;
  nombre: string;
  telefono: string | null;
  area: string | null;
  etapa: string;
  etapaRotulo: string;
  estadoTexto: string;
  tono: "bloqueo" | "atencion" | "ok" | "info";
  origen: string | null;
  actividad: string | null;
  captureState: string;
  derivationState: string;
  detenido: boolean;
  cita: string | null;
}

const SEL =
  "id, contact_id, conversation_id, area, contact_state, capture_state, derivation_state, attention_state, attention_category, review_required, first_source, last_inbound_at, updated_at, created_at, contacts!inner(full_name, phone)";

function armar(rubroId: string, c: ConsultaContactos, sel: string, conteo: boolean) {
  let q: any = createAdminClient().from("opportunities").select(sel, conteo ? { count: "exact" } : undefined).eq("rubro_id", rubroId);
  q = aplicarCondiciones(q, c.conds);
  if (c.area) q = q.eq("area", c.area);
  if (c.fecha.desde) q = q.gte(c.fecha.col, c.fecha.desde);
  if (c.fecha.hastaExclusivo) q = q.lt(c.fecha.col, c.fecha.hastaExclusivo);
  if (c.busqueda) q = q.or(c.busqueda, { referencedTable: "contacts" });
  return q;
}

function aFila(o: any, cita: string | null): FilaContacto {
  const detenido = o.attention_category === "detencion";
  const e = etapaDe(o);
  const est = estadoCorto({ ...o, detenido });
  return {
    id: o.id,
    contactId: o.contact_id ?? null,
    conversationId: o.conversation_id ?? null,
    nombre: o.contacts?.full_name?.trim() || "Sin nombre",
    telefono: o.contacts?.phone ?? null,
    area: o.area ?? null,
    etapa: e,
    etapaRotulo: rotuloEtapa(e),
    estadoTexto: est.texto,
    tono: est.tono,
    origen: esFuente(o.first_source) ? FUENTE_LABEL[o.first_source as keyof typeof FUENTE_LABEL] : null,
    actividad: o.last_inbound_at ?? o.updated_at ?? null,
    captureState: o.capture_state,
    derivationState: o.derivation_state,
    detenido,
    cita,
  };
}

export async function listarContactos(rubroId: string, f: FiltrosContactos): Promise<{ filas: FilaContacto[]; total: number; error: string | null }> {
  const c = armarConsulta(f, TAMANO_PAGINA_CONTACTOS);
  const { data, count, error } = await armar(rubroId, c, SEL, true)
    .order(c.orden.col, { ascending: c.orden.asc, nullsFirst: false })
    .order("id", { ascending: true })
    .range(c.desplazamiento.from, c.desplazamiento.to);
  if (error) return { filas: [], total: 0, error: String(error.message ?? error) };
  const filas = (data ?? []) as any[];
  const ids = filas.map((o) => o.contact_id).filter(Boolean);
  const citaDe = new Map<string, string>();
  if (ids.length) {
    const { data: citas } = await createAdminClient()
      .from("appointments")
      .select("contact_id, starts_at")
      .in("contact_id", ids)
      .gte("starts_at", new Date().toISOString())
      .not("status", "in", "(cancelada,realizada,ausente)")
      .order("starts_at", { ascending: true });
    for (const x of (citas ?? []) as any[]) if (!citaDe.has(x.contact_id)) citaDe.set(x.contact_id, x.starts_at);
  }
  return { filas: filas.map((o) => aFila(o, citaDe.get(o.contact_id) ?? null)), total: count ?? 0, error: null };
}

/** Cuántas personas hay en cada etapa (mismos indicadores que sus listas). */
export async function contarEtapas(rubroId: string, claves: { clave: string; conds: import("@/lib/indicadores").Condicion[] }[]): Promise<Record<string, number | null>> {
  const s = createAdminClient();
  const r = await Promise.all(
    claves.map(async (k) => {
      const { count, error } = await aplicarCondiciones(s.from("opportunities").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId), k.conds);
      return [k.clave, error ? null : count ?? 0] as const;
    })
  );
  return Object.fromEntries(r);
}

/** Filas para el CSV: por selección (ids del rubro) o por los filtros vigentes. Solo columnas no sensibles. */
export async function filasParaCsv(rubroId: string, opts: { ids?: string[]; filtros?: FiltrosContactos }): Promise<{ filas: FilaCsv[]; truncado: boolean }> {
  let q: any;
  if (opts.ids && opts.ids.length) {
    q = createAdminClient().from("opportunities").select(SEL).eq("rubro_id", rubroId).in("id", opts.ids);
  } else {
    const c = armarConsulta(opts.filtros!, TOPE_EXPORTACION);
    q = armar(rubroId, c, SEL, false).order(c.orden.col, { ascending: c.orden.asc, nullsFirst: false }).order("id", { ascending: true }).range(0, TOPE_EXPORTACION);
  }
  const { data, error } = await q;
  if (error) throw new Error(String(error.message ?? error));
  const todas = (data ?? []) as any[];
  const truncado = todas.length > TOPE_EXPORTACION;
  const filas = todas.slice(0, TOPE_EXPORTACION).map((o) => {
    const f = aFila(o, null);
    return { nombre: f.nombre, telefono: f.telefono, etapa: f.etapaRotulo, estado: f.estadoTexto, area: f.area, origen: f.origen, actividad: f.actividad, alta: o.created_at ?? null };
  });
  return { filas, truncado };
}

/** Personas del rubro para elegir al agendar una cita (por nombre o teléfono). */
export async function buscarPersonas(rubroId: string, texto: string, limite = 8): Promise<{ id: string; nombre: string; telefono: string | null }[]> {
  const { armarOrBusqueda } = await import("@/lib/contactos/consulta");
  const or = armarOrBusqueda(texto);
  if (!or) return [];
  const { data } = await createAdminClient().from("contacts").select("id, full_name, phone").eq("rubro_id", rubroId).or(or).order("created_at", { ascending: false }).limit(limite);
  return ((data ?? []) as any[]).map((c) => ({ id: c.id, nombre: c.full_name?.trim() || "Sin nombre", telefono: c.phone ?? null }));
}
