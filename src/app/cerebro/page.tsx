import { cache } from "react";
import { Inter_Tight, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import "./cerebro.css";
import "./centro.css";
import { requirePageSession } from "@/lib/acceso/pagina";
import { CerebroVista } from "@/components/cerebro/cerebro-vista";
import { resumenSemanaEnMemoria } from "@/lib/asistente/semana-cache";
import { leerRubrosActivos } from "@/lib/perfiles-stats";
import { leerSalud } from "@/lib/salud";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, perfilDeRubroId, type TareaBandeja } from "@/lib/bandeja-claude";
import { leerDecisiones } from "@/lib/cerebro/decisiones-servidor";
import type { PerfilSemana } from "@/lib/cerebro/contenido";
import { leerOficina } from "@/lib/oficina/servidor";
import { leerAprendido } from "@/lib/cerebro/conocimiento-servidor";
import { resumenGrafo, type ResumenGrafo } from "@/lib/cerebro/anillo";
import { sinVedadas } from "@/lib/jarvis/seguridad";
import type { PropuestaJarvisCerebro } from "@/components/cerebro/cerebro-vista";

export const metadata = { title: "Cerebro del negocio" };
export const dynamic = "force-dynamic";

const fuente = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600", "800"], display: "swap", variable: "--cz-f" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--cz-mono" });
/** Serif itálica de los carteles (palabras clave recuadradas, como en el video de referencia del dueño). */
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["italic", "normal"], display: "swap", variable: "--cz-serif" });

/**
 * Cerebro del negocio (21/11, pedido de los dueños; vuelta 6 del 22/11: centro de mando).
 * Arriba, la barra para hablarle (Preguntale · Enseñale · Ordenale); debajo, el anillo de
 * pantallas con cada función viva (pendientes, Oficina, Jarvis, recomendaciones, lo aprendido,
 * decisiones, la semana, salud, laboratorio, mapa del código y pedidos a Claude). Lee el panel en
 * vivo; todo lo que escribe (enseñar, archivar, ordenar a la Oficina, arrancar agentes, mandar a
 * Claude, proponer cambios) pide confirmación antes.
 */

/** Una sola lectura de la semana por pedido, compartida por los bloques. */
const leerSemana = cache(async (): Promise<{ desde: string; perfiles: PerfilSemana[] } | null> => resumenSemanaEnMemoria().catch(() => null));

async function contarContactos(): Promise<number | null> {
  try {
    const { count, error } = await createAdminClient().from("contacts").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? null;
  } catch {
    return null;
  }
}

export default async function CerebroPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const [semana, contactos, salud, pedidos, rubros, oficina, aprendido, propuestas, grafo] = await Promise.all([
    leerSemana(),
    contarContactos(),
    leerSalud().catch(() => null),
    leerPedidos(),
    leerRubrosActivos().catch(() => []),
    leerOficina().catch(() => null),
    leerAprendido(200).catch(() => null),
    leerPropuestasJarvis(),
    leerGrafo(),
  ]);
  return (
    <CerebroVista
      fuentes={{
        clase: `${fuente.variable} ${mono.variable} ${serif.variable}`,
        estilo: { ["--cz-f" as string]: fuente.style.fontFamily, ["--cz-mono" as string]: mono.style.fontFamily, ["--cz-serif" as string]: serif.style.fontFamily },
      }}
      semana={semana}
      contactos={contactos}
      salud={salud}
      pedidos={pedidos}
      rubros={rubros}
      decisiones={leerDecisiones()}
      oficina={oficina?.tareas ?? null}
      aprendidos={aprendido?.disponible ? aprendido.items.length : null}
      propuestas={propuestas}
      grafo={grafo}
    />
  );
}

/** Lo último que se le pidió a Claude. */
async function leerPedidos(): Promise<TareaBandeja[] | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("bandeja_claude" as any)
      .select("id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    return (data ?? []).map(filaATarea).filter((x): x is TareaBandeja => x !== null);
  } catch {
    return null;
  }
}

/**
 * Propuestas de Jarvis que esperan el OK (últimos 7 días), de los cuatro perfiles, cada una con su
 * perfil para abrirla en el Jarvis de ese perfil. Sin lo que Jarvis no hace (mismo filtro que Jarvis).
 */
async function leerPropuestasJarvis(): Promise<PropuestaJarvisCerebro[] | null> {
  try {
    const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data, error } = await createAdminClient()
      .from("asistente_acciones" as any)
      .select("id, rubro_id, tipo, titulo, resumen, estado")
      .eq("estado", "propuesta")
      .gte("created_at", desde)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    const filas = ((data ?? []) as any[]).map((r) => ({ id: String(r.id), tipo: String(r.tipo ?? ""), titulo: String(r.titulo ?? "Propuesta"), resumen: r.resumen ? String(r.resumen) : "", estado: String(r.estado), rubro_id: r.rubro_id }));
    return sinVedadas(filas).visibles.map((r) => ({ id: r.id, titulo: r.titulo, resumen: r.resumen, perfil: perfilDeRubroId(r.rubro_id) }));
  } catch {
    return null;
  }
}

/** Resumen del mapa del código que arma Graphify (viaja con el despliegue junto con el resto del cerebro). */
async function leerGrafo(): Promise<ResumenGrafo | null> {
  try {
    return resumenGrafo(await readFile(join(process.cwd(), "cerebro", "mapa-codigo", "GRAPH_REPORT.md"), "utf8"));
  } catch {
    return null;
  }
}
