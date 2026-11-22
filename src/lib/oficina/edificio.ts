/**
 * Edificio de la Oficina (22/11). Funciones puras: plano de las salas, puestos dentro de cada sala,
 * rutas de los mensajeros hacia el Cerebro, fase del paseo y cámara. Sin navegador, sin azar y sin
 * fecha: lo mismo en el servidor y en el cliente. Unidades: metros de la escena; x crece hacia la
 * derecha, z hacia el frente (hacia la cámara). Corte tipo casa de muñecas: sin techo.
 */
import type { Area } from "@/lib/oficina/reglas";

export type Lado = "N" | "S" | "E" | "O";
export type Punto = [number, number];

export interface Sala {
  area: Area;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  cx: number;
  cz: number;
  /** Lado de la pared con la puerta que da al pasillo. */
  lado: Lado;
  puerta: Punto;
  /** Pasillo interior por el que se sale hacia la puerta (z para salas N/S, ignorado en E/O). */
  caminoZ: number;
  /** Puntos desde la puerta hasta donde se deja la carpeta en el Cerebro. */
  fuera: Punto[];
}

export const CORREDOR = 2.2;
const COLS: [number, number][] = [
  [-17.2, -8.2],
  [-6, 6],
  [8.2, 17.2],
];
const FILAS: [number, number][] = [
  [-13.9, -7.3],
  [-5.1, 5.1],
  [7.3, 13.9],
];

function sala(area: Area, c: number, f: number, lado: Lado, puerta: Punto, caminoZ: number, fuera: Punto[]): Sala {
  const [x0, x1] = COLS[c];
  const [z0, z1] = FILAS[f];
  return { area, x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, lado, puerta, caminoZ, fuera };
}

/** Escritorio del Cerebro donde se apilan las hojas: ahí dejan sus carpetas los mensajeros. */
export const BANDEJA_CEREBRO: Punto = [0, -3.0];

const DESDE_NORTE: Punto[] = [[0, -3.95]];
const DESDE_OESTE: Punto[] = [[-4.3, -1.0], [-2.2, -3.1]];
const DESDE_ESTE: Punto[] = [[4.3, -1.0], [2.2, -3.1]];

export const SALAS: Record<Area, Sala> = {
  direccion: sala("direccion", 1, 1, "N", [0, -5.1], 0, []),
  analisis: sala("analisis", 0, 0, "S", [-10.5, -7.3], -8.1, [[-10.5, -6.2], [0, -6.2], [0, -5.1], ...DESDE_NORTE]),
  redes: sala("redes", 1, 0, "S", [0, -7.3], -8.1, [[0, -5.1], ...DESDE_NORTE]),
  diseno: sala("diseno", 2, 0, "S", [10.5, -7.3], -8.1, [[10.5, -6.2], [0, -6.2], [0, -5.1], ...DESDE_NORTE]),
  seo: sala("seo", 0, 1, "E", [-8.2, 0], 0, [[-7.1, 0], [-6, 0], ...DESDE_OESTE]),
  bots: sala("bots", 2, 1, "O", [8.2, 0], 0, [[7.1, 0], [6, 0], ...DESDE_ESTE]),
  ingenieria: sala("ingenieria", 0, 2, "N", [-10.5, 7.3], 8.1, [[-10.5, 6.2], [-7.1, 6.2], [-7.1, 0], [-6, 0], ...DESDE_OESTE]),
  asistente: sala("asistente", 2, 2, "N", [10.5, 7.3], 8.1, [[10.5, 6.2], [7.1, 6.2], [7.1, 0], [6, 0], ...DESDE_ESTE]),
};

/** Sala del costado de abajo, sin sector: la entrada del edificio. */
export const ENTRADA = { x0: -6, x1: 6, z0: 7.3, z1: 13.9 };
export const LIMITES = { x0: -18.4, x1: 18.4, z0: -15.1, z1: 15.1 };
export const SALAS_ORDEN: Area[] = ["direccion", "analisis", "redes", "diseno", "seo", "bots", "ingenieria", "asistente"];

export interface Asiento {
  x: number;
  z: number;
  /** Mesa donde apoya el puesto (el trabajador se sienta al sur de la mesa). */
  mesa: Punto;
  col: number;
  fila: number;
}

