import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { contarIndicador, enlaceIndicador, indicadorPorClave, listarIndicador, rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { prioridadesDeInicio, type Pendiente } from "@/lib/inicio";
import { conVolver } from "@/lib/navegacion";
import { CircuitosMarketing } from "@/components/marketing/circuitos-marketing";
import { BotonAsistente } from "@/components/asistente/boton-asistente";
import { Icono } from "@/components/ui/icono-seccion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicio" };

const TZ = "America/Argentina/Buenos_Aires";
const MOSTRAR_CAPTADOS = 6;

function cuando(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const hora = d.toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  if (dia === hoy) return `hoy ${hora}`;
  return `${d.toLocaleDateString("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })} ${hora}`;
}

/**
 * Inicio del perfil (renovado 18/10): primero los captados que falta
 * derivar, con nombre, cuándo se captó y su cita; después lo demás que
 * necesita a una persona. Las cifras en cero no se muestran (están en «Más
 * opciones»). Solo lectura: no envía ni cambia nada.
 */
export default async function InicioPerfilPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const aqui = `/hoy?perfil=${slug}`;
  const s = createAdminClient();

  const claves = ["requiere_humano", "captado_sin_derivar", "revision_pendiente", "seguimiento_caido", "derivado_sin_resultado", "humano_en_curso"] as const;
  const [conteos, retenidas, captados] = await Promise.all([
    Promise.all(claves.map(async (c) => [c, await contarIndicador(rubroId as string, indicadorPorClave(c)!)] as const)),
    s.from("content_pieces").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).in("estado", ["retenida", "error", "incierta"]),
    listarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!, { orden: "reciente" }),
  ]);
  const cuenta = Object.fromEntries(conteos.map(([c, r]) => [c, r])) as Record<(typeof claves)[number], { count: number | null; error: string | null }>;
  const pendientes: Pendiente[] = prioridadesDeInicio({
    conteos: Object.fromEntries(conteos.map(([c, r]) => [c, r.count])),
    contenidoRetenido: retenidas.error ? null : retenidas.count ?? 0,
    enlace: (clave) => enlaceIndicador(slug, clave, aqui),
    enlaceContenido: `/contenido?perfil=${slug}&volver=${encodeURIComponent(aqui)}#c-acc`,
  });
  const otros = pendientes.filter((p) => p.clave !== "captado_sin_derivar");
  const otrosConCosas = otros.filter((p) => p.cantidad !== null && p.cantidad > 0);
  const otrosEnCero = otros.filter((p) => p.cantidad === 0);
  const errores = conteos.filter(([, r]) => r.error).length + (retenidas.error ? 1 : 0);

  // Citas próximas de los captados que se muestran.
  const filas = (captados.filas ?? []).slice(0, MOSTRAR_CAPTADOS);
  const ids = filas.map((f: any) => f.contact_id).filter(Boolean);
  const { data: citas } = ids.length
    ? await s.from("appointments").select("contact_id, starts_at, status, kind").in("contact_id", ids).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true })
    : { data: [] as any[] };
  const citaDe = (id: string) => ((citas ?? []) as any[]).find((c) => c.contact_id === id && !/cancel/.test(String(c.status ?? "")));
  const totalCaptados = cuenta.captado_sin_derivar.count;
  const conversacion = (id: string) => (slug === "juridico" ? `/inbox/${id}` : `/conversacion/${id}`);

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Resumen</h1>
            <p className="mt-1 text-sm text-slate-600">Lo que necesita tu atención, empezando por los captados.</p>
          </div>
          <BotonAsistente variante="suave" texto="Resumen de hoy">
            Preguntale al asistente
          </BotonAsistente>
        </div>

        {errores > 0 && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">
            No se pudieron leer {errores} de las cifras. Las que faltan figuran como «Sin datos»: no son cero.
          </p>
        )}

        <section aria-labelledby="hoy-captados" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
                <Icono nombre="cerrados" className="h-5 w-5" />
              </span>
              <div>
                <h2 id="hoy-captados" className="text-base font-semibold text-slate-950">
                  Captados para derivar
                  {totalCaptados !== null && <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 align-middle text-xs font-semibold text-white tabular-nums">{totalCaptados}</span>}
                </h2>
                <p className="text-sm text-slate-600">Aceptaron el siguiente paso y falta pasarlos al profesional.</p>
              </div>
            </div>
            {(totalCaptados ?? 0) > 0 && (
              <Link href={enlaceIndicador(slug, "captado_sin_derivar", aqui)} className="btn-suave">
                Ver todos
              </Link>
            )}
          </div>
          {totalCaptados === null ? (
            <p className="px-5 py-6 text-sm text-slate-600">Sin datos por ahora.</p>
          ) : filas.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-base font-semibold text-slate-900">Nada pendiente de derivar</p>
              <p className="mt-1 text-sm text-slate-600">Cuando alguien acepte el siguiente paso, aparece acá primero.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filas.map((o: any) => {
                const cita = citaDe(o.contact_id);
                return (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{o.contacts?.full_name ?? "Sin nombre"}</p>
                      <p className="text-xs text-slate-500">
                        {o.contacts?.phone ?? "Sin teléfono"} · actividad {cuando(o.updated_at)}
                        {o.area === "penal" ? " · Penal" : ""}
                      </p>
                    </div>
                    {cita ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/10 px-2.5 py-1 text-xs font-semibold text-gold-800">
                        <Icono nombre="agenda" className="h-3.5 w-3.5" /> Cita {cuando(cita.starts_at)}
                        {cita.kind === "ia" ? " · Fase 2" : ""}
                      </span>
                    ) : null}
                    <div className="flex shrink-0 gap-2">
                      <Link href={conVolver(`/ficha/${o.contact_id}`, aqui)} className="btn-gold-sm">
                        Derivar
                      </Link>
                      {o.conversation_id && (
                        <Link href={conVolver(conversacion(o.conversation_id), aqui)} className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">
                          Chat
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {slug === "marketing" ? <CircuitosMarketing /> : null}

        {otrosConCosas.length > 0 && (
          <section aria-labelledby="hoy-atencion">
            <h2 id="hoy-atencion" className="mb-3 text-base font-semibold text-slate-950">
              También necesita tu atención
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otrosConCosas.map((p) => (
                <li key={p.clave}>
                  <Link href={p.href} className={`flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md ${p.urgente ? "border-amber-300" : "border-slate-200"}`}>
                    <span className="text-sm text-slate-600">{p.titulo}</span>
                    <span className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{p.cantidad!.toLocaleString("es-AR")}</span>
                    <span className="mt-auto pt-2 text-sm font-semibold text-slate-900">
                      {p.accion} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {otrosConCosas.length === 0 && (totalCaptados ?? 0) === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-700">Todo al día: nadie espera a una persona y no hay revisiones pendientes.</p>
        )}

        <section aria-labelledby="hoy-mas" className="solo-avanzado rounded-2xl border border-slate-200 bg-white p-5 text-sm">
          <h2 id="hoy-mas" className="mb-3 text-base font-semibold text-slate-950">Más indicadores</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {otrosEnCero.map((p) => (
              <li key={p.clave}>
                <Link href={p.href} className="flex justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                  <span className="text-slate-700">{p.titulo}</span>
                  <span className="tabular-nums text-slate-500">0</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={enlaceIndicador(slug, "humano_en_curso", aqui)} className="flex justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                <span className="text-slate-700">Atención humana en curso</span>
                <span className="tabular-nums text-slate-500">{cuenta.humano_en_curso.count ?? "Sin datos"}</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </MarcoPerfil>
  );
}
