import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { tickAllActiveCampaigns } from "@/lib/campaigns";
import { runMarketingTick } from "@/lib/marketing/followups";
import { enqueueQualifiedLeads } from "@/lib/marketing/outreach";
import { runFollowupTick } from "@/lib/seguimiento/motor";
import { ejecutarCitaTareasVencidas } from "@/lib/citas";
import { publicarVencidas } from "@/lib/contenido/cola";
import { getTareasServidor } from "@/lib/tareas-servidor";
import { generarInformesVencidos } from "@/lib/experimento/servicio";
import { evaluarPlantillasPendientes, revisarAjusteC } from "@/lib/experimento/acciones";
import { avanzarExtraccion } from "@/lib/marketing/extraer";
import { registrarLatido } from "@/lib/salud";

// El análisis de negocios (descargar la web + IA) necesita más de los 10s por defecto.
export const maxDuration = 60;

/**
 * Endpoint "latido": le da un paso a todas las campañas en curso (manda como
 * mucho 1 mensaje por campaña, si ya le toca según su ritmo configurado) y
 * responde al instante. Pensado para ser llamado por un cron externo cada
 * ~1 minuto (ver docs/SETUP.md) — así se logra el ritmo real de "1 mensaje
 * nuevo cada 1.5 minutos, en lotes de 10, con 5 minutos de pausa entre
 * lotes" sin necesitar que ninguna función quede corriendo horas.
 *
 * Protegido con CRON_SECRET, solo por encabezado `Authorization: Bearer
 * <secreto>` (desde el 16/10 ya no se acepta en la dirección: las URL quedan
 * en los registros). La tarea de Supabase ya lo manda por encabezado.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // sin secreto configurado, no se puede usar
  const recibido = request.headers.get("authorization") ?? "";
  const esperado = `Bearer ${expected}`;
  if (recibido.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const inicio = Date.now();
  try {
    // 1) Primero lo que manda mensajes (campañas), que es lo sensible al ritmo.
    const results = await tickAllActiveCampaigns();

    // 2) Seguimiento general de los cuatro perfiles (bloque 2.3): programa los
    //    contactos 2 y 3 y manda los vencidos. Aislado: si falla, no afecta al resto.
    let seguimiento: Record<string, unknown> = {};
    try {
      seguimiento = await runFollowupTick();
    } catch (err: any) {
      seguimiento = { error: String(err?.message ?? err) };
    }

    // 3) Pipeline de Marketing: analiza negocios nuevos, suma los mejor
    //    calificados a la prospección automática (sus seguimientos ya van por el punto 2).
    //    Aislado: si falla, no afecta a las campañas de los otros rubros.
    let marketing: Record<string, unknown> = {};
    try {
      marketing = await runMarketingTick();
      marketing.sumados_a_prospeccion = await enqueueQualifiedLeads();
    } catch (err: any) {
      marketing = { error: String(err?.message ?? err) };
    }

    // 4) Etapa 3: tareas del servidor (citas de Fase 2 y publicación de
    //    contenido), solo si el ejecutor está encendido desde Configuración.
    //    Cada una además respeta la pausa general y su política propia.
    const tareas = await getTareasServidor();
    const servidor: Record<string, unknown> = { citas: "apagado", contenido: "apagado" };
    if (tareas.citas) {
      try {
        servidor.citas = await ejecutarCitaTareasVencidas({ limit: 5 });
      } catch (err: any) {
        servidor.citas = { error: String(err?.message ?? err) };
      }
    }
    if (tareas.contenido) {
      try {
        servidor.contenido = await publicarVencidas({ limit: 3 });
      } catch (err: any) {
        servidor.contenido = { error: String(err?.message ?? err) };
      }
    }

    // 5) Extraer negocios (Marketing): una zona por latido. No contacta a
    //    nadie, así que corre aunque la pausa general esté puesta. Si este
    //    latido ya usó mucho tiempo, queda para el próximo (la búsqueda puede
    //    tardar hasta ~45 s y la función tiene 60 s).
    let extraccion: unknown = "sin tiempo en este latido";
    if (Date.now() - inicio < 12_000) {
      try {
        extraccion = await avanzarExtraccion();
      } catch (err: any) {
        extraccion = { error: String(err?.message ?? err) };
      }
    }

    // 6) Comparación de agentes: informes de los días 7/14/21/28, estado del
    //    ajuste de C y evaluación de plantillas en cola. No envía mensajes;
    //    corre aunque nadie tenga el panel abierto.
    const experimento: Record<string, unknown> = {};
    for (const [clave, tarea] of [
      ["informes", () => generarInformesVencidos()],
      ["ajuste_c", () => revisarAjusteC()],
      ["plantillas", () => (Date.now() - inicio < 40_000 ? evaluarPlantillasPendientes(2) : Promise.resolve("sin tiempo en este latido"))],
    ] as const) {
      try {
        experimento[clave] = await tarea();
      } catch (err: any) {
        experimento[clave] = { error: String(err?.message ?? err) };
      }
    }

    // Tablero de salud: deja la hora del último latido.
    await registrarLatido(true, { ms: Date.now() - inicio });
    return NextResponse.json({ ok: true, results, seguimiento, marketing, servidor, extraccion, experimento });
  } catch (err: any) {
    await registrarLatido(false, { error: String(err?.message ?? err).slice(0, 200) });
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}

// Algunos servicios de cron gratuitos (cron-job.org incluido) solo pueden
// hacer GET. Aceptamos ambos métodos con la misma lógica.
export async function GET(request: Request) {
  return POST(request);
}
