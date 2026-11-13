/**
 * Operaciones del panel que el asistente puede proponer (13/11 · «dale
 * permisos a TODO»). Cada entrada describe UNA operación que ya existe en una
 * pantalla: qué ruta la hace, qué datos pide y qué nivel de confirmación
 * lleva. El asistente no tiene una copia de la lógica: al confirmar se llama
 * a la misma ruta que usa la pantalla, con la sesión de quien confirma, así
 * que valen exactamente las mismas validaciones.
 *
 * Este archivo tiene solo los tipos y las funciones puras; las entradas
 * están en `catalogo.ts`.
 */
import type { NivelAccion } from "@/lib/asistente/permisos";

export type GrupoOperacion =
  | "personas"
  | "chats"
  | "seguimiento"
  | "campañas"
  | "bases"
  | "plantillas"
  | "líneas"
  | "bot"
  | "agenda"
  | "redes y contenido"
  | "incidencias"
  | "marketing"
  | "ajustes del perfil"
  | "ajustes generales"
  | "pedidos a Claude";

export type TipoCampo = "texto" | "numero" | "si_no" | "lista" | "objeto";

export interface CampoOperacion {
  nombre: string;
  tipo: TipoCampo;
  obligatorio?: boolean;
  /** Conjunto cerrado de valores, si la pantalla lo valida. */
  valores?: readonly string[];
  descripcion: string;
}

/** Qué cosa del panel identifica un tramo de la ruta, y cómo se comprueba que es del perfil. */
export type TablaRecurso =
  | "campaigns"
  | "imported_bases"
  | "opportunities"
  | "contacts"
  | "conversations"
  | "appointments"
  | "wasender_lineas"
  | "wasender_plantillas"
  | "profile_lines"
  | "followup_tasks"
  | "detenciones"
  | "incidencias"
  | "notification_phones"
  | "content_pieces"
  | "bandeja_claude"
  | "calendar_exceptions"
  | "template_assignments"
  | "rubros"
  | "messages"
  | "message_attachments"
  | "agent_library"
  | "agent_roles"
  | "area_del_perfil";

export interface RecursoOperacion {
  /** Nombre del tramo dinámico en la ruta: "id", "lineId"… */
  param: string;
  /** Cómo se le llama en palabras: «campaña», «persona», «línea de Wasender». */
  que: string;
  tabla: TablaRecurso;
}

export interface OperacionPanel {
  clave: string;
  grupo: GrupoOperacion;
  /** Verbo + objeto, como lo diría la responsable: «Pausar una campaña». */
  titulo: string;
  /** Para el modelo: cuándo usarla y qué hace exactamente. */
  descripcion: string;
  metodo: "POST" | "PUT" | "PATCH" | "DELETE";
  /** Ruta bajo /api, con los tramos dinámicos entre corchetes. */
  ruta: string;
  recursos?: RecursoOperacion[];
  campos: CampoOperacion[];
  /**
   * Campos del cuerpo que nombran otra cosa del panel (una base, un rol, una
   * línea). El modelo puede dar el nombre: el servidor lo cambia por su
   * identificador y comprueba que sea de este perfil.
   */
  referencias?: { campo: string; que: string; tabla: TablaRecurso }[];
  /** Valores que la operación fija en el cuerpo (por ejemplo { accion: "archivar" }). */
  fijos?: Record<string, unknown>;
  /** Cómo recibe la ruta el perfil. Lo completa el servidor: el modelo nunca lo elige. */
  perfil?: { en: "cuerpo" | "query"; campo: string; valor: "slug" | "rubro_id" | "area" };
  /** Vale para los cuatro perfiles (se avisa en la propuesta). */
  general?: boolean;
  /** La operación existe en un solo perfil (por ejemplo, la prospección de Marketing). */
  soloPerfil?: string;
  /** La ruta recibe un formulario en lugar de JSON (solo campos de texto). */
  comoFormulario?: boolean;
  nivel: NivelAccion;
  /** Sube el nivel según un dato: p. ej. encender algo pide el código. Gana el más alto. */
  nivelSi?: { campo: string; igual: unknown; nivel: NivelAccion }[];
  /** Si la ruta pide el código en su cuerpo, en qué campo. */
  campoPin?: string;
  /** Qué pasa al confirmar, en una frase para la propuesta. */
  efecto: string;
}

