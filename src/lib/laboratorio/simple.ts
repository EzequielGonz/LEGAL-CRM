/**
 * Laboratorio simple (15/11, pedido de la responsable: «demasiado técnico, no
 * sé ni cómo usarlo»). Funciones puras que usan la pantalla nueva del
 * laboratorio y las herramientas del asistente para crear, probar, usar y
 * volver atrás una versión del bot de un perfil. Sin acceso a datos.
 */
import { esRubro, modeloValido, type FichaNueva, type PedidoVersion, type Rubro } from "./reglas";

// ---------------------------------------------------------------------------
// Versiones de un perfil
// ---------------------------------------------------------------------------

export interface VersionParaLista {
  version: number;
  nombre: string;
  descripcion?: string;
  rubros: Rubro[];
  modelo: string | null;
  laboratorio: boolean;
  estado: "borrador" | "en_prueba" | "activa" | "archivada";
}

export interface VersionDelPerfil {
  version: number;
  nombre: string;
  descripcion: string;
  modelo: string | null;
  /** Es la que responde hoy las charlas de este perfil. */
  rige: boolean;
  /** Se creó en el laboratorio (v3 en adelante): se puede probar o usar. */
  nueva: boolean;
}

/**
 * Versiones que sirven para un perfil, cortas y en orden: primero la que rige,
 * después las nuevas (de la más reciente a la más vieja). Las archivadas no
 * se muestran. v1 y v2 solo aparecen si son la que rige.
 */
export function versionesDelPerfil(versiones: VersionParaLista[], rubro: Rubro, vigente: number, max = 6): VersionDelPerfil[] {
  const lista = versiones
    .filter((v) => v.estado !== "archivada")
    .filter((v) => v.version === vigente || (v.laboratorio && v.rubros.includes(rubro)))
    .map((v) => ({ version: v.version, nombre: v.nombre, descripcion: v.descripcion ?? "", modelo: v.modelo, rige: v.version === vigente, nueva: v.laboratorio }));
  lista.sort((a, b) => (a.rige !== b.rige ? (a.rige ? -1 : 1) : b.version - a.version));
  return lista.slice(0, max);
}

/** Versión que rige en un perfil (si no hay asignación, la v2). */
export function versionVigente(asignaciones: { rubro: string; version: number }[], rubro: Rubro): number {
  return Number(asignaciones.find((a) => a.rubro === rubro)?.version ?? 2);
}

/** La última vez que se cambió la versión de este perfil y sigue vigente: es lo que deshace «Volver a la anterior». */
export function aplicacionParaVolver<T extends { id: string; tipo: string; rubro: string; aplicada_at: string }>(aplicaciones: T[], rubro: Rubro): T | null {
  const deEste = aplicaciones.filter((a) => a.tipo === "version_perfil" && a.rubro === rubro);
  deEste.sort((a, b) => Date.parse(b.aplicada_at) - Date.parse(a.aplicada_at));
  return deEste[0] ?? null;
}

// ---------------------------------------------------------------------------
// Prueba simulada: resumen corto
// ---------------------------------------------------------------------------

export interface ResultadoCaso {
  rubro?: string;
  titulo?: string;
  variante?: string;
  turnos?: { rol: string; texto: string }[];
  evaluacion?: { ok: boolean; nota?: string };
  error?: string;
}

export interface ResumenPrueba {
  total: number;
  bien: number;
  revisar: number;
  sinCorrer: number;
  frase: string;
  ejemplos: { titulo: string; pregunta: string; respuesta: string; bien: boolean; nota: string }[];
}

const corto = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t);

/**
 * Resume una prueba simulada en una frase y 2 o 3 ejemplos (primero los que
 * hay que revisar). Solo cuenta la versión nueva (no la comparación con la que rige).
 */
