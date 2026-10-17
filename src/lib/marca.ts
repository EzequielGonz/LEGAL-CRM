/**
 * Identidad visual de cada perfil. Datos públicos de marca, sin secretos.
 *
 * Fuente única (rediseño 17/10, bloque 2): la fila `brand_briefs` de cada
 * perfil es la fuente; `MARCAS` solo aporta los valores por defecto (los
 * logos originales entregados por la responsable en /public/logos y las
 * paletas aprobadas). Menú, selector de perfiles, Teléfono, Configuración y
 * Contenido resuelven la marca con `resolverMarca`, así que editar el logo
 * del panel o el nombre en Configuración actualiza todas las superficies.
 *
 * Tokens en tres niveles: paleta (referencia, `paleta`) → roles con contraste
 * comprobado (`ROLES`, semántico) → variables `--rol-*` de cada
 * `data-tema` en globals.css (componentes).
 */
export const SLUGS_PERFIL = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
export type SlugPerfil = (typeof SLUGS_PERFIL)[number];

export interface Marca {
  slug: SlugPerfil;
  nombre: string;
  bajada: string;
  logo: string;
  /** Colores de la paleta entregada, del más oscuro al más claro. */
  paleta: string[];
  acento: string;
  /**
   * Escala uniforme para igualar el tamaño óptico de los logos originales
   * sobre la placa (medido sobre la tinta de cada imagen: Coberturas ocupa
   * más superficie y Marketing es apaisado). Nunca deforma: es la misma
   * escala en los dos ejes y solo se aplica al logo original.
   */
  escalaOptica: number;
}

export const MARCAS: Record<SlugPerfil, Marca> = {
  juridico: {
    slug: "juridico",
    nombre: "Estudio Jurídico VITA",
    bajada: "Civil y Penal",
    logo: "/logos/juridico.svg",
    paleta: ["#112250", "#3B507D", "#BEB7A7", "#E7E2CE", "#F5F4F0"],
    acento: "#C9A85A",
    escalaOptica: 1,
  },
  coberturas_medicas: {
    slug: "coberturas_medicas",
    nombre: "Compara tu Obra Social",
    bajada: "Coberturas médicas",
    logo: "/logos/coberturas_medicas.svg",
    paleta: ["#051F20", "#0B2B26", "#163832", "#235347", "#8EB69B", "#DAF1DE"],
    acento: "#8EB69B",
    escalaOptica: 0.9,
  },
  agencia_0km: {
    slug: "agencia_0km",
    nombre: "Automotores Kocos",
    bajada: "Autos 0 km",
    logo: "/logos/agencia_0km.svg",
    paleta: ["#000521", "#020C47", "#011F65", "#0E4EB2", "#2078CF"],
    acento: "#2078CF",
    escalaOptica: 1,
  },
  marketing: {
    slug: "marketing",
    nombre: "Kocos Marketing",
    bajada: "Agencia de marketing",
    logo: "/logos/marketing.svg",
    paleta: ["#1B1B1B", "#323232", "#FFE7D0", "#FC6E20"],
    acento: "#FC6E20",
    escalaOptica: 1.04,
  },
};

export function esSlugPerfil(v: unknown): v is SlugPerfil {
  return typeof v === "string" && (SLUGS_PERFIL as readonly string[]).includes(v);
}

/** Tema a aplicar: el perfil pedido o Jurídico (valor por defecto del panel). */
export function temaDe(slug: unknown): SlugPerfil {
  return esSlugPerfil(slug) ? slug : "juridico";
}

export function marcaDe(slug: unknown): Marca {
  return MARCAS[temaDe(slug)];
}

/* ───────────── Colores: una sola clave ───────────── */

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Colores guardados en `brand_briefs.colores`. La clave canónica es
 * `principal` (la que usa la base desde el SQL 14); `primario` es el nombre
 * anterior del formulario de Contenido y se sigue leyendo como alias. Se
 * conservan todas las demás claves con un color válido (claro, oscuro,
 * acento, fondo…): guardar el formulario no borra ninguna.
 */
export function normalizarColores(colores: unknown): Record<string, string> {
  const salida: Record<string, string> = {};
  if (!colores || typeof colores !== "object") return salida;
  for (const [k, v] of Object.entries(colores as Record<string, unknown>)) {
    if (typeof v === "string" && HEX.test(v.trim()) && /^[a-z_]{2,20}$/.test(k)) salida[k] = v.trim().toUpperCase();
  }
  if (!salida.principal && salida.primario) salida.principal = salida.primario;
  delete salida.primario;
  return salida;
}

export function colorPrincipal(colores: unknown): string | null {
  return normalizarColores(colores).principal ?? null;
}

/* ───────────── Logo: prioridad única ───────────── */

