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
 * Nunca envía mensajes ni toca Meta. Lo único que cambia de una campaña o de
 * una base es su rol (agent_role_id), y solo cuando alguien lo aplica a mano
 * desde acá, igual que en Agentes. No lanza, pausa ni reanuda campañas. Nunca
 * escribe `agente_ganador` (el ganador global de la comparación A/B/C).
 * Aplicar, volver atrás y las pruebas A/B corren en funciones de la base de
 * una sola transacción junto con su línea en ops_change_log (0632).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { identificadorModelo } from "@/lib/agentes/modelo";
import { guardarRol } from "@/lib/agentes/roles";
import { validarRol } from "@/lib/agentes/roles-reglas";
import { experimentoEnCurso } from "@/lib/experimento/servicio";
import { limpiarCacheConocimiento } from "@/lib/conocimiento/servicio";
import { sumar, tasas, veredicto, type FilaEstadistica } from "@/lib/conocimiento/estadisticas";
import { probarBotReal } from "@/lib/ai-agent/probar-real";
import { limpiarCacheLaboratorio } from "./en-vivo";
import { modelosDisponibles } from "./modelos";
import { casosDelPerfil, casosEscritos, evaluarCaso, type CasoSimulado } from "./casos";
import {
  AREAS_DEL_RUBRO,
  PREFIJO_VARIABLE_PROVEEDOR,
  RUBROS,
  bloqueDeVersion,
  bloqueRolLaboratorio,
  datosSuficientes,
  diferencias,
  esRubro,
  estadoDesdeFilas,
  estadoVersion,
  modeloPermitido,
  modeloValido,
  pruebaVigente,
  referenciaComun,
  rolDeLaboratorio,
  tipoConsultaValido,
  validarProveedor,
  validarPruebaAB,
  validarVersion,
  type ConfigVersion,
  type PedidoProveedor,
  type PedidoVersion,
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

/** Llama a una función del laboratorio en la base. Sus errores esperables (P0001) traen un texto para mostrar. */
async function rpcLab<T = unknown>(nombre: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await createAdminClient().rpc(nombre as any, args);
  if (error) {
    if ((error as any).code === "P0001" && (error as any).message) throw new LaboratorioError(String((error as any).message).slice(0, 300));
    throw error;
  }
  return data as T;
}

function limpiarCaches() {
  limpiarCacheConocimiento();
  limpiarCacheLaboratorio();
}

async function exigirModelo(modelo: string | null) {
  if (!modelo) return;
  const { modelos } = await modelosDisponibles();
  if (!modeloPermitido(modelo, modelos)) {
    throw new LaboratorioError(`El modelo ${modelo} no figura entre los disponibles para la clave del servidor. Elegí uno de la lista de «Modelos de IA».`);
  }
}

async function sinComparacionGeneral() {
  if (await experimentoEnCurso(true).catch(() => null)) {
    throw new LaboratorioError("Hay una comparación A/B/C general en curso (Biblioteca de agentes). Mientras dure, desde el laboratorio no se aplican versiones ni se arman pruebas A/B, para no mezclar resultados.");
  }
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
    proveedores: ((prov.data as any[]) ?? []).map((p) => ({
      ...p,
      // Solo se mira si existe una variable con el prefijo del laboratorio (nunca su valor ni otras variables).
      configurada: typeof p.variable_clave === "string" && p.variable_clave.startsWith(PREFIJO_VARIABLE_PROVEEDOR) && !!(process.env[p.variable_clave] ?? "").trim(),
      estado: "preparado, sin conectar",
    })),
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

/**
 * Roles que se suman a una versión: se copia su contenido (la versión no cambia
 * si el rol original cambia después). Solo roles de los perfiles de la versión
 * o roles generales.
 */
async function rolesParaCopiar(ids: unknown, rubros: Rubro[]): Promise<{ nombre: string; objetivo: string; tono: string; instrucciones: string; origen_id: string }[]> {
  const lista = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
  if (!lista.length) return [];
  const s = createAdminClient();
  const [delPerfil, generales] = await Promise.all([
    s.from("agent_roles" as any).select("id, rubro_id, nombre, objetivo, tono, instrucciones, archived_at").in("id", lista).in("rubro_id", rubros.map((r) => RUBRO_IDS[r])),
    s.from("bot_lab_roles_generales" as any).select("id, nombre, objetivo, tono, instrucciones, archived_at").in("id", lista),
  ]);
  const todos = [...((delPerfil.data as any[]) ?? []), ...((generales.data as any[]) ?? [])].filter((r) => !r.archived_at);
  if (todos.length !== lista.length) throw new LaboratorioError("Algún rol elegido no es de los perfiles de la versión, no es general o está archivado.");
  return todos.map((r) => ({ nombre: r.nombre, objetivo: r.objetivo ?? "", tono: r.tono ?? "", instrucciones: r.instrucciones, origen_id: r.id }));
}

export async function crearVersion(pedido: PedidoVersion & { roles_ids?: unknown }, actor: string): Promise<{ version: number }> {
  const rubrosPedidos = Array.isArray(pedido.rubros) ? Array.from(new Set(pedido.rubros.filter(esRubro))) : [];
  const roles = await rolesParaCopiar(pedido.roles_ids, rubrosPedidos);
  const v = validarVersion({ ...pedido, roles }, await versionesExistentes());
  if (!v.ok) throw new LaboratorioError(v.error);
  await exigirModelo(v.version.modelo);
  // Si parte de otra versión del laboratorio, esa tiene que cubrir los mismos perfiles (si no, la copia quedaría sin sus fichas).
  const base = await configVersion(v.version.base_version);
  if (base && !v.version.rubros.every((r) => base.rubros.includes(r))) {
    throw new LaboratorioError(`v${v.version.base_version} no se creó para todos los perfiles elegidos. Elegí otra versión de origen o menos perfiles.`);
  }
  const data = await rpcLab<number>("laboratorio_crear_version", {
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
  return { version: Number(data) };
}

/** ¿La versión responde charlas o podría volver a responder con «Volver a lo anterior»? */
async function versionComprometida(version: number): Promise<string | null> {
  const s = createAdminClient();
  const [asig, pruebas, apl] = await Promise.all([
    s.from("bot_knowledge_assignment" as any).select("version, comparar_con"),
    s.from("bot_lab_pruebas_ab" as any).select("version, inicio, fin, cortada_at").eq("version", version).is("cortada_at", null),
    s.from("bot_lab_aplicaciones" as any).select("antes").eq("tipo", "version_perfil").is("revertida_at", null),
  ]);
  if (((asig.data as any[]) ?? []).some((a) => a.version === version || a.comparar_con === version)) return "Esta versión rige en algún perfil.";
  if (((pruebas.data as any[]) ?? []).some((p) => pruebaVigente(p, new Date()))) return "Esta versión está en una prueba A/B en curso.";
  if (((apl.data as any[]) ?? []).some((a) => Number(a.antes?.version) === version || Number(a.antes?.comparar_con) === version)) {
    return "Esta versión es la que volvería con «Volver a lo anterior» en una aplicación vigente.";
  }
  return null;
}

/** Cambia el modelo de una versión del laboratorio que todavía no rige en ningún lado. */
export async function cambiarModeloVersion(version: number, modelo: string | null, actor: string) {
  const cfg = await configVersion(version);
  if (!cfg) throw new LaboratorioError("Solo se puede elegir el modelo de una versión creada en el laboratorio (v3 en adelante).");
  if (cfg.archived_at) throw new LaboratorioError("La versión está archivada.");
  if (modelo && !modeloValido(modelo)) throw new LaboratorioError("El modelo no es válido.");
  await exigirModelo(modelo);
  const motivo = await versionComprometida(version);
  if (motivo) throw new LaboratorioError(`${motivo} Para usar otro modelo, creá una versión nueva o una prueba A/B con ese modelo.`);
  const { error } = await createAdminClient().from("bot_lab_versiones" as any).update({ modelo: modelo || null }).eq("version", version);
  if (error) throw error;
  await registrar(actor, "laboratorio_modelo_version", `bot_lab_versiones:v${version}`, { modelo: cfg.modelo }, { modelo: modelo || null }, "Laboratorio: modelo de una versión que todavía no rige.");
  limpiarCaches();
}

export async function archivarVersion(version: number, nota: string, actor: string) {
  const cfg = await configVersion(version);
  if (!cfg) throw new LaboratorioError("Solo se archivan versiones creadas en el laboratorio.");
  const motivo = await versionComprometida(version);
  if (motivo) throw new LaboratorioError(`${motivo} Volvé atrás la aplicación o cortá la prueba antes de archivarla.`);
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
// Aplicaciones manuales y vuelta atrás (funciones de la base, una transacción)
// ---------------------------------------------------------------------------

export async function aplicarVersionAPerfil(rubro: Rubro, version: number, actor: string) {
  await sinComparacionGeneral();
  const { data: abiertas } = await createAdminClient().from("bot_lab_pruebas_ab" as any).select("inicio, fin, cortada_at").eq("rubro", rubro).is("cortada_at", null);
  if (((abiertas as any[]) ?? []).some((p) => pruebaVigente(p, new Date()))) {
    throw new LaboratorioError("Este perfil tiene una prueba A/B en curso. Cortala o esperá a que termine antes de cambiar la versión de todo el perfil: si no, la comparación deja de ser justa.");
  }
  const id = await rpcLab<string>("laboratorio_aplicar_version", { p_rubro: rubro, p_version: version, p_actor: actor });
  limpiarCaches();
  return { id, aviso: AVISO_MINUTO };
}

export async function aplicarRol(
  p: { tipo: "rol_perfil" | "rol_tipo_consulta" | "rol_base" | "rol_campana"; rubro: Rubro; rolId: string | null; tipoConsulta?: unknown; baseId?: string | null; campaignId?: string | null },
  actor: string
) {
  if (p.tipo === "rol_tipo_consulta" && !tipoConsultaValido(p.rubro, p.tipoConsulta)) throw new LaboratorioError("Elegí un tipo de consulta válido para este perfil.");
  if (p.tipo === "rol_base" && !p.baseId) throw new LaboratorioError("Elegí la base.");
  if (p.tipo === "rol_campana" && !p.campaignId) throw new LaboratorioError("Elegí la campaña.");
  const id = await rpcLab<string>("laboratorio_aplicar_rol", {
    p_tipo: p.tipo,
    p_rubro: p.rubro,
    p_rubro_id: RUBRO_IDS[p.rubro],
    p_areas: AREAS_DEL_RUBRO[p.rubro],
    p_rol: p.rolId,
    p_tipo_consulta: p.tipo === "rol_tipo_consulta" ? p.tipoConsulta : null,
    p_base: p.tipo === "rol_base" ? p.baseId : null,
    p_campana: p.tipo === "rol_campana" ? p.campaignId : null,
    p_actor: actor,
  });
  limpiarCaches();
  return { id, aviso: AVISO_MINUTO };
}

/** Vuelve a lo que había antes de una aplicación. Si después alguien lo cambió a mano, explica por qué no lo pisa. */
export async function revertirAplicacion(id: string, nota: string, actor: string) {
  const { data: a } = await createAdminClient().from("bot_lab_aplicaciones" as any).select("rubro").eq("id", id).maybeSingle();
  const rubro = (a as any)?.rubro;
  if (!esRubro(rubro)) throw new LaboratorioError("No existe esa aplicación.", 404);
  await rpcLab("laboratorio_revertir", { p_id: id, p_rubro_id: RUBRO_IDS[rubro], p_areas: AREAS_DEL_RUBRO[rubro], p_actor: actor, p_nota: nota });
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
  if (!SLUG_POR_ID[(orig as any).rubro_id]) throw new LaboratorioError("El rol no es de un perfil conocido.");
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
  await sinComparacionGeneral();
  const v = validarPruebaAB(p);
  if (!v.ok) throw new LaboratorioError(v.error);
  if (typeof p.campaignId !== "string" || !p.campaignId) throw new LaboratorioError("Elegí la campaña.");
  if (!(await versionesExistentes()).includes(v.version)) throw new LaboratorioError("La versión no existe.");
  await exigirModelo(v.modelo);
  // Candado por campaña, versión archivada, perfil y «tiene que cambiar algo» se comprueban en la base, en la misma transacción.
  const id = await rpcLab<string>("laboratorio_crear_ab", {
    p_rubro: p.rubro,
    p_campana: p.campaignId,
    p_areas: AREAS_DEL_RUBRO[p.rubro],
    p_version: v.version,
    p_modelo: v.modelo ?? "",
    p_porcentaje: v.porcentaje,
    p_dias: v.dias,
    p_actor: actor,
  });
  limpiarCaches();
  return { id, aviso: AVISO_MINUTO };
}

export async function cortarPruebaAB(id: string, nota: string, actor: string) {
  await rpcLab("laboratorio_cortar_ab", { p_id: id, p_actor: actor, p_nota: nota });
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

/** Versión más usada por variante, según lo que quedó registrado en cada charla. */
function versionPorVariante(filas: { variante: string; version: number | null }[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const v of ["prueba", "control"]) {
    const cuenta = new Map<number, number>();
    for (const f of filas) if (f.variante === v && f.version != null) cuenta.set(Number(f.version), (cuenta.get(Number(f.version)) ?? 0) + 1);
    out[v] = cuenta.size ? Array.from(cuenta.entries()).sort((a, b) => b[1] - a[1])[0][0] : null;
  }
  return out;
}

/** Cifras por versión (v1, v2, v3…) para un perfil o sumando los elegidos, en un período. */
export async function comparativa(rubros: Rubro[], dias: number) {
  const s = createAdminClient();
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - Math.max(1, Math.min(90, dias)) * 86_400_000);
  const [est, asig, pruebas] = await Promise.all([
    s.rpc("conocimiento_estadisticas" as any, { p_desde: desde.toISOString(), p_hasta: hasta.toISOString() }),
    s.from("bot_knowledge_assignment" as any).select("rubro, version, comparar_con"),
    s.from("bot_lab_pruebas_ab" as any).select("id, rubro, campaign_id, version, control_version, modelo, porcentaje, inicio, fin, cortada_at, campaigns(name)").in("rubro", rubros).gte("fin", desde.toISOString()).order("inicio", { ascending: false }).limit(10),
  ]);
  for (const r of [est, asig, pruebas]) if (r.error) throw r.error;
  const ids = new Set(rubros.map((r) => RUBRO_IDS[r]));
  const filas = ((est.data as any[]) ?? []).filter((f) => ids.has(f.rubro_id)).map(filaNumerica);
  const versiones = Array.from(new Set(filas.map((f) => f.version))).sort((a, b) => a - b);
  // Con varios perfiles que tienen versiones activas distintas no hay una referencia común para comparar.
  const referencia = referenciaComun(rubros, ((asig.data as any[]) ?? []) as { rubro: Rubro; version: number }[]);
  const sumaRef = referencia == null ? null : sumar(filas, referencia);
  const porVersion = versiones.map((v) => {
    const suma = sumar(filas, v);
    return { ...tasas(suma), suficiente: datosSuficientes([suma.conversaciones]), veredicto: sumaRef && v !== referencia ? veredicto(sumaRef, suma) : null };
  });
  const listaPruebas = (pruebas.data as any[]) ?? [];
  const { data: asignadas } = listaPruebas.length
    ? await s.from("bot_lab_ab_asignaciones" as any).select("prueba_id, variante, version").in("prueba_id", listaPruebas.map((p) => p.id)).limit(5000)
    : { data: [] as any[] };
  const ab = await Promise.all(
    listaPruebas.map(async (p) => {
      const { data, error } = await s.rpc("laboratorio_estadisticas_ab" as any, { p_prueba: p.id });
      if (error) throw error;
      // La versión de cada variante sale de lo registrado en las charlas (la de control puede cambiar si cambia la versión activa).
      const reales = versionPorVariante(((asignadas as any[]) ?? []).filter((a) => a.prueba_id === p.id));
      const vs = ((data as any[]) ?? []).map((f) => {
        const t = tasas(filaNumerica({ ...f, version: f.variante === "prueba" ? reales.prueba ?? p.version : reales.control ?? p.control_version ?? 0 }));
        return { variante: f.variante as "prueba" | "control", ...t, suficiente: datosSuficientes([t.conversaciones]) };
      });
      const control = vs.find((x) => x.variante === "control");
      const prueba = vs.find((x) => x.variante === "prueba");
      const suficientes = datosSuficientes([control?.conversaciones ?? 0, prueba?.conversaciones ?? 0]);
      return {
        id: p.id,
        rubro: p.rubro,
        campana: p.campaigns?.name ?? "Campaña",
        version: reales.prueba ?? p.version,
        control_version: reales.control ?? p.control_version,
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
/** Tiempo por llamada a Gemini y presupuesto total (la función del servidor corta a los 300 s). */
const TIEMPO_POR_LLAMADA_MS = 25_000;
const PRESUPUESTO_TOTAL_MS = 240_000;
/** Corridas por día (configurable con LABORATORIO_SIMULACIONES_POR_DIA). */
export function simulacionesPorDia(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.LABORATORIO_SIMULACIONES_POR_DIA);
  return Number.isInteger(n) && n > 0 && n <= 200 ? n : 20;
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

export async function prepararSimulacion(
  p: { rubros: unknown; version: unknown; modelo?: unknown; casos_propios?: unknown; comparar_con_activa?: unknown },
  actor: string
): Promise<{ id: string; completar: () => Promise<void> }> {
  const s = createAdminClient();
  const ahora = Date.now();
  const [enCurso, delDia] = await Promise.all([
    s.from("bot_lab_simulaciones" as any).select("id").eq("estado", "procesando").gte("creada_at", new Date(ahora - SIMULACION_VENCE_MS).toISOString()).limit(1),
    s.from("bot_lab_simulaciones" as any).select("id", { count: "exact", head: true }).gte("creada_at", new Date(ahora - 86_400_000).toISOString()),
  ]);
  if (enCurso.error) throw enCurso.error;
  if (((enCurso.data as any[]) ?? []).length) throw new LaboratorioError("Ya hay una prueba simulada corriendo. Esperá a que termine (unos minutos) antes de lanzar otra.", 409);
  const tope = simulacionesPorDia();
  if ((delDia.count ?? 0) >= tope) throw new LaboratorioError(`Ya se corrieron ${tope} pruebas simuladas en las últimas 24 horas (es el tope diario, porque cada una usa la IA). Probá más tarde.`, 429);

  const rubros = Array.isArray(p.rubros) ? Array.from(new Set(p.rubros.filter(esRubro))) : [];
  if (!rubros.length) throw new LaboratorioError("Elegí al menos un perfil.");
  const version = Number(p.version);
  if (!(await versionesExistentes()).includes(version)) throw new LaboratorioError("Elegí una versión que exista.");
  const modelo = typeof p.modelo === "string" && p.modelo.trim() ? p.modelo.trim() : null;
  if (modelo && !modeloValido(modelo)) throw new LaboratorioError("El modelo no es válido.");
  await exigirModelo(modelo);
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
    throw new LaboratorioError(`Son ${corridas} charlas simuladas; el máximo por corrida es ${MAX_CORRIDAS}. Elegí menos perfiles, menos casos o no compares con la versión activa.`);
  }
  const pedido = { rubros, version, modelo, comparar_con_activa: comparar, casos: casosPorRubro.map((c) => ({ rubro: c.rubro, id: c.caso.id, titulo: c.caso.titulo })) };
  const { data, error } = await s.from("bot_lab_simulaciones" as any).insert({ creada_por: actor, estado: "procesando", pedido }).select("id").single();
  if (error) throw error;
  const id = (data as any).id as string;
  await registrar(actor, "laboratorio_simulacion", `bot_lab_simulaciones:${id}`, null, pedido, "Laboratorio: prueba simulada con casos inventados. No le escribe a nadie; usa la IA.");

  const completar = async () => {
    const t0 = Date.now();
    try {
      const { data: aplicadas } = await s
        .from("bot_lab_aplicaciones" as any)
        .select("tipo, rubro, tipo_consulta, agent_roles(nombre, objetivo, tono, instrucciones, archived_at)")
        .in("tipo", ["rol_perfil", "rol_tipo_consulta"])
        .is("revertida_at", null)
        .order("aplicada_at")
        .order("id");
      const estado = estadoDesdeFilas({ pruebas: null, versiones: null, nombres: null, aplicaciones: (aplicadas as any[]) ?? [] });
      const { data: asig } = await s.from("bot_knowledge_assignment" as any).select("rubro, version");
      const activaDe = (r: Rubro) => Number(((asig as any[]) ?? []).find((a) => a.rubro === r)?.version ?? 2);
      // El mismo rol del laboratorio que regiría en vivo para alguien que escribe por su cuenta en el área principal del perfil.
      const rolLab = (r: Rubro) => {
        const a = rolDeLaboratorio(estado.aplicaciones, { rubro: r, area: AREAS_DEL_RUBRO[r][0], modo: "entrante" });
        return a ? bloqueRolLaboratorio(a) : null;
      };
      const tareas: { rubro: Rubro; caso: CasoSimulado; variante: "nueva" | "activa" }[] = casosPorRubro.flatMap((c) => (comparar ? [{ ...c, variante: "nueva" as const }, { ...c, variante: "activa" as const }] : [{ ...c, variante: "nueva" as const }]));
      const resultados: any[] = [];
      const tokens = { entrada: 0, salida: 0 };
      const guardar = async (estadoFinal: "procesando" | "listo") => {
        const ok = resultados.filter((r) => r.evaluacion?.ok).length;
        await s
          .from("bot_lab_simulaciones" as any)
          .update({ estado: estadoFinal, resultado: { resultados, resumen: { total: resultados.length, ok, alertas: resultados.length - ok, pendientes: tareas.length - resultados.length }, tokens }, ...(estadoFinal === "listo" ? { terminada_at: new Date().toISOString() } : {}) })
          .eq("id", id);
      };
      for (let i = 0; i < tareas.length; i += 4) {
        if (Date.now() - t0 > PRESUPUESTO_TOTAL_MS) {
          for (const t of tareas.slice(i)) resultados.push({ rubro: t.rubro, caso: t.caso.id, titulo: t.caso.titulo, variante: t.variante, error: "No se corrió: se terminó el tiempo de la corrida." });
          break;
        }
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
                timeoutMs: TIEMPO_POR_LLAMADA_MS,
              });
              tokens.entrada += r.tokens.entrada;
              tokens.salida += r.tokens.salida;
              return { rubro: t.rubro, caso: t.caso.id, titulo: t.caso.titulo, variante: t.variante, version: r.version, modelo: r.modelo, turnos: r.turnos, evaluacion: evaluarCaso(t.caso, r.turnos) };
            } catch (err) {
              // El detalle queda solo en el registro del servidor; en pantalla, un texto genérico.
              console.error("[laboratorio] caso simulado:", (err as Error)?.message ?? err);
              return { rubro: t.rubro, caso: t.caso.id, titulo: t.caso.titulo, variante: t.variante, version: vUsar, error: "No se pudo correr este caso (la IA no respondió a tiempo o falló)." };
            }
          })
        );
        resultados.push(...tanda);
        // Avance guardado tanda por tanda: si la función se corta, lo hecho no se pierde.
        await guardar("procesando");
      }
      await guardar("listo");
    } catch (err) {
      console.error("[laboratorio] simulación:", err);
      await s.from("bot_lab_simulaciones" as any).update({ estado: "error", error: "No se pudo completar la simulación.", terminada_at: new Date().toISOString() }).eq("id", id);
    }
  };
  return { id, completar };
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
