import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { createAdminClient } from "@/lib/supabase/admin";
import { esSlugPerfil } from "@/lib/marca";
import { claveInstagramEnlace, usuarioDeInstagram } from "@/lib/redes/instagram-enlace";

export const dynamic = "force-dynamic";

/**
 * Instagram por enlace (24/10). GET ?perfil= → { usuario }. POST { perfil, enlace } guarda
 * el usuario público (vacío lo borra). No publica nada ni usa la API de Meta.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const { data } = await createAdminClient().from("system_settings").select("value").eq("key", claveInstagramEnlace(perfil)).maybeSingle();
  return NextResponse.json({ usuario: ((data as any)?.value?.usuario as string | undefined) ?? null });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = body?.perfil;
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
  const vacio = !String(body?.enlace ?? "").trim();
  const usuario = vacio ? null : usuarioDeInstagram(body?.enlace);
  if (!vacio && !usuario) return NextResponse.json({ error: "Pegá el enlace del perfil (instagram.com/usuario) o el @usuario." }, { status: 400 });
  const { error } = await createAdminClient()
    .from("system_settings")
    .upsert({ key: claveInstagramEnlace(perfil), value: { usuario, at: new Date().toISOString() } as any }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  return NextResponse.json({ ok: true, usuario });
}
