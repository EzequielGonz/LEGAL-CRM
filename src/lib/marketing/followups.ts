import { getAutomationPause } from "@/lib/automation-pause";
import { analyzePendingLeads } from "./analysis";
import { hasRunnableScrapeJob, runNextScrapeJob } from "./scrape-jobs";

/**
 * Latido del pipeline de Marketing que no es el envío de la campaña:
 * búsquedas de negocios y análisis.
 *
 * Etapa 2 (bloque 2.3): los seguimientos de Marketing pasaron al circuito
 * general de los cuatro perfiles (src/lib/seguimiento/motor.ts). El sistema
 * anterior ("repesca" con sus propias reglas) dejó de enviar; su historial se
 * conserva en marketing_leads y marketing_events. Las cinco diferencias que
 * se corrigieron al pasar al circuito general:
 *  1. Entraba quien dejó de responder sin importar la hora: ahora el contacto
 *     2 se programa a las 48–72 h, en la franja válida del calendario.
 *  2. Horario propio de 9 a 20: ahora rige el general (lunes a sábado de 8 a
 *     21, con las excepciones cargadas a mano).
 *  3. Intervalos de "menos de 3 días" y "3 días después": ahora 60 h (48 a 72)
 *     para cada contacto, editable por perfil.
 *  4. Al agotarse daba de baja y cerraba como perdido: ahora agotar no es una
 *     baja, y quien llegó al tercer contacto sin avanzar pasa a la base para
 *     campaña manual.
 *  5. Mandaba el tercer contacto aunque no hubiera respondido el segundo:
 *     ahora, sin respuesta al segundo, el circuito se detiene.
 */
export async function runMarketingTick() {
  const result: Record<string, unknown> = {};

  // Pausa general: sin búsquedas ni análisis con IA.
  if ((await getAutomationPause()).outboundPaused) {
    result.pausa_general = true;
    return result;
  }

  // Una búsqueda de Google Maps (hasta ~45 s) y el análisis (descarga de sitios + IA) no
  // entran juntos en una misma ejecución: si hay una búsqueda por correr y la cola de
  // análisis no está saturada, este latido corre la búsqueda; si no, analiza.
  try {
    if (await hasRunnableScrapeJob()) {
      result.busqueda = await runNextScrapeJob();
    } else {
      result.analisis = await analyzePendingLeads(2);
    }
  } catch (err: any) {
    result.analisis_error = String(err?.message ?? err);
  }

  return result;
}
