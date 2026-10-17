import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { createClient } from "@/lib/supabase/server";
import {
  INDICADORES,
  ORDENES,
  TAMANO_PAGINA,
  contarIndicador,
  enlaceIndicador,
  indicadorPorClave,
  listarIndicador,
  rubroIdDe,
  volverSeguro,
  type Orden,
} from "@/lib/indicadores";
import { ATTENTION_STATE_LABEL, CAPTURE_STATE_LABEL, CONTACT_STATE_LABEL } from "@/lib/opportunities";
import { ZONA_LABEL, normalizarZona } from "@/lib/captacion/reglas";
import { FUENTE_LABEL, esFuente } from "@/lib/fuente";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { EnlaceVolver } from "@/components/ui/enlaces-navegacion";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { conVolver, inicioDePerfil } from "@/lib/navegacion";
import { estadoCorto } from "@/lib/inicio";

export const dynamic = "force-dynamic";

/**
 * Etapa 2 · Bloque 2 — Lista de un indicador (indicador → lista → ficha →
 * conversación). La lista usa la MISMA consulta que su cifra
 * (`src/lib/indicadores.ts`). Todo el estado (indicador, orden, página y
 * retorno) vive en la dirección: volver desde la ficha o el chat conserva
 * filtros, orden y posición. Sirve para los cuatro perfiles, en
 * computadora y en teléfono.
 */
