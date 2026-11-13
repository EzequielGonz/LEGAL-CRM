/**
 * Asistente · operaciones del panel (13/11). Lado servidor del catálogo:
 * buscar operaciones, armar la propuesta (identificando el recurso DENTRO
 * del perfil abierto) y, al confirmar, llamar a la misma ruta que usa la
 * pantalla con la sesión de quien confirma.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { CATALOGO, operacionPorClave } from "@/lib/asistente/catalogo";
import {
  buscarOperaciones,
  fichaDeOperacion,
  nivelDeOperacion,
  rutaConIds,
  validarCampos,
  type OperacionPanel,
  type RecursoOperacion,
  type TablaRecurso,
} from "@/lib/asistente/catalogo-tipos";
import type { NivelAccion } from "@/lib/asistente/permisos";

type Db = ReturnType<typeof createAdminClient>;

export interface CtxPanel {
  slug: string;
  rubroId: string;
  guardar: (tipo: string, titulo: string, resumen: string, payload: unknown) => Promise<{ id: string }>;
  agregarPropuesta: (id: string) => void;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const areasDe = (slug: string) => AREAS_DE_PERFIL[slug] ?? [slug];
const limpio = (v: unknown, max = 80) => String(v ?? "").trim().slice(0, max);
const paraLike = (t: string) => t.replace(/[%_,()]/g, " ");

type Encontrado = { id: string; nombre: string };
type Resolucion = { uno: Encontrado } | { error: string; opciones?: string[] };

/** De qué columna sale el perfil de cada tabla y con qué nombre se busca. */
const TABLAS: Record<TablaRecurso, { tabla: string; perfil: "rubro_id" | "area" | "general" | "es_el_perfil" | "es_un_area" | "persona" | "conversacion"; nombre?: string; orden?: string; idCol?: string }> = {
  campaigns: { tabla: "campaigns", perfil: "area", nombre: "name", orden: "created_at" },
  imported_bases: { tabla: "imported_bases", perfil: "area", nombre: "name", orden: "created_at" },
  wasender_lineas: { tabla: "wasender_lineas", perfil: "rubro_id", nombre: "nombre", orden: "created_at" },
  wasender_plantillas: { tabla: "wasender_plantillas", perfil: "rubro_id", nombre: "nombre", orden: "created_at" },
  profile_lines: { tabla: "profile_lines", perfil: "rubro_id", nombre: "label", orden: "created_at" },
  content_pieces: { tabla: "content_pieces", perfil: "rubro_id", nombre: "titulo", orden: "created_at" },
  template_assignments: { tabla: "template_assignments", perfil: "rubro_id" },
  bandeja_claude: { tabla: "bandeja_claude", perfil: "rubro_id" },
  incidencias: { tabla: "incidences", perfil: "rubro_id" },
  notification_phones: { tabla: "notification_phones", perfil: "general", nombre: "label" },
  calendar_exceptions: { tabla: "contact_calendar_exceptions", perfil: "general" },
  rubros: { tabla: "rubros", perfil: "es_el_perfil" },
  area_del_perfil: { tabla: "", perfil: "es_un_area" },
  message_attachments: { tabla: "message_attachments", perfil: "rubro_id" },
  // Los agentes de la biblioteca se identifican por su clave, no por un identificador largo.
  agent_library: { tabla: "agent_library", perfil: "rubro_id", nombre: "nombre", idCol: "clave" },
  agent_roles: { tabla: "agent_roles", perfil: "rubro_id", nombre: "nombre", orden: "created_at" },
  // Lo que cuelga de una persona se busca por su nombre o su teléfono.
  contacts: { tabla: "contacts", perfil: "persona" },
  opportunities: { tabla: "opportunities", perfil: "persona", orden: "updated_at" },
  conversations: { tabla: "conversations", perfil: "persona", orden: "last_message_at" },
  appointments: { tabla: "appointments", perfil: "persona", orden: "starts_at" },
  followup_tasks: { tabla: "followup_tasks", perfil: "persona", orden: "created_at" },
  detenciones: { tabla: "contact_detentions", perfil: "persona", orden: "created_at" },
  messages: { tabla: "messages", perfil: "conversacion" },
};

