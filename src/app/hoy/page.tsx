import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { contarIndicador, enlaceIndicador, indicadorPorClave, listarIndicador, rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { prioridadesDeInicio } from "@/lib/inicio";
import { conVolver } from "@/lib/navegacion";
import { CircuitosMarketing } from "@/components/marketing/circuitos-marketing";
import { BotonAsistente } from "@/components/asistente/boton-asistente";
import { Icono } from "@/components/ui/icono-seccion";
import { VISTAS_CARTERA, cuandoCorto, enlaceConversacion, iniciales } from "@/lib/cartera";
import { AREAS_DE_PERFIL, contarGrupo, resumenCifras } from "@/lib/cartera-servidor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicio" };

const MOSTRAR_CAPTADOS = 6;

function Numero({ n, texto }: { n: number | null | undefined; texto: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-slate-950">{n === null || n === undefined ? "—" : n.toLocaleString("es-AR")}</p>
      <p className="text-xs text-slate-500">{texto}</p>
    </div>
  );
}

/**
 * Inicio del perfil (reorganización 2, 18/10): primero los captados que falta
 * derivar; después lo que se puede cerrar (agendados, charlas en curso,
 * seguimientos, derivados sin resultado) y dos cifras chicas: la semana y la
 * última base. Las quejas y la atención humana no van acá. Solo lectura.
 */