export function resumenPrueba(resultados: ResultadoCaso[] | null | undefined, maxEjemplos = 3): ResumenPrueba {
  const nuevos = (resultados ?? []).filter((r) => (r.variante ?? "nueva") === "nueva");
  const corridos = nuevos.filter((r) => !r.error && r.evaluacion);
  const bien = corridos.filter((r) => r.evaluacion!.ok).length;
  const revisar = corridos.length - bien;
  const sinCorrer = nuevos.length - corridos.length;
  const ordenados = [...corridos].sort((a, b) => Number(a.evaluacion!.ok) - Number(b.evaluacion!.ok));
  const ejemplos = ordenados.slice(0, maxEjemplos).map((r) => {
    const pregunta = r.turnos?.find((t) => t.rol === "persona")?.texto ?? "";
    const respuesta = r.turnos?.find((t) => t.rol === "bot" && t.texto && !t.texto.startsWith("("))?.texto ?? r.turnos?.find((t) => t.rol === "bot")?.texto ?? "";
    return { titulo: r.titulo ?? "Caso", pregunta: corto(pregunta, 160), respuesta: corto(respuesta, 280), bien: r.evaluacion!.ok, nota: r.evaluacion!.nota ?? "" };
  });
  let frase: string;
  if (!nuevos.length) frase = "Todavía no hay respuestas para mostrar.";
  else if (!corridos.length) frase = "No se pudo correr ninguna charla de prueba. Probá de nuevo en un rato.";
  else frase = `${bien} de ${corridos.length} respuestas salieron bien${revisar ? `; ${revisar} conviene mirarlas` : ""}${sinCorrer ? ` (${sinCorrer} no se pudieron correr)` : ""}.`;
  return { total: nuevos.length, bien, revisar, sinCorrer, frase, ejemplos };
}

// ---------------------------------------------------------------------------
// Gráfico «Cómo viene cada versión»
// ---------------------------------------------------------------------------

export interface CifrasVersion {
  version: number;
  conversaciones: number;
  tasa_sigue: number;
  tasa_captacion: number;
  tasa_escalado: number;
  suficiente: boolean;
}

export const METRICAS_SIMPLES = [
  { clave: "tasa_sigue", titulo: "Siguieron la charla", ayuda: "De cada 100 personas que escribieron, cuántas siguieron hablando con el bot." },
  { clave: "tasa_captacion", titulo: "Captados", ayuda: "De cada 100, cuántas dejaron sus datos para que las contacten." },
  { clave: "tasa_escalado", titulo: "Pasaron a una persona", ayuda: "De cada 100, cuántas pidieron o necesitaron hablar con alguien del equipo." },
] as const;

export interface BarraVersion {
  version: number;
  etiqueta: string;
  rige: boolean;
  valor: number;
  conversaciones: number;
}

export interface GraficoVersiones {
  /** Hay datos de al menos una versión. */
  hayDatos: boolean;
  /** Alcanza para comparar (la que rige y al menos otra con charlas suficientes). */
  alcanza: boolean;
  metricas: { clave: string; titulo: string; ayuda: string; barras: BarraVersion[] }[];
}