const ORDEN_NIVEL: Record<NivelAccion, number> = { cambio: 0, contacto: 1, pin: 2 };

/** Nivel de confirmación de una operación con sus datos. Pura. */
export function nivelDeOperacion(op: OperacionPanel, cuerpo: Record<string, unknown> = {}): NivelAccion {
  let nivel: NivelAccion = op.campoPin ? "pin" : op.nivel;
  for (const r of op.nivelSi ?? []) {
    if (cuerpo[r.campo] === r.igual && ORDEN_NIVEL[r.nivel] > ORDEN_NIVEL[nivel]) nivel = r.nivel;
  }
  return nivel;
}

const norm = (t: unknown) =>
  String(t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

/** Busca operaciones por palabras (título, descripción, grupo, clave). Pura. */
export function buscarOperaciones(catalogo: readonly OperacionPanel[], texto: unknown, grupo?: unknown, perfil?: string): OperacionPanel[] {
  if (perfil) catalogo = catalogo.filter((o) => !o.soloPerfil || o.soloPerfil === perfil);
  const g = norm(grupo);
  const palabras = norm(texto).split(/[^a-z0-9ñ]+/).filter((p) => p.length > 2);
  const base = g ? catalogo.filter((o) => norm(o.grupo).includes(g)) : [...catalogo];
  if (!palabras.length) return base;
  const puntuadas = base
    .map((o) => {
      const donde = `${norm(o.titulo)} ${norm(o.clave).replace(/_/g, " ")} ${norm(o.grupo)}`;
      const resto = norm(o.descripcion);
      let p = 0;
      for (const w of palabras) {
        const raiz = w.length > 5 ? w.slice(0, w.length - 2) : w;
        if (donde.includes(raiz)) p += 3;
        else if (resto.includes(raiz)) p += 1;
      }
      return { o, p };
    })
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p);
  return puntuadas.map((x) => x.o);
}

export type ValidacionCampos = { ok: true; cuerpo: Record<string, unknown> } | { ok: false; error: string };

/**
 * Deja pasar solo los campos declarados, con su tipo. Lo que el modelo
 * mande de más se descarta: no puede colar un perfil, un código ni un campo
 * fijo. Pura.
 */
export function validarCampos(op: OperacionPanel, parametros: unknown): ValidacionCampos {
  const p = parametros && typeof parametros === "object" && !Array.isArray(parametros) ? (parametros as Record<string, unknown>) : {};
  const cuerpo: Record<string, unknown> = {};
  for (const c of op.campos) {
    let v = p[c.nombre];
    const vacio = v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    if (vacio) {
      if (c.obligatorio) return { ok: false, error: `Falta «${c.nombre}»: ${c.descripcion}` };
      if (v === null) cuerpo[c.nombre] = null;
      continue;
    }
    if (c.tipo === "texto") {
      if (typeof v !== "string" && typeof v !== "number") return { ok: false, error: `«${c.nombre}» tiene que ser un texto.` };
      v = String(v).trim().slice(0, 8000);
      if (c.valores && !c.valores.includes(v as string)) return { ok: false, error: `«${c.nombre}» tiene que ser uno de: ${c.valores.join(", ")}.` };
    } else if (c.tipo === "numero") {
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      if (!Number.isFinite(n)) return { ok: false, error: `«${c.nombre}» tiene que ser un número.` };
      v = n;
    } else if (c.tipo === "si_no") {
      if (typeof v !== "boolean") {
        const t = norm(v);
        if (["true", "si", "1", "encendido", "encender"].includes(t)) v = true;
        else if (["false", "no", "0", "apagado", "apagar"].includes(t)) v = false;
        else return { ok: false, error: `«${c.nombre}» tiene que ser sí o no.` };
      }
    } else if (c.tipo === "lista") {
      if (!Array.isArray(v)) return { ok: false, error: `«${c.nombre}» tiene que ser una lista.` };
      if (c.valores && (v as unknown[]).some((x) => !c.valores!.includes(String(x)))) return { ok: false, error: `En «${c.nombre}» solo valen: ${c.valores.join(", ")}.` };
      v = (v as unknown[]).slice(0, 200);
    } else if (c.tipo === "objeto") {
      if (typeof v !== "object" || Array.isArray(v)) return { ok: false, error: `«${c.nombre}» tiene que ser un objeto.` };
    }
    cuerpo[c.nombre] = v;
  }
  return { ok: true, cuerpo };
}

