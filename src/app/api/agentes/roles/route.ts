import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { archivarRol, asignarRolABase, guardarRol, listarRoles } from "@/lib/agentes/roles";

export const dynamic = "force-dynamic";

/**
 * Roles del agente por base (21/10).
 * GET  ?perfil=<slug>                      → roles y bases del perfil.
 * POST { perfil, accion: "guardar", id?, nombre, objetivo, tono, instrucciones }
 * POST { perfil, accion: "archivar", id, nota? }
 * POST { perfil, accion: "asignar", base_id, rol_id|null }
 * No envía mensajes ni lanza campañas.
 */
function perfilDe(v: unknown): RubroSlug | null {
  return typeof v === "string" && v in RUBRO_IDS ? (v as RubroSlug) : null;
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = perfilDe(new URL(request.url).searchParams.get("perfil"));
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const rubroId = RUBRO_IDS[perfil];
  const [roles, { data: bases }] = await Promise.all([
    listarRoles(rubroId),
    createAdminClient()
      .from("imported_bases" as any)
      .select("id, name, area, created_rows, created_at, agent_role_id")
      .in("area", AREAS_DE_PERFIL[perfil] ?? [perfil])
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);
  return NextResponse.json({ roles, bases: bases ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = perfilDe(body?.perfil);
  if (!perfil) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const rubroId = RUBRO_IDS[perfil];
  const areas = AREAS_DE_PERFIL[perfil] ?? [perfil];
  try {
    if (body.accion === "guardar") {
      const rol = await guardarRol(rubroId, areas[0], { id: body.id ?? null, nombre: body.nombre, objetivo: body.objetivo, tono: body.tono, instrucciones: body.instrucciones });
      return NextResponse.json({ rol });
    }
    if (body.accion === "archivar" && typeof body.id === "string") {
      await archivarRol(rubroId, body.id, String(body.nota ?? ""));
      return NextResponse.json({ ok: true });
    }
    if (body.accion === "asignar" && typeof body.base_id === "string") {
      await asignarRolABase(rubroId, areas, body.base_id, typeof body.rol_id === "string" && body.rol_id ? body.rol_id : null);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String((err as Error)?.message ?? err).slice(0, 300) }, { status: 400 });
  }
}
