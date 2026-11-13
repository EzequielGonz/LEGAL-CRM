import { Suspense } from "react";
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
import { getCampaignFunnelCounts } from "@/lib/campaigns";
import { TableroHoy } from "@/components/inicio/tablero-hoy";
import { PresentacionHoy } from "@/components/inicio/presentacion-hoy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hoy" };

const MOSTRAR_CAPTADOS = 6;

/** Saludo según la hora de Buenos Aires (24/10). */
function saludo(ahora = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("es-AR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).format(ahora));
  return h < 12 ? "Buen día" : h < 20 ? "Buenas tardes" : "Buenas noches";
}

function fechaHoy(ahora = new Date()): string {
  const t = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(ahora);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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
export default async function InicioPerfilPage({ searchParams }: { searchParams: { perfil?: string; grupo?: string; cola?: string; todo?: string; periodo?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{saludo()}</h1>
            <p className="mt-1 text-sm text-slate-600">{fechaHoy()} · personas, no mensajes</p>
          </div>
          <BotonAsistente variante="suave" texto="Resumen de hoy">
            Pedile algo
          </BotonAsistente>
        </div>

        {/* 13/11: el marco y el saludo se pintan enseguida; los datos llegan apenas están. */}
        <Suspense fallback={<EsqueletoHoy />}>
          <CuerpoHoy slug={slug} rubroId={rubroId} searchParams={searchParams} />
        </Suspense>
      </div>
    </MarcoPerfil>
  );
}

function EsqueletoHoy() {
  return (
    <div role="status" aria-label="Cargando el tablero de hoy" className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[40, 56, 44].map((w, i) => (
          <span key={i} className="h-9 animate-pulse rounded-full bg-slate-200/70" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
    </div>
  );
}

async function CuerpoHoy({ slug, rubroId, searchParams }: { slug: SlugPerfil; rubroId: string; searchParams: { grupo?: string; cola?: string; todo?: string; periodo?: string } }) {
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
  // Campañas activas (19/10): las que están enviando ahora, con su avance. Solo lectura.
  const { data: activas } = await s
    .from("campaigns")
    .select("id, name, status")
    .in("area", areas)
    .is("archived_at", null)
    .eq("status", "en_curso")
    .order("created_at", { ascending: false });
  const embudos = await Promise.all(((activas ?? []) as any[]).map((c) => getCampaignFunnelCounts(s, c.id).catch(() => null)));
  const baseCampanas = slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`;
  const cuenta = Object.fromEntries(conteos.map(([c, r]) => [c, r])) as Record<(typeof claves)[number], { count: number | null; error: string | null }>;
  const errores = conteos.filter(([, r]) => r.error).length + (retenidas.error ? 1 : 0);

  // Citas próximas de los captados que se muestran.
  const ids = (captados.filas ?? []).map((f: any) => f.contact_id).filter(Boolean);
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
    <>
        <TableroHoy
          slug={slug}
          rubroId={rubroId}
          areas={areas}
          grupo={searchParams.grupo}
          filtroCola={searchParams.cola}
          verTodo={searchParams.todo === "1"}
          enMarcha={paraCerrar}
          captados={(captados.filas ?? []).map((o: any) => {
            const cita = citaDe(o.contact_id);
            return {
              contactId: o.contact_id ?? null,
              conversationId: o.conversation_id ?? null,
              nombre: o.contacts?.full_name ?? null,
              detalle: `Aceptó el siguiente paso${o.area === "penal" ? " · Penal" : ""}`,
              etiqueta: cita ? `Cita ${cuandoCorto(cita.starts_at)}${cita.kind === "ia" ? " · Fase 2" : ""}` : null,
              at: o.updated_at ?? null,
            };
          })}
        />

        {errores > 0 && (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">
            No se pudieron leer {errores} de las cifras. Las que faltan figuran como «—»: no son cero.
          </p>
        )}

        <section aria-labelledby="hoy-campanas" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="hoy-campanas" className="text-base font-semibold text-slate-950">
                Campañas activas
                <span className="ml-2 rounded-full bg-gold-500/15 px-2 py-0.5 align-middle text-xs font-semibold text-gold-800 tabular-nums">{(activas ?? []).length}</span>
              </h2>
              <p className="text-sm text-slate-600">Las que están enviando ahora.</p>
            </div>
            <Link href={baseCampanas} className="shrink-0 text-xs font-medium text-slate-700 underline underline-offset-2">
              Ver campañas
            </Link>
          </div>
          {(activas ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Ninguna campaña está enviando ahora.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {((activas ?? []) as any[]).map((c, i) => {
                const f = embudos[i];
                return (
                  <li key={c.id}>
                    <Link href={`${baseCampanas}/${c.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 hover:bg-slate-50">
                      <span className="min-w-0 truncate text-sm font-semibold text-slate-950">{c.name}</span>
                      <span className="text-xs text-slate-600">
                        <span className="tabular-nums">{f?.enviados ?? 0}</span> de <span className="tabular-nums">{f?.total ?? 0}</span> enviados · <span className="tabular-nums">{f?.respondieron ?? 0}</span> respondieron · <span className="tabular-nums">{f?.agendados ?? 0}</span> agendados
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {slug === "marketing" ? <CircuitosMarketing /> : null}

        {/* 12/11: estadísticas como una presentación; la semana actual primero. */}
        <Suspense fallback={<div role="status" aria-label="Cargando las cifras" className="h-56 animate-pulse rounded-2xl bg-slate-200/60" />}>
          <PresentacionHoy slug={slug} rubroId={rubroId} areas={areas} periodo={searchParams.periodo} historial={`${prefijo}/estadisticas`} />
        </Suspense>

        <section aria-labelledby="hoy-base">
          <h2 id="hoy-base" className="sr-only">
            Última base
          </h2>
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
    </>
  );
}
