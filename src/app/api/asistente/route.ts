import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil } from "@/lib/marca";
import { conversarConAsistente, validarImagenes, validarTextos, type MensajeAsistente } from "@/lib/asistente/motor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Asistente del panel (18/10). body: { perfil, mensajes: [{ rol, texto }], imagenes?: [{ mime, datos }], textos?: [{ nombre, contenido }], modo?: "campanas" }.
 * Las imágenes (hasta 3, solo para mirarlas) van con el último mensaje.
 * Responde texto, propuestas (que se confirman aparte) y botones a pantallas.
 * No envía mensajes a nadie ni ejecuta acciones por su cuenta.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const mensajes: MensajeAsistente[] = Array.isArray(body?.mensajes)
    ? body.mensajes
        .filter((m: any) => (m?.rol === "usuario" || m?.rol === "asistente") && typeof m?.texto === "string" && m.texto.trim())
        .map((m: any) => ({ rol: m.rol, texto: String(m.texto).slice(0, 4000) }))
    : [];
  if (mensajes.length === 0 || mensajes[mensajes.length - 1].rol !== "usuario") {
    return NextResponse.json({ error: "Escribí qué necesitás." }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "El asistente necesita la clave de Gemini configurada en el servidor." }, { status: 503 });
  try {
    return NextResponse.json(await conversarConAsistente(body.perfil, mensajes, validarImagenes(body?.imagenes), { modo: body?.modo === "campanas" ? "campanas" : "general", textos: validarTextos(body?.textos) }));
  } catch (err) {
    console.error("[asistente]", err);
    return NextResponse.json({ error: "El asistente no pudo responder ahora. Probá de nuevo en unos segundos." }, { status: 502 });
  }
}
