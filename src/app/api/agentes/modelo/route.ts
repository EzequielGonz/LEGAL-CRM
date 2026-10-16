import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { informeModeloActivo } from "@/lib/agentes/modelo";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Etapa 3 · Informe del modelo activo (solo lectura): proveedor, identificador
 * (variable de entorno o valor por defecto del código), si la clave está
 * configurada (sin mostrarla) y qué asignaciones hay. No cambia nada.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const informe = informeModeloActivo();
  const { data: asignaciones } = await createAdminClient().from("agent_assignments").select("rubro_id, area, agente_clave, version, modelo_proveedor, modelo_identificador, estado, updated_at").order("area");
  return NextResponse.json({ ...informe, asignaciones: asignaciones ?? [] });
}
