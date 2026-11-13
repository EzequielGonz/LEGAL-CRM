import { createAdminClient } from "@/lib/supabase/admin";
import type { Area } from "@/lib/supabase/database.types";
import { getProfile } from "@/lib/profiles";
import { motivoNoDisponible, type LineaParaEnviar } from "@/lib/wasender/envio";
import { completar, elegirVariante, variablesDe } from "@/lib/wasender/plantillas";
import { primerNombre } from "@/lib/wasender/ritmo";

/**
 * Seguimiento por Wasender (12/11, bloque 4). El circuito es el mismo de
 * siempre (contactos 2 y 3, plazos, compuerta, detenciones): lo único que
 * cambia cuando el chat sale por Wasender es por dónde sale y con qué texto.
 * No hay plantilla aprobada por Meta ni ventana de 24 h: se usa una plantilla
 * propia del perfil, de uso «seguimiento», elegida por su nombre.
 */

type Db = ReturnType<typeof createAdminClient>;
type Env = Record<string, string | undefined>;

export interface PlantillaSeguimiento {
  id: string;
  nombre: string;
  uso: string;
  cuerpo: string;
  variantes: string[];
  activa: boolean;
  archivada_at: string | null;
}

export type Proposito = "seguimiento_2" | "seguimiento_3" | "segundo_intento";

const PATRON: Record<Proposito, RegExp> = {
  seguimiento_2: /(^|_)seguimiento_2$/,
  seguimiento_3: /(^|_)seguimiento_3$/,
  segundo_intento: /(^|_)segundo_intento(_|$)/,
};

/**
 * Plantilla para ese paso, por nombre: «…_seguimiento_2», «…_seguimiento_3» o
 * «…_segundo_intento». El contacto 3 usa la del 2 si no tiene la propia (igual
 * que con Meta). Solo activas, sin archivar y sin partes «[revisar]». Pura.
 */
export function elegirPlantilla(plantillas: PlantillaSeguimiento[], proposito: Proposito): PlantillaSeguimiento | null {
  const usables = plantillas
    .filter((p) => p.activa && !p.archivada_at && ![p.cuerpo, ...p.variantes].some((t) => /\[revisar/i.test(t)))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const usoEsperado = proposito === "segundo_intento" ? "campana" : "seguimiento";
  const buscar = (clave: Proposito) => usables.find((p) => p.uso === usoEsperado && PATRON[clave].test(p.nombre)) ?? null;
  return buscar(proposito) ?? (proposito === "seguimiento_3" ? buscar("seguimiento_2") : null);
}

/** Texto para esa persona: su variante de siempre y el primer nombre. Pura. */
export function textoDePlantilla(p: { cuerpo: string; variantes: string[] }, datos: { nombre: string; asesor: string; marca: string }, semilla: string): string {
  return completar(elegirVariante(p.cuerpo, p.variantes, semilla), { ...datos, nombre: primerNombre(datos.nombre) }).trim();
}

export interface LineaSeguimiento extends LineaParaEnviar {
  rubro_id: string;
  area: string;
  limite_diario: number | null;
  calentamiento_desde: string | null;
}

/** Qué impide enviar por esa línea y con esa plantilla. Pura. */
export function faltantesSeguimiento(
  d: {
    linea: LineaSeguimiento | null;
    rubroId: string;
    area: string;
    plantilla: PlantillaSeguimiento | null;
    proposito: Proposito;
    perfil: { brand_name?: string | null; agent_presentation_name?: string | null } | null;
    /** 13/11: en los contactos 2 y 3 el bot puede redactar el mensaje; la plantilla es el respaldo. */
    plantillaOpcional?: boolean;
  },
  env: Env = process.env
): string | null {
  if (!d.linea) return "La línea de Wasender de esta conversación ya no existe: queda pendiente.";
  if (d.linea.rubro_id !== d.rubroId) return `La línea de Wasender «${d.linea.nombre}» es de otro perfil: no se envía hasta corregirlo.`;
  if (d.linea.area !== d.area) return `La línea de Wasender «${d.linea.nombre}» es de otra área: no se envía hasta corregirlo.`;
  const motivo = motivoNoDisponible(d.linea, env);
  if (motivo) return motivo.replace(/: no se envió\.$/, ": queda pendiente.");
  if (!d.plantilla) {
    if (d.plantillaOpcional) return null;
    const nombre = d.proposito === "segundo_intento" ? "«…_segundo_intento» (uso campaña)" : `«…_${d.proposito}» (uso seguimiento)`;
    return `Falta una plantilla de Wasender activa cuyo nombre termine en ${nombre}: queda pendiente.`;
  }
  const usadas = new Set([d.plantilla.cuerpo, ...d.plantilla.variantes].flatMap((t) => variablesDe(t)));
  if (usadas.has("marca") && !d.perfil?.brand_name?.trim()) return "Falta el nombre del perfil o marca: queda pendiente.";
  if (usadas.has("asesor") && !d.perfil?.agent_presentation_name?.trim()) return "Falta el nombre de presentación del agente: queda pendiente.";
  return null;
}

export type PreparacionSeguimiento =
  | { ok: true; linea: LineaSeguimiento; plantilla: PlantillaSeguimiento | null; perfil: { brand_name?: string | null; agent_presentation_name?: string | null } | null }
  | { ok: false; reason: string };

/** Lee la línea, las plantillas del perfil y dice si se puede enviar. */
export async function prepararEnvioWasender(
  d: { lineaId: string; rubroId: string; area: Area | string; proposito: Proposito; plantillaOpcional?: boolean },
  supabase: Db = createAdminClient(),
  env: Env = process.env
): Promise<PreparacionSeguimiento> {
  const [{ data: linea }, { data: plantillas }, perfil] = await Promise.all([
    (supabase.from("wasender_lineas" as any) as any)
      .select("id, rubro_id, area, nombre, habilitada, estado, api_key_cifrada, archivada_at, limite_diario, calentamiento_desde")
      .eq("id", d.lineaId)
      .maybeSingle(),
    (supabase.from("wasender_plantillas" as any) as any).select("id, nombre, uso, cuerpo, variantes, activa, archivada_at").eq("rubro_id", d.rubroId).is("archivada_at", null),
    getProfile(d.rubroId),
  ]);
  const lista: PlantillaSeguimiento[] = ((plantillas ?? []) as any[]).map((p) => ({ ...p, variantes: Array.isArray(p.variantes) ? p.variantes.filter((v: unknown) => typeof v === "string") : [] }));
  const plantilla = elegirPlantilla(lista, d.proposito);
  const reason = faltantesSeguimiento({ linea: (linea as LineaSeguimiento | null) ?? null, rubroId: d.rubroId, area: String(d.area), plantilla, proposito: d.proposito, perfil: perfil as any, plantillaOpcional: d.plantillaOpcional }, env);
  if (reason) return { ok: false, reason };
  return { ok: true, linea: linea as LineaSeguimiento, plantilla, perfil: perfil as any };
}
