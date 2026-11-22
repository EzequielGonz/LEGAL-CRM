import { createAdminClient } from "@/lib/supabase/admin";
import { aSecciones, type Conocimiento } from "@/lib/cerebro/conocimiento";
import { buscarEnCerebro, type SeccionCerebro } from "@/lib/jarvis/cerebro-memoria";
import { seccionesDelCerebro } from "@/lib/jarvis/cerebro-memoria-servidor";

const COLUMNAS = "id, rubro_id, tipo, titulo, contenido, fuente, creado_por, created_at, archivada_at";

/** Lo aprendido vigente. Si la tabla todavía no existe (falta aplicar 0650) devuelve `disponible: false`, sin romper. */
export async function leerAprendido(limite = 200): Promise<{ disponible: boolean; items: Conocimiento[] }> {
  try {
    const { data, error } = await createAdminClient().from("cerebro_conocimiento" as any).select(COLUMNAS).is("archivada_at", null).order("created_at", { ascending: false }).limit(limite);
    if (error) return { disponible: false, items: [] };
    return { disponible: true, items: (data ?? []) as unknown as Conocimiento[] };
  } catch {
    return { disponible: false, items: [] };
  }
}

/** Busca en los .md del cerebro y en lo aprendido; lo aprendido va primero a igual puntaje (lo enseñó el dueño). */
export async function preguntarAlCerebro(pregunta: string, max = 4): Promise<SeccionCerebro[]> {
  const { items } = await leerAprendido();
  const aprendido = buscarEnCerebro(aSecciones(items), pregunta, 2);
  const archivos = buscarEnCerebro(seccionesDelCerebro(), pregunta, max);
  return [...aprendido, ...archivos].slice(0, max + 1);
}

export { COLUMNAS as COLUMNAS_CONOCIMIENTO };
