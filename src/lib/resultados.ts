/**
 * Resultados con nombre y apellido (13/11, pedido de la responsable: «no puedo
 * ver nada, quién se derivó, quién se cerró… solo números»).
 *
 * Cada cifra de «Hoy» se abre acá: la lista de personas de ese período, con
 * cuándo pasó, de qué campaña o base vino, quién lo hizo y con qué motivo, y
 * los botones para abrir la ficha o el chat. Solo lectura.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { PERIODOS, rangoDePeriodo, type ClavePeriodo } from "@/lib/hoy/periodos";

export const VISTAS_RESULTADO = [
  { clave: "captados", titulo: "Captados", bajada: "Aceptaron el siguiente paso" },
  { clave: "derivados", titulo: "Derivados", bajada: "Pasados a quien los atiende" },
  { clave: "perdidos", titulo: "Perdidos", bajada: "Cerrados sin avanzar" },
  { clave: "respondieron", titulo: "Respondieron", bajada: "Escribieron en el período" },
  { clave: "contactados", titulo: "Contactados", bajada: "Recibieron el primer mensaje" },
] as const;
export type ClaveResultado = (typeof VISTAS_RESULTADO)[number]["clave"];

export const PERIODOS_RESULTADO = [...PERIODOS, { clave: "todo", titulo: "Desde siempre", bajada: "Sin límite de fecha" }] as const;
export type ClavePeriodoResultado = (typeof PERIODOS_RESULTADO)[number]["clave"];

export const esVistaResultado = (v: unknown): v is ClaveResultado => VISTAS_RESULTADO.some((x) => x.clave === v);
export const esPeriodoResultado = (v: unknown): v is ClavePeriodoResultado => PERIODOS_RESULTADO.some((x) => x.clave === v);

export interface FilaResultado {
  clave: string;
  contactId: string | null;
  conversationId: string | null;
  nombre: string | null;
  telefono: string | null;
  /** Cuándo pasó lo que muestra la vista. */
  at: string | null;
  /** De dónde vino la persona, en palabras. */
  origen: string;
  /** La base de la que salió, cuando además hay campaña. */
  base: string | null;
  /** Estado de hoy, en palabras. */
  estado: string;
  /** Quién lo hizo y con qué motivo, si se sabe. */
  detalle: string | null;
}

export interface Resultados {
  filas: FilaResultado[];
  total: number;
  /** De dónde vienen las personas de toda la vista (no solo de la página). */
  origenes: { nombre: string; cantidad: number }[];
  origenesParciales: boolean;
}

/** Rango de fechas de un período; «todo» no tiene límite. Pura. */
export function rangoResultado(periodo: ClavePeriodoResultado, ahora: Date = new Date()): { desde: Date | null; hasta: Date | null } {
  if (periodo === "todo") return { desde: null, hasta: null };
  const r = rangoDePeriodo(periodo as ClavePeriodo, ahora);
  return { desde: r.desde, hasta: r.hasta };
}

const ACTOR: Record<string, string> = { sistema: "el sistema", operador: "una persona del equipo", ia: "el bot", agente_ia: "el bot", panel: "una persona del equipo", migracion: "la carga inicial de datos", claude: "Claude" };

/** Quién lo hizo, en palabras. Pura. */
export function quienLoHizo(actor: string | null | undefined): string | null {
  if (!actor) return null;
  return ACTOR[actor] ?? actor;
}

const FUENTE: Record<string, string> = {
  base_de_datos: "Base de datos sin nombre",
  base_importada: "Base de datos sin nombre",
  google_maps: "Negocios de Google Maps",
  organico_whatsapp: "Escribió por su cuenta",
};

/** Origen en palabras: la campaña manda; si no, la base; si no, cómo llegó. Pura. */
export function origenEnPalabras(d: { campana?: string | null; base?: string | null; fuente?: string | null; detalleFuente?: string | null }): string {
  if (d.campana) return `Campaña «${d.campana}»`;
  if (d.base) return `Base «${d.base}»`;
  const f = String(d.fuente ?? "").toLowerCase();
  if (FUENTE[f]) return FUENTE[f];
  if (!f || f === "no_informada") return "Sin origen registrado";
  if (/form|landing|web/.test(f)) return d.detalleFuente ? `Formulario web · ${d.detalleFuente}` : "Formulario web";
  if (/entrante|inbound|organico|propia/.test(f)) return "Escribió por su cuenta";
  if (/anuncio|ads/.test(f)) return d.detalleFuente ? `Anuncio · ${d.detalleFuente}` : "Anuncio";
  return f.replace(/_/g, " ");
}