/** Reemplaza los tramos dinámicos de la ruta. Lanza si falta alguno o no es un identificador. Pura. */
export function rutaConIds(ruta: string, ids: Record<string, string>): string {
  const lista = ruta.split("/").map((tramo) => {
    const m = tramo.match(/^\[(\w+)\]$/);
    if (!m) return tramo;
    const id = ids[m[1]];
    if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error(`Falta identificar «${m[1]}».`);
    return encodeURIComponent(id);
  });
  return `/api/${lista.join("/")}`;
}

/** Lo que el modelo ve de una operación (sin detalles internos). Pura. */
export function fichaDeOperacion(op: OperacionPanel) {
  const nivel = nivelDeOperacion(op);
  return {
    clave: op.clave,
    grupo: op.grupo,
    que_hace: `${op.titulo}. ${op.descripcion}`,
    necesita_identificar: (op.recursos ?? []).map((r) => `${r.param}: ${r.que} (nombre, teléfono o identificador)`),
    parametros: op.campos.map((c) => ({ nombre: c.nombre, tipo: c.tipo, obligatorio: !!c.obligatorio, ...(c.valores ? { valores: c.valores } : {}), que_es: c.descripcion })),
    confirmacion: nivel === "pin" ? "pide el código de acceso" : nivel === "contacto" ? "confirmación reforzada (puede escribirle a personas)" : "un clic",
    ...(op.general ? { alcance: "vale para los cuatro perfiles" } : {}),
  };
}

/** Comprobaciones de forma del catálogo (las usa la prueba). Devuelve la lista de problemas. Pura. */
export function problemasDelCatalogo(catalogo: readonly OperacionPanel[]): string[] {
  const problemas: string[] = [];
  const claves = new Set<string>();
  for (const op of catalogo) {
    if (claves.has(op.clave)) problemas.push(`${op.clave}: clave repetida`);
    claves.add(op.clave);
    if (!/^[a-z0-9_]{3,60}$/.test(op.clave)) problemas.push(`${op.clave}: clave con formato inválido`);
    const dinamicos = [...op.ruta.matchAll(/\[(\w+)\]/g)].map((m) => m[1]);
    const declarados = (op.recursos ?? []).map((r) => r.param);
    for (const d of dinamicos) if (!declarados.includes(d)) problemas.push(`${op.clave}: falta declarar el recurso «${d}»`);
    for (const d of declarados) if (!dinamicos.includes(d)) problemas.push(`${op.clave}: el recurso «${d}» no está en la ruta`);
    const nombres = op.campos.map((c) => c.nombre);
    if (new Set(nombres).size !== nombres.length) problemas.push(`${op.clave}: campo repetido`);
    for (const reservado of [op.perfil?.en === "cuerpo" ? op.perfil.campo : null, op.campoPin ?? null, ...Object.keys(op.fijos ?? {})]) {
      if (reservado && nombres.includes(reservado)) problemas.push(`${op.clave}: «${reservado}» lo completa el servidor, no puede ser un campo del modelo`);
    }
    for (const ref of op.referencias ?? []) if (!nombres.includes(ref.campo)) problemas.push(`${op.clave}: la referencia «${ref.campo}» no es un campo`);
    if (!op.perfil && !op.general && !op.soloPerfil && !(op.recursos ?? []).length && !(op.referencias ?? []).length) problemas.push(`${op.clave}: no dice de qué perfil es (perfil, recurso o general)`);
    if (op.efecto.trim().length < 10) problemas.push(`${op.clave}: falta decir qué pasa al confirmar`);
  }
  return problemas;
}
