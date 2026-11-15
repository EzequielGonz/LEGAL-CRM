import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { conversarConAsistenteGeneral, validarImagenes, validarTextos, type MensajeAsistente } from "@/lib/asistente/motor";
import { sanearResumenes } from "@/lib/asistente/general";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Asistente general (15/11), desde la pantalla de Perfiles: el mismo
 * asistente, para los cuatro perfiles. body: { mensajes, imagenes?, textos?,
 * archivos?: [resumen de cada planilla] }. De las planillas solo llega el
 * resumen enmascarado (las filas se subieron aparte y no las ve el modelo).
 * Responde texto, propuestas (que se confirman aparte) y botones a pantallas.
 * No envía mensajes a nadie ni ejecuta acciones por su cuenta.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
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
    return NextResponse.json(
      await conversarConAsistenteGeneral(mensajes, validarImagenes(body?.imagenes), { textos: validarTextos(body?.textos), archivos: sanearResumenes(body?.archivos) })
    );
  } catch (err) {
    console.error("[asistente/general]", err);
    return NextResponse.json({ error: "El asistente no pudo responder ahora. Probá de nuevo en unos segundos." }, { status: 502 });
  }
}
