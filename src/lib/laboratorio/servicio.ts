/**
 * Laboratorio del bot (15/11): acceso a datos del panel (servidor, clave de
 * servicio). Las decisiones están en ./reglas.ts (puras y probadas).
 *
 * Lo que hace este módulo:
 *  - crea versiones nuevas como copia (nunca edita v1, v2 ni otra versión
 *    existente, ni el prompt del agente de base del perfil);
 *  - aplica a mano versiones y roles (perfil, tipo de consulta, base o
 *    campaña) guardando lo anterior, y vuelve atrás;
 *  - arma y corta pruebas A/B por campaña;
 *  - lee cifras para las comparativas y corre pruebas simuladas.
 *
 * Nunca envía mensajes, nunca toca Meta ni campañas en curso, nunca escribe
 * `agente_ganador` (el ganador global de la comparación A/B/C) y cada cambio
 * queda en ops_change_log (solo inserciones).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { asignarRolABase, asignarRolACampana, guardarRol } from "@/lib/agentes/roles";
import { validarRol } from "@/lib/agentes/roles-reglas";
import { experimentoEnCurso } from "@/lib/experimento/servicio";
import { limpiarCacheConocimiento } from "@/lib/conocimiento/servicio";
import { sumar, tasas, veredicto, type FilaEstadistica } from "@/lib/conocimiento/estadisticas";
import { probarBotReal } from "@/lib/ai-agent/probar-real";
import { limpiarCacheLaboratorio } from "./en-vivo";
import { casosDelPerfil, casosEscritos, evaluarCaso, type CasoSimulado } from "./casos";
import {
  AREAS_DEL_RUBRO,
  RUBROS,
  bloqueDeVersion,
  bloqueRolLaboratorio,
  datosSuficientes,
  diferencias,
  esRubro,
  estadoVersion,
  modeloValido,
  pruebaSuperpuesta,
  pruebaVigente,
  tipoConsultaValido,
  validarProveedor,
  validarPruebaAB,
  validarVersion,
  type ConfigVersion,
  type PedidoProveedor,
  type PedidoVersion,
  type PruebaAB,
  type Rubro,
  type TipoConsulta,
} from "./reglas";

export class LaboratorioError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "LaboratorioError";
  }
}

const SLUG_POR_ID: Record<string, Rubro> = Object.fromEntries(Object.entries(RUBRO_IDS).map(([s, id]) => [id, s as Rubro]));
const AVISO_MINUTO = "Tarda hasta 1 minuto en regir en las respuestas nuevas.";

async function registrar(actor: string, action: string, target: string, before: unknown, after: unknown, note: string) {
  const { error } = await createAdminClient().from("ops_change_log" as any).insert({ actor, action, target, before: before ?? null, after: after ?? null, note });
  if (error) throw error;
}

function limpiarCaches() {
  limpiarCacheConocimiento();
  limpiarCacheLaboratorio();
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------

export async function resumenLaboratorio() {
  const s = createAdminClient();
  const [vers, lab, asig, conteo, pruebas, apl, prov, exp] = await Promise.all([
    s.from("bot_knowledge_versions" as any).select("version, nombre, descripcion, created_at").order("version"),
    s.from("bot_lab_versiones" as any).select("*"),
    s.from("bot_knowledge_assignment" as any).select("rubro, version, comparar_con, porcentaje, desde"),
    s.from("bot_knowledge_items" as any).select("version, rubro, capa, activo"),
    s.from("bot_lab_pruebas_ab" as any).select("*, campaigns(name, status)").order("creada_at", { ascending: false }).limit(60),
    s.from("bot_lab_aplicaciones" as any).select("*, agent_roles(nombre), imported_bases(name), campaigns(name)").is("revertida_at", null).order("aplicada_at", { ascending: false }),
    s.from("bot_lab_proveedores" as any).select("id, nombre, endpoint, variable_clave, notas, creado_at").is("archived_at", null).order("creado_at"),
    experimentoEnCurso().catch(() => null),
  ]);
  for (const r of [vers, lab, asig, conteo, pruebas, apl, prov]) if (r.error) throw r.error;
  const ahora = new Date();
  const asignaciones = ((asig.data as any[]) ?? []) as { rubro: Rubro; version: number; comparar_con: number | null; porcentaje: number; desde: string }[];
  const listaPruebas = ((pruebas.data as any[]) ?? []).map((p) => ({ ...p, campana: p.campaigns?.name ?? "Campaña", vigente: pruebaVigente(p, ahora) }));
  const vigentes = listaPruebas.filter((p) => p.vigente);
  const porVersion = new Map<number, any>(((lab.data as any[]) ?? []).map((v) => [v.version, v]));
  const items = (conteo.data as any[]) ?? [];
  const versiones = ((vers.data as any[]) ?? []).map((v) => {
    const l = porVersion.get(v.version) ?? null;
    const propios = items.filter((i) => i.version === v.version && i.activo);
    return {
      version: v.version as number,
      nombre: v.nombre as string,
      descripcion: v.descripcion as string,
      creada: v.created_at as string,
      laboratorio: !!l,
      base_version: l?.base_version ?? null,
      rubros: (l?.rubros ?? RUBROS) as Rubro[],
      modelo: (l?.modelo ?? null) as string | null,
      tono: (l?.tono ?? "") as string,
      reglas: (l?.reglas ?? "") as string,
      roles: (l?.roles ?? []) as { nombre: string }[],
      fichas: propios.length,
      estado: estadoVersion(v.version, { archivada: !!l?.archived_at, asignaciones, pruebasVigentes: vigentes }),
    };
  });
  const aplicaciones = ((apl.data as any[]) ?? []).map((a) => ({
    id: a.id,
    tipo: a.tipo,
    rubro: a.rubro,
    version: a.version,
    tipo_consulta: a.tipo_consulta,
    rol: a.agent_roles?.nombre ?? null,
    base: a.imported_bases?.name ?? null,
    campana: a.campaigns?.name ?? null,
    aplicada_at: a.aplicada_at,
  }));
  return {
    modeloServidor: identificadorModelo(),
    versiones,
    asignaciones,
    pruebas: listaPruebas.map((p) => ({ id: p.id, rubro: p.rubro, campaign_id: p.campaign_id, campana: p.campana, version: p.version, control_version: p.control_version, modelo: p.modelo, porcentaje: p.porcentaje, dias: p.dias, inicio: p.inicio, fin: p.fin, cortada_at: p.cortada_at, vigente: p.vigente })),
    aplicaciones,
    proveedores: ((prov.data as any[]) ?? []).map((p) => ({ ...p, configurada: !!(process.env[p.variable_clave] ?? "").trim(), estado: "preparado, sin conectar" })),
    experimentoGlobal: exp ? { nombre: (exp as any).exp?.nombre ?? "Comparación A/B/C", alcance: (exp as any).exp?.alcance ?? {} } : null,
    aviso: AVISO_MINUTO,
  };
}

// ---------------------------------------------------------------------------
// Versiones
// ---------------------------------------------------------------------------

async function versionesExistentes(): Promise<number[]> {
  const { data, error } = await createAdminClient().from("bot_knowledge_versions" as any).select("version");
  if (error) throw error;
  return ((data as any[]) ?? []).map((v) => Number(v.version));
}

async function configVersion(version: number): Promise<ConfigVersion | null> {
  if (version < 3) return null;
  const { data } = await createAdminClient().from("bot_lab_versiones" as any).select("*").eq("version", version).maybeSingle();
  if (!data) return null;
  const { data: v } = await createAdminClient().from("bot_knowledge_versions" as any).select("nombre").eq("version", version).maybeSingle();
  return { ...(data as any), nombre: (v as any)?.nombre ?? `v${version}`, roles: Array.isArray((data as any).roles) ? (data as any).roles : [] } as ConfigVersion;
}

/** Roles que se suman a una versión: se copia su contenido (la versión no cambia si el rol original cambia después). */
async function rolesParaCopiar(ids: unknown): Promise<{ nombre: string; objetivo: string; tono: string; instrucciones: string; origen_id: string }[]> {
  const lista = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
  if (!lista.length) return [];
  const s = createAdminClient();
  const [delPerfil, generales] = await Promise.all([
    s.from("agent_roles" as any).select("id, nombre, objetivo, tono, instrucciones, archived_at").in("id", lista),
    s.from("bot_lab_roles_generales" as any).select("id, nombre, objetivo, tono, instrucciones, archived_at").in("id", lista),
  ]);
  const todos = [...(((delPerfil.data as any[]) ?? [])), ...(((generales.data as any[]) ?? []))].filter((r) => !r.archived_at);
  return todos.map((r) => ({ nombre: r.nombre, objetivo: r.objetivo ?? "", tono: r.tono ?? "", instrucciones: r.instrucciones, origen_id: r.id }));
}