/** Puestos de una sala: cuatro por fila, dos filas. El Cerebro usa un arco al sur del orbe. */
export function asientosDeSala(area: Area, n: number): Asiento[] {
  const s = SALAS[area];
  const salida: Asiento[] = [];
  for (let j = 0; j < n; j++) {
    if (area === "direccion") {
      const fila = j < 4 ? 0 : 1;
      const xs = fila === 0 ? [-4, -1.35, 1.35, 4] : [-2.7, 2.7];
      const z = fila === 0 ? 1.8 : 3.6;
      const x = xs[fila === 0 ? j : j - 4];
      salida.push({ x, z: z + 0.85, mesa: [x, z], col: fila === 0 ? j : j - 4, fila });
      continue;
    }
    const fila = j < 4 ? 0 : 1;
    const col = fila === 0 ? j : j - 4;
    const x = s.cx + (col - 1.5) * 2.1;
    const alto = s.z1 - s.z0;
    let zMesa: number;
    if (alto > 8) zMesa = s.cz + (fila === 0 ? -2.6 : 1.6);
    else if (s.lado === "N") zMesa = s.z0 + (fila === 0 ? 2.0 : 4.4);
    else zMesa = s.z0 + (fila === 0 ? 1.7 : 4.1);
    salida.push({ x, z: zMesa + 0.85, mesa: [x, zMesa], col, fila });
  }
  return salida;
}

/** Ruta completa de un mensajero: de su asiento al Cerebro (el regreso es la misma ruta al revés). */
export function rutaAlCerebro(area: Area, asiento: Asiento): Punto[] {
  const s = SALAS[area];
  const lado = asiento.col < 3 ? 1.05 : -1.05;
  const ax = asiento.x + lado;
  const pts: Punto[] = [[asiento.x, asiento.z], [ax, asiento.z]];
  if (s.lado === "E" || s.lado === "O") {
    pts.push([ax, 0]);
    pts.push([s.puerta[0] + (s.lado === "E" ? -0.9 : 0.9), 0]);
  } else {
    pts.push([ax, s.caminoZ]);
    pts.push([s.puerta[0], s.caminoZ]);
  }
  pts.push(s.puerta);
  return [...pts, ...s.fuera];
}

