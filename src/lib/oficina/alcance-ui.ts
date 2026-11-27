/**
 * Selector de alcance de «Nueva tarea» en la Oficina (27/11). Puro: traduce
 * lo que se elige en pantalla a un Alcance (src/lib/alcance.ts). Opciones,
 * según la decisión del dueño («no tiene que limitar»): un rubro, varios
 * (juntos o por separado), los 4 juntos (una tarea, un resultado), los 4 por
 * separado (una tarea por rubro, agrupadas) o «Todo el panel».
 */
import { TODOS_LOS_RUBROS, expandirTareas, normalizarAlcance, type Alcance, type ModoAlcance, type Slug } from "@/lib/alcance";

export type OpcionDestino = Slug | "varios" | "cuatro_juntos" | "cuatro_separados" | "panel";

export const NOMBRE_RUBRO: Record<Slug, string> = {
  juridico: "VITA (Jurídico)",
  coberturas_medicas: "Coberturas médicas",
  agencia_0km: "Autos 0 km",
  marketing: "Kocos Marketing",
};

export const OPCIONES_DESTINO: { grupo: string; opciones: { valor: OpcionDestino; etiqueta: string }[] }[] = [
  { grupo: "Un rubro", opciones: TODOS_LOS_RUBROS.map((s) => ({ valor: s, etiqueta: NOMBRE_RUBRO[s] })) },
  {
    grupo: "Varios rubros",
    opciones: [
      { valor: "varios", etiqueta: "Elegir rubros…" },
      { valor: "cuatro_juntos", etiqueta: "Los 4 rubros juntos (un solo resultado)" },
      { valor: "cuatro_separados", etiqueta: "Los 4 rubros por separado (una tarea por rubro)" },
    ],
  },
  { grupo: "Panel", opciones: [{ valor: "panel", etiqueta: "Todo el panel (mejoras al panel)" }] },
];

const esOpcion = (v: unknown): v is OpcionDestino => OPCIONES_DESTINO.some((g) => g.opciones.some((o) => o.valor === v));

/** Lo elegido en pantalla → Alcance. null si falta algo (por ejemplo, «varios» sin rubros marcados). */
export function alcanceDeSelector(opcion: unknown, marcados: readonly Slug[] = [], modo: ModoAlcance = "separados"): Alcance | null {
  if (!esOpcion(opcion)) return null;
  if (opcion === "panel") return { tipo: "panel" };
  if (opcion === "cuatro_juntos") return { tipo: "rubros", rubros: [...TODOS_LOS_RUBROS], modo: "juntos" };
  if (opcion === "cuatro_separados") return { tipo: "rubros", rubros: [...TODOS_LOS_RUBROS], modo: "separados" };
  if (opcion === "varios") return marcados.length ? normalizarAlcance({ tipo: "rubros", rubros: [...marcados], modo }) : null;
  return { tipo: "rubros", rubros: [opcion], modo: "juntos" };
}

/** Qué va a pasar al guardar, en una frase. */
export function explicarAlcance(alcance: Alcance | null): string {
  if (!alcance) return "Marcá al menos un rubro.";
  const n = expandirTareas(alcance).length;
  if (alcance.tipo === "panel") return "Una tarea sobre el panel entero. Puede usar cifras agregadas de los 4 rubros, nunca datos de personas.";
  if (alcance.rubros.length === 1) return "Una tarea de ese perfil: solo ve y toca ese rubro.";
  if (alcance.modo === "juntos") return "Una sola tarea con un resultado conjunto (se ve en la Oficina, no dentro de cada perfil).";
  return `Se crean ${n} tareas, una por rubro, agrupadas para ver el avance juntas.`;
}
