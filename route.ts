import { NextResponse } from "next/server";
import { tickAllActiveCampaigns } from "@/lib/campaigns";
import { runMarketingTick } from "@/lib/marketing/followups";
import { enqueueQualifiedLeads } from "@/lib/marketing/outreach";

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
 * Protegido con CRON_SECRET para que no cualquiera pueda gatillar envíos:
 * aceptamos el secreto como header `Authorization: Bearer <secreto>` (lo
 * usan la mayoría de los servicios de cron que soportan headers custom) o
 * como query param `?secret=<secreto>` (para los que no).
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false; // sin secreto configurado, no se puede usar

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${expected}`) return true;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") === expected) return true;

  return false;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // 1) Primero lo que manda mensajes (campañas), que es lo sensible al ritmo.
    const results = await tickAllActiveCampaigns();

    // 2) Pipeline de Marketing: analiza negocios nuevos, suma los mejor
    //    calificados a la prospección automática y gestiona los seguimientos.
    //    Aislado: si falla, no afecta a las campañas de los otros rubros.
    let marketing: Record<string, unknown> = {};
    try {
      marketing = await runMarketingTick();
      marketing.sumados_a_prospeccion = await enqueueQualifiedLeads();
    } catch (err: any) {
      marketing = { error: String(err?.message ?? err) };
    }

    return NextResponse.json({ ok: true, results, marketing });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}

// Algunos servicios de cron gratuitos (cron-job.org incluido) solo pueden
// hacer GET. Aceptamos ambos métodos con la misma lógica.
export async function GET(request: Request) {
  return POST(request);
}
