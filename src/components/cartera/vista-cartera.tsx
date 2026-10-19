import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Icono } from "@/components/ui/icono-seccion";
import { rubroIdDe, enlaceIndicador } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { conVolver } from "@/lib/navegacion";
import { VISTAS_CARTERA, cuandoCorto, enlaceConversacion, grupoElegido, iniciales, type Tono, type VistaCartera } from "@/lib/cartera";
import { AREAS_DE_PERFIL, contarDetenidos, contarVista, listarGrupo, resumenCifras, type FichaCartera } from "@/lib/cartera-servidor";
import { getProfileMetrics } from "@/lib/metrics";
import { createAdminClient } from "@/lib/supabase/admin";

const PUNTO: Record<Tono, string> = {
  caliente: "bg-gold-500",
  ok: "bg-emerald-500",
  alerta: "bg-amber-500",
  info: "bg-slate-400",
};

function Ficha({ f, slug, aqui, accion }: { f: FichaCartera; slug: SlugPerfil; aqui: string; accion: "derivar" | "chat" | "ficha" }) {
  const ficha = f.contactId ? conVolver(`/ficha/${f.contactId}`, aqui) : null;
  const chat = f.conversationId ? conVolver(enlaceConversacion(slug, f.conversationId), aqui) : null;
  const chatPrincipal = accion === "chat" && !!chat;
  return (
    <li className="ficha-cartera group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="avatar-ficha grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
          {iniciales(f.nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-950">{f.nombre}</p>
          <p className="truncate text-xs tabular-nums text-slate-500">{f.telefono ? `+${f.telefono.replace(/^\+/, "")}` : "Sin teléfono"}</p>
        </div>
        {f.area === "penal" ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">Penal</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{f.estado}</span>
        {f.cita ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-1 font-semibold text-gold-800">
            <Icono nombre="agenda" className="h-3.5 w-3.5" />
            {cuandoCorto(f.cita.inicio)}
            {f.cita.fase2 ? " · Fase 2" : f.cita.reagendada ? " · reagendada" : ""}
          </span>
        ) : null}
      </div>
      {f.actividad ? <p className="mt-2 text-[11px] text-slate-400">Última actividad {cuandoCorto(f.actividad)}</p> : null}
      <div className="mt-auto flex gap-2 pt-3">
        {ficha ? (
          <Link href={ficha} className={chatPrincipal ? "btn-suave-sm flex-1 justify-center" : "btn-gold-sm flex-1 justify-center"}>
            {accion === "derivar" ? "Derivar" : "Ficha"}
          </Link>
        ) : null}
        {chat ? (
          <Link href={chat} className={chatPrincipal ? "btn-gold-sm flex-1 justify-center" : "btn-suave-sm flex-1 justify-center"}>
            Chat
          </Link>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Vista compacta de la cartera (reorganización 2, 18/10): tarjetas por grupo
 * con su cantidad; al elegir una, las fichas de ese grupo, con acceso a la
 * ficha y al chat. Solo lectura.
 */
export async function PaginaCartera({ vista, searchParams }: { vista: VistaCartera; searchParams: { perfil?: string; grupo?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const areas = AREAS_DE_PERFIL[slug];
  const def = VISTAS_CARTERA[vista];
  const ruta = vista === "recuperar" ? "/recuperar" : `/${vista}`;

  const conteos = await contarVista(rubroId, areas, vista);
  const g = grupoElegido(vista, searchParams.grupo, conteos);
  const aqui = `${ruta}?perfil=${slug}&grupo=${g.clave}`;
  const [{ fichas, error }, detenidos, incidencias, semana, historico] = await Promise.all([
    listarGrupo(rubroId, areas, g),
    vista === "recuperar" ? contarDetenidos(rubroId) : Promise.resolve(null),
    vista === "recuperar" && slug === "juridico"
      ? createAdminClient().from("incidences").select("id", { count: "exact", head: true }).eq("status", "abierta").then((r: any) => (r.error ? null : r.count ?? 0))
      : Promise.resolve(null),
    // 20/10: en Conversaciones, la semana más reciente y el historial completo.
    vista === "conversaciones" ? resumenCifras(rubroId, areas).catch(() => null) : Promise.resolve(null),
    vista === "conversaciones" ? getProfileMetrics(rubroId).catch(() => null) : Promise.resolve(null),
  ]);
  const total = conteos[g.clave];
  const cifra = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("es-AR"));
  const completa = g.fuente.tipo === "oportunidades" ? enlaceIndicador(slug, g.fuente.indicador, aqui) : `${slug === "juridico" ? "" : `/panel/${slug}`}/agenda`;

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{def.titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">{def.bajada}</p>
        </div>

        {vista === "conversaciones" ? (
          <section aria-labelledby="conv-semana" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 id="conv-semana" className="text-base font-semibold text-slate-950">Esta semana</h2>
            <p className="text-xs text-slate-500">Desde el lunes</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Mensajes recibidos", semana?.semana.respuestas],
                ["Captados", semana?.semana.captados],
                ["Citas", semana?.semana.citas],
                ["Derivados", semana?.semana.derivados],
              ].map(([l, n]) => (
                <div key={String(l)}>
                  <dt className="text-xs text-slate-600">{l as string}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-slate-950">{cifra(n as number | null | undefined)}</dd>
                </div>
              ))}
            </dl>
            <details className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              <summary className="font-medium text-slate-800">Historial completo</summary>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Oportunidades", historico?.oportunidades],
                  ["Contactados sin respuesta", historico?.contacto.contactado_sin_respuesta],
                  ["Respondieron", historico?.contacto.respondio],
                  ["En conversación", historico?.captacion.en_conversacion],
                  ["Captados", historico?.captacion.captado],
                  ["Derivados", historico?.derivacion.derivado],
                  ["Perdidos", historico?.captacion.perdido],
                  ["Detenidos", historico?.detenidos],
                  ["Mensajes enviados", historico?.mensajes.enviados],
                  ["Mensajes recibidos", historico?.mensajes.recibidos],
                ].map(([l, n]) => (
                  <div key={String(l)}>
                    <dt className="text-xs text-slate-600">{l as string}</dt>
                    <dd className="text-lg font-semibold tabular-nums text-slate-950">{cifra(n as number | null | undefined)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </section>
        ) : null}

        <nav aria-label={`Grupos de ${def.titulo}`}>
          <ul className={`grid grid-cols-2 gap-3 ${def.grupos.length > 4 ? "lg:grid-cols-4 xl:grid-cols-7" : "lg:grid-cols-4"}`}>
            {def.grupos.map((x) => {
              const n = conteos[x.clave];
              const activo = x.clave === g.clave;
              return (
                <li key={x.clave}>
                  <Link
                    href={`${ruta}?perfil=${slug}&grupo=${x.clave}`}
                    aria-current={activo ? "page" : undefined}
                    className={`tarjeta-grupo flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${activo ? "border-transparent ring-2 ring-gold-500" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${PUNTO[x.tono]}`} />
                      {x.titulo}
                    </span>
                    <span className={`mt-2 text-3xl font-semibold tabular-nums ${n ? "text-slate-950" : "text-slate-300"}`}>{n === null ? "—" : n.toLocaleString("es-AR")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={vista === "recuperar" ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" : ""}>
          <section aria-labelledby="grupo-titulo" className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="grupo-titulo" className="text-lg font-semibold text-slate-950">
                  {g.titulo}
                  {total ? <span className="ml-2 text-base font-normal text-slate-400 tabular-nums">{total.toLocaleString("es-AR")}</span> : null}
                </h2>
                <p className="text-sm text-slate-600">{g.detalle}</p>
              </div>
              {(total ?? 0) > fichas.length ? (
                <Link href={completa} className="btn-suave">
                  Ver los {total!.toLocaleString("es-AR")}
                </Link>
              ) : null}
            </div>
            {error ? (
              <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">No se pudo leer este grupo ({error}). No es «cero»: volvé a intentar.</p>
            ) : fichas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <p className="text-base font-semibold text-slate-900">Nada en «{g.titulo}» por ahora</p>
                <p className="mt-1 text-sm text-slate-600">Cuando haya alguien acá, aparece su ficha con el acceso al chat.</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fichas.map((f) => (
                  <Ficha key={f.id} f={f} slug={slug} aqui={aqui} accion={g.accion} />
                ))}
              </ul>
            )}
          </section>

          {vista === "recuperar" ? (
            <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <p className="font-semibold text-slate-900">Quejas y pedidos de no contacto</p>
                <p className="mt-1 text-slate-600">El agente se disculpa y deja de escribir. No son trabajo pendiente.</p>
                <Link href={enlaceIndicador(slug, "detencion_reciente", aqui)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-800 underline underline-offset-2">
                  Ver archivo{detenidos !== null ? ` (${detenidos.toLocaleString("es-AR")})` : ""}
                </Link>
              </div>
              {slug === "juridico" ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                  <p className="font-semibold text-slate-900">Incidencias y controles</p>
                  <p className="mt-1 text-slate-600">Plantillas, archivos, mensajes retenidos y detenciones.</p>
                  <Link href="/revision" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-800 underline underline-offset-2">
                    Abrir{incidencias ? ` (${incidencias.toLocaleString("es-AR")} abiertas)` : ""}
                  </Link>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </MarcoPerfil>
  );
}
