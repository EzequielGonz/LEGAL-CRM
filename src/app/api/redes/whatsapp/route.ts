import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardarPerfilWhatsApp, leerPerfilWhatsApp, PerfilError, subirFotoPerfil, validarPerfil } from "@/lib/redes/whatsapp-perfil";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function lineasDelPerfil(rubroId: string) {
  const { data } = await createAdminClient().from("profile_lines").select("id, label, phone_display, credential_key, area").eq("rubro_id", rubroId).eq("active", true).order("created_at");
  return (data ?? []) as { id: string; label: string; phone_display: string | null; credential_key: string; area: string }[];
}

/** Perfil de WhatsApp de cada línea del perfil (lo lee de Meta en vivo). */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const lineas = await lineasDelPerfil(rubroId);
  const salida = await Promise.all(
    lineas.map(async (l) => {
      try {
        return { id: l.id, label: l.label, telefono: l.phone_display, perfil: await leerPerfilWhatsApp(l.credential_key), error: null };
      } catch (err) {
        return { id: l.id, label: l.label, telefono: l.phone_display, perfil: null, error: String((err as Error)?.message ?? err) };
      }
    })
  );
  return NextResponse.json({ lineas: salida });
}

/** Guarda el perfil (y la foto, si viene). multipart: perfil, line_id, datos (JSON), foto (opcional). */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const rubroId = rubroIdDe(form.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const linea = (await lineasDelPerfil(rubroId)).find((l) => l.id === form.get("line_id"));
  if (!linea) return NextResponse.json({ error: "La línea no es de este perfil." }, { status: 404 });
  try {
    let datos: Record<string, unknown> = {};
    try {
      datos = JSON.parse(String(form.get("datos") ?? "{}"));
    } catch {
      throw new PerfilError("Datos inválidos.");
    }
    const limpio = validarPerfil(datos);
    const foto = form.get("foto");
    let handle: string | null = null;
    if (foto && typeof foto !== "string" && foto.size > 0) handle = await subirFotoPerfil(linea.credential_key, await foto.arrayBuffer(), foto.type);
    await guardarPerfilWhatsApp(linea.credential_key, limpio, handle);
    return NextResponse.json({ ok: true, perfil: await leerPerfilWhatsApp(linea.credential_key).catch(() => null) });
  } catch (err) {
    const e = err as PerfilError;
    return NextResponse.json({ error: e.message, campo: e.campo }, { status: e.status ?? 500 });
  }
}