/** Personas del perfil que coinciden con un nombre o un teléfono. */
async function personasDelPerfil(s: Db, ctx: CtxPanel, pedido: string): Promise<Encontrado[]> {
  const digitos = pedido.replace(/\D/g, "");
  let q: any = (s.from("contacts") as any).select("id, full_name, phone").eq("rubro_id", ctx.rubroId).order("updated_at", { ascending: false }).limit(6);
  q = digitos.length >= 6 ? q.ilike("phone", `%${digitos.slice(-8)}%`) : q.ilike("full_name", `%${paraLike(pedido)}%`);
  const { data } = await q;
  return ((data ?? []) as any[]).map((c) => ({ id: c.id, nombre: c.full_name ?? c.phone ?? "Sin nombre" }));
}

/**
 * Identifica el recurso que pide el modelo (por identificador, nombre o
 * teléfono) y comprueba que sea del perfil abierto. Nunca devuelve algo de
 * otro perfil: para tocar otro perfil hay que abrir el asistente ahí.
 */
export async function resolverRecurso(s: Db, r: RecursoOperacion, pedido: unknown, ctx: CtxPanel): Promise<Resolucion> {
  const t = TABLAS[r.tabla];
  if (t.perfil === "es_el_perfil") return { uno: { id: ctx.rubroId, nombre: "este perfil" } };
  if (t.perfil === "es_un_area") {
    // Jurídico tiene dos áreas (civil y penal); los demás perfiles, una sola.
    const lista = areasDe(ctx.slug);
    const pedida = limpio(pedido).toLowerCase();
    if (!pedida && lista.length === 1) return { uno: { id: lista[0], nombre: lista[0] } };
    if (lista.includes(pedida)) return { uno: { id: pedida, nombre: pedida } };
    return { error: `Decime el área: ${lista.join(" o ")}.`, opciones: lista };
  }
  const texto = limpio(pedido);
  if (!texto) return { error: `Falta decir qué ${r.que}.` };
  const areas = areasDe(ctx.slug);
  const fuera = { error: `Ese ${r.que} no es de este perfil. Para tocar otro perfil, abrí el asistente en ese perfil.` };

  if (t.perfil === "general") {
    // Una excepción del calendario se puede nombrar por su día (AAAA-MM-DD).
    if (r.tabla === "calendar_exceptions" && /^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const { data } = await (s.from(t.tabla as any) as any).select("id").eq("day", texto).is("archived_at", null).maybeSingle();
      return data ? { uno: { id: (data as any).id, nombre: `del ${texto}` } } : { error: `No hay una excepción vigente para el ${texto}.` };
    }
    if (UUID.test(texto)) {
      const { data } = await (s.from(t.tabla as any) as any).select("id").eq("id", texto).maybeSingle();
      return data ? { uno: { id: texto, nombre: r.que } } : { error: `No encontré ese ${r.que}.` };
    }
    if (!t.nombre) return { error: `Para ${r.que} hace falta el identificador.` };
    const { data } = await (s.from(t.tabla as any) as any).select(`id, ${t.nombre}`).ilike(t.nombre, `%${paraLike(texto)}%`).limit(6);
    return elegir(r, ((data ?? []) as any[]).map((x) => ({ id: x.id, nombre: String(x[t.nombre!] ?? r.que) })));
  }

  if (r.tabla === "incidencias" && !UUID.test(texto)) {
    // Una incidencia se puede nombrar por la persona: se toma la abierta más reciente de esa persona.
    const personas = await personasDelPerfil(s, ctx, texto);
    const elegida = elegir({ ...r, que: "persona" }, personas);
    if (!("uno" in elegida)) return elegida;
    const { data: opps } = await (s.from("opportunities") as any).select("id").eq("rubro_id", ctx.rubroId).eq("contact_id", elegida.uno.id);
    const ids = ((opps ?? []) as any[]).map((o) => o.id);
    const { data: inc } = ids.length
      ? await (s.from("incidences") as any).select("id").eq("rubro_id", ctx.rubroId).in("opportunity_id", ids).order("created_at", { ascending: false }).limit(1)
      : { data: [] as any[] };
    const fila = ((inc ?? []) as any[])[0];
    return fila ? { uno: { id: fila.id, nombre: `de ${elegida.uno.nombre}` } } : { error: `${elegida.uno.nombre} no tiene incidencias.` };
  }

  if (t.perfil === "rubro_id" || t.perfil === "area") {
    const acotar = (q: any) => (t.perfil === "rubro_id" ? q.eq("rubro_id", ctx.rubroId) : q.in("area", areas));
    if (UUID.test(texto)) {
      const { data } = await acotar((s.from(t.tabla as any) as any).select(`id${t.nombre ? `, ${t.nombre}` : ""}`).eq("id", texto)).maybeSingle();
      if (data) return { uno: { id: texto, nombre: t.nombre ? String((data as any)[t.nombre] ?? r.que) : r.que } };
      const { data: existe } = await (s.from(t.tabla as any) as any).select("id").eq("id", texto).maybeSingle();
      return existe ? fuera : { error: `No encontré ese ${r.que}.` };
    }
    if (!t.nombre) return { error: `Para ${r.que} hace falta el identificador.` };
    const idCol = t.idCol ?? "id";
    if (t.idCol && /^[a-z0-9_]{2,60}$/.test(texto)) {
      const { data: porClave } = await acotar((s.from(t.tabla as any) as any).select(`${idCol}, ${t.nombre}`).eq(idCol, texto)).maybeSingle();
      if (porClave) return { uno: { id: String((porClave as any)[idCol]), nombre: String((porClave as any)[t.nombre] ?? r.que) } };
    }
    let q = acotar((s.from(t.tabla as any) as any).select(`${idCol}, ${t.nombre}`).ilike(t.nombre, `%${paraLike(texto)}%`));
    if (t.orden) q = q.order(t.orden, { ascending: false });
    const { data } = await q.limit(8);
    const filas = ((data ?? []) as any[]).map((x) => ({ id: String(x[idCol]), nombre: String(x[t.nombre!] ?? r.que) }));
    const exacto = filas.filter((f) => f.nombre.toLowerCase() === texto.toLowerCase());
    return elegir(r, exacto.length === 1 ? exacto : filas);
  }

  if (t.perfil === "conversacion") {
    if (!UUID.test(texto)) return { error: `Para ${r.que} hace falta el identificador.` };
    const { data } = await (s.from("messages") as any).select("id, conversations!inner(area)").eq("id", texto).maybeSingle();
    if (!data) return { error: `No encontré ese ${r.que}.` };
    return areas.includes((data as any).conversations?.area) ? { uno: { id: texto, nombre: r.que } } : fuera;
  }

  // Cosas de una persona: por identificador propio o por nombre / teléfono de la persona.
  if (UUID.test(texto)) {
    if (r.tabla === "contacts") {
      const { data } = await (s.from("contacts") as any).select("id, full_name, phone, rubro_id").eq("id", texto).maybeSingle();
      if (!data) return { error: "No encontré esa persona." };
      return (data as any).rubro_id === ctx.rubroId ? { uno: { id: texto, nombre: (data as any).full_name ?? (data as any).phone ?? "Sin nombre" } } : fuera;
    }
    const { data } = await (s.from(t.tabla as any) as any).select("id, contact_id, contacts(full_name, phone, rubro_id)").eq("id", texto).maybeSingle();
    if (data) {
      const c = (data as any).contacts;
      return c?.rubro_id === ctx.rubroId ? { uno: { id: texto, nombre: c.full_name ?? c.phone ?? "Sin nombre" } } : fuera;
    }
    // Puede ser el identificador de la persona en lugar del de su fila: se sigue abajo.
  }
  const personas = UUID.test(texto)
    ? await (async () => {
        const { data } = await (s.from("contacts") as any).select("id, full_name, phone").eq("id", texto).eq("rubro_id", ctx.rubroId).maybeSingle();
        return data ? [{ id: (data as any).id, nombre: (data as any).full_name ?? (data as any).phone ?? "Sin nombre" }] : [];
      })()
    : await personasDelPerfil(s, ctx, texto);
  const elegida = elegir({ ...r, que: "persona" }, personas);
  if (!("uno" in elegida)) return elegida;
  if (r.tabla === "contacts") return elegida;
  let q: any = (s.from(t.tabla as any) as any).select("id").eq("contact_id", elegida.uno.id);
  if (r.tabla === "appointments") q = q.gte("starts_at", new Date(Date.now() - 12 * 3_600_000).toISOString()).not("status", "ilike", "%cancel%").order("starts_at", { ascending: true });
  else if (r.tabla === "detenciones") q = q.eq("status", "vigente").order("created_at", { ascending: false });
  else if (r.tabla === "followup_tasks") q = q.neq("status", "cancelada").order("created_at", { ascending: false });
  else if (t.orden) q = q.order(t.orden, { ascending: false, nullsFirst: false });
  const { data: filas } = await q.limit(1);
  const fila = ((filas ?? []) as any[])[0];
  return fila ? { uno: { id: fila.id, nombre: elegida.uno.nombre } } : { error: `${elegida.uno.nombre} no tiene ${r.que} para esta operación.` };
}

