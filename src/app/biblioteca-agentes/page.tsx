import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { createClient } from "@/lib/supabase/server";
import { MODO_LABEL, limitesEfectivos, type AgenteBiblioteca, type Modo } from "@/lib/agentes/biblioteca";
import { volverSeguro } from "@/lib/indicadores";
import { BibliotecaEditor } from "@/components/agentes/biblioteca-editor";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 4 — Biblioteca de agentes: principal y cuatro derivados,
 * configuración y versiones. Etapa 3: las acciones (probar, evaluar,
 * crear, asignar) viven en «Agentes IA» de cada perfil.
 */
export default async function BibliotecaPage({ searchParams }: { searchParams: { volver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const volver = volverSeguro(searchParams.volver);
  const supabase = createClient();
  const [{ data, error }, { data: rubros }, { data: versiones }] = await Promise.all([
    supabase.from("agent_library").select("*").order("clave"),
    supabase.from("rubros").select("id, name, emoji"),
    supabase.from("agent_library_versions").select("clave, version, motivo, created_by, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const agentes = (data ?? []) as AgenteBiblioteca[];
  const principal = agentes.find((a) => a.rol === "principal") ?? null;
  const derivados = agentes.filter((a) => a.rol === "derivado");
  const rubroDe = (id: string | null) => (rubros ?? []).find((r: any) => r.id === id) as any;

  const tarjeta = (a: AgenteBiblioteca) => (
    <article key={a.clave} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby={`ag-${a.clave}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`ag-${a.clave}`} className="font-semibold text-slate-900">
          {a.nombre}
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{a.estado === "apagado" ? "Apagado" : a.estado} · versión {a.version} · {(a as any).publicacion ?? "preparado"}</span>
      </div>
      <p className="text-sm text-slate-700">{a.objetivo || "Sin objetivo cargado."}</p>
      <p className="text-xs text-slate-600">
        {a.rol === "principal" ? "Base común de todos los derivados." : `Se usaría en: ${rubroDe(a.rubro_id)?.name ?? "perfil"} · hereda del principal.`}{" "}
        Modos: {(a.modos ?? []).map((m) => MODO_LABEL[m as Modo] ?? m).join(", ")}.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-700">Límites ({limitesEfectivos(a, principal).length})</summary>
        <ul className="mt-1 list-disc pl-5 text-slate-700">
          {limitesEfectivos(a, principal).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>
      <BibliotecaEditor clave={a.clave} nombre={a.nombre} objetivo={a.objetivo} />
    </article>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Biblioteca de agentes</h1>
            <p className="text-sm text-slate-600">Solo configuración: ninguno responde mensajes. El agente que responde hoy se maneja en «Agentes IA» de cada perfil.</p>
          </div>
          <Link href={volver ?? "/inicio"} className="tactil inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950">
            ← Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">No se pudo leer la biblioteca. Reintentá en un momento.</p>}
        <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-800">
          Acá se configuran nombres, objetivos y límites con historial de versiones. Probar conversación, pedir mejora, ver resultados, crear y asignar agentes están en «Agentes IA» de cada perfil. Ningún agente de esta biblioteca responde hasta tener una versión publicada, una asignación activa y la pausa general levantada.
        </p>
        {principal && tarjeta(principal)}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{derivados.map(tarjeta)}</div>
        <section aria-label="Historial de versiones" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Últimos cambios</h2>
          <ul className="space-y-1 text-xs text-slate-700">
            {(versiones ?? []).map((v: any) => (
              <li key={`${v.clave}-${v.version}`}>
                {new Date(v.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} · {v.clave} v{v.version} · {v.created_by}
                {v.motivo ? ` · ${v.motivo}` : ""}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