/** La fuente que vale: la primera registrada, salvo que no diga nada. Pura. */
export function fuenteDe(o: { first_source?: string | null; origin_source?: string | null }): string | null {
  return o.first_source && o.first_source !== "no_informada" ? o.first_source : o.origin_source ?? o.first_source ?? null;
}

/** Agrupa por origen, de mayor a menor. Pura. */
export function agruparOrigenes(origenes: string[]): { nombre: string; cantidad: number }[] {
  const m = new Map<string, number>();
  for (const o of origenes) m.set(o, (m.get(o) ?? 0) + 1);
  return Array.from(m, ([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
}

const ESTADO_CAPTACION: Record<string, string> = {
  captado: "Captado",
  perdido: "Perdido",
  en_conversacion: "En conversación",
  en_seguimiento: "En seguimiento",
  sin_contactar: "Sin contactar",
  contactado: "Contactado, sin respuesta",
};

function estadoDe(o: any): string {
  if (!o) return "Sin oportunidad";
  if (o.derivation_state === "derivado") return o.derivation_recipient ? `Derivado a ${o.derivation_recipient}` : "Derivado";
  if (o.capture_state === "captado") return "Captado, sin derivar";
  return ESTADO_CAPTACION[o.capture_state] ?? String(o.capture_state ?? "—").replace(/_/g, " ");
}

const TAMANO = 40;
const TOPE_ORIGENES = 3000;
const COLUMNAS_OPP =
  "id, contact_id, conversation_id, campaign_id, imported_base_id, origin_source, first_source, first_source_detail, capture_state, capture_reason, captured_at, derivation_state, derived_at, derived_by, derivation_recipient, derivation_notes, updated_at";

type Db = ReturnType<typeof createAdminClient>;

async function nombresDe(s: Db, tabla: "campaigns" | "imported_bases", ids: string[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(ids.filter(Boolean)));
  if (!unicos.length) return new Map();
  const { data } = await (s.from(tabla) as any).select("id, name").in("id", unicos);
  return new Map(((data ?? []) as any[]).map((x) => [x.id as string, x.name as string]));
}

export async function leerResultados(d: { rubroId: string; areas: string[]; ver: ClaveResultado; periodo: ClavePeriodoResultado; pagina: number; q?: string }): Promise<Resultados> {
  const s = createAdminClient();
  const { desde, hasta } = rangoResultado(d.periodo);
  const de = (d.pagina - 1) * TAMANO;
  const a = de + TAMANO - 1;

  if (d.ver === "captados" || d.ver === "derivados" || d.ver === "perdidos") {
    const columna = d.ver === "captados" ? "captured_at" : d.ver === "derivados" ? "derived_at" : "updated_at";
    const filtro = (q: any) => {
      let x = q.eq("rubro_id", d.rubroId);
      x = d.ver === "captados" ? x.eq("capture_state", "captado") : d.ver === "derivados" ? x.eq("derivation_state", "derivado") : x.eq("capture_state", "perdido");
      if (desde) x = x.gte(columna, desde.toISOString());
      if (hasta) x = x.lt(columna, hasta.toISOString());
      return x;
    };
    const [{ data: opps, count }, { data: paraOrigen }] = await Promise.all([
      filtro((s.from("opportunities") as any).select(COLUMNAS_OPP, { count: "exact" })).order(columna, { ascending: false, nullsFirst: false }).range(de, a),
      filtro((s.from("opportunities") as any).select("campaign_id, imported_base_id, origin_source, first_source, first_source_detail")).limit(TOPE_ORIGENES),
    ]);
    const lista = (opps ?? []) as any[];
    const todos = (paraOrigen ?? []) as any[];
    const [campanas, bases, { data: contactos }, { data: eventos }] = await Promise.all([
      nombresDe(s, "campaigns", todos.map((o) => o.campaign_id)),
      nombresDe(s, "imported_bases", todos.map((o) => o.imported_base_id)),
      lista.length ? s.from("contacts").select("id, full_name, phone").in("id", lista.map((o) => o.contact_id).filter(Boolean)) : Promise.resolve({ data: [] as any[] }),
      // Quién captó o cerró: el último cambio de captación de cada oportunidad.
      lista.length && d.ver !== "derivados"
        ? (s.from("opportunity_events") as any)
            .select("opportunity_id, at, actor, reason, to_value")
            .in("opportunity_id", lista.map((o) => o.id))
            .eq("dimension", "captacion")
            .eq("to_value", d.ver === "captados" ? "captado" : "perdido")
            .order("at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const contacto = new Map(((contactos ?? []) as any[]).map((c) => [c.id as string, c]));
    const evento = new Map<string, any>();
    for (const e of (eventos ?? []) as any[]) if (!evento.has(e.opportunity_id)) evento.set(e.opportunity_id, e);
    const origenDe = (o: any) => origenEnPalabras({ campana: campanas.get(o.campaign_id), base: bases.get(o.imported_base_id), fuente: fuenteDe(o), detalleFuente: o.first_source_detail });
    const filas: FilaResultado[] = lista.map((o) => {
      const c = contacto.get(o.contact_id);
      const e = evento.get(o.id);
      let detalle: string | null;
      if (d.ver === "derivados") {
        const quien = quienLoHizo(o.derived_by);
        detalle = [quien ? `Lo derivó ${quien}` : null, o.derivation_notes ? `Nota: ${o.derivation_notes}` : null].filter(Boolean).join(" · ") || null;
      } else {
        const quien = quienLoHizo(e?.actor);
        const motivo = (d.ver === "perdidos" ? o.capture_reason : null) ?? e?.reason ?? null;
        detalle = [quien ? `${d.ver === "captados" ? "Lo captó" : "Lo cerró"} ${quien}` : null, motivo].filter(Boolean).join(" · ") || null;
      }
      return {
        clave: o.id,
        contactId: o.contact_id ?? null,
        conversationId: o.conversation_id ?? null,
        nombre: c?.full_name ?? null,
        telefono: c?.phone ?? null,
        at: (d.ver === "perdidos" ? e?.at : null) ?? o[columna] ?? null,
        origen: origenDe(o),
        base: o.campaign_id && bases.get(o.imported_base_id) ? bases.get(o.imported_base_id)! : null,
        estado: estadoDe(o),
        detalle,
      };
    });
    return { filas, total: count ?? filas.length, origenes: agruparOrigenes(todos.map(origenDe)), origenesParciales: todos.length >= TOPE_ORIGENES };
  }

  if (d.ver === "contactados") {
    const { data: camps } = await s.from("campaigns").select("id, name").in("area", d.areas as any);
    const campanas = new Map(((camps ?? []) as any[]).map((c) => [c.id as string, c.name as string]));
    const ids = Array.from(campanas.keys());
    if (!ids.length) return { filas: [], total: 0, origenes: [], origenesParciales: false };
    const filtro = (q: any) => {
      let x = q.in("campaign_id", ids).in("status", ["enviado", "entregado", "leido", "respondio"]);
      if (desde) x = x.gte("sent_at", desde.toISOString());
      if (hasta) x = x.lt("sent_at", hasta.toISOString());
      return x;
    };
    const [{ data: cc, count }, { data: paraOrigen }] = await Promise.all([
      filtro((s.from("campaign_contacts") as any).select("id, campaign_id, contact_id, status, sent_at, contacts(full_name, phone)", { count: "exact" })).order("sent_at", { ascending: false }).range(de, a),
      filtro((s.from("campaign_contacts") as any).select("campaign_id")).limit(TOPE_ORIGENES),
    ]);
    const ESTADO: Record<string, string> = { enviado: "Enviado", entregado: "Entregado", leido: "Leído", respondio: "Respondió" };
    const lista = (cc ?? []) as any[];
    const { data: convs } = lista.length ? await s.from("conversations").select("id, contact_id").in("contact_id", lista.map((x) => x.contact_id).filter(Boolean)) : { data: [] as any[] };
    const conv = new Map(((convs ?? []) as any[]).map((c) => [c.contact_id as string, c.id as string]));
    const filas: FilaResultado[] = lista.map((x) => ({
      clave: x.id,
      contactId: x.contact_id ?? null,
      conversationId: conv.get(x.contact_id) ?? null,
      nombre: x.contacts?.full_name ?? null,
      telefono: x.contacts?.phone ?? null,
      at: x.sent_at ?? null,
      origen: origenEnPalabras({ campana: campanas.get(x.campaign_id) }),
      base: null,
      estado: ESTADO[x.status] ?? x.status,
      detalle: null,
    }));
    const todos = (paraOrigen ?? []) as any[];
    return { filas, total: count ?? filas.length, origenes: agruparOrigenes(todos.map((x) => origenEnPalabras({ campana: campanas.get(x.campaign_id) }))), origenesParciales: todos.length >= TOPE_ORIGENES };
  }

  // Respondieron: una fila por persona (conversación), con su último mensaje del período.
  let qm: any = (s.from("messages") as any)
    .select("conversation_id, created_at, body, conversations!inner(area)")
    .eq("direction", "entrante")
    .in("conversations.area", d.areas)
    .order("created_at", { ascending: false })
    .limit(TOPE_ORIGENES);
  if (desde) qm = qm.gte("created_at", desde.toISOString());
  if (hasta) qm = qm.lt("created_at", hasta.toISOString());
  const { data: mensajes } = await qm;
  const ultimo = new Map<string, any>();
  for (const m of (mensajes ?? []) as any[]) if (!ultimo.has(m.conversation_id)) ultimo.set(m.conversation_id, m);
  const idsConv = Array.from(ultimo.keys());
  const pagina = idsConv.slice(de, a + 1);
  const [{ data: convs }, { data: opps }] = await Promise.all([
    pagina.length ? s.from("conversations").select("id, contact_id, contacts(full_name, phone)").in("id", pagina) : Promise.resolve({ data: [] as any[] }),
    idsConv.length ? (s.from("opportunities") as any).select(COLUMNAS_OPP).in("conversation_id", idsConv.slice(0, 600)) : Promise.resolve({ data: [] as any[] }),
  ]);
  const todasOpp = (opps ?? []) as any[];
  const [campanas, bases] = await Promise.all([nombresDe(s, "campaigns", todasOpp.map((o) => o.campaign_id)), nombresDe(s, "imported_bases", todasOpp.map((o) => o.imported_base_id))]);
  const oppDe = new Map(todasOpp.map((o) => [o.conversation_id as string, o]));
  const convDe = new Map(((convs ?? []) as any[]).map((c) => [c.id as string, c]));
  const origenDe = (o: any) => (o ? origenEnPalabras({ campana: campanas.get(o.campaign_id), base: bases.get(o.imported_base_id), fuente: fuenteDe(o), detalleFuente: o.first_source_detail }) : "Sin origen registrado");
  const filas: FilaResultado[] = pagina.map((id) => {
    const c = convDe.get(id) as any;
    const o = oppDe.get(id);
    const m = ultimo.get(id);
    return {
      clave: id,
      contactId: c?.contact_id ?? null,
      conversationId: id,
      nombre: c?.contacts?.full_name ?? null,
      telefono: c?.contacts?.phone ?? null,
      at: m?.created_at ?? null,
      origen: origenDe(o),
      base: o?.campaign_id && bases.get(o.imported_base_id) ? bases.get(o.imported_base_id)! : null,
      estado: estadoDe(o),
      detalle: m?.body ? `Último mensaje: «${String(m.body).replace(/\s+/g, " ").slice(0, 110)}»` : null,
    };
  });
  return {
    filas,
    total: idsConv.length,
    origenes: agruparOrigenes(idsConv.slice(0, 600).map((id) => origenDe(oppDe.get(id)))),
    origenesParciales: (mensajes ?? []).length >= TOPE_ORIGENES || idsConv.length > 600,
  };
}

export const TAMANO_PAGINA_RESULTADOS = TAMANO;