function elegir(r: RecursoOperacion, filas: Encontrado[]): Resolucion {
  if (filas.length === 1) return { uno: filas[0] };
  if (filas.length === 0) return { error: `No encontré ${r.que} con ese dato en este perfil.` };
  return { error: `Hay ${filas.length} que coinciden: decime cuál.`, opciones: filas.map((f) => f.nombre).slice(0, 8) };
}

/** Herramienta de consulta: qué operaciones existen y qué datos pide cada una. */
export function listarOperaciones(args: Record<string, unknown>, perfil?: string): Record<string, unknown> {
  const lista = buscarOperaciones(CATALOGO, args.buscar, args.grupo, perfil);
  const grupos = Array.from(new Set(CATALOGO.filter((o) => !o.soloPerfil || !perfil || o.soloPerfil === perfil).map((o) => o.grupo)));
  if (!lista.length) return { resultado: "No encontré una operación con esas palabras.", grupos, sugerencia: "Probá con otro verbo o pedí el grupo entero." };
  return { operaciones: lista.slice(0, 12).map(fichaDeOperacion), hay_mas: Math.max(0, lista.length - 12), grupos };
}

const ROTULO_NIVEL: Record<NivelAccion, string> = {
  cambio: "",
  contacto: " Puede hacer salir mensajes a personas: pide la confirmación reforzada.",
  pin: " Pide el código de acceso.",
};

