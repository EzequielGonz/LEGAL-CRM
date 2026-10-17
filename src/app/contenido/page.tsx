import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { createClient } from "@/lib/supabase/server";
import { rubroIdDe, volverSeguro } from "@/lib/indicadores";
import { panoramaContenido } from "@/lib/contenido/panel";
import { CalendarioControl, PedidoContenido } from "@/components/contenido/contenido-acciones";
import { AuditoriaLanding, BriefMarca, GeneradorPiezas } from "@/components/contenido/contenido-etapa3";
import { CreadorGuiado } from "@/components/contenido/creador-guiado";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { EnlaceVolver } from "@/components/ui/enlaces-navegacion";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { inicioDePerfil } from "@/lib/navegacion";

export const dynamic = "force-dynamic";

const CANAL_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", landing: "Web (landing)" };
const ESTADO_LABEL: Record<string, string> = {
  programada: "Programada",
  lista: "Lista (espera conexión o fecha)",
  publicando: "Publicando",
  retenida: "Retenida",
  error: "Error",
  incierta: "Incierta: se reconcilia antes de repetir",
};
const fecha = (iso: string | null, tz = "America/Argentina/Buenos_Aires") =>
  iso ? new Date(iso).toLocaleString("es-AR", { timeZone: tz, dateStyle: "short", timeStyle: "short" }) : "Sin fecha";
const cifra = (v: number | null | undefined) => (v === null || v === undefined ? "Sin datos" : v.toLocaleString("es-AR"));

/**
 * Contenido (Etapa 2 · bloque 5; rediseño 17/10, bloque 3). Dentro del
 * marco del perfil y en dos niveles:
 *  - Simple: qué pasa (panorama), qué necesita atención, crear una pieza
 *    con el recorrido guiado, borradores, calendario y resultados.
 *  - Avanzado: además, el brief completo (servicios, hechos autorizados,
 *    restricciones, identidad visual), la generación por lotes, la
 *    auditoría de la landing y las políticas por canal.
 * Las dos vistas usan los mismos datos y la misma API. Nada se publica sin
 * política habilitada, cuenta conectada y ejecutor encendido.
 */