export async function crearVersion(pedido: PedidoVersion & { roles_ids?: unknown }, actor: string): Promise<{ version: number }> {
  const roles = await rolesParaCopiar(pedido.roles_ids);
  const v = validarVersion({ ...pedido, roles }, await versionesExistentes());
  if (!v.ok) throw new LaboratorioError(v.error);
  // Si parte de otra versión del laboratorio, esa tiene que cubrir los mismos perfiles (si no, la copia quedaría sin sus fichas).
  const base = await configVersion(v.version.base_version);
  if (base && !v.version.rubros.every((r) => base.rubros.includes(r))) {
    throw new LaboratorioError(`v${v.version.base_version} no se creó para todos los perfiles elegidos. Elegí otra versión de origen o menos perfiles.`);
  }
  const { data, error } = await createAdminClient().rpc("laboratorio_crear_version" as any, {
    p_nombre: v.version.nombre,
    p_descripcion: v.version.descripcion,
    p_base: v.version.base_version,
    p_rubros: v.version.rubros,
    p_modelo: v.version.modelo ?? "",
    p_tono: v.version.tono,
    p_reglas: v.version.reglas,
    p_roles: v.version.roles,
    p_fichas: v.version.fichas,
    p_actor: actor,
  });
  if (error) throw error;
  return { version: Number(data) };
}

async function versionEnUso(version: number): Promise<boolean> {
  const s = createAdminClient();
  const [asig, pruebas] = await Promise.all([
    s.from("bot_knowledge_assignment" as any).select("version, comparar_con"),
    s.from("bot_lab_pruebas_ab" as any).select("version, inicio, fin, cortada_at").eq("version", version).is("cortada_at", null),
  ]);
  const enAsig = ((asig.data as any[]) ?? []).some((a) => a.version === version || a.comparar_con === version);
  const enPrueba = ((pruebas.data as any[]) ?? []).some((p) => pruebaVigente(p, new Date()));
  return enAsig || enPrueba;
}

/** Cambia el modelo de una versión del laboratorio que todavía no rige en ningún lado. */
export async function cambiarModeloVersion(version: number, modelo: string | null, actor: string) {
  const cfg = await configVersion(version);
  if (!cfg) throw new LaboratorioError("Solo se puede elegir el modelo de una versión creada en el laboratorio (v3 en adelante).");
  if (cfg.archived_at) throw new LaboratorioError("La versión está archivada.");
  if (modelo && !modeloValido(modelo)) throw new LaboratorioError("El modelo no es válido.");
  if (await versionEnUso(version)) throw new LaboratorioError("Esta versión ya responde charlas (aplicada o en prueba). Para usar otro modelo, creá una versión nueva o una prueba A/B con ese modelo.");
  const { error } = await createAdminClient().from("bot_lab_versiones" as any).update({ modelo: modelo || null }).eq("version", version);
  if (error) throw error;
  await registrar(actor, "laboratorio_modelo_version", `bot_lab_versiones:v${version}`, { modelo: cfg.modelo }, { modelo: modelo || null }, "Laboratorio: modelo de una versión que todavía no rige.");
  limpiarCaches();
}

