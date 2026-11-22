/**
 * Centro de mando del Cerebro (vuelta 6, 22/11). Funciones puras del anillo de pantallas y de la
 * barra «Preguntale · Enseñale · Ordenale»: geometría del anillo (qué pantalla queda al frente al
 * girar), el pedido que arma «Ordenale» para la Oficina y la lectura del informe de Graphify.
 * Sin datos de personas: solo textos del dueño, cifras y nombres de archivos del código.
 */

/** Las pantallas del anillo, en el orden en que aparecen al girar (la primera arranca al frente). */
export const PANTALLAS = [
  { id: "pendientes", titulo: "Pendientes de los dueños", corto: "Pendientes", color: "amarillo" },
  { id: "oficina", titulo: "Oficina", corto: "Oficina", color: "violeta" },
  { id: "jarvis", titulo: "Jarvis", corto: "Jarvis", color: "rosa" },
  { id: "recomienda", titulo: "Lo que recomienda hoy", corto: "Recomienda", color: "agua" },
  { id: "aprendido", titulo: "Lo aprendido", corto: "Aprendido", color: "lila" },
  { id: "decisiones", titulo: "Decisiones y órdenes", corto: "Decisiones", color: "coral" },
  { id: "semana", titulo: "La semana en cifras", corto: "Semana", color: "cielo" },
  { id: "salud", titulo: "Salud del panel", corto: "Salud", color: "lima" },
  { id: "laboratorio", titulo: "Laboratorio de bots", corto: "Laboratorio", color: "durazno" },
  { id: "mapa", titulo: "Mapa del código", corto: "Mapa", color: "menta" },
  { id: "claude", titulo: "Pedidos a Claude", corto: "Claude", color: "fucsia" },
] as const;

export type IdPantalla = (typeof PANTALLAS)[number]["id"];

export const esIdPantalla = (v: unknown): v is IdPantalla => typeof v === "string" && PANTALLAS.some((p) => p.id === v);

/**
 * Secciones viejas del cerebro (enlaces `#alertas`, `#preguntas`… que siguen dando vueltas en la
 * Bandeja y en el buscador) → la pantalla del anillo que las aloja ahora. Nada se perdió: se mudó.
 */
const SECCION_VIEJA: Record<string, IdPantalla> = {
  veo: "semana",
  alertas: "salud",
  preguntas: "pendientes",
  hablar: "claude",
  asistente: "jarvis",
  laboratorio: "laboratorio",
  entiendo: "semana",
  pendientes: "pendientes",
  propuestas: "recomienda",
  corregi: "decisiones",
  estado: "pendientes",
  recomienda: "recomienda",
  herramientas: "aprendido",
};

