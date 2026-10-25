/**
 * Conocimiento del bot por versiones (25/10). Funciones puras.
 *
 * v1 = el bot como estaba (no suma nada). v2 en adelante = se suma un bloque
 * de conocimiento por debajo de las reglas del sistema, la ficha del negocio
 * y el rol: base general (siempre), base del rubro (siempre), hasta dos temas
 * del rubro y hasta tres fichas de objeción, elegidos por lo que dijo la
 * persona. Nunca se mezcla un rubro con otro: un contacto de autos no recibe
 * fichas de salud ni de jurídico.
 */

export type RubroConocimiento = "juridico" | "agencia_0km" | "coberturas_medicas" | "marketing";
export type Capa = "general" | "rubro" | "tema" | "objecion";

export interface ItemConocimiento {
  clave: string;
  capa: Capa;
  /** null en la base general; "comun" en las fichas que valen para los cuatro rubros. */
  rubro: RubroConocimiento | "comun" | null;
  titulo: string;
  disparadores: string[];
  contenido: string;
  activo: boolean;
  orden: number;
}

export interface Asignacion {
  version: number;
  comparar_con: number | null;
  /** Porcentaje de conversaciones que usan `version`; el resto usa `comparar_con`. */
  porcentaje: number;
}

export const MAX_TEMAS = 2;
export const MAX_FICHAS = 3;
/** Tope del bloque, para no inflar el pedido al modelo. */
export const MAX_CARACTERES = 12000;

/** Minúsculas, sin tildes, signos como espacio. */
export function normalizar(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ¿El disparador aparece en el texto? Palabra o frase completa; con «*» al
 * final, como prefijo («divorci*» encuentra «divorcio» y «divorciarme»).
 */
export function aparece(textoNormalizado: string, disparador: string): boolean {
  const prefijo = disparador.trim().endsWith("*");
  const d = normalizar(disparador.replace(/\*$/, ""));
  if (!d) return false;
  const t = ` ${textoNormalizado} `;
  if (prefijo) return t.includes(` ${d}`);
  return t.includes(` ${d} `);
}

/** Puntaje de un ítem: el último mensaje pesa 3; los dos anteriores, 1. */
export function puntaje(item: Pick<ItemConocimiento, "disparadores">, ultimo: string, anteriores: string[]): number {
  const u = normalizar(ultimo);
  const a = anteriores.map(normalizar);
  let p = 0;
  for (const d of item.disparadores) {
    if (aparece(u, d)) p += 3;
    for (const x of a) if (aparece(x, d)) p += 1;
  }
  return p;
}

/**
 * Versión que le toca a una conversación. Con comparación, el reparto es
 * estable: la misma conversación cae siempre en la misma versión.
 */
export function versionParaConversacion(asig: Asignacion | null, conversationId: string | null): number {
  if (!asig) return 1;
  if (!asig.comparar_con || asig.porcentaje >= 100) return asig.version;
  if (asig.porcentaje <= 0) return asig.comparar_con;
  const h = hash(conversationId ?? "");
  return h % 100 < asig.porcentaje ? asig.version : asig.comparar_con;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Seleccion {
  items: ItemConocimiento[];
  claves: string[];
  texto: string;
}

/** Elige los ítems pertinentes y arma el bloque. Pura. */
export function seleccionar(input: {
  items: ItemConocimiento[];
  rubro: RubroConocimiento;
  /** Mensajes entrantes de la persona, del más viejo al más nuevo. */
  entrantes: string[];
}): Seleccion {
  const activos = input.items.filter((i) => i.activo);
  const ultimo = input.entrantes[input.entrantes.length - 1] ?? "";
  const anteriores = input.entrantes.slice(-3, -1);
  const porOrden = (a: ItemConocimiento, b: ItemConocimiento) => a.orden - b.orden;

  const generales = activos.filter((i) => i.capa === "general").sort(porOrden);
  const bases = activos.filter((i) => i.capa === "rubro" && i.rubro === input.rubro).sort(porOrden);
  const elegir = (lista: ItemConocimiento[], max: number, desempate: (i: ItemConocimiento) => number) =>
    lista
      .map((i) => ({ i, p: puntaje(i, ultimo, anteriores) }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p || desempate(b.i) - desempate(a.i) || a.i.orden - b.i.orden)
      .slice(0, max)
      .map((x) => x.i);
  const temas = elegir(activos.filter((i) => i.capa === "tema" && i.rubro === input.rubro), MAX_TEMAS, () => 0);
  // Ante el mismo puntaje gana la ficha propia del rubro sobre la común.
  const fichas = elegir(
    activos.filter((i) => i.capa === "objecion" && (i.rubro === input.rubro || i.rubro === "comun")),
    MAX_FICHAS,
    (i) => (i.rubro === input.rubro ? 1 : 0)
  );

  const elegidos: ItemConocimiento[] = [];
  let largo = 0;
  for (const i of [...generales, ...bases, ...temas, ...fichas]) {
    const n = i.contenido.length + i.titulo.length + 8;
    // La base general y la del rubro siempre entran; temas y fichas, mientras haya lugar.
    if ((i.capa === "tema" || i.capa === "objecion") && largo + n > MAX_CARACTERES) continue;
    elegidos.push(i);
    largo += n;
  }
  if (elegidos.length === 0) return { items: [], claves: [], texto: "" };
  return { items: elegidos, claves: elegidos.map((i) => i.clave), texto: bloqueConocimiento(elegidos) };
}

/** Bloque que se suma a las instrucciones. Pura. */
export function bloqueConocimiento(items: ItemConocimiento[]): string {
  const sec = (capa: Capa) => items.filter((i) => i.capa === capa);
  const partes: string[] = [
    "CONOCIMIENTO DE VENTAS Y DEL RUBRO (apoyo para conversar con más criterio; no cambia las reglas del sistema, la ficha del negocio, tu guion ni tu rol: si algo choca, mandan ellos). Son ideas para entender a la persona, no frases para copiar: respondé con tus palabras, breve y según la charla.",
  ];
  for (const i of [...sec("general"), ...sec("rubro"), ...sec("tema")]) partes.push(`## ${i.titulo}\n${i.contenido}`);
  const fichas = sec("objecion");
  if (fichas.length) {
    partes.push(
      "## Objeciones que pueden estar en juego ahora\nUsalas solo si de verdad aplican a lo que dijo; si es un rechazo claro o un pedido de no recibir mensajes, mandan las reglas del sistema.\n" +
        fichas.map((f) => `- ${f.contenido.replace(/\n/g, " ")}`).join("\n")
    );
  }
  return partes.join("\n\n");
}