export async function archivarVersion(version: number, nota: string, actor: string) {
  const cfg = await configVersion(version);
  if (!cfg) throw new LaboratorioError("Solo se archivan versiones creadas en el laboratorio.");
  if (await versionEnUso(version)) throw new LaboratorioError("Esta versión está en uso. Volvé atrás la aplicación o cortá la prueba antes de archivarla.");
  const { error } = await createAdminClient().from("bot_lab_versiones" as any).update({ archived_at: new Date().toISOString(), archived_note: (nota || "Archivada desde el laboratorio").slice(0, 300) }).eq("version", version);
  if (error) throw error;
  await registrar(actor, "laboratorio_archivar_version", `bot_lab_versiones:v${version}`, { archived_at: null }, { archived_at: "ahora", nota }, "Laboratorio: versión archivada (no se borra).");
  limpiarCaches();
}

async function itemsComparables(version: number, rubro: Rubro) {
  const { data, error } = await createAdminClient()
    .from("bot_knowledge_items" as any)
    .select("clave, titulo, contenido, activo")
    .eq("version", version)
    .or(`rubro.eq.${rubro},rubro.eq.comun,rubro.is.null`);
  if (error) throw error;
  return ((data as any[]) ?? []) as { clave: string; titulo: string; contenido: string; activo: boolean }[];
}

/** Lo que cambia si se aplica `version` a todo el perfil (se muestra antes de confirmar). */
export async function diferenciasParaAplicar(rubro: Rubro, version: number) {
  const { data: asig } = await createAdminClient().from("bot_knowledge_assignment" as any).select("version").eq("rubro", rubro).maybeSingle();
  const actual = Number((asig as any)?.version ?? 2);
  const [ia, ib, ca, cb] = await Promise.all([itemsComparables(actual, rubro), itemsComparables(version, rubro), configVersion(actual), configVersion(version)]);
  return { actual, nueva: version, ...diferencias({ version: actual, items: ia, cfg: ca, modeloServidor: identificadorModelo() }, { version, items: ib, cfg: cb }) };
}

// ---------------------------------------------------------------------------
// Aplicaciones manuales y vuelta atrás
// ---------------------------------------------------------------------------

async function insertarAplicacion(fila: Record<string, unknown>) {
  const { data, error } = await createAdminClient().from("bot_lab_aplicaciones" as any).insert(fila).select("id").single();
  if (error) {
    if ((error as any).code === "23505") throw new LaboratorioError("Ya hay un rol aplicado ahí. Volvé atrás el anterior antes de aplicar otro.");
    throw error;
  }
  return (data as any).id as string;
}

export async function aplicarVersionAPerfil(rubro: Rubro, version: number, actor: string) {
  const cfg = await configVersion(version);
  if (!cfg) throw new LaboratorioError("Desde el laboratorio se aplican versiones creadas acá (v3 en adelante). Para v1 o v2 usá «Conocimiento del bot».");
  if (cfg.archived_at) throw new LaboratorioError("La versión está archivada.");
  if (!cfg.rubros.includes(rubro)) throw new LaboratorioError("Esa versión no se creó para este perfil.");
  const s = createAdminClient();
  const { data: antes } = await s.from("bot_knowledge_assignment" as any).select("rubro, version, comparar_con, porcentaje, desde, updated_by").eq("rubro", rubro).maybeSingle();
  if ((antes as any)?.version === version && (antes as any)?.comparar_con == null) throw new LaboratorioError(`v${version} ya rige en este perfil.`);
  const despues = { rubro, version, comparar_con: null, porcentaje: 100, desde: new Date().toISOString(), updated_by: actor };
  const { error } = await s.from("bot_knowledge_assignment" as any).upsert(despues, { onConflict: "rubro" });
  if (error) throw error;
  const id = await insertarAplicacion({ tipo: "version_perfil", rubro, version, antes: antes ?? null, despues, aplicada_por: actor });
  await registrar(actor, "laboratorio_aplicar_version", `bot_knowledge_assignment:${rubro}`, antes ?? null, { ...despues, aplicacion: id }, "Laboratorio: versión aplicada a todo el perfil, a mano y con confirmación. Se puede volver atrás.");
  limpiarCaches();
  return { id, aviso: AVISO_MINUTO };
}

async function rolDelPerfil(rubro: Rubro, rolId: string) {
  const { data } = await createAdminClient().from("agent_roles" as any).select("id, rubro_id, nombre, archived_at").eq("id", rolId).maybeSingle();
  if (!data || (data as any).rubro_id !== RUBRO_IDS[rubro] || (data as any).archived_at) throw new LaboratorioError("El rol no es de este perfil o está archivado.");
  return data as any;
}

