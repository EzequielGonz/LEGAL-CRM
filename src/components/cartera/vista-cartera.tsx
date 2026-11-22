import { perfilActivo } from "@/lib/perfil-activo";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { contarIndicador, indicadorPorClave, rubroIdDe, enlaceIndicador } from "@/lib/indicadores";
import { colasDeHoy } from "@/lib/hoy/colas";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { conVolver } from "@/lib/navegacion";
import { VISTAS_CARTERA, cuandoCorto, enlaceConversacion, grupoElegido, iniciales, type Tono, type VistaCartera } from "@/lib/cartera";
import { AREAS_DE_PERFIL, contarDetenidos, contarVista, listarGrupo, resumenCifras, type FichaCartera } from "@/lib/cartera-servidor";
import { getProfileMetrics } from "@/lib/metrics";
import { nivelDeInteres } from "@/lib/atencion/interes";
import { createAdminClient } from "@/lib/supabase/admin";
import { Anillo, Bento, BentoCelda, Boton, Pastilla, Tarjeta, VerMas } from "@/components/premium";
import { esperaHace } from "@/lib/premium/espera";
import "@/app/chats-campanas.css";

const PUNTO: Record<Tono, string> = {
  caliente: "bg-gold-500",
  ok: "bg-emerald-500",
  alerta: "bg-amber-500",
  info: "bg-slate-400",
};