export default async function ContenidoPage({ searchParams }: { searchParams: { perfil?: string; volver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroIdLeido = rubroIdDe(perfil);
  if (!rubroIdLeido || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const rubroId = rubroIdLeido as string;
  const volver = volverSeguro(searchParams.volver);
  const [{ data: rubro }, p] = await Promise.all([
    createClient().from("rubros").select("name").eq("id", rubroId).maybeSingle(),
    panoramaContenido(rubroId),
  ]);
  const todasPausadas = p.politicas.length === 0 || p.politicas.every((x: any) => x.calendario_pausado);
  const algunaHabilitada = p.politicas.some((x: any) => x.habilitada);
  const resumen = [
    { ancla: "#c-acc", titulo: "Necesitan atención", valor: p.atencion.length, nota: p.atencion.length ? "Retenidas o con error" : "Nada pendiente", alerta: p.atencion.length > 0 },
    { ancla: "#c-bor", titulo: "Borradores", valor: p.borradores.length, nota: "Sin programar", alerta: false },
    { ancla: "#c-prox", titulo: "Próximas", valor: p.proximas.length, nota: todasPausadas ? "Calendario en pausa" : "En el calendario", alerta: false },
    { ancla: "#c-pub", titulo: "Publicadas", valor: p.publicadas.length, nota: "Confirmadas por la plataforma", alerta: false },
  ];

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-600">{rubro?.name ?? "Perfil"}</p>
            <h1 className="text-2xl font-semibold text-slate-900">Contenido</h1>
            <p className="mt-1 text-sm text-slate-700">
              {algunaHabilitada ? "Autopublicación habilitada en algún canal." : "Autopublicación apagada: se preparan borradores y piezas, nada se publica."}{" "}
              {todasPausadas ? "Calendario en pausa." : "Calendario activo."}
            </p>
          </div>
          <EnlaceVolver volver={volver} respaldo={inicioDePerfil(slug)} />
        </div>

        {p.error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">No se pudo leer el contenido: {p.error}. No es «vacío»: reintentá.</p>}

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Panorama del contenido">
          {resumen.map((r) => (
            <li key={r.ancla}>
              <a href={r.ancla} className={`tarjeta-resumen block h-full rounded-xl border bg-white p-4 hover:border-slate-400 ${r.alerta ? "border-amber-400" : "border-slate-200"}`}>
                <span className="block text-sm text-slate-700">{r.titulo}</span>
                <span className="mt-1 block text-2xl font-semibold tabular-nums text-slate-900">{r.valor.toLocaleString("es-AR")}</span>
                <span className={`mt-0.5 block text-xs ${r.alerta ? "font-medium text-amber-900" : "text-slate-600"}`}>{r.nota}</span>
              </a>
            </li>
          ))}
        </ul>

        <section aria-labelledby="c-crear" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="c-crear" className="text-lg font-semibold text-slate-900">Crear contenido</h2>
            <EnlaceAvanzado href="#c-brief" className="solo-simple tactil inline-flex items-center text-sm font-medium text-slate-700 underline underline-offset-2">
              Ver configuración completa
            </EnlaceAvanzado>
          </div>
          <CreadorGuiado perfil={perfil} />
        </section>

        <section id="c-acc" tabIndex={-1} aria-labelledby="c-acc-t" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 outline-none">
          <h2 id="c-acc-t" className="mb-2 text-base font-semibold text-slate-900">Necesitan atención ({p.atencion.length})</h2>
          {p.atencion.length === 0 ? (
            <p className="text-sm text-slate-600">Nada pendiente.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.atencion.map((x: any) => (
                <li key={x.id} className="py-2 text-sm">
                  <p className="font-medium text-slate-900">
                    {CANAL_LABEL[x.canal] ?? x.canal} · {ESTADO_LABEL[x.estado] ?? x.estado}
                  </p>
                  <p className="text-slate-700 [overflow-wrap:anywhere]">{x.titulo ?? x.texto.slice(0, 120)}</p>
                  {x.motivo && <p className="text-xs text-amber-900">Motivo: {x.motivo}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="c-bor" tabIndex={-1} aria-labelledby="c-bor-t" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 outline-none">
          <h2 id="c-bor-t" className="mb-2 text-base font-semibold text-slate-900">Borradores ({p.borradores.length})</h2>
          {p.borradores.length === 0 ? (
            <p className="text-sm text-slate-600">No hay borradores guardados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.borradores.map((x: any) => (
                <li key={x.id} className="flex flex-col gap-0.5 py-2 text-sm sm:flex-row sm:justify-between sm:gap-3">
                  <span className="min-w-0 text-slate-800 [overflow-wrap:anywhere]">
                    {CANAL_LABEL[x.canal] ?? x.canal} · {x.titulo ?? x.texto.slice(0, 80)}
                  </span>
                  <span className="shrink-0 text-xs text-slate-600">Guardado {fecha(x.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="c-prox" tabIndex={-1} aria-labelledby="c-prox-t" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 outline-none">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="c-prox-t" className="text-base font-semibold text-slate-900">Calendario · próximas ({p.proximas.length})</h2>
          </div>
          {p.proximas.length === 0 ? (
            <p className="text-sm text-slate-600">No hay piezas programadas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.proximas.map((x: any) => (
                <li key={x.id} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:justify-between sm:gap-3">
                  <span className="min-w-0 text-slate-800 [overflow-wrap:anywhere]">
                    {CANAL_LABEL[x.canal] ?? x.canal} · {x.formato} · {x.titulo ?? x.texto.slice(0, 80)}
                  </span>
                  <span className="shrink-0 text-xs text-slate-600">
                    {ESTADO_LABEL[x.estado] ?? x.estado} · {fecha(x.programada_para, x.zona_horaria)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <CalendarioControl perfil={perfil} pausado={todasPausadas} />
          </div>
        </section>

        <section id="c-pub" tabIndex={-1} aria-labelledby="c-pub-t" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 outline-none">
          <h2 id="c-pub-t" className="mb-1 text-base font-semibold text-slate-900">Publicadas y resultados ({p.publicadas.length})</h2>
          <p className="mb-2 text-xs text-slate-600">Solo datos reales del destino. Un clic no es una consulta; una consulta no es una captación ni una venta.</p>
          {p.publicadas.length === 0 ? (
            <p className="text-sm text-slate-600">Todavía no hay publicaciones confirmadas por la plataforma.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-xs text-slate-600">
                  <tr>
                    <th scope="col" className="py-1 pr-3">Pieza</th>
                    <th scope="col" className="py-1 pr-3">Publicada</th>
                    <th scope="col" className="py-1 pr-3 text-right">Alcance</th>
                    <th scope="col" className="py-1 pr-3 text-right">Interacciones</th>
                    <th scope="col" className="py-1 pr-3 text-right">Clics</th>
                    <th scope="col" className="py-1 text-right">Consultas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {p.publicadas.map((x: any) => {
                    const r = (x.content_results ?? []).sort((a: any, b: any) => String(b.medido_at).localeCompare(String(a.medido_at)))[0] ?? null;
                    return (
                      <tr key={x.id}>
                        <td className="py-1 pr-3">
                          {x.url_publicada ? (
                            <a href={x.url_publicada} target="_blank" rel="noopener noreferrer" className="underline">
                              {CANAL_LABEL[x.canal] ?? x.canal} · {x.titulo ?? x.texto.slice(0, 60)}
                            </a>
                          ) : (
                            `${CANAL_LABEL[x.canal] ?? x.canal} · ${x.titulo ?? x.texto.slice(0, 60)}`
                          )}
                        </td>
                        <td className="py-1 pr-3 text-xs">{fecha(x.publicada_at)}</td>
                        <td className="py-1 pr-3 text-right">{cifra(r?.alcance)}</td>
                        <td className="py-1 pr-3 text-right">{cifra(r?.interacciones)}</td>
                        <td className="py-1 pr-3 text-right">{cifra(r?.clics)}</td>
                        <td className="py-1 text-right">{cifra(r?.consultas)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="c-ped" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-ped" className="mb-2 text-base font-semibold text-slate-900">Pedir mejoras</h2>
          <PedidoContenido perfil={perfil} />
          {p.pedidos.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {p.pedidos.map((x: any) => (
                <li key={x.id} className="[overflow-wrap:anywhere]">
                  {fecha(x.created_at)} · {x.estado} · {x.pedido.slice(0, 140)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ───────── Avanzado: configuración completa de Contenido ───────── */}
        <div className="solo-avanzado space-y-5">
          <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-600">Configuración de Contenido</h2>
          <section id="c-brief" tabIndex={-1} aria-labelledby="c-brief-t" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 outline-none">
            <h3 id="c-brief-t" className="mb-1 text-base font-semibold text-slate-900">Marca y hechos autorizados (brief)</h3>
            <p className="mb-3 text-xs text-slate-600">Es la misma marca del menú, el selector de perfiles y Configuración: un solo lugar para nombre, logos y colores.</p>
            <BriefMarca perfil={perfil} />
          </section>

          <section aria-labelledby="c-gen" className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 id="c-gen" className="mb-2 text-base font-semibold text-slate-900">Generar varias piezas</h3>
            <p className="mb-2 text-xs text-slate-600">Texto e imagen a partir del brief. Entran a la cola como listas, programadas o retenidas con motivo; se publican solo con la política del canal habilitada, la cuenta conectada y el ejecutor encendido.</p>
            <GeneradorPiezas perfil={perfil} />
          </section>

          <section aria-labelledby="c-aud" className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 id="c-aud" className="mb-2 text-base font-semibold text-slate-900">Auditoría de la landing</h3>
            <AuditoriaLanding perfil={perfil} />
          </section>

          <section id="c-pol" aria-labelledby="c-pol-t" className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h3 id="c-pol-t" className="mb-2 text-base font-semibold text-slate-900">Políticas por canal</h3>
            <ul className="space-y-1 text-slate-700">
              {p.politicas.map((x: any) => (
                <li key={x.canal}>
                  {CANAL_LABEL[x.canal] ?? x.canal}: {x.habilitada ? "habilitada" : "apagada"} · {x.calendario_pausado ? "en pausa" : "activa"} ·{" "}
                  {x.destino_ref ? `destino conectado (${x.proveedor ?? "—"})` : "sin cuenta conectada"} · {x.frecuencia_semanal} por semana · zona {x.zona_horaria} · v{x.version}
                </li>
              ))}
              {p.politicas.length === 0 && <li>Sin políticas cargadas: todo queda en borrador.</li>}
              <li>Search Console: {(p.searchConsole as any)?.estado === "conectado" ? "conectado" : "sin conectar"}</li>
            </ul>
          </section>
        </div>
      </div>
    </MarcoPerfil>
  );
}