export async function aplicarRol(
  p: { tipo: "rol_perfil" | "rol_tipo_consulta" | "rol_base" | "rol_campana"; rubro: Rubro; rolId: string | null; tipoConsulta?: unknown; baseId?: string | null; campaignId?: string | null },
  actor: string
) {
  const s = createAdminClient();
  const areas = AREAS_DEL_RUBRO[p.rubro];
  if (p.rolId) await rolDelPerfil(p.rubro, p.rolId);
  else if (p.tipo === "rol_perfil" || p.tipo === "rol_tipo_consulta") throw new LaboratorioError("Elegí un rol.");
  let id: string;
  if (p.tipo === "rol_perfil" || p.tipo === "rol_tipo_consulta") {
    const tipoConsulta = p.tipo === "rol_tipo_consulta" ? p.tipoConsulta : null;
    if (p.tipo === "rol_tipo_consulta" && !tipoConsultaValido(p.rubro, tipoConsulta)) throw new LaboratorioError("Elegí un tipo de consulta válido para este perfil.");
    id = await insertarAplicacion({ tipo: p.tipo, rubro: p.rubro, rol_id: p.rolId, tipo_consulta: tipoConsulta, antes: null, despues: { rol_id: p.rolId, tipo_consulta: tipoConsulta }, aplicada_por: actor });
    await registrar(actor, "laboratorio_aplicar_rol", `bot_lab_aplicaciones:${id}`, null, { tipo: p.tipo, rubro: p.rubro, rol_id: p.rolId, tipo_consulta: tipoConsulta }, "Laboratorio: rol aplicado a mano. Entra solo si la charla no tiene rol de campaña ni de base.");
  } else if (p.tipo === "rol_base") {
    if (!p.baseId) throw new LaboratorioError("Elegí la base.");
    const { data: base } = await s.from("imported_bases" as any).select("id, agent_role_id").eq("id", p.baseId).maybeSingle();
    if (!base) throw new LaboratorioError("La base no existe.");
    const antes = { agent_role_id: (base as any).agent_role_id ?? null };
    await asignarRolABase(RUBRO_IDS[p.rubro], areas, p.baseId, p.rolId);
    id = await insertarAplicacion({ tipo: "rol_base", rubro: p.rubro, rol_id: p.rolId, base_id: p.baseId, antes, despues: { agent_role_id: p.rolId }, aplicada_por: actor });
    await registrar(actor, "laboratorio_aplicar_rol", `imported_bases:${p.baseId}`, antes, { agent_role_id: p.rolId, aplicacion: id }, "Laboratorio: rol cargado a una base. Se puede volver atrás.");
  } else {
    if (!p.campaignId) throw new LaboratorioError("Elegí la campaña.");
    const { data: camp } = await s.from("campaigns" as any).select("id, agent_role_id").eq("id", p.campaignId).maybeSingle();
    if (!camp) throw new LaboratorioError("La campaña no existe.");
    const antes = { agent_role_id: (camp as any).agent_role_id ?? null };
    await asignarRolACampana(RUBRO_IDS[p.rubro], areas, p.campaignId, p.rolId, actor);
    id = await insertarAplicacion({ tipo: "rol_campana", rubro: p.rubro, rol_id: p.rolId, campaign_id: p.campaignId, antes, despues: { agent_role_id: p.rolId }, aplicada_por: actor });
    await registrar(actor, "laboratorio_aplicar_rol", `campaigns:${p.campaignId}`, antes, { agent_role_id: p.rolId, aplicacion: id }, "Laboratorio: rol cargado a una campaña. Se puede volver atrás.");
  }
  limpiarCaches();
  return { id, aviso: AVISO_MINUTO };
}

/** Vuelve a lo que había antes de una aplicación. Si después alguien lo cambió a mano, no pisa ese cambio. */
export async function revertirAplicacion(id: string, nota: string, actor: string) {
  const s = createAdminClient();
  const { data: a } = await s.from("bot_lab_aplicaciones" as any).select("*").eq("id", id).maybeSingle();
  const ap = a as any;
  if (!ap) throw new LaboratorioError("No existe esa aplicación.", 404);
  if (ap.revertida_at) throw new LaboratorioError("Ya se volvió atrás.");
  if (ap.tipo === "version_perfil") {
    const { data: actual } = await s.from("bot_knowledge_assignment" as any).select("*").eq("rubro", ap.rubro).maybeSingle();
    if (!actual || (actual as any).version !== ap.version || (actual as any).comparar_con !== null) {
      throw new LaboratorioError("La versión del perfil cambió después de esta aplicación. Revisala en «Conocimiento del bot» antes de volver atrás.");
    }
    const previo = ap.antes ?? { rubro: ap.rubro, version: 2, comparar_con: null, porcentaje: 100 };
    const fila = { rubro: ap.rubro, version: previo.version, comparar_con: previo.comparar_con ?? null, porcentaje: previo.porcentaje ?? 100, desde: new Date().toISOString(), updated_by: actor };
    const { error } = await s.from("bot_knowledge_assignment" as any).upsert(fila, { onConflict: "rubro" });
    if (error) throw error;
    await registrar(actor, "laboratorio_volver_atras", `bot_knowledge_assignment:${ap.rubro}`, actual, fila, `Laboratorio: vuelve a lo anterior (aplicación ${id}).`);
  } else if (ap.tipo === "rol_base" || ap.tipo === "rol_campana") {
    const tabla = ap.tipo === "rol_base" ? "imported_bases" : "campaigns";
    const objetivo = ap.tipo === "rol_base" ? ap.base_id : ap.campaign_id;
    const { data: fila } = await s.from(tabla as any).select("agent_role_id").eq("id", objetivo).maybeSingle();
    if ((fila as any)?.agent_role_id !== (ap.despues?.agent_role_id ?? null)) {
      throw new LaboratorioError("El rol cambió después de esta aplicación. Revisalo a mano antes de volver atrás.");
    }
    const previo = ap.antes?.agent_role_id ?? null;
    const { error } = await s.from(tabla as any).update({ agent_role_id: previo } as any).eq("id", objetivo);
    if (error) throw error;
    await registrar(actor, "laboratorio_volver_atras", `${tabla}:${objetivo}`, { agent_role_id: (fila as any)?.agent_role_id ?? null }, { agent_role_id: previo }, `Laboratorio: vuelve a lo anterior (aplicación ${id}).`);
  } else {
    await registrar(actor, "laboratorio_volver_atras", `bot_lab_aplicaciones:${id}`, { tipo: ap.tipo, rol_id: ap.rol_id, tipo_consulta: ap.tipo_consulta }, null, "Laboratorio: se quita el rol aplicado; vuelve el comportamiento anterior.");
  }
  const { error } = await s.from("bot_lab_aplicaciones" as any).update({ revertida_at: new Date().toISOString(), revertida_por: actor, nota_reversion: (nota || "").slice(0, 300) || null }).eq("id", id).is("revertida_at", null);
  if (error) throw error;
  limpiarCaches();
  return { ok: true, aviso: AVISO_MINUTO };
}

// ---------------------------------------------------------------------------
// Roles y fichas
// ---------------------------------------------------------------------------

