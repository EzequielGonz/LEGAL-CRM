import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { listarRoles } from "@/lib/agentes/roles";
import { armarHistorial } from "@/lib/laboratorio/historial";

export const dynamic = "force-dynamic";

/** Historial de cambios de roles, ficha y agentes de UN perfil (cada rubro separado). Solo lee. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const rubroId = RUBRO_IDS[perfil];
  const s = createAdminClient();
  const [roles, { data: rubro }, { data: agentes }, { data: versiones }] = await Promise.all([
    listarRoles(rubroId, true).catch(() => []),
    s.from("rubros").select("*").eq("id", rubroId).maybeSingle(),
    s.from("agent_library").select("clave").or(`rubro_id.is.null,rubro_id.eq.${rubroId}`),
    s.from("agent_library_versions").select("clave, version, motivo, created_at").order("created_at", { ascending: false }).limit(60),
  ]);
  const claves = new Set(((agentes ?? []) as any[]).map((a) => a.clave));
  const eventos = armarHistorial({ roles: roles as any[], fichaActualizada: (rubro as any)?.business_sheet_updated_at ?? null, versiones: ((versiones ?? []) as any[]).filter((v) => claves.has(v.clave)) });
  return NextResponse.json({ eventos });
}
