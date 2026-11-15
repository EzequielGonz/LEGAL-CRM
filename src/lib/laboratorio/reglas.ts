/**
 * Laboratorio del bot (15/11). Reglas puras: sin base, sin red, sin fecha
 * implícita (la hora entra como parámetro).
 *
 * Regla central de la responsable: nada de lo que hoy rige cambia. Una
 * versión del laboratorio es una COPIA (v3, v4…) de la que rige, con sus
 * fichas, tono, reglas, roles y modelo propios. Solo responde charlas reales
 * si alguien la aplica a mano (todo el perfil, un rol puntual o una prueba
 * A/B en una campaña), y cada aplicación se puede deshacer.
 *
 * Precedencia dentro de una charla real:
 *   - La prueba A/B de la campaña decide VERSIÓN y MODELO (solo para charlas
 *     de esa campaña cuyo envío es posterior al inicio de la prueba).
 *   - Los roles no dependen del A/B: rol de la campaña > rol de la base >
 *     rol por tipo de consulta del laboratorio > rol de todo el perfil del
 *     laboratorio. Los dos primeros los resuelve el bot como siempre
 *     (src/lib/agentes/roles.ts); los del laboratorio entran solo si la charla
 *     no tiene rol de campaña ni de base.
 *   - Dentro del tipo de consulta, el área (civil, penal) gana sobre el modo
 *     (viene de campaña / escribió por su cuenta); a igual tipo, el más viejo.
 *   - Si la versión en prueba trae roles copiados y la campaña tiene su rol,
 *     los dos se suman y el rol de la campaña va último (como hoy), así que
 *     ante un choque manda el de la campaña.
 *
 * Sin nada del laboratorio aplicado, el pedido al modelo es idéntico al de
 * hoy (mismo texto de instrucciones, misma versión de conocimiento, mismo
 * modelo): lo comprueba tests/unitarias/laboratorio-bot.test.ts.
 */

export type Rubro = "juridico" | "agencia_0km" | "coberturas_medicas" | "marketing";
export const RUBROS: Rubro[] = ["juridico", "agencia_0km", "coberturas_medicas", "marketing"];
export const AREAS_DEL_RUBRO: Record<Rubro, string[]> = {
  juridico: ["civil", "penal"],
  agencia_0km: ["agencia_0km"],
  coberturas_medicas: ["coberturas_medicas"],
  marketing: ["marketing"],
};

/** Tipo de consulta al que se puede aplicar un rol. civil y penal, solo en Jurídico. */
export type TipoConsulta = "entrante" | "campana" | "civil" | "penal";
export const TIPOS_CONSULTA: Record<TipoConsulta, string> = {
  entrante: "Escribió por su cuenta (redes, web, publicidad)",
  campana: "Viene de una base o campaña",
  civil: "Consultas civiles",
  penal: "Consultas penales",
};

export function esRubro(v: unknown): v is Rubro {
  return typeof v === "string" && (RUBROS as string[]).includes(v);
}

export function tipoConsultaValido(rubro: Rubro, tipo: unknown): tipo is TipoConsulta {
  if (tipo === "entrante" || tipo === "campana") return true;
  return rubro === "juridico" && (tipo === "civil" || tipo === "penal");
}

// ---------------------------------------------------------------------------
// Modelos y proveedores
// ---------------------------------------------------------------------------

/** Identificador de un modelo de Gemini (único proveedor con llamadas implementadas). */
export function modeloValido(id: unknown): id is string {
  return typeof id === "string" && /^gemini-[a-z0-9][a-z0-9.\-]{0,60}$/.test(id.trim());
}