export async function bibliotecaRoles() {
  const s = createAdminClient();
  const [roles, generales, bases, camps, apl] = await Promise.all([
    s.from("agent_roles" as any).select("id, rubro_id, nombre, objetivo, tono, instrucciones, updated_at").is("archived_at", null).order("updated_at", { ascending: false }),
    s.from("bot_lab_roles_generales" as any).select("id, nombre, objetivo, tono, instrucciones, creado_at").is("archived_at", null).order("creado_at", { ascending: false }),
    s.from("imported_bases" as any).select("id, name, area, agent_role_id").is("archived_at", null).order("created_at", { ascending: false }).limit(300),
    s.from("campaigns" as any).select("id, name, area, status, agent_role_id").is("archived_at", null).order("created_at", { ascending: false }).limit(300),
    s.from("bot_lab_aplicaciones" as any).select("rol_id, tipo, tipo_consulta").is("revertida_at", null).not("rol_id", "is", null),
  ]);
  for (const r of [roles, generales, bases, camps, apl]) if (r.error) throw r.error;
  const rubroDeArea = (area: string) => (Object.entries(AREAS_DEL_RUBRO).find(([, as]) => as.includes(area))?.[0] ?? null) as Rubro | null;
  const listaBases = ((bases.data as any[]) ?? []).map((b) => ({ id: b.id, nombre: b.name, rubro: rubroDeArea(b.area), rol_id: b.agent_role_id }));
  const listaCamps = ((camps.data as any[]) ?? []).map((c) => ({ id: c.id, nombre: c.name, rubro: rubroDeArea(c.area), estado: c.status, rol_id: c.agent_role_id }));
  const aplicaciones = (apl.data as any[]) ?? [];
  return {
    roles: ((roles.data as any[]) ?? []).map((r) => ({
      id: r.id,
      rubro: SLUG_POR_ID[r.rubro_id] ?? null,
      nombre: r.nombre,
      objetivo: r.objetivo,
      tono: r.tono,
      instrucciones: r.instrucciones,
      usos: listaBases.filter((b) => b.rol_id === r.id).length + listaCamps.filter((c) => c.rol_id === r.id).length + aplicaciones.filter((a) => a.rol_id === r.id).length,
    })),
    generales: (generales.data as any[]) ?? [],
    bases: listaBases,
    campanas: listaCamps,
  };
}

export async function fichasDeVersion(version: number, rubro: Rubro) {
  const { data, error } = await createAdminClient()
    .from("bot_knowledge_items" as any)
    .select("clave, capa, rubro, titulo, disparadores, contenido, activo")
    .eq("version", version)
    .or(`rubro.eq.${rubro},rubro.eq.comun,rubro.is.null`)
    .order("capa")
    .order("orden");
  if (error) throw error;
  return (data as any[]) ?? [];
}

/** Rol nuevo en un perfil (fila nueva; no se edita ninguno existente). */
export async function crearRol(rubro: Rubro, pedido: { nombre: unknown; objetivo?: unknown; tono?: unknown; instrucciones: unknown }, actor: string) {
  const rol = await guardarRol(RUBRO_IDS[rubro], AREAS_DEL_RUBRO[rubro][0], { ...pedido, id: null }, "laboratorio");
  await registrar(actor, "laboratorio_rol_nuevo", `agent_roles:${rol.id}`, null, { rubro, nombre: rol.nombre }, "Laboratorio: rol nuevo. No se aplica a nada hasta que se lo aplique a mano.");
  return rol;
}

/** «Editar» un rol desde el laboratorio crea una copia con los cambios: el original queda igual (puede estar en uso). */
export async function editarRolComoCopia(rolId: string, cambios: { nombre: unknown; objetivo?: unknown; tono?: unknown; instrucciones: unknown }, actor: string) {
  const { data: orig } = await createAdminClient().from("agent_roles" as any).select("id, rubro_id, area, nombre").eq("id", rolId).maybeSingle();
  if (!orig) throw new LaboratorioError("El rol no existe.", 404);
  const rubro = SLUG_POR_ID[(orig as any).rubro_id];
  if (!rubro) throw new LaboratorioError("El rol no es de un perfil conocido.");
  const rol = await guardarRol((orig as any).rubro_id, (orig as any).area, { ...cambios, id: null }, "laboratorio");
  await registrar(actor, "laboratorio_rol_copia_editada", `agent_roles:${rol.id}`, { origen: rolId, nombre: (orig as any).nombre }, { nombre: rol.nombre }, "Laboratorio: versión nueva de un rol (copia con cambios). El original no cambia.");
  return rol;
}

/** Copia un rol de un perfil (o un rol general) a otro perfil: fila nueva. */
export async function copiarRol(origen: { rolId?: string | null; generalId?: string | null }, destino: Rubro, actor: string) {
  const s = createAdminClient();
  let r: any = null;
  let de = "";
  if (origen.rolId) {
    const { data } = await s.from("agent_roles" as any).select("id, rubro_id, nombre, objetivo, tono, instrucciones, archived_at").eq("id", origen.rolId).maybeSingle();
    r = data;
    de = SLUG_POR_ID[(data as any)?.rubro_id] ?? "";
  } else if (origen.generalId) {
    const { data } = await s.from("bot_lab_roles_generales" as any).select("id, nombre, objetivo, tono, instrucciones, archived_at").eq("id", origen.generalId).maybeSingle();
    r = data;
    de = "general";
  }
  if (!r || r.archived_at) throw new LaboratorioError("El rol no existe o está archivado.", 404);
  const nombre = de && de !== "general" && de !== destino ? `${r.nombre} (copia)`.slice(0, 80) : r.nombre;
  const nuevo = await guardarRol(RUBRO_IDS[destino], AREAS_DEL_RUBRO[destino][0], { nombre, objetivo: r.objetivo, tono: r.tono, instrucciones: r.instrucciones, id: null }, "laboratorio");
  await registrar(actor, "laboratorio_rol_copiado", `agent_roles:${nuevo.id}`, { origen: r.id, de }, { destino, nombre: nuevo.nombre }, "Laboratorio: rol copiado a otro perfil (fila nueva).");
  return nuevo;
}

