/**
 * Menú del perfil a medida (13/11 · pedido de la responsable: que el
 * asistente pueda cambiar «secciones»). Cada perfil puede renombrar,
 * ocultar y reordenar las secciones del menú, y renombrar sus pestañas, sin
 * tocar código. Se guarda por perfil (cada rubro por separado) y siempre se
 * puede volver al menú original. Puro: sin base ni navegador.
 */

export interface SeccionPersonal {
  nombre?: string;
  oculta?: boolean;
  /** Nombre nuevo de una pestaña, por su nombre original. */
  pestanas?: Record<string, string>;
}

export interface MenuPersonal {
  secciones?: Record<string, SeccionPersonal>;
  /** Claves de sección en el orden pedido (las que falten van después, en su orden original). */
  orden?: string[];
}

/** Estas dos no se pueden ocultar: sin ellas no hay forma de volver atrás desde el panel. */
export const SECCIONES_FIJAS = ["inicio", "configuracion"] as const;

const NOMBRE_MAX = 28;
const limpiarNombre = (v: unknown): string =>
  String(v ?? "")
    .replace(/[\u0000-\u001f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NOMBRE_MAX);

interface SeccionBase {
  clave: string;
  label: string;
  grupo: string;
  href: string;
  tabs: { label: string; href: string; oculto?: boolean }[];
  oculta?: boolean;
}

/** Deja solo lo que tiene forma válida. Lo que no se entiende se descarta. */
export function validarMenuPersonal(v: unknown): MenuPersonal {
  const out: MenuPersonal = {};
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const secciones = o.secciones && typeof o.secciones === "object" && !Array.isArray(o.secciones) ? (o.secciones as Record<string, unknown>) : {};
  for (const [clave, crudo] of Object.entries(secciones).slice(0, 20)) {
    if (!/^[a-z_]{2,30}$/.test(clave) || !crudo || typeof crudo !== "object") continue;
    const c = crudo as Record<string, unknown>;
    const s: SeccionPersonal = {};
    const nombre = limpiarNombre(c.nombre);
    if (nombre.length >= 2) s.nombre = nombre;
    if (c.oculta === true && !(SECCIONES_FIJAS as readonly string[]).includes(clave)) s.oculta = true;
    if (c.pestanas && typeof c.pestanas === "object" && !Array.isArray(c.pestanas)) {
      const p: Record<string, string> = {};
      for (const [orig, nuevo] of Object.entries(c.pestanas as Record<string, unknown>).slice(0, 20)) {
        const n = limpiarNombre(nuevo);
        if (orig.length <= 60 && n.length >= 2) p[orig] = n;
      }
      if (Object.keys(p).length) s.pestanas = p;
    }
    if (Object.keys(s).length) (out.secciones ??= {})[clave] = s;
  }
  if (Array.isArray(o.orden)) {
    const orden = Array.from(new Set(o.orden.filter((x): x is string => typeof x === "string" && /^[a-z_]{2,30}$/.test(x)))).slice(0, 20);
    if (orden.length) out.orden = orden;
  }
  return out;
}

/** Aplica el menú a medida sobre el menú de fábrica. Sin dato, devuelve el de fábrica. */
export function aplicarMenuPersonal<T extends SeccionBase>(secciones: T[], personal: MenuPersonal | null | undefined): T[] {
  const p = personal ? validarMenuPersonal(personal) : {};
  if (!p.secciones && !p.orden) return secciones;
  const lista = secciones.map((s) => {
    const c = p.secciones?.[s.clave];
    if (!c) return s;
    const tabs = c.pestanas ? s.tabs.map((t) => (c.pestanas![t.label] ? { ...t, label: c.pestanas![t.label] } : t)) : s.tabs;
    return { ...s, label: c.nombre ?? s.label, tabs, ...(c.oculta ? { oculta: true } : {}) };
  });
  if (!p.orden) return lista;
  const pos = (clave: string) => {
    const i = p.orden!.indexOf(clave);
    return i < 0 ? 1000 + secciones.findIndex((s) => s.clave === clave) : i;
  };
  // El orden vale dentro de cada grupo: «Trabajo» sigue arriba de «Configurar».
  return [...lista].sort((a, b) => (a.grupo === b.grupo ? pos(a.clave) - pos(b.clave) : 0));
}

export interface CambioMenu {
  /** Clave o nombre actual de la sección. */
  seccion: string;
  nombre?: string | null;
  oculta?: boolean;
  /** Lugar dentro de su grupo, empezando en 1. */
  posicion?: number;
  /** Para renombrar una pestaña: su nombre actual y el nuevo. */
  pestana?: string;
  nombre_pestana?: string | null;
}

const norm = (t: unknown) =>
  String(t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

export type FusionMenu = { ok: true; valor: MenuPersonal; descripcion: string[] } | { ok: false; error: string };

/**
 * Suma cambios al menú a medida actual. `fabrica` es el menú original del
 * perfil; se usa para reconocer las secciones por su clave o por su nombre
 * (el original o el que tengan ahora).
 */
export function fusionarMenu(actual: MenuPersonal | null | undefined, cambios: unknown, fabrica: SeccionBase[]): FusionMenu {
  if (!Array.isArray(cambios) || cambios.length === 0) return { ok: false, error: "Falta decir qué cambiar del menú." };
  const valor = validarMenuPersonal(actual ?? {});
  const vista = aplicarMenuPersonal(fabrica, valor);
  const descripcion: string[] = [];
  for (const crudo of cambios.slice(0, 20)) {
    const c = (crudo ?? {}) as CambioMenu;
    const q = norm(c.seccion);
    const base = fabrica.find((s) => s.clave === q || norm(s.label) === q) ?? fabrica[vista.findIndex((s) => norm(s.label) === q)];
    if (!base) return { ok: false, error: `No existe la sección «${String(c.seccion ?? "").slice(0, 40)}». Las secciones son: ${vista.map((s) => s.label).join(", ")}.` };
    const s: SeccionPersonal = { ...(valor.secciones?.[base.clave] ?? {}) };
    if (c.nombre !== undefined) {
      const n = limpiarNombre(c.nombre);
      if (c.nombre === null || n === "" || norm(n) === norm(base.label)) {
        delete s.nombre;
        descripcion.push(`«${base.label}» vuelve a su nombre original`);
      } else if (n.length < 2) {
        return { ok: false, error: "El nombre nuevo es demasiado corto." };
      } else {
        s.nombre = n;
        descripcion.push(`«${base.label}» pasa a llamarse «${n}»`);
      }
    }
    if (c.oculta !== undefined) {
      if (c.oculta === true) {
        if ((SECCIONES_FIJAS as readonly string[]).includes(base.clave)) return { ok: false, error: `«${base.label}» no se puede ocultar: hace falta para manejar el panel.` };
        s.oculta = true;
        descripcion.push(`«${base.label}» se oculta del menú (se sigue pudiendo abrir desde el asistente o volver a mostrar)`);
      } else {
        delete s.oculta;
        descripcion.push(`«${base.label}» vuelve a mostrarse`);
      }
    }
    if (c.pestana !== undefined) {
      const tq = norm(c.pestana);
      const actualTabs = vista.find((x) => x.clave === base.clave)!.tabs;
      const i = base.tabs.findIndex((t, k) => !t.oculto && (norm(t.label) === tq || norm(actualTabs[k]?.label) === tq));
      if (i < 0) return { ok: false, error: `«${base.label}» no tiene una pestaña «${String(c.pestana).slice(0, 40)}». Tiene: ${actualTabs.filter((t) => !t.oculto).map((t) => t.label).join(", ")}.` };
      const original = base.tabs[i].label;
      const n = limpiarNombre(c.nombre_pestana);
      const pest = { ...(s.pestanas ?? {}) };
      if (!n || norm(n) === norm(original)) {
        delete pest[original];
        descripcion.push(`La pestaña «${original}» vuelve a su nombre original`);
      } else if (n.length < 2) {
        return { ok: false, error: "El nombre nuevo de la pestaña es demasiado corto." };
      } else {
        pest[original] = n;
        descripcion.push(`La pestaña «${original}» de «${base.label}» pasa a llamarse «${n}»`);
      }
      if (Object.keys(pest).length) s.pestanas = pest;
      else delete s.pestanas;
    }
    if (Object.keys(s).length) (valor.secciones ??= {})[base.clave] = s;
    else if (valor.secciones) delete valor.secciones[base.clave];
    if (c.posicion !== undefined) {
      const n = Math.round(Number(c.posicion));
      const grupo = aplicarMenuPersonal(fabrica, valor).filter((x) => x.grupo === base.grupo).map((x) => x.clave);
      if (!Number.isFinite(n) || n < 1 || n > grupo.length) return { ok: false, error: `La posición de «${base.label}» tiene que ser un número entre 1 y ${grupo.length}.` };
      const sin = grupo.filter((k) => k !== base.clave);
      sin.splice(n - 1, 0, base.clave);
      const otros = aplicarMenuPersonal(fabrica, valor).filter((x) => x.grupo !== base.grupo).map((x) => x.clave);
      valor.orden = base.grupo === fabrica[0]?.grupo ? [...sin, ...otros] : [...otros, ...sin];
      descripcion.push(`«${base.label}» pasa al lugar ${n} de su grupo`);
    }
  }
  if (valor.secciones && Object.keys(valor.secciones).length === 0) delete valor.secciones;
  if (!descripcion.length) return { ok: false, error: "No entendí qué cambiar: decí la sección y si querés renombrarla, ocultarla, mostrarla o moverla." };
  return { ok: true, valor, descripcion };
}
