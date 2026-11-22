import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewCampaignForm } from "@/components/campanas/new-campaign-form";
import { DeleteCampaignButton } from "@/components/campanas/delete-campaign-button";
import { ArchivedToggle } from "@/components/ui/archived-toggle";
import { ResumenSeccion } from "@/components/nivel/resumen-seccion";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCampaignFunnelCounts } from "@/lib/campaigns";
import { getCampaignMetrics } from "@/lib/campaign-metrics";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { opcionesWasender } from "@/lib/wasender/campanas";
import { cantidad, motivoPausaLegible } from "@/lib/textos/pantalla";

/** Perfil según la ruta: «/campanas» es Jurídico; «/panel/<perfil>/campanas» el resto. */
function perfilDe(basePath: string): SlugPerfil | undefined {
  if (basePath === "/campanas") return "juridico";
  const m = /^\/panel\/([a-z0-9_]+)\/campanas/.exec(basePath);
  return m && esSlugPerfil(m[1]) ? m[1] : undefined;
}

/**
 * Qué está pasando con la campaña (24/10): el motivo real de la pausa y, si
 * terminó con destinatarios sin enviar, cuántos quedaron.
 */
function queHace(c: { status: string; pause_reason?: string | null }, pendientes: number | null): string {
  if (c.status === "pausada" && c.pause_reason) return `${capital(motivoPausaLegible(c.pause_reason))}. No envía nada hasta que la reanudes.`;
  if (c.status === "finalizada" && pendientes) return `Terminada con ${cantidad(pendientes, "destinatario")} sin enviar (no se van a enviar solos).`;
  return QUE_HACE[c.status] ?? "";
}