export async function crearRolGeneral(pedido: { nombre: unknown; objetivo?: unknown; tono?: unknown; instrucciones: unknown }, actor: string) {
  const v = validarRol(pedido);
  if (!v.ok) throw new LaboratorioError(v.error);
  const { data, error } = await createAdminClient().from("bot_lab_roles_generales" as any).insert({ ...v.rol, creado_por: actor }).select("*").single();
  if (error) throw error;
  await registrar(actor, "laboratorio_rol_general_nuevo", `bot_lab_roles_generales:${(data as any).id}`, null, v.rol, "Laboratorio: rol general nuevo. Para usarlo en un perfil se copia.");
  return data;
}

// ---------------------------------------------------------------------------
// Proveedores (preparado, sin conectar)
// ---------------------------------------------------------------------------

export async function crearProveedor(p: PedidoProveedor, actor: string) {
  const v = validarProveedor(p);
  if (!v.ok) throw new LaboratorioError(v.error);
  const { data, error } = await createAdminClient().from("bot_lab_proveedores" as any).insert({ ...v.proveedor, creado_por: actor }).select("id").single();
  if (error) throw error;
  await registrar(actor, "laboratorio_proveedor_preparado", `bot_lab_proveedores:${(data as any).id}`, null, { nombre: v.proveedor.nombre, endpoint: v.proveedor.endpoint, variable_clave: v.proveedor.variable_clave }, "Laboratorio: proveedor preparado, sin conectar. No se guarda ninguna clave.");
  return { id: (data as any).id };
}

export async function archivarProveedor(id: string, actor: string) {
  const { error } = await createAdminClient().from("bot_lab_proveedores" as any).update({ archived_at: new Date().toISOString(), archived_note: "Archivado desde el laboratorio" }).eq("id", id).is("archived_at", null);
  if (error) throw error;
  await registrar(actor, "laboratorio_proveedor_archivado", `bot_lab_proveedores:${id}`, null, { archived: true }, "Laboratorio: proveedor archivado (no se borra).");
}

// ---------------------------------------------------------------------------
// Pruebas A/B por campaña
// ---------------------------------------------------------------------------

export async function crearPruebaAB(p: { rubro: Rubro; campaignId: unknown; version: unknown; modelo?: unknown; porcentaje?: unknown; dias?: unknown }, actor: string) {
  if (await experimentoEnCurso(true).catch(() => null)) {
    throw new LaboratorioError("Hay una comparación A/B/C general en curso (Biblioteca de agentes). Mientras dure, no se arman pruebas A/B por campaña para no mezclar resultados.");
  }
  const v = validarPruebaAB(p);
  if (!v.ok) throw new LaboratorioError(v.error);
  if (typeof p.campaignId !== "string" || !p.campaignId) throw new LaboratorioError("Elegí la campaña.");
  const s = createAdminClient();
  const { data: camp } = await s.from("campaigns" as any).select("id, area, archived_at").eq("id", p.campaignId).maybeSingle();
  if (!camp || (camp as any).archived_at || !AREAS_DEL_RUBRO[p.rubro].includes((camp as any).area)) throw new LaboratorioError("La campaña no es de este perfil o está archivada.");
  if (!(await versionesExistentes()).includes(v.version)) throw new LaboratorioError("La versión no existe.");
  const cfg = await configVersion(v.version);
  if (cfg?.archived_at) throw new LaboratorioError("La versión está archivada.");
  if (cfg && !cfg.rubros.includes(p.rubro)) throw new LaboratorioError("Esa versión no se creó para este perfil.");
  const { data: asig } = await s.from("bot_knowledge_assignment" as any).select("version").eq("rubro", p.rubro).maybeSingle();
  const control = Number((asig as any)?.version ?? 2);
  if (v.version === control && !v.modelo) throw new LaboratorioError("La prueba tiene que cambiar algo: otra versión u otro modelo.");
  const { data: abiertas } = await s.from("bot_lab_pruebas_ab" as any).select("id, rubro, campaign_id, version, modelo, porcentaje, inicio, fin, cortada_at").eq("campaign_id", p.campaignId).is("cortada_at", null);
  if (pruebaSuperpuesta(((abiertas as any[]) ?? []) as PruebaAB[], p.campaignId, new Date())) throw new LaboratorioError("Esta campaña ya tiene una prueba A/B en curso. Cortala antes de armar otra.");
  const inicio = new Date();
  const fin = new Date(inicio.getTime() + v.dias * 86_400_000);
  const fila = { rubro: p.rubro, campaign_id: p.campaignId, version: v.version, modelo: v.modelo, porcentaje: v.porcentaje, dias: v.dias, inicio: inicio.toISOString(), fin: fin.toISOString(), control_version: control, creada_por: actor };
  const { data, error } = await s.from("bot_lab_pruebas_ab" as any).insert(fila).select("id").single();
  if (error) throw error;
  await registrar(actor, "laboratorio_ab_inicio", `bot_lab_pruebas_ab:${(data as any).id}`, null, fila, "Laboratorio: prueba A/B en una campaña, solo para charlas nuevas. Se corta sola al vencer.");
  limpiarCaches();
  return { id: (data as any).id as string, aviso: AVISO_MINUTO };
}

export async function cortarPruebaAB(id: string, nota: string, actor: string) {
  const s = createAdminClient();
  const { data: p } = await s.from("bot_lab_pruebas_ab" as any).select("id, cortada_at, fin").eq("id", id).maybeSingle();
  if (!p) throw new LaboratorioError("No existe esa prueba.", 404);
  if ((p as any).cortada_at) throw new LaboratorioError("La prueba ya estaba cortada.");
  const ahora = new Date().toISOString();
  const { error } = await s.from("bot_lab_pruebas_ab" as any).update({ cortada_at: ahora, cortada_por: actor, nota_corte: (nota || "").slice(0, 300) || null }).eq("id", id).is("cortada_at", null);
  if (error) throw error;
  await registrar(actor, "laboratorio_ab_corte", `bot_lab_pruebas_ab:${id}`, { cortada_at: null, fin: (p as any).fin }, { cortada_at: ahora }, "Laboratorio: prueba A/B cortada a mano; todas las charlas vuelven a la versión activa.");
  limpiarCaches();
  return { ok: true, aviso: AVISO_MINUTO };
}

