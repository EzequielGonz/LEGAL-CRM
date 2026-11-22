/**
 * Recorrido de la Oficina estilo videojuego (22/11, vuelta 6). Funciones puras: pasillos, ruta al
 * café, paredes para chocar, cámara a altura de persona, carteles «Nombre · estado» y respuestas
 * del chat con cada agente. Sin navegador, sin azar y sin fecha: lo mismo en servidor y cliente.
 * Unidades: metros de la escena (x a la derecha, z hacia el frente). No toca reglas de tareas.
 */
import { ENTRADA, SALAS, asientosDeSala, murosDeRect, rutaAlCerebro, type Asiento, type Punto } from "@/lib/oficina/edificio";
import type { Area } from "@/lib/oficina/reglas";
import { SECTORES } from "@/lib/oficina/sectores";
import { pedidoParaSector } from "@/lib/oficina/panel";
import type { EstadoVisual } from "@/lib/oficina/escena";

/** Alto de las paredes del edificio (corte sin techo, como el reel). */
export const ALTO_PARED = 2.6;
/** Ojos de la persona que recorre. */
export const ALTURA_OJOS = 1.62;
export const RADIO_PERSONA = 0.28;

/** Pasillos: dos horizontales entre filas de salas y dos verticales entre columnas. */
export const PASILLO_NORTE = -6.2;
export const PASILLO_SUR = 6.2;
export const PASILLO_OESTE = -7.1;
export const PASILLO_ESTE = 7.1;

/** Lugares donde se puede entrar caminando: cada sector y el living con cocina de la entrada. */
export type Lugar = Area | "entrada";

/** Puntos de la cocina donde se paran los que van por un café (uno por persona, sin pisarse). */
export const PUNTOS_CAFE: Punto[] = [
  [1.9, 9.0],
  [1.9, 10.1],
  [1.2, 8.6],
  [0.9, 10.6],
];

/** Puerta del living de la entrada (lado norte, hacia el pasillo sur). */
export const PUERTA_ENTRADA: Punto = [0, ENTRADA.z0];

/** Ruta de un agente desde su asiento hasta la cocina del living. El regreso es la misma al revés. */
export function rutaAlCafe(area: Area, asiento: Asiento, turno = 0): Punto[] {
  const s = SALAS[area];
  const completa = rutaAlCerebro(area, asiento);
  const hastaPuerta = completa.slice(0, completa.length - s.fuera.length);
  const pts: Punto[] = [...hastaPuerta];
  if (s.lado === "E" || s.lado === "O") {
    const x = s.lado === "E" ? PASILLO_OESTE : PASILLO_ESTE;
    pts.push([x, 0], [x, PASILLO_SUR]);
  } else if (s.lado === "S") {
    const xv = s.puerta[0] > 0.01 ? PASILLO_ESTE : PASILLO_OESTE;
    pts.push([s.puerta[0], PASILLO_NORTE], [xv, PASILLO_NORTE], [xv, PASILLO_SUR]);
  } else {
    pts.push([s.puerta[0], PASILLO_SUR]);
  }
  const destino = PUNTOS_CAFE[((turno % PUNTOS_CAFE.length) + PUNTOS_CAFE.length) % PUNTOS_CAFE.length];
  pts.push([0, PASILLO_SUR], PUERTA_ENTRADA, [0, ENTRADA.z0 + 0.9], destino);
  return sinRepetidos(pts);
}

function sinRepetidos(pts: Punto[]): Punto[] {
  const salida: Punto[] = [];
  for (const p of pts) {
    const u = salida[salida.length - 1];
    if (!u || Math.hypot(u[0] - p[0], u[1] - p[1]) > 0.01) salida.push(p);
  }
  return salida;
}

/**
 * Quién sale por un café en cada sala: como mucho uno, entre los libres, elegido por la posición de
 * la sala para que no salgan todos juntos. El Cerebro no sale (es el que recibe).
 */
export function paseanteDeSala(area: Area, estados: EstadoVisual[]): number | null {
  if (area === "direccion") return null;
  const libres = estados.map((e, j) => (e === "libre" ? j : -1)).filter((j) => j >= 0);
  if (!libres.length) return null;
  const orden = ["analisis", "redes", "diseno", "seo", "bots", "ingenieria", "asistente"].indexOf(area);
  if (orden % 2 === 1) return null;
  return libres[orden % libres.length];
}

// --- Paredes para chocar ---------------------------------------------------------------------

/** Caja en planta: [x0, z0, x1, z1]. */
export type Caja = [number, number, number, number];

const GROSOR_TAPA = 0.16;