function capital(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Qué significa cada estado, en palabras simples. */
const QUE_HACE: Record<string, string> = {
  borrador: "Preparada: no envía nada hasta que la lances.",
  en_curso: "Enviando, con el ritmo configurado.",
  pausada: "Pausada: no envía nada.",
  finalizada: "Terminó: no quedan mensajes por enviar.",
};

/**
 * Campañas de un perfil (rediseño 17/10, bloque 3): una sola vista para los
 * cuatro perfiles. Simple: en qué está cada campaña y qué significa; crear
 * una campaña solo la prepara. Avanzado: además la plantilla, archivar y
 * las archivadas. Lanzar o reanudar se hace en el detalle y siempre pide
 * confirmación aparte.
 */
/** 18/11: embudo de cada campaña guardado 20 segundos (como sus cifras). La lista ya viene filtrada por perfil. */
const embudoEnMemoria = unstable_cache((campaignId: string) => getCampaignFunnelCounts(createAdminClient(), campaignId), ["campaign-funnel"], { revalidate: 20 });

export async function CampanasListView({
  areas,
  channelArea,
  rubroId,
  basePath,
  perfilNombre,
  searchParams,
}: {
  areas: string[];
  channelArea: string;
  rubroId: string;
  basePath: string;
  perfilNombre: string;
  searchParams: { archivadas?: string; metodo?: string };
}) {
  const verArchivadas = searchParams?.archivadas === "1";
  // 17/11: Meta y Wasender separados también en la lista.
  const metodo: "todas" | "meta" | "wasender" = searchParams?.metodo === "meta" || searchParams?.metodo === "wasender" ? searchParams.metodo : "todas";
  const supabase = createClient();
  const [{ data: campaigns, error }, { data: channels }, { data: campaignLines }, { data: basesCargadas }, { data: rolesPerfil }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .filter("archived_at", verArchivadas ? "not.is" : "is", null)
      .in("area", areas)
      .order("created_at", { ascending: false }),
    supabase.from("channels").select("id, label").eq("area", channelArea).eq("type", "whatsapp"),
    supabase
      .from("profile_lines")
      .select("id, label")
      .eq("rubro_id", rubroId)
      .eq("active", true)
      .eq("use_for_campaigns", true)
      .order("created_at"),
    // 24/10: al preparar la campaña se elige una base ya cargada y el rol del bot.
    supabase.from("imported_bases").select("id, name, file_name, total_rows, created_rows, created_at").in("area", areas).is("archived_at", null).order("created_at", { ascending: false }).limit(60),
    supabase.from("agent_roles" as any).select("id, nombre").eq("rubro_id", rubroId).is("archived_at", null).order("updated_at", { ascending: false }),
  ]);
  // 10/11: líneas y plantillas de Wasender (tablas sin permisos públicos: se leen en el servidor).
  // 18/11 (velocidad): Wasender, embudo y cifras se piden a la vez, y el embudo se guarda 20 s por campaña
  // (antes eran unas 7 consultas por campaña en cada carga, una tanda después de la otra).
  // 24/10: las cifras de envío salen del mismo cálculo que el detalle y el Inicio.
  const [wasender, listaEmbudos, listaMetricas] = await Promise.all([
    opcionesWasender(rubroId).catch(() => null),
    Promise.all((campaigns ?? []).map(async (c: any) => [c.id, await embudoEnMemoria(c.id).catch(() => null)] as const)),
    Promise.all((campaigns ?? []).map(async (c: any) => [c.id, await getCampaignMetrics(c.id).catch(() => null)] as const)),
  ]);
  const funnels = new Map(listaEmbudos);
  const metricas = new Map(listaMetricas);
  const cuenta = (estado: string) => (campaigns ?? []).filter((c: any) => c.status === estado).length;
  const enCurso = cuenta("en_curso");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">Campañas</h1>
          <p className="mt-1 text-sm text-slate-600">Conversaciones que se inician con una base cargada — {perfilNombre}.</p>
        </div>
        <span className={verArchivadas ? "" : "solo-avanzado"}>
          <ArchivedToggle basePath={basePath} showing={verArchivadas} />
        </span>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          No se pudieron leer las campañas. No es que no haya: volvé a intentar.
        </p>
      ) : null}

      {!verArchivadas ? (
        <ResumenSeccion
          id="camp"
          estado={
            (campaigns ?? []).length === 0
              ? "Todavía no hay campañas"
              : enCurso
              ? enCurso === 1 ? "Una campaña enviando ahora" : `${cantidad(enCurso, "campaña")} enviando ahora`
              : "Ninguna campaña está enviando"
          }
          detalle={
            <p>
              {cantidad(cuenta("borrador"), "preparada")} · {cantidad(cuenta("pausada"), "pausada")} · {cantidad(cuenta("finalizada"), "terminada")}. Crear una campaña solo la
              prepara: los mensajes salen recién cuando la lanzás y lo confirmás.
            </p>
          }
          tono={enCurso ? "atencion" : "info"}
        />
      ) : null}

      {!verArchivadas ? (
        <div>
          <NewCampaignForm
            channels={channels ?? []}
            lines={campaignLines ?? []}
            redirectBase={basePath}
            perfil={perfilDe(basePath)}
            bases={((basesCargadas ?? []) as any[]).map((b) => ({ id: b.id, nombre: b.name || b.file_name || "Base sin nombre", filas: b.total_rows ?? b.created_rows ?? null }))}
            roles={((rolesPerfil ?? []) as any[]).map((r) => ({ id: r.id, nombre: r.nombre }))}
            wasender={wasender}
          />
        </div>
      ) : null}

      {(campaigns ?? []).length > 0 ? (
        <nav aria-label="Método de envío" className="flex flex-wrap gap-2">
          {([
            ["todas", "Todas", (campaigns ?? []).length],
            ["meta", "WhatsApp oficial (Meta)", (campaigns ?? []).filter((c: any) => c.proveedor !== "wasender").length],
            ["wasender", "WhatsApp por QR (Wasender)", (campaigns ?? []).filter((c: any) => c.proveedor === "wasender").length],
          ] as const).map(([valor, texto, n]) => {
            const q = new URLSearchParams();
            if (verArchivadas) q.set("archivadas", "1");
            if (valor !== "todas") q.set("metodo", valor);
            const qs = q.toString();
            return (
              <Link
                key={valor}
                prefetch={false}
                href={`${basePath}${qs ? `?${qs}` : ""}`}
                aria-current={metodo === valor ? "page" : undefined}
                className={`inline-flex min-h-[40px] items-center rounded-full border px-3 py-1.5 text-sm ${metodo === valor ? "border-gold-400 bg-slate-900 font-semibold text-gold-100" : "border-slate-300 text-slate-700 hover:border-slate-400"}`}
              >
                {texto} <span className="ml-1.5 tabular-nums opacity-80">{n}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      <ul className="space-y-3" aria-label="Campañas">
        {(campaigns ?? []).filter((c: any) => metodo === "todas" || (metodo === "wasender") === (c.proveedor === "wasender")).map((c: any) => {
          const f = funnels.get(c.id);
          const m = metricas.get(c.id);
          return (
            <li key={c.id} className="card-lift flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="min-w-0 font-medium text-slate-900 [overflow-wrap:anywhere]">
                    <Link prefetch={false} href={`${basePath}/${c.id}`} className="underline-offset-2 hover:underline">
                      {c.name}
                    </Link>
                  </h3>
                  <span className="flex shrink-0 gap-1.5">
                    <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs font-medium text-slate-700">{c.proveedor === "wasender" ? "Wasender" : "Meta"}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}</span>
                  </span>
                </div>
                <p className={`text-sm ${c.status === "pausada" && c.pause_reason ? "font-medium text-amber-800" : "text-slate-700"}`}>{queHace(c, m ? m.pendientes + (m.a_revisar ?? 0) : null)}</p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="tabular-nums">{m?.enviados ?? f?.enviados ?? 0}</span> de <span className="tabular-nums">{m?.prospectos ?? f?.total ?? 0}</span> enviados
                  {m?.fallidos ? <> · <span className="tabular-nums">{m.fallidos}</span> fallaron</> : null} ·{" "}
                  <span className="tabular-nums">{m?.personas_responden ?? f?.respondieron ?? 0}</span> respondieron · <span className="tabular-nums">{f?.agendados ?? 0}</span> agendados
                </p>
                <p className="solo-avanzado mt-1 text-xs text-slate-600 [overflow-wrap:anywhere]">
                  {c.proveedor === "wasender" ? (
                    "Envía por Wasender"
                  ) : (
                    <>
                      Plantilla {c.message_template_name ?? "sin elegir"}
                      {c.message_template_name && !c.template_id ? " (sin confirmar en el catálogo)" : ""}
                    </>
                  )}
                </p>
              </div>
              <span className="solo-avanzado shrink-0">
                <DeleteCampaignButton campaignId={c.id} campaignName={c.name} archived={!!c.archived_at} />
              </span>
            </li>
          );
        })}
        {!error && (campaigns ?? []).length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-700">
            {verArchivadas ? "No hay campañas archivadas." : `Todavía no creaste ninguna campaña de ${perfilNombre}.`}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