// ---------------------------------------------------------------------------
// Comparativas
// ---------------------------------------------------------------------------

function filaNumerica(f: any): FilaEstadistica {
  const n = (x: unknown) => (x == null ? null : Number(x));
  return {
    version: Number(f.version ?? 0),
    conversaciones: Number(f.conversaciones),
    turnos: Number(f.turnos),
    siguieron: Number(f.siguieron),
    captados: Number(f.captados),
    escalados: Number(f.escalados),
    detenidos: Number(f.detenidos),
    retenidos: Number(f.retenidos),
    tokens_promedio: n(f.tokens_promedio),
    latencia_promedio: n(f.latencia_promedio),
  };
}

/** Cifras por versión (v1, v2, v3…) para un perfil o sumando los elegidos, en un período. */
export async function comparativa(rubros: Rubro[], dias: number) {
  const s = createAdminClient();
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - Math.max(1, Math.min(90, dias)) * 86_400_000);
  const [est, asig, pruebas] = await Promise.all([
    s.rpc("conocimiento_estadisticas" as any, { p_desde: desde.toISOString(), p_hasta: hasta.toISOString() }),
    s.from("bot_knowledge_assignment" as any).select("rubro, version"),
    s.from("bot_lab_pruebas_ab" as any).select("id, rubro, campaign_id, version, control_version, modelo, porcentaje, inicio, fin, cortada_at, campaigns(name)").in("rubro", rubros).gte("fin", desde.toISOString()).order("inicio", { ascending: false }).limit(10),
  ]);
  for (const r of [est, asig, pruebas]) if (r.error) throw r.error;
  const ids = new Set(rubros.map((r) => RUBRO_IDS[r]));
  const filas = ((est.data as any[]) ?? []).filter((f) => ids.has(f.rubro_id)).map(filaNumerica);
  const versiones = Array.from(new Set(filas.map((f) => f.version))).sort((a, b) => a - b);
  const vigentes = ((asig.data as any[]) ?? []).filter((a) => rubros.includes(a.rubro)).map((a) => Number(a.version));
  const referencia = vigentes.length ? vigentes[0] : 2;
  const sumaRef = sumar(filas, referencia);
  const porVersion = versiones.map((v) => {
    const suma = sumar(filas, v);
    return { ...tasas(suma), suficiente: datosSuficientes([suma.conversaciones]), veredicto: v === referencia ? null : veredicto(sumaRef, suma) };
  });
  const ab = await Promise.all(
    ((pruebas.data as any[]) ?? []).map(async (p) => {
      const { data, error } = await s.rpc("laboratorio_estadisticas_ab" as any, { p_prueba: p.id });
      if (error) throw error;
      const vs = ((data as any[]) ?? []).map((f) => ({ variante: f.variante as "prueba" | "control", ...tasas(filaNumerica({ ...f, version: f.variante === "prueba" ? p.version : p.control_version ?? 0 })) }));
      const control = vs.find((x) => x.variante === "control");
      const prueba = vs.find((x) => x.variante === "prueba");
      const suficientes = datosSuficientes([control?.conversaciones ?? 0, prueba?.conversaciones ?? 0]);
      return {
        id: p.id,
        rubro: p.rubro,
        campana: p.campaigns?.name ?? "Campaña",
        version: p.version,
        control_version: p.control_version,
        modelo: p.modelo,
        porcentaje: p.porcentaje,
        inicio: p.inicio,
        fin: p.fin,
        cortada_at: p.cortada_at,
        vigente: pruebaVigente(p, new Date()),
        variantes: vs,
        suficientes,
        veredicto: control && prueba ? veredicto(control, prueba) : null,
      };
    })
  );
  return { dias, desde: desde.toISOString(), hasta: hasta.toISOString(), referencia, versiones: porVersion, ab, rubros };
}

// ---------------------------------------------------------------------------
// Pruebas simuladas
// ---------------------------------------------------------------------------

const MAX_CORRIDAS = 16;
const SIMULACION_VENCE_MS = 6 * 60_000;

