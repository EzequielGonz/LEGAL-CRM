import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONFIG_VACIA, validarConfigAnuncios } from "@/lib/redes/publicidad";

export const dynamic = "force-dynamic";

async function leer(): Promise<{ habilitada: boolean; perfiles: Record<string, unknown> }> {
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", "publicidad").maybeSingle();
  const v: any = data?.value ?? {};
  return { habilitada: false, perfiles: typeof v.perfiles === "object" && v.perfiles ? v.perfiles : {} };
}

/** Configuración de publicidad del perfil (siempre apagada: no gasta nada). */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const v = await leer();
  return NextResponse.json({ habilitada: false, config: { ...CONFIG_VACIA, ...((v.perfiles[perfil] as object) ?? {}) } });
}

export async function PUT(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  let config;
  try {
    config = validarConfigAnuncios(body?.config ?? {});
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, campo: "cuenta_publicitaria" }, { status: 400 });
  }
  const v = await leer();
  const valor = { habilitada: false, perfiles: { ...v.perfiles, [body.perfil]: config } };
  const { error } = await createAdminClient().from("system_settings").upsert({ key: "publicidad", value: valor, updated_at: new Date().toISOString(), updated_by: "panel" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habilitada: false, config });
}