/** Normaliza el nombre que devuelve la API («models/gemini-…») al identificador que se usa al pedir. */
export function idDeModelo(nombre: string): string {
  return nombre.replace(/^models\//, "").trim();
}

/**
 * Lista de modelos para elegir: los que informa la API (si respondió), si no
 * la lista configurable (variable LABORATORIO_MODELOS, separados por coma), y
 * siempre el que usa hoy el servidor. Sin repetir, el del servidor primero.
 */
export function listaDeModelos(input: { deLaApi: string[] | null; configurables: string | undefined; delServidor: string }): { modelos: string[]; origen: "api" | "configuracion" } {
  const delaApi = (input.deLaApi ?? []).map(idDeModelo).filter(modeloValido);
  const conf = (input.configurables ?? "").split(",").map((x) => x.trim()).filter(modeloValido);
  const origen = delaApi.length ? "api" : "configuracion";
  const base = delaApi.length ? delaApi : conf;
  const modelos = Array.from(new Set([input.delServidor, ...base].filter(modeloValido)));
  return { modelos, origen };
}

/**
 * Las variables de los proveedores preparados empiezan con este prefijo: así
 * el panel solo puede preguntar por variables propias del laboratorio y no
 * sirve para averiguar qué otras variables existen en el servidor.
 */
export const PREFIJO_VARIABLE_PROVEEDOR = "LAB_PROVEEDOR_";

/** ¿El modelo está entre los disponibles para la clave del servidor? (un nombre inexistente dejaría sin respuesta al perfil). Pura. */
export function modeloPermitido(modelo: string | null, disponibles: string[]): boolean {
  return !modelo || (modeloValido(modelo) && disponibles.includes(modelo));
}

/** ¿El error de Gemini es «ese modelo no existe»? (404 / NOT_FOUND). Pura. */
export function esModeloNoEncontrado(err: unknown): boolean {
  const e = err as { status?: unknown; code?: unknown; message?: unknown } | null;
  if (!e) return false;
  if (e.status === 404 || e.code === 404) return true;
  return /\bNOT_FOUND\b|\b404\b|model[^.]{0,80}not found|is not found for api version/i.test(String(e.message ?? ""));
}

export interface PedidoProveedor {
  nombre: unknown;
  endpoint: unknown;
  variable_clave: unknown;
  notas?: unknown;
}

/**
 * Proveedor externo preparado para más adelante: solo nombre, dirección y el
 * NOMBRE de la variable de entorno donde estaría la clave. Nunca la clave.
 */
export function validarProveedor(p: PedidoProveedor): { ok: true; proveedor: { nombre: string; endpoint: string; variable_clave: string; notas: string } } | { ok: false; error: string } {
  const nombre = String(p.nombre ?? "").trim().slice(0, 60);
  const endpoint = String(p.endpoint ?? "").trim();
  const variable = String(p.variable_clave ?? "").trim();
  const notas = String(p.notas ?? "").trim().slice(0, 500);
  if (nombre.length < 2) return { ok: false, error: "Poné el nombre del proveedor." };
  let url: URL | null = null;
  try {
    url = new URL(endpoint);
  } catch {
    url = null;
  }
  if (!url || url.protocol !== "https:" || endpoint.length > 300) return { ok: false, error: "La dirección tiene que empezar con https:// (máximo 300 caracteres)." };
  if (url.username || url.password || url.search) return { ok: false, error: "La dirección no puede llevar usuario, contraseña ni parámetros: la clave va en una variable de entorno." };
  if (!new RegExp(`^${PREFIJO_VARIABLE_PROVEEDOR}[A-Z0-9_]{2,50}$`).test(variable)) {
    return { ok: false, error: `Escribí solo el nombre de la variable de entorno: tiene que empezar con ${PREFIJO_VARIABLE_PROVEEDOR} (por ejemplo ${PREFIJO_VARIABLE_PROVEEDOR}OTRO_API_KEY), con mayúsculas, números y guion bajo. Nunca la clave.` };
  }
  if (pareceSecreto(notas)) return { ok: false, error: "Las notas parecen tener una clave. No la pegues acá: va en la variable de entorno del servidor." };
  return { ok: true, proveedor: { nombre, endpoint, variable_clave: variable, notas } };
}

/** ¿El texto parece una clave pegada? (cadena larga sin espacios con letras y números). */
export function pareceSecreto(t: string): boolean {
  return /\b(?=[A-Za-z0-9_\-]*\d)(?=[A-Za-z0-9_\-]*[A-Za-z])[A-Za-z0-9_\-]{28,}\b/.test(t);
}

// ---------------------------------------------------------------------------
// Versiones
// ---------------------------------------------------------------------------

export interface RolCopiado {
  nombre: string;
  objetivo: string;
  tono: string;
  instrucciones: string;
  /** De qué rol salió la copia (solo referencia; la versión no cambia si el rol original cambia). */
  origen_id: string | null;
}

export interface FichaNueva {
  capa: "tema" | "objecion";
  rubro: Rubro | "comun";
  titulo: string;
  disparadores: string[];
  contenido: string;
}

export interface ConfigVersion {
  version: number;
  nombre: string;
  base_version: number;
  rubros: Rubro[];
  modelo: string | null;
  tono: string;
  reglas: string;
  roles: RolCopiado[];
  archived_at: string | null;
}

export interface PedidoVersion {
  nombre: unknown;
  descripcion?: unknown;
  base_version: unknown;
  rubros: unknown;
  modelo?: unknown;
  tono?: unknown;
  reglas?: unknown;
  roles?: unknown;
  fichas?: unknown;
}

const conDatosPersonales = (t: string) => /\b\d{7,}\b/.test(t) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(t);

function limpiarTexto(v: unknown, max: number): string {
  return String(v ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim().slice(0, max);
}

function normalizarDisparadores(v: unknown): string[] {
  const lista = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return Array.from(
    new Set(
      lista
        .filter((d): d is string => typeof d === "string")
        .map((d) => d.toLowerCase().replace(/\s+/g, " ").trim())
        .filter((d) => d.length >= 2 && d.length <= 60)
    )
  ).slice(0, 40);
}

/** Valida una versión nueva del laboratorio. Pura. */
export function validarVersion(
  p: PedidoVersion,
  versionesExistentes: number[]
): { ok: true; version: { nombre: string; descripcion: string; base_version: number; rubros: Rubro[]; modelo: string | null; tono: string; reglas: string; roles: RolCopiado[]; fichas: FichaNueva[] } } | { ok: false; error: string } {
  const nombre = limpiarTexto(p.nombre, 70);
  if (nombre.length < 2) return { ok: false, error: "Poné un nombre para la versión (por ejemplo «Más breve y cálida»)." };
  const base = Number(p.base_version);
  if (!Number.isInteger(base) || !versionesExistentes.includes(base)) return { ok: false, error: "Elegí de qué versión parte la copia." };
  const rubros = Array.isArray(p.rubros) ? Array.from(new Set(p.rubros.filter(esRubro))) : [];
  if (!rubros.length) return { ok: false, error: "Elegí al menos un perfil para la versión." };
  const modeloTxt = typeof p.modelo === "string" ? p.modelo.trim() : "";
  if (modeloTxt && !modeloValido(modeloTxt)) return { ok: false, error: "El modelo no es válido. Elegilo de la lista de modelos de Gemini." };
  const tono = limpiarTexto(p.tono, 1500);
  const reglas = limpiarTexto(p.reglas, 4000);
  const descripcion = limpiarTexto(p.descripcion, 900);
  if ([tono, reglas, descripcion].some(conDatosPersonales)) return { ok: false, error: "El tono, las reglas y la descripción no pueden tener teléfonos ni correos de personas." };
  const roles: RolCopiado[] = [];
  for (const r of Array.isArray(p.roles) ? p.roles.slice(0, 5) : []) {
    const rol = r as Record<string, unknown>;
    const n = limpiarTexto(rol?.nombre, 80);
    const ins = limpiarTexto(rol?.instrucciones, 6000);
    if (n.length < 2 || ins.length < 10) return { ok: false, error: "Cada rol sumado tiene que tener nombre e instrucciones." };
    roles.push({ nombre: n, objetivo: limpiarTexto(rol?.objetivo, 500), tono: limpiarTexto(rol?.tono, 300), instrucciones: ins, origen_id: typeof rol?.origen_id === "string" ? rol.origen_id : null });
  }
  if (roles.some((r) => conDatosPersonales(r.instrucciones))) return { ok: false, error: "Los roles no pueden tener teléfonos ni correos de personas." };
  const fichas: FichaNueva[] = [];
  for (const f of Array.isArray(p.fichas) ? p.fichas.slice(0, 30) : []) {
    const x = f as Record<string, unknown>;
    const capa = x?.capa === "tema" ? "tema" : "objecion";
    const rubro = x?.rubro === "comun" ? "comun" : esRubro(x?.rubro) ? x.rubro : null;
    if (!rubro || (rubro !== "comun" && !rubros.includes(rubro))) return { ok: false, error: "Cada ficha nueva tiene que ser de un perfil de la versión (o común a todos)." };
    const titulo = limpiarTexto(x?.titulo, 160);
    const contenido = limpiarTexto(x?.contenido, 4000);
    const disparadores = normalizarDisparadores(x?.disparadores);
    if (titulo.length < 2 || contenido.length < 10) return { ok: false, error: "Cada ficha nueva necesita título y un texto de al menos 10 caracteres." };
    if (!disparadores.length) return { ok: false, error: `La ficha «${titulo}» necesita al menos una frase que la active.` };
    if (conDatosPersonales(contenido)) return { ok: false, error: "Las fichas no pueden tener teléfonos ni correos de personas." };
    fichas.push({ capa, rubro, titulo, disparadores, contenido });
  }
  if (!modeloTxt && !tono && !reglas && !roles.length && !fichas.length) {
    return { ok: false, error: "La versión nueva tiene que sumar algo: fichas, tono, reglas, un rol o un modelo distinto." };
  }
  return { ok: true, version: { nombre, descripcion, base_version: base, rubros, modelo: modeloTxt || null, tono, reglas, roles, fichas } };
}

export type EstadoVersion = "borrador" | "en_prueba" | "activa" | "archivada";
export const ETIQUETA_ESTADO: Record<EstadoVersion, string> = { borrador: "Borrador", en_prueba: "En prueba", activa: "Activa", archivada: "Archivada" };

/** Insignia de una versión según dónde se usa. Pura. */
export function estadoVersion(
  version: number,
  input: { archivada: boolean; asignaciones: { version: number; comparar_con: number | null }[]; pruebasVigentes: { version: number }[] }
): EstadoVersion {
  if (input.archivada) return "archivada";
  if (input.asignaciones.some((a) => a.version === version || a.comparar_con === version)) return "activa";
  if (input.pruebasVigentes.some((p) => p.version === version)) return "en_prueba";
  return "borrador";
}

/** Bloque de instrucciones propio de una versión del laboratorio (tono, reglas y roles copiados). Pura. */
export function bloqueDeVersion(cfg: Pick<ConfigVersion, "version" | "nombre" | "tono" | "reglas" | "roles">): string {
  const partes: string[] = [];
  if (cfg.tono) partes.push(`Tono: ${cfg.tono}`);
  if (cfg.reglas) partes.push(`Reglas de esta versión:\n${cfg.reglas}`);
  for (const r of cfg.roles) {
    partes.push([`Rol sumado: ${r.nombre}.`, r.objetivo ? `Objetivo: ${r.objetivo}` : "", r.tono ? `Tono del rol: ${r.tono}` : "", r.instrucciones].filter(Boolean).join("\n"));
  }
  if (!partes.length) return "";
  return [
    `AJUSTES DE LA VERSIÓN v${cfg.version} («${cfg.nombre}»), elegidos por la responsable. Se SUMAN a tu guion: si algo choca con las reglas del sistema, la ficha del negocio o las reglas estrictas, mandan ellas.`,
    ...partes,
  ].join("\n\n");
}

export interface ItemComparable {
  clave: string;
  titulo: string;
  contenido: string;
  activo: boolean;
}

/** Diferencias entre la versión que rige y la que se quiere aplicar (se muestran antes de confirmar). Pura. */
export function diferencias(
  actual: { version: number; items: ItemComparable[]; cfg: Pick<ConfigVersion, "modelo" | "tono" | "reglas" | "roles"> | null; modeloServidor: string },
  nueva: { version: number; items: ItemComparable[]; cfg: Pick<ConfigVersion, "modelo" | "tono" | "reglas" | "roles"> | null }
): { fichasNuevas: string[]; fichasQuitadas: string[]; fichasCambiadas: string[]; modelo: { antes: string; despues: string } | null; tono: boolean; reglas: boolean; roles: { antes: string[]; despues: string[] } | null } {
  const mapa = (l: ItemComparable[]) => new Map(l.filter((i) => i.activo).map((i) => [i.clave, i]));
  const a = mapa(actual.items);
  const b = mapa(nueva.items);
  const fichasNuevas = Array.from(b.values()).filter((i) => !a.has(i.clave)).map((i) => i.titulo);
  const fichasQuitadas = Array.from(a.values()).filter((i) => !b.has(i.clave)).map((i) => i.titulo);
  const fichasCambiadas = Array.from(b.values()).filter((i) => a.has(i.clave) && (a.get(i.clave)!.contenido !== i.contenido || a.get(i.clave)!.titulo !== i.titulo)).map((i) => i.titulo);
  const mAntes = actual.cfg?.modelo ?? actual.modeloServidor;
  const mDespues = nueva.cfg?.modelo ?? actual.modeloServidor;
  const rAntes = (actual.cfg?.roles ?? []).map((r) => r.nombre);
  const rDespues = (nueva.cfg?.roles ?? []).map((r) => r.nombre);
  return {
    fichasNuevas,
    fichasQuitadas,
    fichasCambiadas,
    modelo: mAntes === mDespues ? null : { antes: mAntes, despues: mDespues },
    tono: (actual.cfg?.tono ?? "") !== (nueva.cfg?.tono ?? ""),
    reglas: (actual.cfg?.reglas ?? "") !== (nueva.cfg?.reglas ?? ""),
    roles: rAntes.join("|") === rDespues.join("|") ? null : { antes: rAntes, despues: rDespues },
  };
}

// ---------------------------------------------------------------------------
// Pruebas A/B por campaña
// ---------------------------------------------------------------------------

export interface PruebaAB {
  id: string;
  rubro: Rubro;
  campaign_id: string;
  version: number;
  modelo: string | null;
  porcentaje: number;
  inicio: string;
  fin: string;
  cortada_at: string | null;
}

export const PORCENTAJE_POR_DEFECTO = 20;
export const DIAS_POR_DEFECTO = 7;

/** Normaliza porcentaje y días de una prueba A/B. Pura. */
export function validarPruebaAB(p: { porcentaje?: unknown; dias?: unknown; version?: unknown; modelo?: unknown }): { ok: true; porcentaje: number; dias: number; version: number; modelo: string | null } | { ok: false; error: string } {
  const porcentaje = p.porcentaje == null || p.porcentaje === "" ? PORCENTAJE_POR_DEFECTO : Math.round(Number(p.porcentaje));
  const dias = p.dias == null || p.dias === "" ? DIAS_POR_DEFECTO : Math.round(Number(p.dias));
  const version = Number(p.version);
  const modelo = typeof p.modelo === "string" && p.modelo.trim() ? p.modelo.trim() : null;
  if (!Number.isFinite(porcentaje) || porcentaje < 1 || porcentaje > 90) return { ok: false, error: "El porcentaje va de 1 a 90 (por defecto 20)." };
  if (!Number.isFinite(dias) || dias < 1 || dias > 30) return { ok: false, error: "La prueba dura de 1 a 30 días (por defecto 7)." };
  if (!Number.isInteger(version) || version < 1) return { ok: false, error: "Elegí la versión que se prueba." };
  if (modelo && !modeloValido(modelo)) return { ok: false, error: "El modelo no es válido." };
  return { ok: true, porcentaje, dias, version, modelo };
}

/** ¿La prueba está corriendo ahora? Se corta sola al llegar al fin. Pura. */
export function pruebaVigente(p: Pick<PruebaAB, "inicio" | "fin" | "cortada_at">, ahora: Date): boolean {
  if (p.cortada_at) return false;
  const t = ahora.getTime();
  return t >= Date.parse(p.inicio) && t < Date.parse(p.fin);
}

/** FNV-1a de 32 bits (el mismo criterio de reparto estable que el conocimiento). */
export function hashEstable(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Variante de una charla dentro de una prueba A/B. Determinística: la misma
 * charla cae siempre en la misma variante. Solo entran charlas de la campaña
 * de la prueba cuyo envío fue desde el inicio de la prueba. Al vencer o
 * cortarse, desde la respuesta siguiente atiende la versión activa. Pura.
 */
export function varianteAB(
  p: PruebaAB,
  ctx: { campaignId: string | null; conversationId: string; envioCampanaAt: string | null; ahora: Date }
): "prueba" | "control" | null {
  if (!ctx.campaignId || ctx.campaignId !== p.campaign_id) return null;
  if (!pruebaVigente(p, ctx.ahora)) return null;
  // Solo cuenta si el envío de ESA campaña a esta persona es posterior al inicio de la prueba.
  if (!ctx.envioCampanaAt || Date.parse(ctx.envioCampanaAt) < Date.parse(p.inicio)) return null;
  return hashEstable(`${p.id}:${ctx.conversationId}`) % 100 < p.porcentaje ? "prueba" : "control";
}

/** Una campaña no puede tener dos pruebas a la vez. Pura. */
export function pruebaSuperpuesta(pruebas: PruebaAB[], campaignId: string, ahora: Date): PruebaAB | null {
  return pruebas.find((p) => p.campaign_id === campaignId && pruebaVigente(p, ahora)) ?? null;
}

// ---------------------------------------------------------------------------
// Roles aplicados desde el laboratorio (tipo de consulta y perfil)
// ---------------------------------------------------------------------------

export interface AplicacionRol {
  tipo: "rol_perfil" | "rol_tipo_consulta";
  rubro: Rubro;
  tipo_consulta: TipoConsulta | null;
  rol: { nombre: string; objetivo: string; tono: string; instrucciones: string };
}

/** Rol del laboratorio para una charla: tipo de consulta antes que perfil. Pura. */
export function rolDeLaboratorio(aplicaciones: AplicacionRol[], ctx: { rubro: Rubro | null; area: string; modo: "campana" | "entrante" }): AplicacionRol | null {
  if (!ctx.rubro) return null;
  // Orden explícito: área (civil, penal) → modo (campaña, entrante) → todo el perfil.
  // A igual tipo, la primera de la lista (en-vivo.ts las lee ordenadas por aplicada_at).
  const del = aplicaciones.filter((a) => a.rubro === ctx.rubro);
  return (
    del.find((a) => a.tipo === "rol_tipo_consulta" && a.tipo_consulta === ctx.area) ??
    del.find((a) => a.tipo === "rol_tipo_consulta" && a.tipo_consulta === ctx.modo) ??
    del.find((a) => a.tipo === "rol_perfil") ??
    null
  );
}

/** Bloque del rol aplicado desde el laboratorio. Pura. */
export function bloqueRolLaboratorio(a: AplicacionRol): string {
  const alcance = a.tipo === "rol_perfil" ? "todas las consultas de este perfil" : `este tipo de consulta (${TIPOS_CONSULTA[a.tipo_consulta ?? "entrante"].toLowerCase()})`;
  return [
    `Rol para ${alcance}: ${a.rol.nombre}.`,
    "Lo eligió la responsable y se SUMA a tu guion general: la base general sigue vigente (presentación, reglas, insistencia y cierre). Si algo del rol choca con las reglas estrictas del sistema, valen las reglas.",
    a.rol.objetivo ? `Objetivo: ${a.rol.objetivo}` : "",
    a.rol.tono ? `Tono: ${a.rol.tono}` : "",
    "Instrucciones:",
    a.rol.instrucciones,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Plan de cada respuesta del bot en vivo
// ---------------------------------------------------------------------------

export interface EstadoLaboratorio {
  pruebas: PruebaAB[];
  versiones: ConfigVersion[];
  aplicaciones: AplicacionRol[];
}
export const ESTADO_VACIO: EstadoLaboratorio = { pruebas: [], versiones: [], aplicaciones: [] };

/**
 * Arma el estado del laboratorio con las filas leídas de la base. Descarta lo
 * que no es de un perfil conocido y los roles archivados. Pura.
 */
export function estadoDesdeFilas(f: { pruebas: any[] | null; versiones: any[] | null; nombres: any[] | null; aplicaciones: any[] | null }): EstadoLaboratorio {
  const nombre = new Map<number, string>((f.nombres ?? []).map((n) => [Number(n.version), String(n.nombre)]));
  return {
    pruebas: (f.pruebas ?? []).filter((p) => esRubro(p.rubro)).map((p) => ({ ...p, version: Number(p.version), porcentaje: Number(p.porcentaje) })) as PruebaAB[],
    versiones: (f.versiones ?? []).map((v) => ({
      ...v,
      version: Number(v.version),
      nombre: nombre.get(Number(v.version)) ?? `v${v.version}`,
      rubros: (v.rubros ?? []).filter(esRubro),
      roles: Array.isArray(v.roles) ? v.roles : [],
      tono: v.tono ?? "",
      reglas: v.reglas ?? "",
      modelo: v.modelo ?? null,
    })) as ConfigVersion[],
    aplicaciones: (f.aplicaciones ?? [])
      .filter((a) => esRubro(a.rubro) && a.agent_roles && !a.agent_roles.archived_at)
      .map((a) => ({ tipo: a.tipo, rubro: a.rubro, tipo_consulta: a.tipo_consulta ?? null, rol: { nombre: a.agent_roles.nombre, objetivo: a.agent_roles.objetivo ?? "", tono: a.agent_roles.tono ?? "", instrucciones: a.agent_roles.instrucciones } })) as AplicacionRol[],
  };
}

export interface PlanTurno {
  /** Versión de conocimiento que impone la variante «prueba» de un A/B (null = la de siempre). */
  forzarVersion: number | null;
  prueba: { id: string; variante: "prueba" | "control"; version: number; modelo: string | null } | null;
  /** Rol del laboratorio (tipo de consulta o perfil) que entra si la charla no tiene rol de campaña ni de base. */
  rol: AplicacionRol | null;
}
export const PLAN_VACIO: PlanTurno = { forzarVersion: null, prueba: null, rol: null };

/** Qué cambia el laboratorio para esta respuesta (antes de elegir el conocimiento). Pura. */
export function planDelTurno(
  estado: EstadoLaboratorio,
  ctx: { rubro: Rubro | null; area: string; modo: "campana" | "entrante"; campaignId: string | null; conversationId: string; envioCampanaAt: string | null; ahora: Date }
): PlanTurno {
  // Sin perfil reconocido, el laboratorio no aplica nada.
  if (!ctx.rubro) return PLAN_VACIO;
  let prueba: PlanTurno["prueba"] = null;
  for (const p of estado.pruebas) {
    if (p.rubro !== ctx.rubro) continue;
    const v = varianteAB(p, ctx);
    if (v) {
      prueba = { id: p.id, variante: v, version: p.version, modelo: p.modelo };
      break;
    }
  }
  const rol = rolDeLaboratorio(estado.aplicaciones, ctx);
  if (!prueba && !rol) return PLAN_VACIO;
  return { forzarVersion: prueba?.variante === "prueba" ? prueba.version : null, prueba, rol };
}

export interface AjustesTurno {
  /** Modelo a pedir (null = el de siempre: GEMINI_MODEL o el valor por defecto). */
  modelo: string | null;
  /** Texto de la versión del laboratorio (tono, reglas, roles copiados); "" si no hay. */
  extras: string;
}
export const AJUSTES_VACIOS: AjustesTurno = { modelo: null, extras: "" };

/**
 * Con la versión que efectivamente respondió (la del A/B o la asignada al
 * perfil), qué modelo y qué texto suma el laboratorio. Las versiones 1 y 2
 * nunca suman nada. Pura.
 */
export function ajustesDeVersion(estado: EstadoLaboratorio, plan: PlanTurno, versionEfectiva: number): AjustesTurno {
  // Si la variante «prueba» no pudo usar su versión (falló la lectura del conocimiento), no se aplica nada de la prueba.
  if (plan.prueba?.variante === "prueba" && versionEfectiva !== plan.prueba.version) return AJUSTES_VACIOS;
  const cfg = versionEfectiva >= 3 ? estado.versiones.find((v) => v.version === versionEfectiva && !v.archived_at) ?? null : null;
  const modeloPrueba = plan.prueba?.variante === "prueba" ? plan.prueba.modelo : null;
  const modelo = modeloPrueba ?? cfg?.modelo ?? null;
  const extras = cfg ? bloqueDeVersion(cfg) : "";
  if (!modelo && !extras) return AJUSTES_VACIOS;
  return { modelo, extras };
}

/** ¿Se registra la variante? Solo si la respuesta efectivamente usó lo que pedía la prueba. Pura. */
export function varianteRegistrable(plan: PlanTurno, versionEfectiva: number): boolean {
  if (!plan.prueba) return false;
  return plan.prueba.variante === "control" || versionEfectiva === plan.prueba.version;
}

/** Ante un error al leer el laboratorio: se mantiene el último estado bueno; solo sin estado previo, el vacío. Pura. */
export function estadoTrasError(anterior: EstadoLaboratorio | null): EstadoLaboratorio {
  return anterior ?? ESTADO_VACIO;
}

/**
 * Suma al texto de instrucciones el conocimiento, los ajustes de la versión y
 * el rol, en el mismo orden de siempre: conocimiento → (ajustes) → rol de
 * campaña o base → (rol del laboratorio, solo si no había otro). Sin nada del
 * laboratorio el resultado es exactamente el de hoy. Pura.
 */
export function componerInstrucciones(input: { system: string; conocimiento: string; extras: string; rol: string; rolLaboratorio: string }): string {
  let s = input.system;
  if (input.conocimiento) s = `${s}\n\n${input.conocimiento}`;
  if (input.extras) s = `${s}\n\n${input.extras}`;
  if (input.rol) s = `${s}\n\n${input.rol}`;
  else if (input.rolLaboratorio) s = `${s}\n\n${input.rolLaboratorio}`;
  return s;
}

/** Pedido al modelo: sin modelo del laboratorio, el MISMO objeto de siempre (no se agrega ninguna clave). Pura. */
export function pedidoConModelo<T extends object>(req: T, modelo: string | null): T | (T & { modelo: string }) {
  return modelo ? { ...req, modelo } : req;
}

// ---------------------------------------------------------------------------
// Comparativas
// ---------------------------------------------------------------------------

/** Mínimo de conversaciones por versión o variante para sacar conclusiones. */
export const MINIMO_POR_VARIANTE = 30;

/**
 * Versión de referencia para comparar varios perfiles sumados: la que rige en
 * todos (sin fila, rige v2). Si rigen versiones distintas, no hay referencia
 * común (null) y no se dan veredictos. Pura.
 */
export function referenciaComun(rubros: Rubro[], asignaciones: { rubro: string; version: number }[]): number | null {
  const vs = new Set(rubros.map((r) => Number(asignaciones.find((a) => a.rubro === r)?.version ?? 2)));
  return vs.size === 1 ? Array.from(vs)[0] : null;
}

export function datosSuficientes(conversaciones: number[]): boolean {
  return conversaciones.length > 0 && conversaciones.every((n) => n >= MINIMO_POR_VARIANTE);
}