/** Deja una operación del panel como PROPUESTA. No ejecuta nada. */
export async function proponerOperacion(args: Record<string, unknown>, ctx: CtxPanel): Promise<Record<string, unknown>> {
  const op = operacionPorClave(String(args.clave ?? ""));
  if (!op) {
    const parecidas = buscarOperaciones(CATALOGO, args.clave).slice(0, 5).map((o) => o.clave);
    return { error: "No existe una operación con esa clave. Buscala primero con operaciones_del_panel.", parecidas };
  }
  if (op.soloPerfil && op.soloPerfil !== ctx.slug) return { error: `Esa operación es solo del perfil ${op.soloPerfil}. Para usarla, abrí el asistente en ese perfil.` };
  const s = createAdminClient();
  const pedidos = args.identificar && typeof args.identificar === "object" ? (args.identificar as Record<string, unknown>) : {};
  const ids: Record<string, string> = {};
  const nombres: string[] = [];
  for (const r of op.recursos ?? []) {
    const res = await resolverRecurso(s, r, pedidos[r.param] ?? (op.recursos!.length === 1 ? args.sobre : undefined), ctx);
    if (!("uno" in res)) return { error: res.error, ...(res.opciones ? { opciones: res.opciones } : {}) };
    ids[r.param] = res.uno.id;
    if (TABLAS[r.tabla].perfil !== "es_el_perfil") nombres.push(`${r.que} «${res.uno.nombre}»`);
  }
  const v = validarCampos(op, args.parametros);
  if (!v.ok) return { error: v.error, parametros: fichaDeOperacion(op).parametros };
  // Lo que nombra otra cosa del panel (una base, un rol, una línea) se cambia por su identificador, dentro del perfil.
  for (const ref of op.referencias ?? []) {
    const dado = v.cuerpo[ref.campo];
    if (dado === undefined || dado === null || dado === "") continue;
    const res = await resolverRecurso(s, { param: ref.campo, que: ref.que, tabla: ref.tabla }, dado, ctx);
    if (!("uno" in res)) return { error: res.error, ...(res.opciones ? { opciones: res.opciones } : {}) };
    v.cuerpo[ref.campo] = res.uno.id;
    nombres.push(`${ref.que} «${res.uno.nombre}»`);
  }
  const nivel = nivelDeOperacion(op, { ...v.cuerpo, ...(op.fijos ?? {}) });
  const deReferencia = new Set((op.referencias ?? []).map((x) => x.campo));
  const datos = Object.entries(v.cuerpo)
    .filter(([k]) => !deReferencia.has(k))
    .map(([k, val]) => `${k}: ${typeof val === "object" && val !== null ? JSON.stringify(val).slice(0, 200) : String(val).slice(0, 300)}`)
    .join(" · ");
  const resumen = `${op.titulo}${nombres.length ? ` — ${nombres.join(", ")}` : ""}. ${op.efecto}${datos ? ` Datos: ${datos}.` : ""}${op.general ? " Vale para los cuatro perfiles." : ""}${ROTULO_NIVEL[nivel]}`.slice(0, 1200);
  const prop = await ctx.guardar("operacion_panel", op.titulo, resumen, { clave: op.clave, ids, cuerpo: v.cuerpo, nivel, perfil: ctx.slug, sobre: nombres });
  ctx.agregarPropuesta(prop.id);
  return { propuesta: prop.id, resumen, aviso: "Quedó como propuesta: no pasó nada todavía. Se hace cuando la responsable toca Confirmar." };
}

