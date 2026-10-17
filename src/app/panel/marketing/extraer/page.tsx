import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ExtraerNegocios } from "@/components/marketing/extraer-negocios";
import { leerLimites, listarExtracciones, usadosHoy } from "@/lib/marketing/extraer";
import { requisitosEjecutarBase } from "@/lib/marketing/ejecutar-base";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = { pendiente: "En cola", ejecutando: "Buscando", listo: "Lista", error: "Con error", cancelado: "Cancelada" };

/** Marketing · Extraer negocios (16/10). */
export default async function ExtraerNegociosPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const [limites, usados, req, recientes] = await Promise.all([
    leerLimites(),
    usadosHoy().catch(() => 0),
    requisitosEjecutarBase().catch(() => ({ faltan: ["No se pudo comprobar la configuración (¿falta la migración 0311?)."], avisos: [] as string[] })),
    listarExtracciones(10).catch(() => [] as any[]),
  ]);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-gold-700">Captación</p>
        <h1 className="text-2xl font-semibold text-slate-900">Extraer negocios</h1>
        <p className="text-sm text-slate-600">Busca negocios en Google Maps (Outscraper) y arma una base nueva. El análisis profundo se hace recién cuando el negocio acepta escuchar la propuesta.</p>
      </header>
      <ExtraerNegocios limites={limites} usadosHoy={usados} faltan={req.faltan} avisos={req.avisos} />
      {recientes.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Extracciones recientes</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {recientes.map((e: any) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <strong>{e.nombre_base}</strong> · {ESTADO[e.estado] ?? e.estado} · {e.creados} nuevos de {e.encontrados}
                </span>
                {e.base_id && (
                  <Link href={`/panel/marketing/bases/${e.base_id}`} className="text-slate-700 underline">Ver en Bases</Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
