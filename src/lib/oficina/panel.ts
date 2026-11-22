/**
 * Datos del edificio para el panel lateral y la escena (22/11). Funciones puras: de las tareas
 * salen los puestos de cada sala, los mensajeros que van al Cerebro, las hojas apiladas y la
 * actividad reciente. No cambia ninguna regla de tareas.
 */
import { ETIQUETA_ETAPA, NOMBRE_AREA, etapaDe, type Area, type TareaOficina } from "@/lib/oficina/reglas";
import { SALAS_ORDEN, mensajerosDeSala } from "@/lib/oficina/edificio";
import { SECTORES, estadoSector, puestosDeSector, puestosOcupados, type EstadoSector } from "@/lib/oficina/sectores";
import type { PuestoVisual } from "@/lib/oficina/escena";

export interface SalaVisual {
  area: Area;
  titulo: string;
  bajada: string;
  puestos: PuestoVisual[];
  estado: EstadoSector;
  /** Índices de los puestos que salen a llevar carpetas al Cerebro. */
  mensajeros: number[];
  trabajando: number;
}

export function salasVisuales(tareas: TareaOficina[]): Record<Area, SalaVisual> {
  const salida = {} as Record<Area, SalaVisual>;
  for (const area of SALAS_ORDEN) {
    const s = SECTORES[area];
    const estado = estadoSector(area, tareas);
    const puestos = puestosDeSector(area, tareas);
    const ocupados = puestosOcupados(s, estado);
    salida[area] = {
      area,
      titulo: s.titulo,
      bajada: s.bajada,
      puestos,
      estado,
      mensajeros: area === "direccion" ? [] : mensajerosDeSala(estado.trabajando, ocupados),
      trabajando: puestos.filter((p) => p.estado === "trabajando").length,
    };
  }
  return salida;
}

/** Cuántas entregas esperan el OK en el escritorio del Cerebro. */
export function hojasParaOk(tareas: Pick<TareaOficina, "estado" | "decision">[]): number {
  return tareas.filter((t) => etapaDe(t) === "esperando_ok").length;
}

export interface Actividad {
  id: string;
  titulo: string;
  etapa: string;
  sector: string;
  updated_at: string;
}

/** Últimas tareas tocadas, de la más nueva a la más vieja. */
export function actividadReciente(tareas: TareaOficina[], max = 6): Actividad[] {
  return [...tareas]
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, max)
    .map((t) => ({ id: t.id, titulo: t.titulo, etapa: ETIQUETA_ETAPA[etapaDe(t)], sector: t.area ? NOMBRE_AREA[t.area] : "Mesa de entrada", updated_at: t.updated_at }));
}

/** Tareas que esperan el OK del dueño, las más nuevas primero. */
export function entregasParaOk(tareas: TareaOficina[]): TareaOficina[] {
  return tareas.filter((t) => etapaDe(t) === "esperando_ok").sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

/** Pedido que se manda a la mesa de entrada cuando se deja una tarea desde una sala: nombra el sector para que el triaje lo ruteé ahí. */
export function pedidoParaSector(area: Area | null, texto: string): string {
  const limpio = texto.trim();
  if (!area || area === "direccion") return limpio;
  return `Para el sector «${SECTORES[area].titulo}»: ${limpio}`;
}
