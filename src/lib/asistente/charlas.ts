import { SLUGS_PERFIL, type SlugPerfil } from "@/lib/marca";

/**
 * Charlas guardadas del asistente (20/11, pedido de la Bandeja para Claude).
 * Reglas puras: qué se guarda de cada mensaje, el título de la charla y de qué
 * lista es (asistente general o Laboratorio de un perfil). Sin acceso a datos.
 *
 * Se guarda solo el texto, las propuestas tal como se mostraron y los botones
 * a pantallas. Nunca imágenes, PDF ni filas de planillas.
 */

export const MAX_TEXTO_MENSAJE = 8000;
export const MAX_MENSAJES_POR_ENVIO = 20;
export const MAX_PROPUESTAS_POR_MENSAJE = 12;
export const MAX_BYTES_PROPUESTAS = 200_000;
export const MAX_ENLACES_POR_MENSAJE = 8;
export const MAX_TITULO = 80;
export const CHARLAS_EN_LISTA = 30;
/** Tope del cuerpo de cada pedido de guardado (bytes). */
export const MAX_CUERPO = 4_500_000;

export type AmbitoCharla = { ambito: "general"; perfil: null } | { ambito: "laboratorio"; perfil: SlugPerfil };

export interface MensajeGuardado {
  rol: "usuario" | "asistente";
  texto: string;
  propuestas: Record<string, unknown>[];
  enlaces: { href: string; texto: string }[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esIdCharla = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Lista a la que pertenece la charla: sin perfil, la general; con perfil válido, la del Laboratorio. */
export function ambitoDe(perfil: unknown): AmbitoCharla | { error: string } {
  if (perfil === undefined || perfil === null || perfil === "") return { ambito: "general", perfil: null };
  if (typeof perfil === "string" && (SLUGS_PERFIL as readonly string[]).includes(perfil)) return { ambito: "laboratorio", perfil: perfil as SlugPerfil };
  return { error: "Perfil no válido." };
}

/** Solo enlaces internos del panel («/algo»), nunca a otros sitios. */
function enlacesSeguros(v: unknown): MensajeGuardado["enlaces"] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e) => e && typeof e.href === "string" && typeof e.texto === "string" && /^\/(?!\/)[^\s\\]*$/.test(e.href) && !e.href.startsWith("/api/") && e.href.length <= 300 && e.texto.trim())
    .slice(0, MAX_ENLACES_POR_MENSAJE)
    .map((e) => ({ href: e.href, texto: String(e.texto).slice(0, 120) }));
}

/** Propuestas como se mostraron: tienen que tener id de propuesta y entrar en el tope de tamaño. */
function propuestasSeguras(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  const validas = v
    .filter((p) => p && typeof p === "object" && esIdCharla((p as any).id) && typeof (p as any).tipo === "string")
    .slice(0, MAX_PROPUESTAS_POR_MENSAJE) as Record<string, unknown>[];
  // Si no entran en el tope, se guardan sin el detalle (al abrir la charla se vuelve a leer de la base).
  if (JSON.stringify(validas).length <= MAX_BYTES_PROPUESTAS) return validas;
  return validas.map(({ id, tipo, titulo, resumen, estado }) => ({ id, tipo, titulo: String(titulo ?? "").slice(0, 200), resumen: String(resumen ?? "").slice(0, 1000), estado }));
}

/**
 * Mensajes que llegan del navegador para guardar. Descarta los de error y los
 * vacíos; recorta el texto. Devuelve error si no queda ninguno válido.
 */
export function sanearMensajes(v: unknown): { mensajes: MensajeGuardado[] } | { error: string } {
  if (!Array.isArray(v) || v.length === 0) return { error: "No hay mensajes para guardar." };
  if (v.length > MAX_MENSAJES_POR_ENVIO) return { error: "Demasiados mensajes juntos." };
  const mensajes: MensajeGuardado[] = [];
  for (const m of v) {
    if (!m || (m.rol !== "usuario" && m.rol !== "asistente") || m.error) continue;
    const texto = typeof m.texto === "string" ? m.texto.trim().slice(0, MAX_TEXTO_MENSAJE) : "";
    if (!texto) continue;
    mensajes.push({
      rol: m.rol,
      texto,
      propuestas: m.rol === "asistente" ? propuestasSeguras(m.propuestas) : [],
      enlaces: m.rol === "asistente" ? enlacesSeguros(m.enlaces) : [],
    });
  }
  return mensajes.length ? { mensajes } : { error: "No hay mensajes para guardar." };
}

/** Título de la charla: el primer pedido, en una línea y recortado. */
export function tituloDeCharla(mensajes: { rol: string; texto: string }[]): string {
  const primero = mensajes.find((m) => m.rol === "usuario")?.texto ?? mensajes[0]?.texto ?? "";
  const linea = primero.replace(/\s+/g, " ").trim();
  if (!linea) return "Charla sin título";
  return linea.length > MAX_TITULO ? `${linea.slice(0, MAX_TITULO - 1).trimEnd()}…` : linea;
}

/**
 * Al abrir una charla, cada propuesta toma el estado actual guardado en la
 * base (pudo confirmarse, descartarse o terminar después). Las que ya no
 * existen quedan como se mostraron. Pura.
 */
export function refrescarPropuestas(
  propuestas: Record<string, unknown>[],
  actuales: Map<string, { titulo?: string; resumen?: string; estado?: string; resultado?: unknown; payload?: unknown; tipo?: string }>
): Record<string, unknown>[] {
  return propuestas.map((p) => {
    const a = actuales.get(String(p.id));
    if (!a) return p;
    const nueva: Record<string, unknown> = { ...p, tipo: a.tipo ?? p.tipo, estado: a.estado ?? p.estado, titulo: a.titulo ?? p.titulo, resumen: a.resumen ?? p.resumen };
    if (a.resultado !== undefined && a.resultado !== null) nueva.resultado = a.resultado;
    // El boceto de campañas se edita antes de confirmar: el detalle vigente es el guardado.
    if (a.tipo === "plan_campanas" && a.payload) nueva.detalle = a.payload;
    return nueva;
  });
}

/** Ids de propuestas de una lista de mensajes, sin repetir. */
export function idsDePropuestas(mensajes: { propuestas?: Record<string, unknown>[] }[]): string[] {
  return Array.from(new Set(mensajes.flatMap((m) => (m.propuestas ?? []).map((p) => String(p.id))).filter(esIdCharla)));
}
