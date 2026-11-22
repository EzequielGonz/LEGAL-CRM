import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Anillo, Bento, BentoCelda, Boton, Pastilla, Tarjeta, VerMas } from "@/components/premium";
import type { EstadoPastilla } from "@/components/premium";
import "@/app/chats-campanas.css";

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


const ESTADO_PASTILLA: Record<string, EstadoPastilla> = { en_curso: "ok", pausada: "atencion", borrador: "info", finalizada: "neutro" };

/** Un porcentaje entero (0 a 100) de n sobre d; sin base, 0. */
function porcentajeEntero(n: number, d: number): number {
  return d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0;
}

/**
 * Tarjeta de una campaña (22/11): estado en pastilla, dos anillos chicos (enviados y respuestas) y el
 * botón «Dejar lista» en las que están preparándose. «Dejar lista» solo abre el detalle: nada se lanza desde acá.
 */
export function TarjetaCampana({ c, f, m, basePath, orden, rubro, texto }: { c: any; f: any; m: any; basePath: string; orden: number; rubro: SlugPerfil; texto: string }) {
  const enviados = m?.enviados ?? f?.enviados ?? 0;
  const total = m?.prospectos ?? f?.total ?? 0;
  const responden = m?.personas_responden ?? f?.respondieron ?? 0;
  const preparando = c.status === "borrador";
  return (
    <Tarjeta como="li" relieve rubro={rubro} aparecer={orden}>
      <div className="cc-camp__cabeza">
        <h3 className="cc-camp__nombre">
          <Link prefetch={false} href={`${basePath}/${c.id}`}>
            {c.name}
          </Link>
        </h3>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pastilla>{c.proveedor === "wasender" ? "Wasender" : "Meta"}</Pastilla>
          <Pastilla estado={ESTADO_PASTILLA[c.status] ?? "neutro"}>{CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}</Pastilla>
        </span>
      </div>
      <div className="cc-camp__cuerpo">
        <Anillo valor={enviados} meta={Math.max(total, enviados, 1)} rubro={rubro} tamano="chico" nombre={`Enviados de ${c.name}`} unidad={`de ${total} destinatarios`} />
        <Anillo valor={porcentajeEntero(responden, enviados)} rubro={rubro} tamano="chico" nombre={`Respuesta de ${c.name}`} unidad="de respuesta" sufijo="%" retrasoMs={80} />
        <dl className="cc-camp__cifras">
          <div>
            <dt>Enviados</dt>
            <dd>
              {enviados.toLocaleString("es-AR")}
              <span style={{ fontSize: "0.8rem", fontWeight: 500, opacity: 0.8 }}> de {total.toLocaleString("es-AR")}</span>
            </dd>
          </div>
          <div>
            <dt>Respondieron</dt>
            <dd>{responden.toLocaleString("es-AR")}</dd>
          </div>
          <div>
            <dt>Agendados</dt>
            <dd>{(f?.agendados ?? 0).toLocaleString("es-AR")}</dd>
          </div>
        </dl>
      </div>
      <p className={`cc-camp__linea${c.status === "pausada" && c.pause_reason ? " cc-camp__linea--aviso" : ""}`}>
        {texto}
        {m?.fallidos ? ` · ${m.fallidos} fallaron` : ""}
      </p>
      <p className="solo-avanzado cc-camp__linea" style={{ fontSize: 12.5, overflowWrap: "anywhere" }}>
        {c.proveedor === "wasender" ? (
          "Envía por Wasender"
        ) : (
          <>
            Plantilla {c.message_template_name ?? "sin elegir"}
            {c.message_template_name && !c.template_id ? " (sin confirmar en el catálogo)" : ""}
          </>
        )}
      </p>
      <div className="cc-camp__pie">
        <Boton href={preparando ? `${basePath}/${c.id}#campana-config` : `${basePath}/${c.id}`} variante={preparando ? "primario" : "secundario"}>
          {preparando ? "Dejar lista" : "Ver cómo va"}
        </Boton>
        <span className="solo-avanzado">
          <DeleteCampaignButton campaignId={c.id} campaignName={c.name} archived={!!c.archived_at} />
        </span>
      </div>
    </Tarjeta>
  );
}

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
  const rubroPerfil = perfilDe(basePath);
  if (!rubroPerfil) notFound();
  // La campaña que se muestra en el anillo grande: la que está enviando; si no, la última con envíos.
  const principal: any = (campaigns ?? []).find((c: any) => c.status === "en_curso") ?? (campaigns ?? []).find((c: any) => (metricas.get(c.id)?.enviados ?? 0) > 0) ?? null;
  const mp = principal ? metricas.get(principal.id) : null;
  const tasaPrincipal = mp ? porcentajeEntero(mp.personas_responden, mp.enviados) : 0;

  return (
    <div className="cc mx-auto max-w-5xl space-y-6">
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

      {!verArchivadas && (campaigns ?? []).length > 0 ? (
        <Bento>
          <BentoCelda columnas={12} columnasMedio={6}>
            <Tarjeta relieve rubro={rubroPerfil} aparecer={0}>
              <div className="cc-ring">
                <Anillo valor={tasaPrincipal} rubro={rubroPerfil} tamano="grande" sufijo="%" nombre="Respuesta de la campaña" unidad="de las personas con envío respondieron" />
                <div className="cc-ring__texto">
                  <h2 className="cc-ring__titulo">{principal ? `Respuesta de «${principal.name}»` : "Respuesta de tus campañas"}</h2>
                  <p className="cc-ring__detalle">
                    {principal
                      ? `${(metricas.get(principal.id)?.personas_responden ?? 0).toLocaleString("es-AR")} de ${(metricas.get(principal.id)?.enviados ?? 0).toLocaleString("es-AR")} personas con envío respondieron.`
                      : "Todavía no hay envíos para medir."}
                  </p>
                  <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <Pastilla estado={enCurso ? "ok" : "neutro"}>{enCurso} enviando ahora</Pastilla>
                    <Pastilla estado="info">{cantidad(cuenta("borrador"), "preparada")}</Pastilla>
                    {cuenta("pausada") ? <Pastilla estado="atencion">{cantidad(cuenta("pausada"), "pausada")}</Pastilla> : null}
                  </span>
                </div>
              </div>
            </Tarjeta>
          </BentoCelda>
        </Bento>
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

      {(() => {
        const visibles = (campaigns ?? []).filter((c: any) => metodo === "todas" || (metodo === "wasender") === (c.proveedor === "wasender"));
        const tarjeta = (c: any, i: number) => <TarjetaCampana key={c.id} c={c} f={funnels.get(c.id)} m={metricas.get(c.id)} basePath={basePath} orden={i + 1} rubro={rubroPerfil} texto={queHace(c, metricas.get(c.id) ? metricas.get(c.id)!.pendientes + (metricas.get(c.id)!.a_revisar ?? 0) : null)} />;
        return (
          <>
            <ul className="cc-camp" aria-label="Campañas">
              {visibles.slice(0, 3).map(tarjeta)}
              {!error && (campaigns ?? []).length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-700" style={{ gridColumn: "1 / -1" }}>
                  {verArchivadas ? "No hay campañas archivadas." : `Todavía no creaste ninguna campaña de ${perfilNombre}.`}
                </li>
              ) : null}
            </ul>
            {visibles.length > 3 ? (
              <VerMas cerrado={`Ver las otras ${visibles.length - 3} campañas`} abierto="Ocultar las otras campañas">
                <ul className="cc-camp" aria-label="Más campañas" style={{ marginTop: 16 }}>
                  {visibles.slice(3).map((c: any, i: number) => tarjeta(c, i + 4))}
                </ul>
              </VerMas>
            ) : null}
          </>
        );
      })()}
    </div>
  );
}
