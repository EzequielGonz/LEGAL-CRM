/**
 * Lee las plantillas que aparecen en un historial (24/10) para mostrarle al
 * bot su texto real y sus botones. Solo lectura.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { prepararHistorial, refPlantilla, type AnalisisPlantilla, type FilaHistorial } from "./plantillas-en-historial";

export async function historialConPlantillas<T extends FilaHistorial>(filas: T[]) {
  const refs = filas.map(refPlantilla).filter(Boolean) as { id: string | null; nombre: string | null }[];
  const ids = Array.from(new Set(refs.map((r) => r.id).filter(Boolean))) as string[];
  const nombres = Array.from(new Set(refs.map((r) => r.nombre).filter(Boolean))) as string[];
  const porId = new Map<string, AnalisisPlantilla>();
  const porNombre = new Map<string, AnalisisPlantilla>();
  if (ids.length || nombres.length) {
    try {
      const s = createAdminClient();
      const [a, b] = await Promise.all([
        ids.length ? s.from("whatsapp_templates" as any).select("id, name, variables").in("id", ids) : Promise.resolve({ data: [] as any[] }),
        nombres.length ? s.from("whatsapp_templates" as any).select("id, name, variables").in("name", nombres) : Promise.resolve({ data: [] as any[] }),
      ]);
      for (const t of [...((a as any).data ?? []), ...((b as any).data ?? [])] as any[]) {
        const v = (t.variables ?? null) as AnalisisPlantilla | null;
        if (!v) continue;
        porId.set(t.id, v);
        if (!porNombre.has(t.name)) porNombre.set(t.name, v);
      }
    } catch (err) {
      console.error("[historial] No se pudieron leer las plantillas:", err);
    }
  }
  return prepararHistorial(filas, (ref) => (ref.id && porId.get(ref.id)) || (ref.nombre && porNombre.get(ref.nombre)) || null);
}