export function largoRuta(pts: Punto[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

export interface PuntoRuta {
  x: number;
  z: number;
  /** Rumbo en radianes para girar un personaje cuyo frente es +z. */
  rumbo: number;
}

/** Punto a la distancia d desde el inicio de la ruta (acotado a los extremos). */
export function puntoEnRuta(pts: Punto[], d: number): PuntoRuta {
  if (pts.length === 1) return { x: pts[0][0], z: pts[0][1], rumbo: 0 };
  let resto = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dz = pts[i][1] - pts[i - 1][1];
    const seg = Math.hypot(dx, dz);
    if (resto <= seg || i === pts.length - 1) {
      const u = seg === 0 ? 0 : Math.min(1, resto / seg);
      return { x: pts[i - 1][0] + dx * u, z: pts[i - 1][1] + dz * u, rumbo: Math.atan2(dx, dz) };
    }
    resto -= seg;
  }
  return { x: pts[0][0], z: pts[0][1], rumbo: 0 };
}

export type FaseMensajero = "sentado" | "yendo" | "dejando" | "volviendo";

export interface PasoMensajero {
  fase: FaseMensajero;
  /** Distancia recorrida desde el asiento. */
  d: number;
  /** 0 a 1 dentro de la fase. */
  u: number;
}

export const VELOCIDAD_PASEO = 2.3;
export const ESPERA_SENTADO = 7;
export const PAUSA_ENTREGA = 1.3;

/** Duración total de un ciclo para una ruta de ese largo. */
export function cicloMensajero(largo: number, espera = ESPERA_SENTADO): number {
  return espera + (2 * largo) / VELOCIDAD_PASEO + PAUSA_ENTREGA;
}

/** En qué fase del paseo está un mensajero en el instante t. Ciclo: sentado, va, deja la carpeta, vuelve. */
export function faseMensajero(t: number, largo: number, desfase = 0, espera = ESPERA_SENTADO): PasoMensajero {
  const ida = largo / VELOCIDAD_PASEO;
  const ciclo = espera + 2 * ida + PAUSA_ENTREGA;
  let u = (((t + desfase) % ciclo) + ciclo) % ciclo;
  if (u < espera) return { fase: "sentado", d: 0, u: u / espera };
  u -= espera;
  if (u < ida) return { fase: "yendo", d: u * VELOCIDAD_PASEO, u: u / ida };
  u -= ida;
  if (u < PAUSA_ENTREGA) return { fase: "dejando", d: largo, u: u / PAUSA_ENTREGA };
  u -= PAUSA_ENTREGA;
  return { fase: "volviendo", d: largo - Math.min(ida, u) * VELOCIDAD_PASEO, u: Math.min(1, u / ida) };
}

/** Quiénes salen a pasear: los últimos puestos que trabajan, máximo dos por sala. */
export function mensajerosDeSala(trabajando: number, ocupados: number): number[] {
  const n = Math.min(2, trabajando, ocupados);
  const salida: number[] = [];
  for (let k = 0; k < n; k++) salida.push(ocupados - 1 - k);
  return salida;
}

/** Puntos para el rastro de luz del pasillo: uno cada `paso` metros a lo largo de la ruta. */
export function puntosDeRastro(pts: Punto[], paso = 1.1): Punto[] {
  const largo = largoRuta(pts);
  const salida: Punto[] = [];
  for (let d = 0.6; d < largo; d += paso) {
    const p = puntoEnRuta(pts, d);
    salida.push([p.x, p.z]);
  }
  return salida;
}

// --- Paredes con puerta -----------------------------------------------------------------------

export interface Muro {
  p: [number, number, number];
  s: [number, number, number];
}

export const ALTO_MURO: Record<Lado, number> = { N: 1.7, O: 1.05, E: 1.05, S: 0.28 };
const GROSOR = 0.16;
const PUERTA = 1.7;

function muroLinea(cx: number, cz: number, largo: number, horizontal: boolean, alto: number, hueco: number | null): Muro[] {
  const caja = (c: number, l: number): Muro => ({
    p: horizontal ? [c, alto / 2, cz] : [cx, alto / 2, c],
    s: horizontal ? [l, alto, GROSOR] : [GROSOR, alto, l],
  });
  const ini = (horizontal ? cx : cz) - largo / 2;
  const fin = ini + largo;
  if (hueco == null) return [caja((ini + fin) / 2, largo)];
  const a = hueco - PUERTA / 2;
  const b = hueco + PUERTA / 2;
  const salida: Muro[] = [];
  if (a - ini > 0.05) salida.push(caja((ini + a) / 2, a - ini));
  if (fin - b > 0.05) salida.push(caja((b + fin) / 2, fin - b));
  return salida;
}

/** Paredes de un rectángulo; `abre` dice dónde va el hueco de la puerta en cada lado (coordenada sobre ese lado). */
export function murosDeRect(r: { x0: number; x1: number; z0: number; z1: number }, abre: Partial<Record<Lado, number | null>> = {}): Muro[] {
  const cx = (r.x0 + r.x1) / 2;
  const cz = (r.z0 + r.z1) / 2;
  const ancho = r.x1 - r.x0;
  const alto = r.z1 - r.z0;
  return [
    ...muroLinea(cx, r.z0, ancho, true, ALTO_MURO.N, abre.N ?? null),
    ...muroLinea(cx, r.z1, ancho, true, ALTO_MURO.S, abre.S ?? null),
    ...muroLinea(r.x0, cz, alto, false, ALTO_MURO.O, abre.O ?? null),
    ...muroLinea(r.x1, cz, alto, false, ALTO_MURO.E, abre.E ?? null),
  ];
}

/** Cajas de las cuatro paredes de una sala (con huecos de puerta). El Cerebro abre N, O y E. */
export function murosDeSala(area: Area): Muro[] {
  const s = SALAS[area];
  if (area === "direccion") return murosDeRect(s, { N: 0, O: 0, E: 0 });
  const coord = s.lado === "N" || s.lado === "S" ? s.puerta[0] : s.puerta[1];
  return murosDeRect(s, { [s.lado]: coord });
}

// --- Cámara --------------------------------------------------------------------------------

export interface PosCamara {
  pos: [number, number, number];
  mira: [number, number, number];
  fov: number;
}

/**
 * Cámara del edificio entero o de una sala. Con el panel lateral abierto el punto de mira se corre
 * a la izquierda para que la escena quede a la derecha del panel.
 */
export function camaraEdificio(sala: Area | null, conPanel: boolean, apaisada: boolean): PosCamara {
  const corrimiento = conPanel && apaisada ? 1 : 0;
  if (!sala) {
    return apaisada
      ? { pos: [-2.6 * corrimiento, 50, 37], mira: [-6.5 * corrimiento, 0, 0.6], fov: 31 }
      : { pos: [0, 66, 48], mira: [0, 0, 1.2], fov: 31 };
  }
  const s = SALAS[sala];
  const ancho = s.x1 - s.x0;
  const y = 5 + ancho * 1.2;
  const dz = y * 0.7;
  const dx = corrimiento * (ancho * 0.2);
  return { pos: [s.cx - dx, y, s.cz + dz - 0.6], mira: [s.cx - dx, 0, s.cz + 0.7], fov: 36 };
}

export function suavizado(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
