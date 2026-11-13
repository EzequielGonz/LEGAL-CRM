import Link from "next/link";
import clsx from "clsx";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { requirePageSession } from "@/lib/acceso/pagina";
import { perfilActivo } from "@/lib/perfil-activo";
import { RUBRO_IDS } from "@/lib/rubros";
import type { SlugPerfil } from "@/lib/marca";
import { conVolver } from "@/lib/navegacion";
import { cuandoCorto } from "@/lib/cartera";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { listarMovimientos } from "@/lib/limpieza/servidor";
import { TEXTO_REGLA } from "@/lib/limpieza/reglas";
import { BotonDeshacer } from "@/components/limpieza/boton-deshacer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Movidos en la limpieza" };

const TAMANO = 50;
/** De la más importante de revisar a la menos. */
const ORDEN = ["concreto_llamada", "posible_captacion", "relectura_rechazo", "relectura_baja", "rechazo_no_es_atencion", "dejo_de_responder", "perdido_sin_atencion", "incidencia_de_migracion", "relectura_sin_cambio"];

/**
 * Movidos en la limpieza del 13/11 (pedido de la responsable: «Reclasificar
 * solo», con una lista para revisar y deshacer). Cada perfil ve solo lo suyo.
 */
export default async function LimpiezaPage(
  props: { searchParams: Promise<{ perfil?: string; regla?: string; pagina?: string }> }
) {
  const searchParams = await props.searchParams;
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  const regla = searchParams.regla && TEXTO_REGLA[searchParams.regla] ? searchParams.regla : null;
  const pagina = pageFromParam(searchParams.pagina);
  const { filas, total, porRegla } = await listarMovimientos(RUBRO_IDS[slug], { regla, pagina, tamano: TAMANO });
  const reglas = ORDEN.filter((r) => porRegla[r]);
  const todos = Object.values(porRegla).reduce((a, b) => a + b, 0);
  const aqui = `/limpieza?perfil=${slug}${regla ? `&regla=${regla}` : ""}`;
  const ficha = (id: string) => conVolver(slug === "juridico" ? `/prospectos/${id}` : `/ficha/${id}`, aqui);

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Movidos en la limpieza</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-700">
            El 13/11 se reubicó a cada persona según lo que dice su chat. No se borró nada ni se le escribió a nadie. Si alguno quedó mal, tocá «Deshacer» y vuelve a como estaba.
          </p>
        </div>

        {todos === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">No hay movimientos de la limpieza en este perfil</p>
            <p className="mt-1 text-sm text-slate-600">Cuando se reubique a alguien, aparece acá con su motivo.</p>
          </div>
        ) : (
          <>
            <nav aria-label="Tipos de movimiento" className="flex flex-wrap gap-2">
              <Link href={`/limpieza?perfil=${slug}`} aria-current={!regla ? "page" : undefined} className={clsx("tactil inline-flex items-center rounded-full border px-4 text-sm font-medium", !regla ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50")}>
                Todos <span className="ml-1.5 tabular-nums">{todos.toLocaleString("es-AR")}</span>
              </Link>
              {reglas.map((r) => (
                <Link key={r} href={`/limpieza?perfil=${slug}&regla=${r}`} aria-current={regla === r ? "page" : undefined} className={clsx("tactil inline-flex items-center rounded-full border px-4 text-sm font-medium", regla === r ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50")}>
                  {TEXTO_REGLA[r].titulo} <span className="ml-1.5 tabular-nums">{porRegla[r].toLocaleString("es-AR")}</span>
                </Link>
              ))}
            </nav>

            {regla ? <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">{TEXTO_REGLA[regla].que}</p> : null}

            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {filas.map((m) => {
                const nombre = m.nombre ?? (m.opportunity_id ? "Sin nombre" : "Incidencia general");
                return (
                  <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{nombre}</p>
                      <p className="mt-0.5 text-sm text-slate-700 [overflow-wrap:anywhere]">{m.motivo}</p>
                      <p className="mt-1 text-[13px] text-slate-500">
                        {TEXTO_REGLA[m.regla]?.titulo ?? m.regla} · {cuandoCorto(m.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.contactId ? (
                        <Link href={ficha(m.contactId)} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50">
                          Abrir ficha
                        </Link>
                      ) : null}
                      {m.conversation_id ? (
                        <Link href={conVolver(`/conversacion/${m.conversation_id}`, aqui)} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50">
                          Ver chat
                        </Link>
                      ) : null}
                      {m.regla === "relectura_sin_cambio" ? null : <BotonDeshacer id={m.id} nombre={nombre} />}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pager basePath="/limpieza" params={{ perfil: slug, regla: regla ?? undefined }} page={pagina} pageSize={TAMANO} total={total} unit="movimientos" />
          </>
        )}
      </div>
    </MarcoPerfil>
  );
}
