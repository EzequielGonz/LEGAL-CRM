/**
 * Etapa 3 · Ejecutor de tareas del servidor (citas de Fase 2 y publicación
 * de contenido). Vive en system_settings.tareas_servidor como
 * {"citas": false, "contenido": false}. Apagado por defecto; se enciende
 * solo desde Configuración con el PIN, y aun encendido la pausa general
 * sigue cortando cualquier envío o publicación.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export interface TareasServidor {
  citas: boolean;
  contenido: boolean;
  configProblem?: string;
}

export function parseTareasServidor(row: { value: unknown } | null | undefined): TareasServidor {
  const v = (row?.value ?? null) as Record<string, unknown> | null;
  if (!v || typeof v !== "object") return { citas: false, contenido: false, configProblem: "Sin configuración: las tareas del servidor quedan apagadas." };
  return { citas: v.citas === true, contenido: v.contenido === true };
}

export async function getTareasServidor(): Promise<TareasServidor> {
  try {
    const { data, error } = await createAdminClient().from("system_settings").select("value").eq("key", "tareas_servidor").maybeSingle();
    if (error) throw new Error(error.message);
    return parseTareasServidor(data);
  } catch (err: any) {
    console.error("[tareas] No se pudo leer tareas_servidor; se asumen apagadas:", err?.message ?? err);
    return { citas: false, contenido: false, configProblem: String(err?.message ?? err) };
  }
}

export async function setTareasServidor(valor: { citas: boolean; contenido: boolean }, actor = "operador") {
  const { error } = await createAdminClient()
    .from("system_settings")
    .upsert({ key: "tareas_servidor", value: { ...valor, since: new Date().toISOString(), by: actor } }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