/** Tapas de vidrio en los extremos de los pasillos (puertas al jardín). */
export function tapasDePasillo(): Caja[] {
  const g = GROSOR_TAPA / 2;
  return [
    [-17.2 - g, -7.3, -17.2 + g, -5.1],
    [17.2 - g, -7.3, 17.2 + g, -5.1],
    [-17.2 - g, 5.1, -17.2 + g, 7.3],
    [17.2 - g, 5.1, 17.2 + g, 7.3],
    [-8.2, -13.9 - g, -6, -13.9 + g],
    [6, -13.9 - g, 8.2, -13.9 + g],
    [-8.2, 13.9 - g, -6, 13.9 + g],
    [6, 13.9 - g, 8.2, 13.9 + g],
  ];
}

/** Todas las paredes del edificio en planta, con los huecos de las puertas. */
export function cajasDeParedes(): Caja[] {
  const cajas: Caja[] = [];
  const agregar = (m: { p: [number, number, number]; s: [number, number, number] }) =>
    cajas.push([m.p[0] - m.s[0] / 2, m.p[2] - m.s[2] / 2, m.p[0] + m.s[0] / 2, m.p[2] + m.s[2] / 2]);
  for (const area of Object.keys(SALAS) as Area[]) {
    const s = SALAS[area];
    if (area === "direccion") murosDeRect(s, { N: 0, O: 0, E: 0 }).forEach(agregar);
    else {
      const coord = s.lado === "N" || s.lado === "S" ? s.puerta[0] : s.puerta[1];
      murosDeRect(s, { [s.lado]: coord }).forEach(agregar);
    }
  }
  murosDeRect(ENTRADA, { N: 0, S: 0 }).forEach(agregar);
  cajas.push(...tapasDePasillo());
  return cajas;
}

function choca(x: number, z: number, r: number, c: Caja): boolean {
  const cx = Math.max(c[0], Math.min(x, c[2]));
  const cz = Math.max(c[1], Math.min(z, c[3]));
  return (x - cx) ** 2 + (z - cz) ** 2 < r * r;
}

/** Límites de lo que se puede caminar: el edificio más la vereda. */
export const LIMITE_PASEO = { x0: -21, x1: 21, z0: -18, z1: 18 };

/** Mueve a la persona sin atravesar paredes: prueba cada eje por separado (se desliza por la pared). */
export function moverConChoques(x: number, z: number, dx: number, dz: number, cajas: Caja[], r = RADIO_PERSONA): [number, number] {
  // Pasos cortos para no «saltar» una pared fina en un cuadro lento.
  const pasos = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  let p: [number, number] = [x, z];
  for (let i = 0; i < pasos; i++) p = pasoConChoques(p[0], p[1], dx / pasos, dz / pasos, cajas, r);
  return p;
}

function pasoConChoques(x: number, z: number, dx: number, dz: number, cajas: Caja[], r: number): [number, number] {
  let nx = Math.min(LIMITE_PASEO.x1, Math.max(LIMITE_PASEO.x0, x + dx));
  if (cajas.some((c) => choca(nx, z, r, c))) nx = x;
  let nz = Math.min(LIMITE_PASEO.z1, Math.max(LIMITE_PASEO.z0, z + dz));
  if (cajas.some((c) => choca(nx, nz, r, c))) nz = z;
  return [nx, nz];
}

// --- Cámara a altura de persona ----------------------------------------------------------------

export interface PuntoDeVista {
  x: number;
  z: number;
  /** Giro: 0 mira hacia -z (el fondo del edificio). */
  yaw: number;
  pitch: number;
}

/** Giro para mirar desde (x, z) hacia (tx, tz). */
export function yawHacia(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(-(tx - x), -(tz - z));
}

/** Dirección hacia adelante en planta para un giro dado. */
export function adelante(yaw: number): [number, number] {
  return [-Math.sin(yaw), -Math.cos(yaw)];
}

/**
 * Dónde aparece la persona al entrar a un lugar: un paso adentro de la puerta, en diagonal, mirando
 * hacia los escritorios (se ve la sala entera, como al entrar en el reel).
 */