export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: { perfil?: string; indicador?: string; orden?: string; pagina?: string; volver?: string };
}) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;

  const rubroIdLeido = rubroIdDe(searchParams.perfil ?? "juridico");
  if (!rubroIdLeido) notFound();
  const rubroId: string = rubroIdLeido as string;
  const perfil = searchParams.perfil ?? "juridico";
  const slug: SlugPerfil = esSlugPerfil(perfil) ? perfil : "juridico";
  const ind = indicadorPorClave(searchParams.indicador ?? "oportunidades") ?? indicadorPorClave("oportunidades")!;
  const orden: Orden = (Object.keys(ORDENES) as Orden[]).includes(searchParams.orden as Orden) ? (searchParams.orden as Orden) : "reciente";
  const pagina = Math.max(1, Number.parseInt(searchParams.pagina ?? "1", 10) || 1);
  const volver = volverSeguro(searchParams.volver);

  const supabase = createClient();
  const [{ data: rubro }, lista, contador] = await Promise.all([
    supabase.from("rubros").select("name").eq("id", rubroId).maybeSingle(),
    listarIndicador(rubroId, ind, { pagina, orden }),
    contarIndicador(rubroId, ind),
  ]);

  // Dirección actual: la ficha y el chat vuelven exactamente acá.
  const aqui = (() => {
    const p = new URLSearchParams({ perfil, indicador: ind.clave, orden, pagina: String(pagina) });
    if (volver) p.set("volver", volver);
    return `/oportunidades?${p.toString()}`;
  })();
  const con = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ perfil, indicador: ind.clave, orden, pagina: String(pagina), ...cambios });
    if (volver) p.set("volver", volver);
    return `/oportunidades?${p.toString()}`;
  };
  const total = lista.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  const grupos = Array.from(new Set(INDICADORES.map((i) => i.grupo)));
  const GRUPO_LABEL: Record<string, string> = {
    contacto: "Contacto",
    captacion: "Captación",
    derivacion: "Derivación y resultado",
    atencion: "Atención",
    seguimiento: "Seguimiento",
    revision: "Revisión",
    fuente: "Fuente",
  };

  const delGrupo = INDICADORES.filter((i) => i.grupo === ind.grupo);

  return (
    <MarcoPerfil slug={slug}>
      <a href="#lista" className="skip-link">
        Saltar a la lista
      </a>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-600">
              Oportunidades · {GRUPO_LABEL[ind.grupo] ?? ind.grupo}
              {rubro?.name ? ` · ${rubro.name}` : ""}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">{ind.label}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{ind.definicion}</p>
          </div>
          <EnlaceVolver volver={volver} respaldo={inicioDePerfil(slug)} />
        </div>

        <nav aria-label={`Listas de ${GRUPO_LABEL[ind.grupo] ?? ind.grupo}`} className="flex flex-wrap items-center gap-2">
          {delGrupo.map((i) => (
            <Link
              key={i.clave}
              href={enlaceIndicador(perfil, i.clave, volver)}
              aria-current={i.clave === ind.clave ? "page" : undefined}
              className={
                i.clave === ind.clave
                  ? "tactil inline-flex items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white"
                  : "tactil inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              }
            >
              {i.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="tactil inline-flex cursor-pointer list-none items-center rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">
              Todas las listas <span aria-hidden="true" className="ml-1.5">▾</span>
            </summary>
            <div className="absolute left-0 z-20 mt-2 grid w-[min(92vw,44rem)] grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-3">
              {grupos.map((g) => (
                <div key={g}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{GRUPO_LABEL[g] ?? g}</p>
                  <ul className="space-y-0.5">
                    {INDICADORES.filter((i) => i.grupo === g).map((i) => (
                      <li key={i.clave}>
                        <Link
                          href={enlaceIndicador(perfil, i.clave, volver)}
                          aria-current={i.clave === ind.clave ? "page" : undefined}
                          className={
                            i.clave === ind.clave
                              ? "block rounded px-2 py-1.5 text-sm font-semibold text-slate-900 underline"
                              : "block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:underline"
                          }
                        >
                          {i.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-slate-700" aria-live="polite">
            {lista.error || contador.error ? (
              <span className="font-medium text-red-700">No se pudo leer la lista: {lista.error ?? contador.error}. No es «cero»: reintentá.</span>
            ) : (
              <>
                <strong>{total.toLocaleString("es-AR")}</strong> oportunidades
                {contador.count !== null && contador.count !== total ? (
                  <span className="ml-2 text-amber-700">(la cifra cambió mientras se leía: {contador.count.toLocaleString("es-AR")})</span>
                ) : null}
                {" · "}página {pagina} de {paginas}
              </>
            )}
          </p>
          <nav aria-label="Orden" className="flex flex-wrap gap-2">
            {(Object.keys(ORDENES) as Orden[]).map((o) => (
              <Link
                key={o}
                href={con({ orden: o, pagina: "1" })}
                aria-current={o === orden ? "true" : undefined}
                className={
                  o === orden
                    ? "tactil inline-flex items-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white"
                    : "tactil inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
                }
              >
                {ORDENES[o].label}
              </Link>
            ))}
          </nav>
        </div>

        <section id="lista" aria-label={`Lista: ${ind.label}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {!lista.error && lista.filas.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">
              No hay oportunidades en esta lista{pagina > 1 ? " en esta página" : ""}.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lista.filas.map((o: any) => {
                const advertencias = Array.isArray(o.capture_warnings) ? (o.capture_warnings as string[]) : [];
                return (
                  <li key={o.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{o.contacts?.full_name ?? "Sin nombre"}</p>
                      <p className="solo-simple text-sm text-slate-700">
                        <span className="tabular-nums">{o.contacts?.phone ?? "Sin teléfono"}</span> · {estadoCorto(o).texto}
                      </p>
                      <p className="solo-avanzado text-xs text-slate-600">
                        {o.contacts?.phone ?? "Sin teléfono"} · {CONTACT_STATE_LABEL[o.contact_state] ?? o.contact_state} ·{" "}
                        {CAPTURE_STATE_LABEL[o.capture_state] ?? o.capture_state}
                        {o.capture_state === "captado" ? ` · ${ZONA_LABEL[normalizarZona(o.location_zone)]}` : ""}
                        {o.attention_state !== "ia" ? ` · ${ATTENTION_STATE_LABEL[o.attention_state] ?? o.attention_state}` : ""}
                        {esFuente(o.first_source) ? ` · Fuente: ${FUENTE_LABEL[o.first_source as keyof typeof FUENTE_LABEL]}` : ""}
                      </p>
                      {advertencias.length > 0 && (
                        <p className="text-xs text-amber-800">Falta: {advertencias.map((a) => a.replaceAll("_", " ")).join(", ")}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={conVolver(`/ficha/${o.contact_id}`, aqui)}
                        className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50"
                      >
                        Ficha
                      </Link>
                      {o.conversation_id && (
                        <Link
                          href={conVolver(`/inbox/${o.conversation_id}`, aqui)}
                          className="tactil inline-flex items-center rounded-lg bg-slate-900 px-3 text-sm text-white hover:bg-slate-800"
                        >
                          Conversación
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {paginas > 1 && (
          <nav aria-label="Páginas" className="flex items-center justify-between text-sm">
            {pagina > 1 ? (
              <Link href={con({ pagina: String(pagina - 1) })} className="tactil inline-flex items-center rounded-lg border border-slate-300 bg-white px-3">
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            {pagina < paginas ? (
              <Link href={con({ pagina: String(pagina + 1) })} className="tactil inline-flex items-center rounded-lg border border-slate-300 bg-white px-3">
                Siguiente →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
        <p className="text-xs text-slate-600">Unidad: oportunidad (una por consulta). La cifra y esta lista salen de la misma consulta.</p>
      </div>
    </MarcoPerfil>
  );
}
