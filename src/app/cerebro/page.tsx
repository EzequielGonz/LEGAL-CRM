import { cache } from "react";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./cerebro.css";
import { requirePageSession } from "@/lib/acceso/pagina";
import { CerebroVista } from "@/components/cerebro/cerebro-vista";
import { resumenSemanaEnMemoria } from "@/lib/asistente/semana-cache";
import { leerRubrosActivos } from "@/lib/perfiles-stats";
import { leerSalud } from "@/lib/salud";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, type TareaBandeja } from "@/lib/bandeja-claude";
import { leerDecisiones } from "@/lib/cerebro/decisiones-servidor";
import type { PerfilSemana } from "@/lib/cerebro/contenido";

export const metadata = { title: "Cerebro del negocio" };
export const dynamic = "force-dynamic";

const fuente = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600", "800"], display: "swap", variable: "--cz-f" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--cz-mono" });

/**
 * Cerebro del negocio (21/11, pedido de los dueños): pantalla aparte, con la
 * escena de la página del cerebro que armó Claude (esfera, frases, recuadro).
 * Se abre desde Inicio en una pestaña nueva. Lee el panel en vivo (cifras de
 * la semana, salud, pedidos a Claude), suma el asistente general y el
 * laboratorio de bots, y manda pedidos a la Bandeja para Claude. Solo lee:
 * el único botón que escribe es «Mandar a Claude».
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
  const [semana, contactos, salud, pedidos, rubros] = await Promise.all([
    leerSemana(),
    contarContactos(),
    leerSalud().catch(() => null),
    leerPedidos(),
    leerRubrosActivos().catch(() => []),
  ]);
  return <CerebroVista fuentes={{ clase: `${fuente.variable} ${mono.variable}`, estilo: { ["--cz-f" as string]: fuente.style.fontFamily, ["--cz-mono" as string]: mono.style.fontFamily } }} semana={semana} contactos={contactos} salud={salud} pedidos={pedidos} rubros={rubros} decisiones={leerDecisiones()} />;
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
