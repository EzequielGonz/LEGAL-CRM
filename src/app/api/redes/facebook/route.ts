import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import {
  RedError,
  estadoVinculacion,
  guardarPaginaFacebook,
  leerPaginaFacebook,
  leerPerfilInstagram,
  subirFotoPaginaFacebook,
  validarPaginaFacebook,
} from "@/lib/redes/facebook-pagina";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const mensaje = (err: unknown) => String((err as Error)?.message ?? err);

/** Página de Facebook e Instagram del perfil (en vivo, desde Meta). Nunca devuelve tokens. */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const perfil = new URL(request.url).searchParams.get("perfil");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const vinculacion = estadoVinculacion(perfil);
  const [facebook, instagram] = await Promise.all([
    vinculacion.facebook ? leerPaginaFacebook(perfil).then((d) => ({ datos: d, error: null }), (e) => ({ datos: null, error: mensaje(e) })) : Promise.resolve({ datos: null, error: null }),
    vinculacion.instagram ? leerPerfilInstagram(perfil).then((d) => ({ datos: d, error: null }), (e) => ({ datos: null, error: mensaje(e) })) : Promise.resolve({ datos: null, error: null }),
  ]);
  return NextResponse.json({ vinculacion, facebook, instagram });
}

/** Guarda la página de Facebook (y la foto, si viene). multipart: perfil, datos (JSON), foto (opcional). */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const perfil = String(form.get("perfil") ?? "");
  if (!esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  try {
    let datos: Record<string, unknown> = {};
    try {
      datos = JSON.parse(String(form.get("datos") ?? "{}"));
    } catch {
      throw new RedError("Datos inválidos.");
    }
    const limpio = validarPaginaFacebook(datos);
    const foto = form.get("foto");
    if (foto && typeof foto !== "string" && foto.size > 0) await subirFotoPaginaFacebook(perfil, await foto.arrayBuffer(), foto.type);
    await guardarPaginaFacebook(perfil, limpio);
    return NextResponse.json({ ok: true, datos: await leerPaginaFacebook(perfil).catch(() => null) });
  } catch (err) {
    const e = err as RedError;
    return NextResponse.json({ error: e.message, campo: e.campo }, { status: e.status ?? 500 });
  }
}
