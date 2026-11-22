/**
 * Lógica visual de la Oficina 3D (22/11). Funciones puras: a partir de las
 * tareas decide qué muestra cada puesto (estado, progreso, texto, posición,
 * color), dónde va la cámara y cómo se mueve el festejo. Sin navegador, sin
 * azar y sin fecha: lo mismo en el servidor y en el cliente (nada de errores
 * de hidratación). Tampoco maneja datos de prospectos: solo rol, tarea y
 * progreso.
 */
import {
  ESCRITORIOS,
  escritorioActual,
  etapaDe,
  vistaEscritorios,
  type Area,
  type TareaOficina,
} from "@/lib/oficina/reglas";

export type EstadoVisual = "trabajando" | "listo" | "en_cola" | "libre";

export const ETIQUETA_VISUAL: Record<EstadoVisual, string> = {
  trabajando: "Trabajando",
  listo: "Listo para tu OK",
  en_cola: "En cola",
  libre: "Libre",
};

/** Color de cada escritorio (el del personaje y el aro del piso). */
export const COLOR_AREA: Record<Area, string> = {
  direccion: "#9B6BFF",
  analisis: "#4F8BFF",
  redes: "#FF5C5C",
  diseno: "#FF8FD0",
  seo: "#3ED6C6",
  bots: "#FF9A3D",
  ingenieria: "#B9B3E6",
  asistente: "#FFD3A8",
};

/** Colores del estado: amarillo trabajando, verde listo, gris libre. */
export const COLOR_ESTADO: Record<EstadoVisual, string> = {
  trabajando: "#F2C531",
  listo: "#6FD3A3",
  en_cola: "#C9A94A",
  libre: "#8C8A99",
};

/** Palabras cortas que suben sobre el agente mientras trabaja, según su rol. */
export const GLIFOS: Record<Area, [string, string, string]> = {
  direccion: ["OK", "§", "revisar"],
  analisis: ["%", "CTR", "ROAS"],
  redes: ["#", "reel", "AD"],
  diseno: ["Aa", "px", "color"],
  seo: ["SEO", "↑", "www"],
  bots: ["bot", "{ }", "..."],
  ingenieria: ["</>", "{ }", "test"],
  asistente: ["hoy", "+1", "lista"],
};

// --- Posición de los puestos -------------------------------------------------

/** Dos filas de cuatro. La fila de atrás es la 0. Unidades: metros de la escena. */
export const SEPARACION_X = 3.7;
export const FILAS_Z: [number, number] = [-2.1, 1.9];

export function posicionPuesto(indice: number): { x: number; z: number } {
  const col = ((indice % 4) + 4) % 4;
  const fila = indice < 4 ? 0 : 1;
  return { x: (col - 1.5) * SEPARACION_X, z: FILAS_Z[fila] };
}

// --- Estado visual por puesto ---------------------------------------------------

export interface PuestoVisual {
  area: Area;
  indice: number;
  nombre: string;
  rol: string;
  equipo: string[];
  estado: EstadoVisual;
  /** Texto del chip: «Trabajando 28 %», «Listo para tu OK», «En cola», «Libre». */
  chip: string;
  /** 0 a 1. */
  progreso: number;
  /** Qué hace, en palabras simples. */
  queHace: string;
  /** Título de la tarea que lo ocupa ahora (o la primera lista), si hay. */
  tarea: string | null;
  /** Tareas que este puesto entregó y esperan el OK del dueño. */
  listas: string[];
  /** Tareas que está trabajando o que esperan su turno. */
  enMarcha: string[];
  color: string;
  glifos: [string, string, string];
  x: number;
  z: number;
  ultima: string | null;
}