export async function prepararSimulacion(
  p: { rubros: unknown; version: unknown; modelo?: unknown; casos_propios?: unknown; comparar_con_activa?: unknown },
  actor: string
): Promise<{ id: string; completar: () => Promise<void> }> {
  const rubros = Array.isArray(p.rubros) ? Array.from(new Set(p.rubros.filter(esRubro))) : [];
  if (!rubros.length) throw new LaboratorioError("Elegí al menos un perfil.");
  const version = Number(p.version);
  if (!(await versionesExistentes()).includes(version)) throw new LaboratorioError("Elegí una versión que exista.");
  const modelo = typeof p.modelo === "string" && p.modelo.trim() ? p.modelo.trim() : null;
  if (modelo && !modeloValido(modelo)) throw new LaboratorioError("El modelo no es válido.");
  const cfg = await configVersion(version);
  if (cfg && !rubros.every((r) => cfg.rubros.includes(r))) throw new LaboratorioError("La versión no se creó para todos los perfiles elegidos.");
  const casosPorRubro: { rubro: Rubro; caso: CasoSimulado }[] = [];
  for (const rubro of rubros) {
    let casos = casosDelPerfil(rubro, rubros.length > 1);
    if (typeof p.casos_propios === "string" && p.casos_propios.trim()) {
      const propios = casosEscritos(p.casos_propios, rubro);
      if (!propios.ok) throw new LaboratorioError(propios.error);
      casos = propios.casos;
    }
    for (const caso of casos) casosPorRubro.push({ rubro, caso });
  }
  const comparar = p.comparar_con_activa === true;
  const corridas = casosPorRubro.length * (comparar ? 2 : 1);
  if (corridas > MAX_CORRIDAS) {
    throw new LaboratorioError(`Son ${corridas} charlas simuladas; el máximo por corrida es ${MAX_CORRIDAS}. Elegí menos perfiles, menos casos o sin comparar con la activa.`);
  }
  const pedido = { rubros, version, modelo, comparar_con_activa: comparar, casos: casosPorRubro.map((c) => ({ rubro: c.rubro, id: c.caso.id, titulo: c.caso.titulo })) };
  const s = createAdminClient();
  const { data, error } = await s.from("bot_lab_simulaciones" as any).insert({ creada_por: actor, estado: "procesando", pedido }).select("id").single();
  if (error) throw error;
  const id = (data as any).id as string;

  const completar = async () => {
    try {
      const { data: aplicadas } = await s
        .from("bot_lab_aplicaciones" as any)
        .select("tipo, rubro, tipo_consulta, agent_roles(nombre, objetivo, tono, instrucciones, archived_at)")
        .in("tipo", ["rol_perfil", "rol_tipo_consulta"])
        .is("revertida_at", null);
      const { data: asig } = await s.from("bot_knowledge_assignment" as any).select("rubro, version");
      const activaDe = (r: Rubro) => Number(((asig as any[]) ?? []).find((a) => a.rubro === r)?.version ?? 2);
      // Rol del laboratorio que regiría para alguien que escribe por su cuenta (sin campaña ni base), igual que en vivo.
      const rolLab = (r: Rubro) => {
        const lista = ((aplicadas as any[]) ?? []).filter((a) => a.rubro === r && a.agent_roles && !a.agent_roles.archived_at);
        const a = lista.find((x) => x.tipo === "rol_tipo_consulta" && x.tipo_consulta === "entrante") ?? lista.find((x) => x.tipo === "rol_perfil");
        return a ? bloqueRolLaboratorio({ tipo: a.tipo, rubro: r, tipo_consulta: a.tipo_consulta, rol: a.agent_roles }) : null;
      };
      const tareas: { rubro: Rubro; caso: CasoSimulado; variante: "nueva" | "activa" }[] = casosPorRubro.flatMap((c) => (comparar ? [{ ...c, variante: "nueva" as const }, { ...c, variante: "activa" as const }] : [{ ...c, variante: "nueva" as const }]));
      const resultados: any[] = [];
      const tokens = { entrada: 0, salida: 0 };
      for (let i = 0; i < tareas.length; i += 4) {
        const tanda = await Promise.all(
          tareas.slice(i, i + 4).map(async (t) => {
            const vUsar = t.variante === "nueva" ? version : activaDe(t.rubro);
            const cfgUsar = t.variante === "nueva" ? cfg : await configVersion(vUsar);
            try {
              const r = await probarBotReal({
                area: AREAS_DEL_RUBRO[t.rubro][0] as any,
                rubroId: RUBRO_IDS[t.rubro],
                mensajes: t.caso.mensajes,
                version: vUsar,
                modelo: t.variante === "nueva" ? modelo ?? cfg?.modelo ?? null : cfgUsar?.modelo ?? null,
                extras: cfgUsar ? bloqueDeVersion(cfgUsar) : null,
                rolLaboratorio: rolLab(t.rubro),
              });
              tokens.entrada += r.tokens.entrada;
              tokens.salida += r.tokens.salida;
              return { rubro: t.rubro, caso: t.caso.id, titulo: t.caso.titulo, variante: t.variante, version: r.version, modelo: r.modelo, turnos: r.turnos, evaluacion: evaluarCaso(t.caso, r.turnos) };
            } catch (err) {
              return { rubro: t.rubro, caso: t.caso.id, titulo: t.caso.titulo, variante: t.variante, version: vUsar, error: "No se pudo correr este caso.", detalle: String((err as Error)?.message ?? err).slice(0, 200) };
            }
          })
        );
        resultados.push(...tanda);
      }
      const ok = resultados.filter((r) => r.evaluacion?.ok).length;
      await s.from("bot_lab_simulaciones" as any).update({ estado: "listo", resultado: { resultados, resumen: { total: resultados.length, ok, alertas: resultados.length - ok }, tokens }, terminada_at: new Date().toISOString() }).eq("id", id);
    } catch (err) {
      console.error("[laboratorio] simulación:", err);
      await s.from("bot_lab_simulaciones" as any).update({ estado: "error", error: "No se pudo completar la simulación.", terminada_at: new Date().toISOString() }).eq("id", id);
    }
  };
  return { id, completar };
}

/**
 * Si la función del servidor se cortó por tiempo, la simulación quedaría «procesando» para
 * siempre: pasados unos minutos se muestra como cortada (solo al leer; no se escribe nada).
 */
function simulacionVisible<T extends { estado: string; creada_at: string; error?: string | null }>(s: T, ahora: Date): T {
  if (s.estado === "procesando" && ahora.getTime() - Date.parse(s.creada_at) > SIMULACION_VENCE_MS) {
    return { ...s, estado: "error", error: "La simulación se cortó por tiempo. Probá con menos casos o menos perfiles." };
  }
  return s;
}

export async function leerSimulacion(id: string) {
  const { data, error } = await createAdminClient().from("bot_lab_simulaciones" as any).select("id, creada_at, estado, pedido, resultado, error, terminada_at").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new LaboratorioError("No existe esa simulación.", 404);
  return simulacionVisible(data as any, new Date());
}

export async function listarSimulaciones() {
  const { data, error } = await createAdminClient().from("bot_lab_simulaciones" as any).select("id, creada_at, estado, pedido, terminada_at").order("creada_at", { ascending: false }).limit(10);
  if (error) throw error;
  return ((data as any[]) ?? []).map((s) => simulacionVisible(s, new Date()));
}

export type { TipoConsulta };