/** Pantalla que abre una dirección con `#algo` (nueva o vieja). Null si no corresponde a ninguna. */
export function pantallaDeAncla(ancla: string | null | undefined): IdPantalla | null {
  const a = (ancla ?? "").replace(/^#/, "").trim().toLowerCase();
  if (!a) return null;
  if (esIdPantalla(a)) return a;
  return SECCION_VIEJA[a] ?? null;
}

/** Ángulo (grados) entre dos pantallas vecinas. */
export function paso(n: number): number {
  return n > 0 ? 360 / n : 0;
}

/** Índice de la pantalla que queda al frente con un giro dado (grados; positivo = hacia la izquierda). */
export function indiceAlFrente(giro: number, n: number): number {
  if (n <= 0 || !Number.isFinite(giro)) return 0;
  const i = Math.round(giro / paso(n));
  return ((i % n) + n) % n;
}

/**
 * Giro que trae la pantalla `i` al frente por el camino más corto desde el giro actual
 * (así, ir de la última a la primera no da la vuelta entera).
 */
export function giroHacia(i: number, giroActual: number, n: number): number {
  if (n <= 0) return 0;
  const p = paso(n);
  const actual = Number.isFinite(giroActual) ? giroActual : 0;
  const base = i * p;
  const vueltas = Math.round((actual - base) / 360);
  return base + vueltas * 360;
}

/** Ajusta el giro a la pantalla más cercana (al soltar el arrastre o la rueda). */
export function ajustar(giro: number, n: number): number {
  if (n <= 0 || !Number.isFinite(giro)) return 0;
  const p = paso(n);
  return Math.round(giro / p) * p;
}

/**
 * Posición de cada pantalla en el anillo: el ángulo propio menos el giro, normalizado a −180…180.
 * `cercania` va de 1 (al frente) a 0 (atrás): sirve para el brillo y para quién recibe clics.
 */
export function posicion(i: number, giro: number, n: number): { angulo: number; cercania: number } {
  const p = paso(n);
  let a = (i * p - (Number.isFinite(giro) ? giro : 0)) % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return { angulo: a, cercania: 1 - Math.abs(a) / 180 };
}

/** Radio del anillo para que `n` pantallas de `ancho` px queden con `aire` px entre sí. */
export function radioAnillo(n: number, ancho: number, aire = 28): number {
  if (n < 3) return ancho;
  return Math.round((ancho + aire) / (2 * Math.tan(Math.PI / n)));
}

// --- «Ordenale» ---------------------------------------------------------------

export const MIN_ORDEN = 8;
export const MAX_ORDEN = 1500;

/** Pedido que «Ordenale» deja en la Oficina: la orden del dueño tal cual, con su origen y el cierre de siempre. */
export function pedidoOrden(texto: string): { ok: true; pedido: string } | { ok: false; error: string } {
  const t = (texto ?? "").replace(/\s+/g, " ").trim();
  if (t.length < MIN_ORDEN) return { ok: false, error: "Contale un poco más qué querés que hagan (al menos una frase corta)." };
  if (t.length > MAX_ORDEN) return { ok: false, error: "Quedó muy largo: acortalo un poco." };
  return { ok: true, pedido: `Orden del dueño desde el Cerebro: ${t}\nRepartila entre los escritorios que correspondan y dejá el resultado como borrador para su OK.` };
}

/** Pedido a la Oficina a partir de una recomendación del cerebro. */
export function pedidoDeRecomendacion(titulo: string, porque: string): string {
  return `Recomendación del cerebro convertida en pedido: ${titulo}. Por qué: ${porque}\nArmá la propuesta y dejala como borrador para el OK de los dueños.`.slice(0, MAX_ORDEN + 200);
}

// --- Mapa del código (Graphify) ---------------------------------------------

export interface ResumenGrafo {
  fecha: string | null;
  archivos: number | null;
  nodos: number | null;
  relaciones: number | null;
  comunidades: number | null;
  /** Las piezas más conectadas del código, con cuántas conexiones tienen. */
  centrales: { nombre: string; conexiones: number }[];
  /** Los grandes barrios del código (comunidades con nombre de archivo). */
  barrios: string[];
}

const entero = (s: string | undefined) => {
  if (!s) return null;
  const n = Number(s.replace(/[.,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Lee `cerebro/mapa-codigo/GRAPH_REPORT.md` (lo arma Graphify). Tolera un informe incompleto. */
export function resumenGrafo(md: string): ResumenGrafo {
  const texto = md ?? "";
  const fecha = /# Graph Report[^(]*\((\d{4}-\d{2}-\d{2})\)/.exec(texto)?.[1] ?? null;
  const archivos = entero(/-\s*([\d.,]+)\s+files/.exec(texto)?.[1]);
  const res = /-\s*([\d.,]+)\s+nodes\s*·\s*([\d.,]+)\s+edges\s*·\s*([\d.,]+)\s+communities/.exec(texto);
  const centrales: ResumenGrafo["centrales"] = [];
  const dios = texto.split(/^## God Nodes.*$/m)[1]?.split(/^## /m)[0] ?? "";
  for (const m of dios.matchAll(/^\d+\.\s+`([^`]+)`\s+-\s+(\d+)\s+edges/gm)) centrales.push({ nombre: m[1], conexiones: Number(m[2]) });
  const hubs = texto.split(/^## Community Hubs.*$/m)[1]?.split(/^## /m)[0] ?? "";
  const barrios = [...hubs.matchAll(/^-\s+(.+)$/gm)].map((m) => m[1].trim()).filter((b) => !b.startsWith("ref_")).slice(0, 40);
  return { fecha, archivos, nodos: entero(res?.[1]), relaciones: entero(res?.[2]), comunidades: entero(res?.[3]), centrales: centrales.slice(0, 10), barrios };
}

/** Filtra los barrios del mapa por palabras (sin tildes ni mayúsculas). */
export function filtrarBarrios(barrios: string[], q: string): string[] {
  const n = sinTildes(q.trim());
  if (!n) return barrios;
  return barrios.filter((b) => sinTildes(b).includes(n));
}

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