/** Nivel con el que se confirma una propuesta guardada: sale del catálogo, nunca de lo que mandó el navegador. */
export function nivelDePropuestaPanel(payload: any): NivelAccion {
  const op = operacionPorClave(String(payload?.clave ?? ""));
  if (!op) return "pin";
  return nivelDeOperacion(op, { ...(payload?.cuerpo ?? {}), ...(op.fijos ?? {}) });
}

export interface LlamadaInterna {
  /** Origen del propio panel (https://…): la llamada no sale a ningún otro lado. */
  origen: string;
  /** Cookie de sesión de quien confirma. */
  cookie: string | null;
  /** Código de acceso escrito al confirmar (solo si la operación lo pide). */
  pin?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Ejecuta una propuesta confirmada llamando a la ruta de la pantalla. El
 * perfil sale de la propuesta guardada (el perfil donde se pidió) y se
 * vuelve a comprobar el recurso: si mientras tanto cambió de perfil o se
 * archivó, la ruta lo rechaza igual que en la pantalla.
 */
export async function ejecutarOperacionPanel(a: { rubro_id: string; payload: any }, http: LlamadaInterna): Promise<Record<string, unknown>> {
  const p = a.payload ?? {};
  const op = operacionPorClave(String(p.clave ?? ""));
  if (!op) throw new Error("Esa operación ya no existe en el panel.");
  const slug = String(p.perfil ?? "");
  const areas = areasDe(slug);
  const ruta = rutaConIds(op.ruta, (p.ids ?? {}) as Record<string, string>);
  const cuerpo: Record<string, unknown> = { ...(p.cuerpo ?? {}), ...(op.fijos ?? {}) };
  const url = new URL(ruta, http.origen);
  if (op.perfil) {
    const valor = op.perfil.valor === "slug" ? slug : op.perfil.valor === "rubro_id" ? a.rubro_id : areas[0];
    if (op.perfil.en === "cuerpo") cuerpo[op.perfil.campo] = valor;
    else url.searchParams.set(op.perfil.campo, valor);
  }
  if (op.campoPin) {
    if (!http.pin) throw new Error("Esta operación pide el código de acceso.");
    cuerpo[op.campoPin] = http.pin;
  }
  if (url.origin !== new URL(http.origen).origin) throw new Error("Ruta inválida.");
  if (op.soloPerfil && op.soloPerfil !== slug) throw new Error("Esa operación no es de este perfil.");
  let body: BodyInit | undefined;
  const headers: Record<string, string> = { ...(http.cookie ? { cookie: http.cookie } : {}), "x-origen-asistente": "1" };
  if (op.comoFormulario) {
    const f = new FormData();
    for (const [k, val] of Object.entries(cuerpo)) if (val !== undefined && val !== null) f.set(k, String(val));
    body = f;
  } else {
    headers["Content-Type"] = "application/json";
    body = op.metodo === "DELETE" && Object.keys(cuerpo).length === 0 ? undefined : JSON.stringify(cuerpo);
  }
  const res = await (http.fetchImpl ?? fetch)(url, {
    method: op.metodo,
    headers,
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(50_000),
  });
  const texto = await res.text();
  let json: any = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw new Error(String(json?.error ?? json?.message ?? `El panel respondió ${res.status}.`).slice(0, 280));
  return { hecho: true, operacion: op.titulo, respuesta: recortar(json) };
}

/** Guarda una versión corta de la respuesta (sin listas largas ni textos enormes). */
function recortar(v: unknown, nivel = 0): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.slice(0, 300);
  if (typeof v !== "object") return v;
  if (nivel >= 2) return Array.isArray(v) ? `[${v.length}]` : "{…}";
  if (Array.isArray(v)) return v.slice(0, 5).map((x) => recortar(x, nivel + 1));
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>)
      .slice(0, 20)
      .map(([k, x]) => [k, recortar(x, nivel + 1)])
  );
}
