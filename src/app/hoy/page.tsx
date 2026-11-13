import { perfilActivo } from "@/lib/perfil-activo";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { contarIndicador, enlaceIndicador, indicadorPorClave, listarIndicador, rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { CircuitosMarketing } from "@/components/marketing/circuitos-marketing";
import { BotonAsistente } from "@/components/asistente/boton-asistente";
import { VISTAS_CARTERA, cuandoCorto } from "@/lib/cartera";
import { AREAS_DE_PERFIL, contarGrupo } from "@/lib/cartera-servidor";
import { getCampaignFunnelCounts } from "@/lib/campaigns";
import { TableroHoy } from "@/components/inicio/tablero-hoy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hoy" };

/** Saludo según la hora de Buenos Aires (24/10). */
function saludo(ahora = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("es-AR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).format(ahora));
  return h < 12 ? "Buen día" : h < 20 ? "Buenas tardes" : "Buenas noches";
}

function fechaHoy(ahora = new Date()): string {
  const t = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(ahora);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Inicio del perfil. Desde el 13/11 muestra solo lo que lleva a una acción:
 * a quién contestarle, a quién derivar, las citas y los derivados sin cerrar,
 * y una línea con lo que el bot lleva adelante. Las cifras del período están
 * en Resultados. Solo lectura.
 */
export default async function InicioPerfilPage({ searchParams }: { searchParams: { perfil?: string; grupo?: string; cola?: string; todo?: string; periodo?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = perfilActivo(searchParams.perfil);
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
  const s = createAdminClient();
  const conv = VISTAS_CARTERA.conversaciones.grupos;
  const grupo = (clave: string) => conv.find((g) => g.clave === clave)!;

  // 13/11 (pedido de la responsable): en Hoy queda solo lo que lleva a una acción.
  // Las cifras de la semana, la última base y los indicadores sueltos se ven en Resultados.
  const claves = ["captado_sin_derivar", "derivado_sin_resultado", "dejaron_de_responder"] as const;
  const [conteos, captados, agendaron, hablando] = await Promise.all([
    Promise.all(claves.map(async (c) => [c, await contarIndicador(rubroId as string, indicadorPorClave(c)!)] as const)),
    listarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!, { orden: "reciente" }),
    contarGrupo(rubroId, areas, grupo("agendaron")).catch(() => null),
    contarGrupo(rubroId, areas, grupo("hablando")).catch(() => null),
  ]);
  // Campañas que están enviando ahora, con su avance. Solo lectura.
  const { data: activas } = await s
    .from("campaigns")
    .select("id, name, status")
    .in("area", areas)
    .is("archived_at", null)
    .eq("status", "en_curso")
    .order("created_at", { ascending: false })
    .limit(3);
  const embudos = await Promise.all(((activas ?? []) as any[]).map((c) => getCampaignFunnelCounts(s, c.id).catch(() => null)));
  const baseCampanas = slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`;
  const cuenta = Object.fromEntries(conteos.map(([c, r]) => [c, r])) as Record<(typeof claves)[number], { count: number | null; error: string | null }>;
  const errores = conteos.filter(([, r]) => r.error).length;

  // Citas próximas de los captados que se muestran.
  const ids = (captados.filas ?? []).map((f: any) => f.contact_id).filter(Boolean);
  const { data: citas } = ids.length
    ? await s.from("appointments").select("contact_id, starts_at, status, kind").in("contact_id", ids).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true })
    : { data: [] as any[] };
  const citaDe = (id: string) => ((citas ?? []) as any[]).find((c) => c.contact_id === id && !/cancel/.test(String(c.status ?? "")));

  // Lo que pide algo tuyo (solo se muestra si hay alguien)…
  const tareas = [
    { titulo: "Citas próximas", n: agendaron, detalle: "Mirá quién viene y a qué hora", href: `/conversaciones?perfil=${slug}&grupo=agendaron` },
    { titulo: "Derivados sin resultado", n: cuenta.derivado_sin_resultado.count, detalle: "Anotá cómo terminó cada uno", href: enlaceIndicador(slug, "derivado_sin_resultado", aqui) },
  ];
  // …y lo que el bot lleva adelante solo: se informa en una línea, cada dato abre su lista.
  const delBot = [
    { texto: "en charla con el bot", n: hablando, href: `/conversaciones?perfil=${slug}&grupo=hablando` },
    { texto: "en seguimiento", n: cuenta.dejaron_de_responder.count, href: enlaceIndicador(slug, "dejaron_de_responder", aqui) },
    ...((activas ?? []) as any[]).map((c, i) => ({ texto: `enviados de «${c.name}»`, n: embudos[i]?.enviados ?? null, de: embudos[i]?.total ?? null, href: `${baseCampanas}/${c.id}` })),
  ];

  return (
    <>
      <TableroHoy
        slug={slug}
        rubroId={rubroId}
        areas={areas}
        grupo={searchParams.grupo}
        filtroCola={searchParams.cola}
        verTodo={searchParams.todo === "1"}
        enMarcha={tareas}
        delBot={delBot}
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

      {slug === "marketing" ? <CircuitosMarketing /> : null}

      <p className="text-sm text-slate-600">
        Los números de la semana y del mes, con de dónde vino cada persona, están en{" "}
        <Link href={`/resultados?perfil=${slug}`} className="font-medium text-slate-900 underline underline-offset-2">
          Resultados
        </Link>
        .
      </p>
    </>
  );
}
