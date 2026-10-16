import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { createClient } from "@/lib/supabase/server";
import { rubroIdDe, volverSeguro } from "@/lib/indicadores";
import { panoramaContenido } from "@/lib/contenido/panel";
import { CalendarioControl, PedidoContenido } from "@/components/contenido/contenido-acciones";
import { AuditoriaLanding, BriefMarca, GeneradorPiezas } from "@/components/contenido/contenido-etapa3";

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
 * Etapa 2 · Bloque 5 — Contenido automático: próximas, publicadas con
 * resultados reales, lo que necesita acción, pedidos en lenguaje natural y
 * pausa del calendario. Los detalles técnicos quedan en «Configuración
 * avanzada». Nada se publica sin política habilitada y cuenta conectada.
 */
export default async function ContenidoPage({ searchParams }: { searchParams: { perfil?: string; volver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroIdLeido = rubroIdDe(perfil);
  if (!rubroIdLeido) notFound();
  const rubroId = rubroIdLeido as string;
  const volver = volverSeguro(searchParams.volver);
  const [{ data: rubro }, p] = await Promise.all([
    createClient().from("rubros").select("name, emoji").eq("id", rubroId).maybeSingle(),
    panoramaContenido(rubroId),
  ]);
  const todasPausadas = p.politicas.length === 0 || p.politicas.every((x: any) => x.calendario_pausado);
  const algunaHabilitada = p.politicas.some((x: any) => x.habilitada);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-5 shadow-navy">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold-300">
              {rubro?.emoji} {rubro?.name ?? "Perfil"}
            </p>
            <h1 className="font-serif text-xl font-semibold text-white">Contenido automático</h1>
            <p className="text-sm text-slate-300">
              {algunaHabilitada ? "Autopublicación habilitada en algún canal." : "Autopublicación apagada: se preparan borradores, nada se publica."}{" "}
              {todasPausadas ? "Calendario en pausa." : "Calendario activo."}
            </p>
          </div>
          <Link href={volver ?? "/inicio"} className="tactil inline-flex items-center text-sm text-slate-300 hover:text-gold-200">
            ← Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
        {p.error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">No se pudo leer el contenido: {p.error}. No es «vacío»: reintentá.</p>}

        <section aria-labelledby="c-acc" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-acc" className="mb-2 text-sm font-semibold text-slate-800">Necesitan acción ({p.atencion.length})</h2>
          {p.atencion.length === 0 ? (
            <p className="text-sm text-slate-600">Nada pendiente.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.atencion.map((x: any) => (
                <li key={x.id} className="py-2 text-sm">
                  <p className="font-medium text-slate-900">
                    {CANAL_LABEL[x.canal] ?? x.canal} · {ESTADO_LABEL[x.estado] ?? x.estado}
                  </p>
                  <p className="text-slate-700">{x.titulo ?? x.texto.slice(0, 120)}</p>
                  {x.motivo && <p className="text-xs text-amber-800">Motivo: {x.motivo}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="c-prox" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-prox" className="mb-2 text-sm font-semibold text-slate-800">Próximas ({p.proximas.length})</h2>
          {p.proximas.length === 0 ? (
            <p className="text-sm text-slate-600">No hay piezas programadas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {p.proximas.map((x: any) => (
                <li key={x.id} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:justify-between">
                  <span className="text-slate-800">
                    {CANAL_LABEL[x.canal] ?? x.canal} · {x.formato} · {x.titulo ?? x.texto.slice(0, 80)}
                  </span>
                  <span className="text-xs text-slate-600">
                    {ESTADO_LABEL[x.estado] ?? x.estado} · {fecha(x.programada_para, x.zona_horaria)} ({x.zona_horaria})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="c-pub" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-pub" className="mb-1 text-sm font-semibold text-slate-800">Publicadas ({p.publicadas.length})</h2>
          <p className="mb-2 text-xs text-slate-600">Solo datos reales del destino. Un clic no es una consulta; una consulta no es una captación ni una venta.</p>
          {p.publicadas.length === 0 ? (
            <p className="text-sm text-slate-600">Todavía no hay publicaciones confirmadas por la plataforma.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-600">
                  <tr>
                    <th scope="col" className="py-1 pr-3">Pieza</th>
                    <th scope="col" className="py-1 pr-3">Publicada</th>
                    <th scope="col" className="py-1 pr-3">Alcance</th>
                    <th scope="col" className="py-1 pr-3">Interacciones</th>
                    <th scope="col" className="py-1 pr-3">Clics</th>
                    <th scope="col" className="py-1">Consultas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                        <td className="py-1 pr-3">{cifra(r?.alcance)}</td>
                        <td className="py-1 pr-3">{cifra(r?.interacciones)}</td>
                        <td className="py-1 pr-3">{cifra(r?.clics)}</td>
                        <td className="py-1">{cifra(r?.consultas)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="c-brief" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-brief" className="mb-2 text-sm font-semibold text-slate-800">Marca y hechos autorizados (brief)</h2>
          <BriefMarca perfil={perfil} />
        </section>

        <section aria-labelledby="c-gen" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-gen" className="mb-2 text-sm font-semibold text-slate-800">Generar piezas</h2>
          <p className="mb-2 text-xs text-slate-600">Texto e imagen a partir del brief. Entran a la cola como listas, programadas o retenidas con motivo; se publican solo con la política del canal habilitada, la cuenta conectada y el ejecutor encendido.</p>
          <GeneradorPiezas perfil={perfil} />
        </section>

        <section aria-labelledby="c-aud" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-aud" className="mb-2 text-sm font-semibold text-slate-800">Auditoría de la landing</h2>
          <AuditoriaLanding perfil={perfil} />
        </section>

        <section aria-labelledby="c-ped" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-ped" className="mb-2 text-sm font-semibold text-slate-800">Pedir mejoras</h2>
          <PedidoContenido perfil={perfil} />
          {p.pedidos.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {p.pedidos.map((x: any) => (
                <li key={x.id}>
                  {fecha(x.created_at)} · {x.estado} · {x.pedido.slice(0, 140)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="c-cal" className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 id="c-cal" className="mb-2 text-sm font-semibold text-slate-800">Calendario</h2>
          <CalendarioControl perfil={perfil} pausado={todasPausadas} />
        </section>

        <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">Configuración avanzada</summary>
          <ul className="mt-2 space-y-1 text-slate-700">
            {p.politicas.map((x: any) => (
              <li key={x.canal}>
                {CANAL_LABEL[x.canal] ?? x.canal}: {x.habilitada ? "habilitada" : "apagada"} · {x.calendario_pausado ? "en pausa" : "activa"} ·{" "}
                {x.destino_ref ? `destino conectado (${x.proveedor ?? "—"})` : "sin cuenta conectada"} · {x.frecuencia_semanal} por semana · zona {x.zona_horaria} · v{x.version}
              </li>
            ))}
            <li>Search Console: {(p.searchConsole as any)?.estado === "conectado" ? "conectado" : "sin conectar"}</li>
          </ul>
        </details>
      </main>
    </div>
  );
}