export function entradaA(lugar: Lugar): PuntoDeVista {
  if (lugar === "entrada") {
    const x = 0.2;
    const z = ENTRADA.z0 + 0.6;
    return { x, z, yaw: yawHacia(x, z, -1.8, 12.8), pitch: -0.1 };
  }
  const s = SALAS[lugar];
  if (lugar === "direccion") {
    const x = 0;
    const z = s.z0 + 0.55;
    return { x, z, yaw: yawHacia(x, z, 0, s.z1), pitch: -0.1 };
  }
  // En el rincón del lado de la puerta, mirando en diagonal hacia el rincón opuesto: se ve la sala entera.
  const [px, pz] = s.puerta;
  if (s.lado === "N" || s.lado === "S") {
    const z = s.lado === "N" ? s.z0 + 0.45 : s.z1 - 0.45;
    const derecha = px > s.cx + 0.01;
    const x = derecha ? s.x1 - 0.45 : s.x0 + 0.45;
    const fondo = s.lado === "N" ? s.z1 - 0.8 : s.z0 + 0.8;
    return { x, z, yaw: yawHacia(x, z, derecha ? s.x0 + 1.2 : s.x1 - 1.2, fondo), pitch: -0.12 };
  }
  const x = s.lado === "O" ? s.x0 + 0.45 : s.x1 - 0.45;
  const z = s.z1 - 0.45;
  return { x, z, yaw: yawHacia(x, z, s.lado === "O" ? s.x1 - 1 : s.x0 + 1, s.z0 + 1.2), pitch: -0.12 };
  void pz;
}

/** En qué lugar está una persona parada en (x, z), o null si está en un pasillo o afuera. */
export function lugarEn(x: number, z: number): Lugar | null {
  for (const a of Object.keys(SALAS) as Area[]) {
    const s = SALAS[a];
    if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) return a;
  }
  if (x >= ENTRADA.x0 && x <= ENTRADA.x1 && z >= ENTRADA.z0 && z <= ENTRADA.z1) return "entrada";
  return null;
}

// --- Carteles y chat -------------------------------------------------------------------------

export type Actividad = "sentado" | "llevando" | "volviendo" | "cafe";

/** Texto corto del cartel flotante: «Guionista · Trabajando». */
export function estadoDeCartel(estado: EstadoVisual, actividad: Actividad = "sentado"): string {
  if (actividad === "llevando") return "Llevando al Cerebro";
  if (actividad === "volviendo") return "Volviendo a su puesto";
  if (actividad === "cafe") return "Tomando un café";
  if (estado === "trabajando") return "Trabajando";
  if (estado === "listo") return "Listo para tu OK";
  if (estado === "en_cola") return "En cola";
  return "Libre";
}

export function cartel(nombre: string, estado: EstadoVisual, actividad: Actividad = "sentado"): string {
  return `${nombre} · ${estadoDeCartel(estado, actividad)}`;
}

export type Pregunta = "que" | "problemas" | "cuanto" | "sigue";

export const SUGERENCIAS: { id: Pregunta; texto: string }[] = [
  { id: "que", texto: "¿Qué estás haciendo?" },
  { id: "problemas", texto: "¿Algún problema?" },
  { id: "cuanto", texto: "¿Cuánto te falta?" },
  { id: "sigue", texto: "¿Qué sigue?" },
];

export interface AgenteChat {
  nombre: string;
  rol: string;
  estado: EstadoVisual;
  tarea: string | null;
  progreso: number;
  area: Area;
  motor: string;
}

/**
 * Respuesta del agente a una pregunta rápida, armada con lo que el panel ya sabe (estado, tarea,
 * avance). No inventa datos ni consulta a ninguna IA: es la ficha del puesto contada en primera persona.
 */
export function respuestaAgente(a: AgenteChat, p: Pregunta): string {
  const sector = SECTORES[a.area].titulo;
  const tarea = a.tarea ? `«${a.tarea}»` : null;
  if (p === "que") {
    if (a.estado === "trabajando") return `Estoy con ${tarea ?? "una tarea"}. Mi parte: ${minuscula(a.rol)}.`;
    if (a.estado === "listo") return `Terminé ${tarea ?? "mi parte"} y la dejé en el Cerebro. Espera tu OK.`;
    if (a.estado === "en_cola") return `Tengo trabajo en cola en ${sector}. Arranco cuando toques «Arrancar ahora».`;
    return `Nada ahora (libre). Dame una tarea y la arranco: ${minuscula(a.rol)}.`;
  }
  if (p === "problemas") {
    if (a.estado === "trabajando") return "Por ahora nada trabado. Si algo se traba, aparece en la actividad del panel.";
    if (a.estado === "listo") return "Ninguno: está listo. Solo falta que lo apruebes, pidas cambios o lo descartes.";
    return "Ninguno. Estoy disponible.";
  }
  if (p === "cuanto") {
    if (a.estado === "trabajando") return `Voy más o menos por el ${Math.round(Math.max(0, Math.min(1, a.progreso)) * 100)} %. Cuando termine, lo llevo al Cerebro para que lo revise.`;
    if (a.estado === "listo") return "Ya terminé. Está esperando tu OK en el Cerebro.";
    if (a.estado === "en_cola") return "Todavía no empecé: está en cola.";
    return "No tengo nada pendiente.";
  }
  if (a.estado === "listo") return "Que lo revises en «Para tu OK». Después, lo que me pidas.";
  if (a.estado === "trabajando") return "Terminar esto, pasarlo al Cerebro y esperar lo próximo.";
  return `Lo que me dejes. Escribime abajo y lo mando a la mesa de entrada de ${sector}.`;
}

