/**
 * Cierre automático de descartes (13/11, pedido de la responsable: «insistir
 * una vez como ya está programado el bot, pero una vez que se pierde ya se
 * elimina y ni se muestra»). Lo corre el latido.
 *
 * Son las mismas personas que «Hoy» ya reconocía como descarte (su último
 * mensaje dice con claridad que no le interesa, que ya lo resolvió, que ya
 * tiene quien la atienda o que es un número equivocado) en chats que el bot no
 * atiende. Antes había que cerrarlas con un clic; ahora, si pasan unas horas
 * sin que la persona escriba otra cosa ni alguien del equipo la rescate, se
 * cierran solas como perdidas con su motivo. No se borra nada: quedan en
 * Chats → Descartados y se pueden reabrir. Un captado nunca se cierra solo.
 */
import { rubroIdDe } from "@/lib/indicadores";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { colasDeHoy } from "@/lib/hoy/colas";
import { setOpportunityState } from "@/lib/opportunities";

/** Horas que se espera desde el mensaje de descarte antes de cerrar. */
export const ESPERA_DESCARTE_HORAS = 6;

/** Cuáles ya esperaron lo suficiente. Pura: se prueba sola. */
export function descartesVencidos<T extends { desde: string; oportunidadId: string | null; captado: boolean }>(descartes: T[], ahora: Date, horas = ESPERA_DESCARTE_HORAS): T[] {
  const limite = ahora.getTime() - horas * 3_600_000;
  return descartes.filter((d) => d.oportunidadId && !d.captado && Date.parse(d.desde) <= limite);
}

export async function cerrarDescartesAutomaticos(opts: { ahora?: Date } = {}): Promise<{ cerrados: number; errores: number; porPerfil: Record<string, number> }> {
  const ahora = opts.ahora ?? new Date();
  const r = { cerrados: 0, errores: 0, porPerfil: {} as Record<string, number> };
  for (const perfil of Object.keys(AREAS_DE_PERFIL) as (keyof typeof AREAS_DE_PERFIL)[]) {
    const rubroId = rubroIdDe(perfil);
    if (!rubroId) continue;
    const { descartes } = await colasDeHoy(rubroId, AREAS_DE_PERFIL[perfil]);
    for (const d of descartesVencidos(descartes, ahora)) {
      try {
        const motivo = `Descarte automático: ${d.descarte.etiqueta.toLowerCase()} (su último mensaje lo dice y pasaron ${ESPERA_DESCARTE_HORAS} h sin novedades).`;
        await setOpportunityState({
          opportunityId: d.oportunidadId!,
          dimension: "captacion",
          field: "capture_state",
          value: "perdido",
          actor: "sistema",
          reason: motivo,
          extra: { capture_reason: motivo },
        });
        r.cerrados++;
        r.porPerfil[perfil] = (r.porPerfil[perfil] ?? 0) + 1;
      } catch (err: any) {
        r.errores++;
        console.error(`[descartes] ${d.oportunidadId}:`, err?.message ?? err);
      }
    }
  }
  return r;
}