function corto(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Avance de una tarea por su ruta: escritorios que ya dejaron su parte sobre el total. */
export function progresoDeTarea(t: Pick<TareaOficina, "estado" | "decision" | "ruta" | "recorrido">): number {
  const etapa = etapaDe(t);
  if (etapa === "esperando_ok" || etapa === "aprobada" || etapa === "cerrada") return 1;
  if (!t.ruta.length) return etapa === "trabajando" ? 0.1 : 0.04;
  const hechos = new Set(t.recorrido.map((p) => p.area));
  const n = t.ruta.filter((a) => hechos.has(a)).length;
  const base = n / t.ruta.length;
  // Si ya está trabajando, la barra nunca queda vacía: algo avanzó.
  return Math.min(0.95, Math.max(etapa === "trabajando" ? 0.08 : 0.03, base + (etapa === "trabajando" ? 0.5 / t.ruta.length : 0)));
}

/** El escritorio que entregó una tarea que espera el OK: el último que dejó nota. */
export function escritorioQueEntrego(t: Pick<TareaOficina, "recorrido">): Area {
  for (let i = t.recorrido.length - 1; i >= 0; i--) {
    const a = t.recorrido[i].area;
    if (a !== "duenos") return a;
  }
  return "direccion";
}

export function puestosVisuales(tareas: TareaOficina[]): PuestoVisual[] {
  const vistas = vistaEscritorios(tareas);
  return ESCRITORIOS.map((e, indice) => {
    const v = vistas[indice];
    const propias = tareas.filter((t) => escritorioActual(t) === e.area);
    const trabajando = propias.filter((t) => t.estado === "en_curso");
    const cola = propias.filter((t) => t.estado !== "en_curso");
    const listas = tareas.filter((t) => etapaDe(t) === "esperando_ok" && escritorioQueEntrego(t) === e.area);

    let estado: EstadoVisual = "libre";
    if (trabajando.length) estado = "trabajando";
    else if (listas.length) estado = "listo";
    else if (cola.length) estado = "en_cola";

    const foco = estado === "trabajando" ? trabajando[0] : estado === "listo" ? listas[0] : estado === "en_cola" ? cola[0] : null;
    const progreso = estado === "listo" ? 1 : estado === "trabajando" && foco ? progresoDeTarea(foco) : 0;

    let chip: string = ETIQUETA_VISUAL[estado];
    if (estado === "trabajando") chip = `Trabajando ${Math.round(progreso * 100)} %`;
    else if (estado === "listo" && listas.length > 1) chip = `Listo para tu OK (${listas.length})`;
    else if (estado === "en_cola" && cola.length > 1) chip = `En cola (${cola.length})`;

    const titulo = foco ? corto(foco.titulo, 52) : null;
    const queHace =
      estado === "trabajando"
        ? `Trabaja en «${titulo}».`
        : estado === "listo"
          ? `Terminó «${titulo}». Revisala y decidí.`
          : estado === "en_cola"
            ? `«${titulo}» espera su turno.`
            : `Sin tareas ahora. ${e.rol}.`;

    const { x, z } = posicionPuesto(indice);
    return {
      area: e.area,
      indice,
      nombre: e.nombre,
      rol: e.rol,
      equipo: e.equipo,
      estado,
      chip,
      progreso,
      queHace,
      tarea: titulo,
      listas: listas.map((t) => t.id),
      enMarcha: [...trabajando, ...cola].map((t) => t.id),
      color: COLOR_AREA[e.area],
      glifos: GLIFOS[e.area],
      x,
      z,
      ultima: v.ultima,
    };
  });
}

/** Resumen de una línea para el lector de pantalla de cada puesto. */
export function descripcionAccesible(p: PuestoVisual): string {
  const pct = p.estado === "trabajando" ? `, ${Math.round(p.progreso * 100)} por ciento` : "";
  return `${p.nombre}: ${ETIQUETA_VISUAL[p.estado]}${pct}. ${p.queHace}`;
}

/** Aviso (aria-live) cuando un puesto pasa a «Listo para tu OK». Máximo uno por cambio. */
export function anuncioDeEntrega(antes: PuestoVisual[] | null, ahora: PuestoVisual[]): string | null {
  if (!antes) return null;
  const nuevos = ahora.filter((p) => p.estado === "listo" && antes.find((a) => a.area === p.area)?.estado !== "listo");
  if (!nuevos.length) return null;
  return nuevos.length === 1
    ? `${nuevos[0].nombre} terminó y espera tu OK.`
    : `${nuevos.length} escritorios terminaron y esperan tu OK: ${nuevos.map((p) => p.nombre).join(", ")}.`;
}

// --- Navegación entre puestos ------------------------------------------------------

export type Vista = "sala" | "cenital" | Area;

export function vecino(area: Area, delta: 1 | -1): Area {
  const i = ESCRITORIOS.findIndex((e) => e.area === area);
  const n = ESCRITORIOS.length;
  return ESCRITORIOS[(((i + delta) % n) + n) % n].area;
}

// --- Cámara: presets (sin órbita libre) --------------------------------------------------

export interface PosCamara {
  pos: [number, number, number];
  mira: [number, number, number];
  fov: number;
}

/**
 * Presets: la sala vista de tres cuartos y en picada, la vista cenital y el
 * primer plano de cada puesto. Con el panel abierto, el puesto se corre a la
 * izquierda de la pantalla para que el panel no lo tape.
 */
export function camaraDe(vista: Vista, conPanel = false, apaisada = true): PosCamara {
  if (vista === "cenital") return { pos: [0, 19, 1.2], mira: [0, 0, 0], fov: 38 };
  if (vista === "sala") return apaisada ? { pos: [0, 12.4, 11.6], mira: [0, 0.3, 0.1], fov: 42 } : { pos: [0, 15, 17], mira: [0, 0.4, -0.2], fov: 46 };
  const i = ESCRITORIOS.findIndex((e) => e.area === vista);
  const { x, z } = posicionPuesto(Math.max(0, i));
  const corrimiento = conPanel && apaisada ? 1.7 : 0;
  return { pos: [x + corrimiento, 4.4, z + 5.4], mira: [x + corrimiento, 2.15, z], fov: 38 };
}

// --- Animación del festejo (una sola vez al entregar) -------------------------------------------

export const DURACION_FESTEJO = 1.6;
export const DURACION_DESTELLO = 0.9;

function suave(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Brazos arriba: 0 abajo, 1 arriba del todo. Sube rápido, se queda y baja. t en segundos. */
export function brazosFestejo(t: number): number {
  if (t <= 0 || t >= DURACION_FESTEJO) return 0;
  if (t < 0.25) return suave(t / 0.25);
  if (t > DURACION_FESTEJO - 0.35) return suave((DURACION_FESTEJO - t) / 0.35);
  return 1;
}

/** Intensidad del destello: pico a los 150 ms y se apaga a los 900 ms. */
export function intensidadDestello(t: number): number {
  if (t <= 0 || t >= DURACION_DESTELLO) return 0;
  if (t < 0.15) return suave(t / 0.15);
  return 1 - suave((t - 0.15) / (DURACION_DESTELLO - 0.15));
}

/** Teclear: ángulo de cada brazo en radianes para el tiempo t, con desfase propio de cada puesto. */
export function brazosTecleo(t: number, indice: number): [number, number] {
  const f = 16 + (indice % 3);
  const fase = indice * 0.9;
  return [-1.05 + Math.sin(t * f + fase) * 0.22, -1.05 + Math.sin(t * f + fase + Math.PI) * 0.22];
}

/** Deriva leve de la cámara en reposo: ±0,5° cada ~10 s. */
export function derivaCamara(t: number): number {
  return Math.sin((t / 10) * Math.PI * 2) * ((0.5 * Math.PI) / 180);
}

/** Glifos que flotan a la vez en toda la sala: tope para que no distraigan. */
export const MAX_GLIFOS_SIMULTANEOS = 2;

/** Qué puestos muestran glifo ahora: máximo dos, rotando cada 2,4 s entre los que trabajan. */
export function puestosConGlifo(puestos: Pick<PuestoVisual, "area" | "estado">[], t: number): Area[] {
  const trabajan = puestos.filter((p) => p.estado === "trabajando");
  if (!trabajan.length) return [];
  const paso = Math.floor(t / 2.4);
  const n = Math.min(MAX_GLIFOS_SIMULTANEOS, trabajan.length);
  const salida: Area[] = [];
  for (let k = 0; k < n; k++) salida.push(trabajan[(paso * n + k) % trabajan.length].area);
  return salida;
}

// --- Diorama CSS 3D (versión liviana) ----------------------------------------------------------------

export const DIORAMA = { ancho: 900, alto: 520, rotZ: -32, rotX: 56 } as const;

/** Centro de un puesto sobre el plano del diorama, en píxeles del plano. */
export function centroPuestoDiorama(indice: number): { x: number; y: number } {
  const col = ((indice % 4) + 4) % 4;
  return { x: (col + 0.5) * (DIORAMA.ancho / 4), y: (indice < 4 ? 0.3 : 0.74) * DIORAMA.alto };
}

/**
 * Dónde cae un puesto en pantalla, respecto del centro de la sala, después de
 * girar y volcar el plano (rotateZ y rotateX). Sirve para centrar el zoom.
 */
export function proyeccionDiorama(indice: number): { sx: number; sy: number } {
  const c = centroPuestoDiorama(indice);
  const dx = c.x - DIORAMA.ancho / 2;
  const dy = c.y - DIORAMA.alto / 2;
  const z = (DIORAMA.rotZ * Math.PI) / 180;
  const x1 = dx * Math.cos(z) - dy * Math.sin(z);
  const y1 = dx * Math.sin(z) + dy * Math.cos(z);
  return { sx: x1, sy: y1 * Math.cos((DIORAMA.rotX * Math.PI) / 180) };
}