function minuscula(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** Pedido que sale del chat con un agente: va al sector y nombra el puesto. */
export function pedidoParaAgente(area: Area, nombre: string, texto: string): string {
  const limpio = texto.trim();
  if (!limpio) return "";
  if (area === "direccion") return `Para ${nombre} del Cerebro: ${limpio}`;
  return pedidoParaSector(area, `(para ${nombre}) ${limpio}`);
}

/** Enlace a Jarvis con el pedido precargado (no se envía solo). */
export function enlaceJarvis(area: Area, nombre: string, texto: string): string {
  const base = texto.trim() || `Contame qué está haciendo ${nombre} de ${SECTORES[area].titulo}`;
  const pedido = `${base} (${nombre} · ${SECTORES[area].titulo}). No ejecutes nada hasta que yo te lo confirme.`;
  return `/asistente?pedido=${encodeURIComponent(pedido.slice(0, 600))}`;
}

/** Iniciales para el avatar redondo del agente. */
export function iniciales(nombre: string): string {
  const partes = nombre.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

/** Asientos de todas las salas, para que la escena y las pruebas usen los mismos. */
export function asientos(area: Area, n: number): Asiento[] {
  return asientosDeSala(area, n);
}

// --- Canal del equipo (panel derecho) ---------------------------------------------------------

export interface MensajeEquipo {
  id: string;
  quien: string;
  area: Area | null;
  texto: string;
  /** Fecha ISO si viene de la base; null si es el estado de ahora. */
  at: string | null;
}

/**
 * Lo que «hablan» los agentes: primero los pasos reales del recorrido de las tareas (quién dejó qué),
 * y si no hay, lo que está haciendo cada puesto ahora. Nada inventado: todo sale de las tareas y
 * de los estados del panel.
 */
export function mensajesDelEquipo(
  tareas: { id: string; titulo: string; recorrido: { area: Area | "duenos"; agente: string; nota: string; at: string }[] }[],
  salas: Record<Area, { puestos: { nombre: string; estado: EstadoVisual; tarea: string | null }[]; mensajeros: number[] }>,
  max = 6,
): MensajeEquipo[] {
  const pasos: MensajeEquipo[] = [];
  for (const t of tareas)
    t.recorrido.forEach((p, i) => {
      if (p.area === "duenos") return;
      pasos.push({ id: `${t.id}:${i}`, quien: p.agente || SECTORES[p.area].titulo, area: p.area, texto: p.nota?.trim() ? p.nota.trim() : `Dejé mi parte en «${t.titulo}».`, at: p.at });
    });
  pasos.sort((a, b) => Date.parse(b.at ?? "") - Date.parse(a.at ?? ""));
  const salida = pasos.slice(0, max);
  if (salida.length >= max) return salida;
  for (const area of Object.keys(salas) as Area[]) {
    const v = salas[area];
    v.puestos.forEach((p, j) => {
      if (salida.length >= max) return;
      if (p.estado === "trabajando") salida.push({ id: `${area}:${j}:ahora`, quien: p.nombre, area, texto: v.mensajeros.includes(j) ? `Llevo «${p.tarea ?? "la entrega"}» al Cerebro.` : `Trabajando en «${p.tarea ?? "una tarea"}».`, at: null });
      else if (p.estado === "listo") salida.push({ id: `${area}:${j}:ahora`, quien: p.nombre, area, texto: `Dejé «${p.tarea ?? "la entrega"}» en el Cerebro. Espera tu OK.`, at: null });
    });
  }
  if (!salida.length) {
    for (const area of Object.keys(salas) as Area[]) {
      const j = paseanteDeSala(area, salas[area].puestos.map((p) => p.estado));
      if (j !== null && salida.length < 3) salida.push({ id: `${area}:${j}:cafe`, quien: salas[area].puestos[j].nombre, area, texto: "Voy por un café. Avisame si hay algo.", at: null });
    }
  }
  return salida;
}
