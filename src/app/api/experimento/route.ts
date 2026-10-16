import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { confirmPin } from "@/lib/acceso/confirmar-pin";
import { ExperimentoError, experimentoActual } from "@/lib/experimento/servicio";
import {
  actualizarCandidato,
  aplicarGanador,
  arrancarExperimento,
  detenerExperimento,
  estimarAjusteC,
  importarConversacionesReales,
  lanzarAjusteC,
  pedirEvaluacionPlantillas,
  votar,
} from "@/lib/experimento/acciones";
import { LETRAS, type Letra } from "@/lib/experimento/reglas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Comparación de agentes A/B/C.
 * GET → experimento, candidatos (sin claves) y, con ?estimar=1, la
 * estimación del ajuste de C.
 * POST { accion, pin?, ... }:
 *  - arrancar, detener, candidato, aplicar, importar_corpus, lanzar_ajuste → con PIN
 *  - votar, evaluar_plantillas → con sesión
 * Ninguna acción envía mensajes ni arranca campañas.
 */
const CON_PIN = new Set(["arrancar", "detener", "candidato", "aplicar", "importar_corpus", "lanzar_ajuste"]);

function letra(v: unknown): Letra | null {
  return typeof v === "string" && (LETRAS as string[]).includes(v) ? (v as Letra) : null;
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const actual = await experimentoActual();
  const url = new URL(request.url);
  const estimacion = url.searchParams.get("estimar") === "1" ? await estimarAjusteC().catch((e) => ({ error: String(e?.message ?? e) })) : null;
  return NextResponse.json({ experimento: actual?.exp ?? null, candidatos: actual?.candidatos ?? [], estimacion });
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const accion = String(body?.accion ?? "");
  if (CON_PIN.has(accion)) {
    const pin = await confirmPin(request, body?.pin, "experimento_agentes" as any, { accion, letra: body?.letra ?? null });
    if (!pin.ok) return NextResponse.json({ error: pin.error }, { status: pin.status });
  }
  try {
    switch (accion) {
      case "arrancar":
        return NextResponse.json(await arrancarExperimento());
      case "detener":
        return NextResponse.json(await detenerExperimento(String(body?.motivo ?? "")));
      case "candidato": {
        const l = letra(body?.letra);
        if (!l) return NextResponse.json({ error: "Candidato inválido." }, { status: 400 });
        const num = (v: unknown) => (v === null ? null : typeof v === "number" && v >= 0 && v < 1000 ? v : undefined);
        return NextResponse.json(
          await actualizarCandidato({
            letra: l,
            modelo: typeof body?.modelo === "string" ? body.modelo.slice(0, 300) : undefined,
            precioEntrada: num(body?.precioEntrada),
            precioSalida: num(body?.precioSalida),
            estado: ["listo", "pendiente", "detenido"].includes(body?.estado) ? body.estado : undefined,
            motivo: typeof body?.motivo === "string" ? body.motivo.slice(0, 300) : undefined,
          })
        );
      }
      case "votar": {
        const l = letra(body?.candidato);
        if (!l || typeof body?.reportId !== "string") return NextResponse.json({ error: "Faltan datos del voto." }, { status: 400 });
        return NextResponse.json(await votar({ reportId: body.reportId, candidato: l, nota: typeof body?.nota === "string" ? body.nota : undefined }));
      }
      case "aplicar":
        return NextResponse.json(await aplicarGanador({ decision: letra(body?.decision) }));
      case "importar_corpus":
        return NextResponse.json(await importarConversacionesReales());
      case "lanzar_ajuste":
        return NextResponse.json(await lanzarAjusteC());
      case "evaluar_plantillas":
        return NextResponse.json(await pedirEvaluacionPlantillas());
      default:
        return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
    }
  } catch (err: any) {
    const status = err instanceof ExperimentoError ? err.status : 500;
    return NextResponse.json({ error: String(err?.message ?? err) }, { status });
  }
}