/** Arma las barras: la versión que rige primero y las nuevas después (hasta 3). */
export function graficoVersiones(cifras: CifrasVersion[], vigente: number, nombres: Record<number, string> = {}, maxNuevas = 3): GraficoVersiones {
  const conDatos = cifras.filter((c) => c.conversaciones > 0);
  const rige = conDatos.find((c) => c.version === vigente) ?? null;
  const otras = conDatos.filter((c) => c.version > 2 && c.version !== vigente).sort((a, b) => b.version - a.version).slice(0, maxNuevas);
  const elegidas = [...(rige ? [rige] : []), ...otras];
  const etiqueta = (v: number) => `${nombres[v] ? `${nombres[v]} ` : ""}(v${v})${v === vigente ? " · rige ahora" : ""}`;
  return {
    hayDatos: elegidas.length > 0,
    alcanza: !!rige && rige.suficiente && otras.some((o) => o.suficiente),
    metricas: METRICAS_SIMPLES.map((m) => ({
      clave: m.clave,
      titulo: m.titulo,
      ayuda: m.ayuda,
      barras: elegidas.map((c) => ({ version: c.version, etiqueta: etiqueta(c.version), rige: c.version === vigente, valor: Math.max(0, Math.min(100, Number(c[m.clave]) || 0)), conversaciones: c.conversaciones })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Modelos con nombre amigable
// ---------------------------------------------------------------------------

/** Nombre y una línea en palabras simples para un modelo de Gemini. */
export function modeloEnPalabras(id: string): { nombre: string; linea: string } {
  const m = id.toLowerCase();
  const version = m.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? "";
  const n = version ? `Gemini ${version}` : "Gemini";
  if (/lite/.test(m)) return { nombre: `${n} Liviano`, linea: "El más rápido y económico; respuestas más simples." };
  if (/flash/.test(m)) return { nombre: `${n} Rápido`, linea: "Rápido y equilibrado: el uso de todos los días." };
  if (/pro/.test(m)) return { nombre: `${n} Completo`, linea: "Más completo y cuidadoso; tarda un poco más." };
  return { nombre: n, linea: "Otro modelo disponible." };
}

// ---------------------------------------------------------------------------
// Versión nueva pedida al asistente
// ---------------------------------------------------------------------------

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Arma el pedido de versión nueva a partir de lo que propone el asistente:
 * copia de la versión que rige, solo para este perfil, con tono, reglas,
 * fichas nuevas y modelo (de la lista disponible). La validación completa la
 * hace `validarVersion` al crearla.
 */
export function pedidoVersionDelAsistente(
  args: Record<string, unknown>,
  rubro: Rubro,
  vigente: number,
  modelosDisponibles: string[]
): { ok: true; pedido: PedidoVersion; cambios: string[] } | { ok: false; error: string } {
  if (!esRubro(rubro)) return { ok: false, error: "Perfil no válido." };
  const nombre = txt(args.nombre, 70);
  if (nombre.length < 2) return { ok: false, error: "Falta un nombre corto para la versión (por ejemplo «Más breve y cálida»)." };
  const tono = txt(args.tono, 1500);
  const reglas = txt(args.reglas, 4000);
  const modelo = txt(args.modelo, 80);
  if (modelo && (!modeloValido(modelo) || !modelosDisponibles.includes(modelo))) {
    return { ok: false, error: `Ese modelo no está disponible. Elegí uno de estos: ${modelosDisponibles.join(", ") || "(ninguno)"}.` };
  }
  const fichas: FichaNueva[] = (Array.isArray(args.fichas) ? args.fichas : []).slice(0, 10).map((f) => {
    const x = (f ?? {}) as Record<string, unknown>;
    return {
      capa: x.tipo === "objecion" ? "objecion" : "tema",
      rubro,
      titulo: txt(x.titulo, 160),
      disparadores: (Array.isArray(x.frases) ? x.frases : typeof x.frases === "string" ? x.frases.split(",") : []).filter((d): d is string => typeof d === "string").slice(0, 20),
      contenido: txt(x.texto, 4000),
    };
  });
  const cambios = [
    tono ? "cómo habla" : null,
    reglas ? "reglas extra" : null,
    fichas.length ? `${fichas.length} ficha(s) nueva(s)` : null,
    modelo ? `modelo ${modeloEnPalabras(modelo).nombre}` : null,
  ].filter((x): x is string => !!x);
  if (!cambios.length) return { ok: false, error: "La versión nueva tiene que cambiar algo: cómo habla, reglas, fichas o el modelo." };
  return {
    ok: true,
    cambios,
    pedido: { nombre, descripcion: txt(args.que_cambia, 900), base_version: vigente, rubros: [rubro], modelo: modelo || null, tono, reglas, fichas },
  };
}

// ---------------------------------------------------------------------------
// Bot de base: instrucciones escritas a mano
// ---------------------------------------------------------------------------

/**
 * Valida las instrucciones del bot de base. No deja SUMAR teléfonos ni correos
 * (los que ya estaban, como el del estudio, se conservan).
 */
export function validarInstrucciones(v: unknown, anterior = ""): { ok: true; texto: string } | { ok: false; error: string } {
  const texto = String(v ?? "").replace(/\r\n/g, "\n").trim();
  if (texto.length < 40) return { ok: false, error: "Las instrucciones son muy cortas: el bot necesita al menos unas líneas para saber qué hacer." };
  if (texto.length > 30_000) return { ok: false, error: "Las instrucciones son demasiado largas (máximo 30.000 caracteres)." };
  const datos = (t: string) => new Set([...(t.replace(/[\s\-().]/g, "").match(/\d{8,}/g) ?? []), ...(t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [])]);
  const antes = datos(anterior);
  if (Array.from(datos(texto)).some((d) => !antes.has(d))) return { ok: false, error: "No sumes teléfonos ni correos de personas a las instrucciones." };
  return { ok: true, texto };
}

/** Nombre de la variable de entorno para la clave de un proveedor, a partir de su nombre. */
export function variableDeProveedor(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `LAB_PROVEEDOR_${base || "OTRO"}_API_KEY`;
}