export default async function InicioPerfilPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const aqui = `/hoy?perfil=${slug}`;
  const areas = AREAS_DE_PERFIL[slug];
  const prefijo = slug === "juridico" ? "" : `/panel/${slug}`;
  const s = createAdminClient();
  const conv = VISTAS_CARTERA.conversaciones.grupos;
  const grupo = (clave: string) => conv.find((g) => g.clave === clave)!;

  const claves = ["requiere_humano", "captado_sin_derivar", "revision_pendiente", "seguimiento_caido", "derivado_sin_resultado", "humano_en_curso", "seguimiento_activo"] as const;
  const [conteos, retenidas, captados, agendaron, hablando, cifras] = await Promise.all([
    Promise.all(claves.map(async (c) => [c, await contarIndicador(rubroId as string, indicadorPorClave(c)!)] as const)),
    s.from("content_pieces").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).in("estado", ["retenida", "error", "incierta"]),
    listarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!, { orden: "reciente" }),
    contarGrupo(rubroId, areas, grupo("agendaron")).catch(() => null),
    contarGrupo(rubroId, areas, grupo("hablando")).catch(() => null),
    resumenCifras(rubroId, areas).catch(() => null),
  ]);
  const cuenta = Object.fromEntries(conteos.map(([c, r]) => [c, r])) as Record<(typeof claves)[number], { count: number | null; error: string | null }>;
  const errores = conteos.filter(([, r]) => r.error).length + (retenidas.error ? 1 : 0);

  // Citas próximas de los captados que se muestran.
  const filas = (captados.filas ?? []).slice(0, MOSTRAR_CAPTADOS);
  const ids = filas.map((f: any) => f.contact_id).filter(Boolean);
  const { data: citas } = ids.length
    ? await s.from("appointments").select("contact_id, starts_at, status, kind").in("contact_id", ids).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true })
    : { data: [] as any[] };
  const citaDe = (id: string) => ((citas ?? []) as any[]).find((c) => c.contact_id === id && !/cancel/.test(String(c.status ?? "")));
  const totalCaptados = cuenta.captado_sin_derivar.count;

  const paraCerrar = [
    { titulo: "Agendaron", n: agendaron, detalle: "Tienen cita próxima", href: `/conversaciones?perfil=${slug}&grupo=agendaron`, icono: "agenda" },
    { titulo: "Hablando ahora", n: hablando, detalle: "Charla en curso", href: `/conversaciones?perfil=${slug}&grupo=hablando`, icono: "consultas" },
    { titulo: "En seguimiento", n: cuenta.seguimiento_activo.count, detalle: "Seguimiento automático", href: `/contactos?perfil=${slug}&grupo=seguimiento`, icono: "seguimiento" },
    { titulo: "Derivados sin resultado", n: cuenta.derivado_sin_resultado.count, detalle: "Anotá cómo terminó", href: enlaceIndicador(slug, "derivado_sin_resultado", aqui), icono: "cerrados" },
  ];

  const mas = prioridadesDeInicio({
    conteos: Object.fromEntries(conteos.map(([c, r]) => [c, r.count])),
    contenidoRetenido: retenidas.error ? null : retenidas.count ?? 0,
    enlace: (clave) => enlaceIndicador(slug, clave, aqui),
    enlaceContenido: `/contenido?perfil=${slug}&volver=${encodeURIComponent(aqui)}#c-acc`,
  }).filter((p) => p.clave !== "captado_sin_derivar" && p.clave !== "derivado_sin_resultado");

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Resumen</h1>
            <p className="mt-1 text-sm text-slate-600">Lo que podés cerrar hoy, empezando por los captados.</p>
          </div>
          <BotonAsistente variante="suave" texto="Resumen de hoy">
            Pedile algo
          </BotonAsistente>
        </div>

        {errores > 0 && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">
            No se pudieron leer {errores} de las cifras. Las que faltan figuran como «—»: no son cero.
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
                  {totalCaptados !== null && <span className="ml-2 rounded-full bg-gold-500/15 px-2 py-0.5 align-middle text-xs font-semibold text-gold-800 tabular-nums">{totalCaptados}</span>}
                </h2>
                <p className="text-sm text-slate-600">Aceptaron el siguiente paso y falta pasarlos al profesional.</p>
              </div>
            </div>
            {(totalCaptados ?? 0) > 0 && (
              <Link href={`/conversaciones?perfil=${slug}&grupo=captados`} className="btn-suave">
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
                    <span aria-hidden="true" className="avatar-ficha grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold">
                      {iniciales(o.contacts?.full_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{o.contacts?.full_name ?? "Sin nombre"}</p>
                      <p className="text-xs text-slate-500">
                        <span className="tabular-nums">{o.contacts?.phone ?? "Sin teléfono"}</span> · actividad {cuandoCorto(o.updated_at)}
                        {o.area === "penal" ? " · Penal" : ""}
                      </p>
                    </div>
                    {cita ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/10 px-2.5 py-1 text-xs font-semibold text-gold-800">
                        <Icono nombre="agenda" className="h-3.5 w-3.5" /> Cita {cuandoCorto(cita.starts_at)}
                        {cita.kind === "ia" ? " · Fase 2" : ""}
                      </span>
                    ) : null}
                    <div className="flex shrink-0 gap-2">
                      <Link href={conVolver(`/ficha/${o.contact_id}`, aqui)} className="btn-gold-sm">
                        Derivar
                      </Link>
                      {o.conversation_id && (
                        <Link href={conVolver(enlaceConversacion(slug, o.conversation_id), aqui)} className="btn-suave-sm">
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

        <section aria-labelledby="hoy-cerrar">
          <h2 id="hoy-cerrar" className="mb-3 text-base font-semibold text-slate-950">
            Para cerrar
          </h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {paraCerrar.map((p) => (
              <li key={p.titulo}>
                <Link href={p.href} className="tarjeta-grupo flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Icono nombre={p.icono} className="h-4 w-4 text-gold-600" />
                    {p.titulo}
                  </span>
                  <span className={`mt-2 text-3xl font-semibold tabular-nums ${p.n ? "text-slate-950" : "text-slate-300"}`}>{p.n === null || p.n === undefined ? "—" : p.n.toLocaleString("es-AR")}</span>
                  <span className="mt-1 text-xs text-slate-500">{p.detalle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {slug === "marketing" ? <CircuitosMarketing /> : null}

        <section aria-labelledby="hoy-cifras" className="grid gap-3 md:grid-cols-2">
          <h2 id="hoy-cifras" className="sr-only">
            Cifras
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Esta semana</p>
            <p className="text-xs text-slate-500">Desde el lunes</p>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <Numero n={cifras?.semana.respuestas} texto="mensajes recibidos" />
              <Numero n={cifras?.semana.citas} texto="citas" />
              <Numero n={cifras?.semana.captados} texto="captados" />
              <Numero n={cifras?.semana.derivados} texto="derivados" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Última base</p>
                <p className="truncate text-xs text-slate-500">{cifras?.ultimaBase ? `${cifras.ultimaBase.nombre} · ${cuandoCorto(cifras.ultimaBase.fecha)}` : "Todavía no cargaste bases"}</p>
              </div>
              <Link href={`${prefijo}/estadisticas`} className="shrink-0 text-xs font-medium text-slate-700 underline underline-offset-2">
                Ver historial
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <Numero n={cifras?.ultimaBase?.cargados ?? (cifras?.ultimaBase === null ? 0 : null)} texto="contactos" />
              <Numero n={cifras?.ultimaBase?.contactados ?? (cifras?.ultimaBase === null ? 0 : null)} texto="contactados" />
              <Numero n={cifras?.ultimaBase?.respondieron ?? (cifras?.ultimaBase === null ? 0 : null)} texto="respondieron" />
              <Numero n={cifras?.ultimaBase?.captados ?? (cifras?.ultimaBase === null ? 0 : null)} texto="captados" />
            </div>
          </div>
        </section>

        <section aria-labelledby="hoy-mas" className="solo-avanzado rounded-2xl border border-slate-200 bg-white p-5 text-sm">
          <h2 id="hoy-mas" className="mb-3 text-base font-semibold text-slate-950">Más indicadores</h2>
          <ul className="grid gap-1 sm:grid-cols-2">
            {mas.map((p) => (
              <li key={p.clave}>
                <Link href={p.href} className="flex justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                  <span className="text-slate-700">{p.titulo}</span>
                  <span className="tabular-nums text-slate-500">{p.cantidad ?? "—"}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={enlaceIndicador(slug, "humano_en_curso", aqui)} className="flex justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                <span className="text-slate-700">Atención humana en curso</span>
                <span className="tabular-nums text-slate-500">{cuenta.humano_en_curso.count ?? "—"}</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </MarcoPerfil>
  );
}
