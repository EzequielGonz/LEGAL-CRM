import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { esSlugPerfil } from "@/lib/marca";
import { colasDeHoy } from "@/lib/hoy/colas";
import { setOpportunityState } from "@/lib/opportunities";

/**
 * Cierra como perdidos los descartes que «Hoy» reconoció (12/11): personas
 * cuyo último mensaje dice que ya tienen abogado, que lo resolvieron o que no
 * les interesa. Lo dispara una persona con un clic; el servidor vuelve a
 * calcular la lista (no confía en lo que manda el navegador). No borra nada:
 * la oportunidad queda «perdido» con su motivo y el chat sigue en el historial.
 */
export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const perfil = body?.perfil;
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
  const pedidos: string[] | null = Array.isArray(body?.oportunidades) ? body.oportunidades.filter((x: unknown) => typeof x === "string") : null;

  const { descartes } = await colasDeHoy(rubroId, AREAS_DE_PERFIL[perfil]);
  const elegidos = descartes.filter((d) => d.oportunidadId && (!pedidos || pedidos.includes(d.oportunidadId)));
  let cerrados = 0;
  const errores: string[] = [];
  for (const d of elegidos) {
    try {
      const motivo = `Descartado desde Hoy: ${d.descarte.etiqueta.toLowerCase()} (su último mensaje lo dice).`;
      await setOpportunityState({
        opportunityId: d.oportunidadId!,
        dimension: "captacion",
        field: "capture_state",
        value: "perdido",
        actor: "operador",
        reason: motivo,
        extra: { capture_reason: motivo },
      });
      cerrados++;
    } catch (err: any) {
      errores.push(String(err?.message ?? err).slice(0, 120));
    }
  }
  return NextResponse.json({ ok: errores.length === 0, cerrados, errores: errores.slice(0, 3) });
}