export function Ficha({ f, slug, aqui, accion, orden = 0, ahoraMs, esperando = false }: { f: FichaCartera; slug: SlugPerfil; aqui: string; accion: "derivar" | "chat" | "ficha"; orden?: number; ahoraMs: number; esperando?: boolean }) {
  const ficha = f.contactId ? conVolver(`/ficha/${f.contactId}`, aqui) : null;
  const chat = f.conversationId ? conVolver(enlaceConversacion(slug, f.conversationId), aqui) : null;
  const chatPrincipal = accion === "chat" && !!chat;
  const principal = chatPrincipal ? chat : ficha ?? chat;
  const nivel = nivelDeInteres(f.interes);
  const espera = esperando ? esperaHace(f.actividad, ahoraMs) : null;
  return (
    <li className="ficha-cartera cc-ficha group" style={{ "--cc-i": Math.min(orden, 8) } as React.CSSProperties}>
      <div className="cc-ficha__fila">
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
      <div className="cc-ficha__espera">
        {espera ? <Pastilla estado={espera.nivel}>Espera {espera.texto}</Pastilla> : null}
        <Pastilla>{f.estado}</Pastilla>
        {nivel ? <Pastilla estado={nivel === "alto" ? "ok" : nivel === "medio" ? "atencion" : "neutro"}>Interés {nivel}</Pastilla> : null}
        {f.cita ? (
          <Pastilla estado="info">
            {cuandoCorto(f.cita.inicio)}
            {f.cita.fase2 ? " · Fase 2" : f.cita.reagendada ? " · reagendada" : ""}
          </Pastilla>
        ) : null}
      </div>
      {f.detalle ? <p className="mt-2 text-[13px] leading-snug text-slate-700 [overflow-wrap:anywhere]">{f.detalle}</p> : null}
      {f.actividad ? <p className="mt-2 text-[13px] text-slate-500">Escribió {cuandoCorto(f.actividad)}</p> : null}
      <div className="cc-ficha__pie">
        {ficha ? (
          <Link prefetch={false} href={ficha} className={`pm-boton ${chatPrincipal ? "pm-boton--secundario" : "pm-boton--primario"}`}>
            {accion === "derivar" ? "Derivar" : "Ficha"}
          </Link>
        ) : null}
        {chat ? (
          <Link prefetch={false} href={chat} className={`pm-boton ${chatPrincipal ? "pm-boton--primario" : "pm-boton--secundario"}`}>
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
  const [{ fichas, error }, detenidos, incidencias, semana, historico, esperaInfo, porDerivar] = await Promise.all([
    listarGrupo(rubroId, areas, g),
    Promise.resolve(null as number | null),
    Promise.resolve(null as number | null),
    // 20/10: en Conversaciones, la semana más reciente y el historial completo.
    vista === "conversaciones" ? resumenCifras(rubroId, areas).catch(() => null) : Promise.resolve(null),
    vista === "conversaciones" || vista === "contactos" ? getProfileMetrics(rubroId).catch(() => null) : Promise.resolve(null),
    // 12/11: en Oportunidades, cuántos esperan una respuesta (se atienden desde Hoy).
    vista === "conversaciones" ? colasDeHoy(rubroId, areas).then((c) => ({ n: c.esperan.length, masVieja: c.esperan[0]?.desde ?? null })).catch(() => ({ n: 0, masVieja: null as string | null })) : Promise.resolve({ n: 0, masVieja: null as string | null }),
    // 12/11: en Cartera, cuántos captados falta derivar (así la cartera vacía dice dónde está la gente).
    vista === "contactos" ? contarIndicador(rubroId, indicadorPorClave("captado_sin_derivar")!).then((r) => r.count ?? 0).catch(() => 0) : Promise.resolve(0),
  ]);
  // 12/11: los grupos sin nadie no ocupan una tarjeta cada uno: van en un renglón.
  const conGente = def.grupos.filter((x) => (conteos[x.clave] ?? 0) > 0 || conteos[x.clave] === null);
  const vacios = def.grupos.filter((x) => conteos[x.clave] === 0);
  const todoVacio = conGente.length === 0;
  const esperan = esperaInfo.n;
  const ahoraMs = Date.now();
  const esperaMax = esperaHace(esperaInfo.masVieja, ahoraMs);
  const totalActivos = def.grupos.reduce((a, x) => a + (conteos[x.clave] ?? 0), 0);
  const total = conteos[g.clave];
  const cifra = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("es-AR"));
  const completa = g.fuente.tipo === "oportunidades" ? enlaceIndicador(slug, g.fuente.indicador, aqui) : `${slug === "juridico" ? "" : `/panel/${slug}`}/agenda`;

  return (
      <div className="cc mx-auto max-w-6xl space-y-6">
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

        {vista === "conversaciones" ? (
          <Bento>
            <BentoCelda columnas={6} columnasMedio={6}>
              <Tarjeta relieve rubro={slug} aparecer={0}>
                <div className="cc-ring">
                  <Anillo valor={esperan} meta={Math.max(totalActivos, esperan, 1)} rubro={slug} tamano="grande" unidad="personas esperando respuesta" nombre="Esperando respuesta" />
                  <div className="cc-ring__texto">
                    <h2 className="cc-ring__titulo">{esperan === 0 ? "Nadie te está esperando" : esperan === 1 ? "Persona esperando respuesta" : "Personas esperando respuesta"}</h2>
                    <p className="cc-ring__detalle">
                      {esperan === 0
                        ? "Todo contestado. Cuando alguien escriba y el bot no le conteste, aparece acá."
                        : esperaMax
                        ? `La que más espera lleva ${esperaMax.texto.replace("hace ", "")}. Escribieron y el bot no les contesta.`
                        : "Escribieron y el bot no les contesta porque el chat lo tiene una persona."}
                    </p>
                    {esperan > 0 ? (
                      <div style={{ marginTop: 12 }}>
                        <Boton href={`/hoy?perfil=${slug}&cola=responder#hoy-cola`} variante="primario">
                          Responder ahora
                        </Boton>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Tarjeta>
            </BentoCelda>
            <BentoCelda columnas={6} columnasMedio={6}>
              <Tarjeta relieve rubro={slug} aparecer={1}>
                <div className="cc-ring--par">
                  {([["captados", "Para cerrar", "personas para cerrar"], ["piden", "Con interés real", "personas con interés real"]] as const).map(([clave, rotulo, unidad], i) => {
                    const n = conteos[clave];
                    if (n === null || n === undefined) return null;
                    return (
                      <div key={clave} className="cc-ring cc-ring--col">
                        <Anillo valor={n} meta={Math.max(totalActivos, n, 1)} rubro={slug} tamano="chico" unidad={unidad} nombre={rotulo} retrasoMs={80 * (i + 1)} />
                        <div className="cc-ring__texto">
                          <h2 className="cc-ring__titulo">{rotulo}</h2>
                          <p className="cc-ring__detalle">{n === 1 ? "1 persona" : `${n.toLocaleString("es-AR")} personas`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Tarjeta>
            </BentoCelda>
          </Bento>
        ) : null}

        {todoVacio ? null : (
          <nav aria-label={`Grupos de ${def.titulo}`} className="cc-grupos">
            <ul className="cc-filtros">
              {conGente.map((x) => {
                const n = conteos[x.clave];
                const activo = x.clave === g.clave;
                return (
                  <li key={x.clave}>
                    <Link prefetch={false} href={`${ruta}?perfil=${slug}&grupo=${x.clave}`} aria-current={activo ? "page" : undefined} className="cc-filtro">
                      <span className="cc-filtro__rotulo">
                        <span aria-hidden="true" className={`cc-filtro__punto cc-filtro__punto--${x.tono}`} />
                        {x.titulo}
                      </span>
                      <span className="cc-filtro__n">{n === null ? "—" : n.toLocaleString("es-AR")}</span>
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
              <ul className="cc-fichas">
                {fichas.map((f, i) => (
                  <Ficha key={f.id} f={f} slug={slug} aqui={aqui} accion={g.accion} orden={i} ahoraMs={ahoraMs} esperando={g.clave === "escribieron" || g.clave === "piden"} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {vista === "conversaciones" ? (
          <VerMas cerrado="Ver cómo viene la semana" abierto="Ocultar la semana">
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
          </VerMas>
        ) : null}

      </div>
  );
}
