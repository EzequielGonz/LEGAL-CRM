import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { tickAllActiveCampaigns } from "@/lib/campaigns";
import { runMarketingTick } from "@/lib/marketing/followups";
import { enqueueQualifiedLeads } from "@/lib/marketing/outreach";
import { runFollowupTick } from "@/lib/seguimiento/motor";
import { ejecutarCitaTareasVencidas } from "@/lib/citas";
import { publicarVencidas } from "@/lib/contenido/cola";
import { getTareasServidor } from "@/lib/tareas-servidor";
import { asegurarAvisosDeLineas } from "@/lib/whatsapp/avisos-servidor";
import { contactarFormulariosDeLanding } from "@/lib/landing-seguimiento";
import { avanzarExtraccion } from "@/lib/marketing/extraer";
import { enviarPresupuestosProgramados } from "@/lib/marketing/presupuestos";
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

    // 6) Avisos de Meta (21/10): si una línea manda y no recibe avisos
    //    (mensajes entrantes ni estados), se suscribe su cuenta al webhook del
    //    panel. Reintenta como mucho cada 6 h por línea. No envía mensajes.
    let avisos: unknown = null;
    if (Date.now() - inicio < 45_000) {
      try {
        avisos = await asegurarAvisosDeLineas();
      } catch (err: any) {
        avisos = { error: String(err?.message ?? err) };
      }
    }

    // 7) Formularios de las landings (21/10): a los 5 minutos, el agente le
    //    escribe por WhatsApp con la plantilla aprobada del rubro.
    let formularios: unknown = null;
    if (Date.now() - inicio < 50_000) {
      try {
        formularios = await contactarFormulariosDeLanding();
      } catch (err: any) {
        formularios = { error: String(err?.message ?? err) };
      }
    }

    // 8) Presupuestos de Marketing programados (21/10): salen a la hora que
    //    eligió el equipo, con pausa general y horario de salidas respetados.
    let presupuestos: unknown = null;
    if (Date.now() - inicio < 52_000) {
      try {
        presupuestos = await enviarPresupuestosProgramados();
      } catch (err: any) {
        presupuestos = { error: String(err?.message ?? err) };
      }
    }

    // Tablero de salud: deja la hora del último latido.
    await registrarLatido(true, { ms: Date.now() - inicio });
    return NextResponse.json({ ok: true, results, seguimiento, marketing, servidor, extraccion, avisos, formularios, presupuestos });
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
