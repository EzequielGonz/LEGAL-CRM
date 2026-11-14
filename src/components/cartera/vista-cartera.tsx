import { perfilActivo } from "@/lib/perfil-activo";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Icono } from "@/components/ui/icono-seccion";
import { contarIndicador, indicadorPorClave, rubroIdDe, enlaceIndicador } from "@/lib/indicadores";
import { colasDeHoy } from "@/lib/hoy/colas";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { conVolver } from "@/lib/navegacion";
import { VISTAS_CARTERA, cuandoCorto, enlaceConversacion, grupoElegido, iniciales, type Tono, type VistaCartera } from "@/lib/cartera";
import { AREAS_DE_PERFIL, contarDetenidos, contarVista, listarGrupo, resumenCifras, type FichaCartera } from "@/lib/cartera-servidor";
import { getProfileMetrics } from "@/lib/metrics";
import { nivelDeInteres } from "@/lib/atencion/interes";
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
  const principal = chatPrincipal ? chat : ficha ?? chat;
  const nivel = nivelDeInteres(f.interes);
  return (
    <li className="ficha-cartera group relative flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition focus-within:border-slate-400 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="avatar-ficha grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
          {iniciales(f.nombre)}
        </span>
        <div className="min-w-0 flex-1">
          {/* 13/11: toda la tarjeta abre a la persona (antes solo los botones de abajo). */}
          {principal ? (
            <Link prefetch={false} href={principal} className="block truncate text-sm font-semibold text-slate-950 outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-slate-900">
              {f.nombre}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-slate-950">{f.nombre}</p>
          )}
          <p className="truncate text-[13px] tabular-nums text-slate-500">{f.telefono ? `+${f.telefono.replace(/^\+/, "")}` : "Sin teléfono"}</p>
        </div>
        {f.area === "penal" ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[13px] font-medium text-slate-600">Penal</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[13px]">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{f.estado}</span>
        {nivel ? (
          <span className={nivel === "alto" ? "rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-900" : nivel === "medio" ? "rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900" : "rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600"}>
            Interés {nivel}
          </span>
        ) : null}
        {f.cita ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-1 font-semibold text-gold-800">
            <Icono nombre="agenda" className="h-3.5 w-3.5" />
            {cuandoCorto(f.cita.inicio)}
            {f.cita.fase2 ? " · Fase 2" : f.cita.reagendada ? " · reagendada" : ""}
          </span>
        ) : null}
      </div>
      {f.detalle ? <p className="mt-2 text-[13px] leading-snug text-slate-700 [overflow-wrap:anywhere]">{f.detalle}</p> : null}
      {f.actividad ? <p className="mt-2 text-[13px] text-slate-500">Escribió {cuandoCorto(f.actividad)}</p> : null}
      <div className="relative z-10 mt-auto flex gap-2 pt-3">
        {ficha ? (
          <Link prefetch={false} href={ficha} className={chatPrincipal ? "btn-suave-sm flex-1 justify-center" : "btn-gold-sm flex-1 justify-center"}>
            {accion === "derivar" ? "Derivar" : "Ficha"}
          </Link>
        ) : null}
        {chat ? (
          <Link prefetch={false} href={chat} className={chatPrincipal ? "btn-gold-sm flex-1 justify-center" : "btn-suave-sm flex-1 justify-center"}>
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
  const perfil = await perfilActivo(searchParams.perfil);
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  return (
    <MarcoPerfil slug={slug}>
      {/* 13/11: el marco se pinta enseguida; la lista llega apenas está. */}
      <Suspense
        fallback={
          <div role="status" aria-label="Cargando" className="mx-auto max-w-6xl space-y-6">
            <h1 className="text-2xl font-semibold text-slate-950">{VISTAS_CARTERA[vista].titulo}</h1>
            <div className="flex flex-wrap gap-2">
              {[32, 40, 36, 28].map((w, i) => (
                <span key={i} className="h-10 animate-pulse rounded-full bg-slate-200/70" style={{ width: `${w * 4}px` }} />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60" />
          </div>
        }
      >
        <CuerpoCartera vista={vista} slug={slug} rubroId={rubroId} searchParams={searchParams} />
      </Suspense>
    </MarcoPerfil>
  );
}

async function CuerpoCartera({ vista, slug, rubroId, searchParams }: { vista: VistaCartera; slug: SlugPerfil; rubroId: string; searchParams: { perfil?: string; grupo?: string } }) {
  const areas = AREAS_DE_PERFIL[slug];
  const def = VISTAS_CARTERA[vista];
  const ruta = `/${vista}`;

  const conteos = await contarVista(rubroId, areas, vista);
  const g = grupoElegido(vista, searchParams.grupo, conteos);
  const aqui = `${ruta}?perfil=${slug}&grupo=${g.clave}`;
  const [{ fichas, error }, detenidos, incidencias, semana, historico, esperan, porDerivar] = await Promise.all([
    listarGrupo(rubroId, areas, g),
    Promise.resolve(null as number | null),
    Promise.resolve(null as number | null),
    // 20/10: en Conversaciones, la semana más reciente y el historial completo.
    vista === "conversaciones" ? resumenCifras(rubroId, areas).catch(() => null) : Promise.resolve(null),
    vista === "conversaciones" || vista === "contactos" ? getProfileMetrics(rubroId).catch(() => null) : Promise.resolve(null),
    // 12/11: en Oportunidades, cuántos esperan una respuesta (se atienden desde Hoy).
    vista === "conversaciones" ? colasDeHoy(rubroId, areas).then((c) => c.esperan.length).catch(() => 0) : Promise.resolve(0),
    // 12/11: en Cartera, cuántos captados falta derivar (así la cartera vacía dice dónde está la gente).
    vista === "contactos" ? contarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!).then((r) => r.count ?? 0).catch(() => 0) : Promise.resolve(0),
  ]);
  // 12/11: los grupos sin nadie no ocupan una tarjeta cada uno: van en un renglón.
  const conGente = def.grupos.filter((x) => (conteos[x.clave] ?? 0) > 0 || conteos[x.clave] === null);
  const vacios = def.grupos.filter((x) => conteos[x.clave] === 0);
  const todoVacio = conGente.length === 0;
  const columnas = conGente.length >= 4 ? "lg:grid-cols-4" : conGente.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  const total = conteos[g.clave];
  const cifra = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("es-AR"));
  const completa = g.fuente.tipo === "oportunidades" ? enlaceIndicador(slug, g.fuente.indicador, aqui) : `${slug === "juridico" ? "" : `/panel/${slug}`}/agenda`;

  return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{def.titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">{def.bajada}</p>
          {vista === "descartados" ? (
            <p className="mt-2 text-sm text-slate-700">
              El 13/11 se reubicó a cada persona según lo que dice su chat.{" "}
              <Link prefetch={false} href={`/limpieza?perfil=${slug}`} className="font-medium text-slate-900 underline underline-offset-2">
                Ver los movidos en la limpieza
              </Link>
            </p>
          ) : null}
        </div>

        {vista === "contactos" && historico ? (
          <section aria-labelledby="etapas-embudo" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 id="etapas-embudo" className="text-base font-semibold text-slate-950">
              El recorrido de {cifra(historico.oportunidades)} personas
            </h2>
            <p className="text-[13px] text-slate-600">De la base fría al cliente. Tocá una etapa para ver quiénes están ahí.</p>
            <ol className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["Sin contactar", historico.contacto.sin_contactar, "sin_contactar", "todavía no se les escribió"],
                  ["Sin respuesta", historico.contacto.contactado_sin_respuesta, "contactado_sin_respuesta", "se les escribió y no contestaron"],
                  ["Respondieron", historico.contacto.respondio, "respondio", "contestaron al menos una vez"],
                  ["En conversación", historico.captacion.en_conversacion, "hablando_ahora", "charla en curso"],
                  ["Captados", historico.captacion.captado, "captado", "aceptaron el siguiente paso"],
                  ["Derivados", historico.derivacion.derivado, "derivado", "pasados a quien los atiende"],
                ] as [string, number | null | undefined, string, string][]
              ).map(([titulo, n, clave, nota], k) => (
                <li key={clave} className="bg-white">
                  <Link prefetch={false} href={enlaceIndicador(slug, clave, aqui)} className="flex h-full flex-col p-4 hover:bg-slate-50">
                    <span className="text-[13px] font-medium text-slate-600">
                      {k + 1}. {titulo}
                    </span>
                    <span className={`mt-1 text-2xl font-semibold tabular-nums ${n ? "text-slate-950" : "text-slate-400"}`}>{cifra(n)}</span>
                    <span className="mt-1 text-[13px] text-slate-500">{nota}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {vista === "conversaciones" && esperan > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-base font-semibold text-slate-950">
                {esperan} {esperan === 1 ? "persona espera" : "personas esperan"} tu respuesta
              </p>
              <p className="text-sm text-slate-700">Escribieron y el bot no les contesta porque el chat lo tiene una persona.</p>
            </div>
            <Link prefetch={false} href={`/hoy?perfil=${slug}&cola=responder#hoy-cola`} className="btn-gold-sm">
              Responder desde Hoy
            </Link>
          </div>
        ) : null}

        {todoVacio ? null : (
          <nav aria-label={`Grupos de ${def.titulo}`}>
            <ul className={`grid grid-cols-2 gap-3 ${columnas}`}>
              {conGente.map((x) => {
                const n = conteos[x.clave];
                const activo = x.clave === g.clave;
                return (
                  <li key={x.clave}>
                    <Link prefetch={false}
                      href={`${ruta}?perfil=${slug}&grupo=${x.clave}`}
                      aria-current={activo ? "page" : undefined}
                      className={`tarjeta-grupo flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${activo ? "border-transparent ring-2 ring-gold-500" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                    >
                      <span className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${PUNTO[x.tono]}`} />
                        {x.titulo}
                      </span>
                      <span className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{n === null ? "—" : n.toLocaleString("es-AR")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {vacios.length > 0 ? (
              <p className="mt-3 text-[13px] text-slate-600">
                Sin nadie por ahora:{" "}
                {vacios.map((x, i) => (
                  <span key={x.clave}>
                    {i > 0 ? " · " : ""}
                    <Link prefetch={false} href={`${ruta}?perfil=${slug}&grupo=${x.clave}`} className="underline underline-offset-2 hover:text-slate-900">
                      {x.titulo}
                    </Link>
                  </span>
                ))}
                .
              </p>
            ) : null}
          </nav>
        )}

        {todoVacio ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-lg font-semibold text-slate-950">{vista === "contactos" ? "Todavía no derivaste a nadie" : `Nada en «${def.titulo}» por ahora`}</p>
            <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
              {vista === "contactos"
                ? "Debajo del recorrido aparecen tus clientes derivados, sus citas y sus seguimientos."
                : vista === "conversaciones"
                ? "Cuando alguien acepte el siguiente paso, agende o esté conversando, aparece acá."
                : vista === "descartados"
                ? "Cuando alguien se pierda o pida que no le escriban, queda acá."
                : "Cuando una charla se caiga y se pueda retomar, aparece acá."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {vista === "contactos" && porDerivar > 0 ? (
                <Link prefetch={false} href={`/hoy?perfil=${slug}&cola=derivar#hoy-cola`} className="btn-gold-sm">
                  Derivar a los {porDerivar} captados
                </Link>
              ) : null}
              {vista === "contactos" ? (
                <Link prefetch={false} href={`/prospectos-por-base?perfil=${slug}`} className="btn-suave-sm">
                  Ver los prospectos por base
                </Link>
              ) : (
                <Link prefetch={false} href={`/hoy?perfil=${slug}`} className="btn-suave-sm">
                  Ir a Hoy
                </Link>
              )}
            </div>
          </div>
        ) : null}

        <div className={todoVacio ? "hidden" : ""}>
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
                <Link prefetch={false} href={completa} className="btn-suave">
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
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {fichas.map((f) => (
                  <Ficha key={f.id} f={f} slug={slug} aqui={aqui} accion={g.accion} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {vista === "conversaciones" ? (
          <section aria-labelledby="conv-semana" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* 12/11: las cifras van después del trabajo, no antes. */}
            <h2 id="conv-semana" className="text-base font-semibold text-slate-950">Esta semana</h2>
            <p className="text-xs text-slate-500">Desde el lunes</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Personas que escribieron", semana?.semana.respuestas],
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

      </div>
  );
}
