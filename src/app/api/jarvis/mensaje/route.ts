import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { RUBRO_IDS } from "@/lib/rubros";
import { conversarConJarvis, validarImagenes, type MensajeAsistente } from "@/lib/asistente/motor";
import { pantallaDeRuta, perfilCoincideConRuta, rutaSegura } from "@/lib/jarvis/pantallas";
import { chequearTopeGemini } from "@/lib/presupuesto/servidor";
import { leerTablero } from "@/lib/jarvis/servidor";
import { respuestaSinIA } from "@/lib/jarvis/tablero";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Jarvis (22/11). body: { perfil, ruta, mensajes: [{ rol, texto }], imagenes? }.
 * El texto de la persona va al modelo como mensaje de usuario (dato); la
 * ruta y el perfil se validan acá. Responde texto, propuestas para confirmar
 * (se confirman aparte, con tarjeta), borradores y botones a pantallas.
 * Nada se ejecuta acá: lo que cambia algo vuelve como propuesta y se confirma aparte.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (!esSlugPerfil(body?.perfil)) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const perfil: SlugPerfil = body.perfil;
  // Cada rubro separado: si la pantalla dice otro perfil, no se mezcla.
  if (!perfilCoincideConRuta(perfil, body?.ruta)) return NextResponse.json({ error: "El perfil no coincide con la pantalla. Recargá la página." }, { status: 400 });
  const mensajes: MensajeAsistente[] = Array.isArray(body?.mensajes)
    ? body.mensajes
        .filter((m: any) => (m?.rol === "usuario" || m?.rol === "asistente") && typeof m?.texto === "string" && m.texto.trim())
        .map((m: any) => ({ rol: m.rol, texto: String(m.texto).slice(0, 4000) }))
        // 22/11: solo los últimos 20 turnos llegan al modelo (tope de costo).
        .slice(-20)
    : [];
  if (mensajes.length === 0 || mensajes[mensajes.length - 1].rol !== "usuario") return NextResponse.json({ error: "Escribí qué necesitás." }, { status: 400 });
  // Sin clave de IA (por ejemplo en una vista previa) o con el tope: respuesta por reglas con los números del panel.
  const sinIA = async (motivo: "sin_clave" | "tope") => {
    const tablero = await leerTablero(perfil).catch(() => null);
    const r = respuestaSinIA(mensajes[mensajes.length - 1].texto, tablero, motivo);
    return NextResponse.json({ texto: r.texto, propuestas: [], enlaces: [], borradores: [], tarjetas: r.tarjetas, descartadas: 0, sinIA: true });
  };
  if (!process.env.GEMINI_API_KEY) return sinIA("sin_clave");

  // Tope de gasto de IA (USD 30 al mes): si se llegó, Jarvis no llama al modelo y lo dice claro.
  const tope = await chequearTopeGemini({ rubroId: RUBRO_IDS[perfil] });
  if (tope.bloquea) return sinIA("tope");
  try {
    const ruta = rutaSegura(body?.ruta);
    return NextResponse.json(await conversarConJarvis(perfil, mensajes, validarImagenes(body?.imagenes), { pantalla: pantallaDeRuta(ruta).pantalla, ruta }));
  } catch (err) {
    console.error("[jarvis]", (err as Error)?.message ?? err);
    return NextResponse.json({ error: "No pude responder ahora. Probá de nuevo en unos segundos." }, { status: 502 });
  }
}
