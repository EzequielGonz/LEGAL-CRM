import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil, normalizarColores } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };

/**
 * Lápiz de la pantalla de perfiles (18/10): nombre, nombre interno, logo y
 * color de acento del panel. multipart: perfil, nombre?, nombre_interno?,
 * color? (#RRGGBB o vacío para volver al original), logo? (archivo),
 * quitar_logo? ("1"). Solo datos públicos de marca; no envía nada.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const form = await request.formData().catch(() => null);
  const perfil = form?.get("perfil");
  if (!form || !esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const rubroId = RUBRO_IDS[perfil];
  const s = createAdminClient();
  const texto = (k: string, max: number) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim().slice(0, max) : null;
  };
  const nombre = texto("nombre", 80);
  const interno = texto("nombre_interno", 60);
  const color = texto("color", 7);
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) return NextResponse.json({ error: "El color tiene que tener el formato #RRGGBB.", campo: "color" }, { status: 400 });

  const { data: previo } = await s.from("brand_briefs").select("colores, logo_panel").eq("rubro_id", rubroId).maybeSingle();
  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (nombre !== null) {
    if (nombre.length < 2) return NextResponse.json({ error: "El nombre es muy corto.", campo: "nombre" }, { status: 400 });
    cambios.nombre_publico = nombre;
  }
  if (color !== null) {
    const colores = normalizarColores((previo as any)?.colores);
    if (color) colores.panel = color.toUpperCase();
    else delete colores.panel;
    cambios.colores = colores;
  }
  const logo = form.get("logo");
  if (logo && typeof logo !== "string" && logo.size > 0) {
    const ext = TIPOS[logo.type];
    if (!ext) return NextResponse.json({ error: "El logo tiene que ser PNG, JPG, WEBP o SVG.", campo: "logo" }, { status: 400 });
    if (logo.size > 2 * 1024 * 1024) return NextResponse.json({ error: "El logo puede pesar hasta 2 MB.", campo: "logo" }, { status: 400 });
    const ruta = `${perfil}/logo-${Date.now()}.${ext}`;
    const { error } = await s.storage.from("marca").upload(ruta, await logo.arrayBuffer(), { contentType: logo.type, upsert: false });
    if (error) return NextResponse.json({ error: `No se pudo subir el logo: ${error.message}`, campo: "logo" }, { status: 500 });
    cambios.logo_panel = s.storage.from("marca").getPublicUrl(ruta).data.publicUrl;
  } else if (form.get("quitar_logo") === "1") {
    cambios.logo_panel = null;
  }
  const { error } = await s.from("brand_briefs").update(cambios).eq("rubro_id", rubroId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (interno) await s.from("rubros").update({ name: interno, settings_updated_at: new Date().toISOString() }).eq("id", rubroId);
  revalidateTag("marca-perfil");
  return NextResponse.json({ ok: true, logo: (cambios.logo_panel as string | null | undefined) ?? (previo as any)?.logo_panel ?? null });
}