/** Logo aceptado: archivo propio del panel (/logos/…) o enlace https. */
export function logoValido(ref: unknown): string | null {
  if (typeof ref !== "string") return null;
  const v = ref.trim();
  if (/^\/logos\/[a-z0-9_-]+\.(svg|png|webp)$/i.test(v)) return v;
  if (/^https:\/\/[^\s"'<>]+$/i.test(v) && v.length <= 500) return v;
  return null;
}

export interface FilaMarca {
  nombre_publico?: string | null;
  logo_panel?: string | null;
  logo_ref?: string | null;
  colores?: unknown;
}

export interface MarcaResuelta extends Marca {
  /** Logo del panel (menú, selector, Teléfono). */
  logoPanel: string;
  /** De dónde salió el logo del panel, para mostrarlo en Configuración. */
  origenLogo: "configuracion" | "original";
  /** Logo de las piezas de Contenido (si no hay uno propio, el del panel). */
  logoPiezas: string;
  colores: Record<string, string>;
}

/**
 * Marca efectiva de un perfil. Prioridad: lo guardado en Configuración
 * (`logo_panel`, `nombre_publico`, `colores`) → valores por defecto de
 * `MARCAS`. El logo de las piezas usa `logo_ref` (el de la landing) y, si no
 * hay, el del panel.
 */
export function resolverMarca(slug: unknown, fila?: FilaMarca | null): MarcaResuelta {
  const base = marcaDe(slug);
  const propio = logoValido(fila?.logo_panel);
  const logoPanel = propio ?? base.logo;
  const colores = normalizarColores(fila?.colores);
  return {
    ...base,
    nombre: fila?.nombre_publico?.trim() || base.nombre,
    logo: logoPanel,
    logoPanel,
    origenLogo: propio ? "configuracion" : "original",
    logoPiezas: logoValido(fila?.logo_ref) ?? logoPanel,
    colores,
  };
}

/* ───────────── Roles de color por perfil ───────────── */

export interface RolesColor {
  /** Fondo de lectura del contenido. */
  superficie: string;
  /** Texto principal sobre la superficie (≥ 4,5:1). */
  texto: string;
  /** Texto secundario y metadatos sobre la superficie (≥ 4,5:1). */
  textoSuave: string;
  /** Bordes de controles y foco (≥ 3:1 sobre la superficie). */
  bordeControl: string;
  /** Separadores decorativos (sin requisito de contraste). */
  divisor: string;
  /** Fondo de la fila o ítem seleccionado. */
  seleccion: string;
  /** Texto sobre la selección (≥ 4,5:1). */
  textoSeleccion: string;
  /** Botón de acción principal. */
  accion: string;
  /** Texto sobre la acción principal (≥ 4,5:1). */
  textoAccion: string;
  /** Fondo del menú y la placa del logo. */
  menu: string;
  /** Texto del menú (≥ 4,5:1 sobre `menu`). */
  textoMenu: string;
}

/**
 * Funciones de cada color de las paletas aprobadas. Solo colores de la
 * paleta, más blanco para la superficie de lectura donde la paleta no trae
 * un claro neutro. Los contrastes se comprueban en
 * tests/unitarias/marca.test.ts.
 */
export const ROLES: Record<SlugPerfil, RolesColor> = {
  juridico: {
    superficie: "#F5F4F0", texto: "#112250", textoSuave: "#3B507D", bordeControl: "#3B507D", divisor: "#BEB7A7",
    seleccion: "#E7E2CE", textoSeleccion: "#112250", accion: "#112250", textoAccion: "#F5F4F0", menu: "#112250", textoMenu: "#F5F4F0",
  },
  coberturas_medicas: {
    superficie: "#FFFFFF", texto: "#051F20", textoSuave: "#235347", bordeControl: "#235347", divisor: "#8EB69B",
    seleccion: "#DAF1DE", textoSeleccion: "#0B2B26", accion: "#163832", textoAccion: "#DAF1DE", menu: "#051F20", textoMenu: "#DAF1DE",
  },
  agencia_0km: {
    superficie: "#FFFFFF", texto: "#000521", textoSuave: "#011F65", bordeControl: "#0E4EB2", divisor: "#2078CF",
    seleccion: "#020C47", textoSeleccion: "#FFFFFF", accion: "#0E4EB2", textoAccion: "#FFFFFF", menu: "#000521", textoMenu: "#FFFFFF",
  },
  marketing: {
    superficie: "#FFFFFF", texto: "#1B1B1B", textoSuave: "#323232", bordeControl: "#323232", divisor: "#FFE7D0",
    seleccion: "#FFE7D0", textoSeleccion: "#1B1B1B", accion: "#FC6E20", textoAccion: "#1B1B1B", menu: "#1B1B1B", textoMenu: "#FFE7D0",
  },
};

/** Contraste WCAG 2.x entre dos colores hexadecimales. */
export function contraste(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/* ───────────── Títulos de pestaña ───────────── */

/** Nombre del panel general (pantallas comunes a los cuatro perfiles). */
export const NOMBRE_PANEL = "Panel central";

/** «Pantalla · Marca» para el título de la pestaña. */
export function tituloPestana(pantalla: string, slug?: unknown): string {
  const marca = slug === undefined ? NOMBRE_PANEL : marcaDe(slug).nombre;
  return pantalla ? `${pantalla} · ${marca}` : marca;
}
