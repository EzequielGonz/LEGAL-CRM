import { NextResponse } from "next/server";
import { tickAllActiveCampaigns } from "@/lib/campaigns";

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
    const results = await tickAllActiveCampaigns();
    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}

// Algunos servicios de cron gratuitos (cron-job.org incluido) solo pueden
// hacer GET. Aceptamos ambos métodos con la misma lógica.
export async function GET(request: Request) {
  return POST(request);
}
