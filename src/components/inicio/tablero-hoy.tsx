import { enlaceIndicador, indicadorPorClave, listarIndicador } from "@/lib/indicadores";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GRUPOS_PERSONAS, motivoLegible, resumenPersonas, type GrupoPersonas } from "@/lib/estadisticas-personas";
import { consultarEstadosLineas } from "@/lib/whatsapp/estado-linea";
import { cuandoCorto, enlaceConversacion, iniciales } from "@/lib/cartera";
import { conVolver } from "@/lib/navegacion";
import type { SlugPerfil } from "@/lib/marca";
import { colasDeHoy, unificarCola, type EntradaCola, type ItemCola } from "@/lib/hoy/colas";
import { CerrarDescartes } from "@/components/inicio/cerrar-descartes";
import { estadoDeCampana } from "@/lib/definiciones/campanas";
import { getCampaignMetrics } from "@/lib/campaign-metrics";
import { contarFallidos24h } from "@/lib/salud/fallas";
import { motivosDeParo } from "@/lib/definiciones/parado";
import { getAutomationPause } from "@/lib/automation-pause";
import { Bento, ChipEstado, Kicker, Luz, Vacio, estadoDeTono } from "@/components/ui/diseno";
import { HoyBento } from "@/components/inicio/hoy-bento";
import { cifrasDePeriodo, rangoDePeriodo } from "@/lib/hoy/periodos";
import { filasParaDecidir, franjaDeEstado, frasesDeHoy, metaDelAnillo } from "@/lib/hoy/resumen-hoy";
import { saludResumida } from "@/components/salud/barra-salud";
import { resumenSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";

/**
 * Tablero de «Hoy» (24/10, boceto v3 aprobado; 22/11 sin chip del bot ni «También hoy»): estado de la línea y la
 * campaña en chips; las dos colas de trabajo; y la lista
 * del grupo elegido (por defecto, «Por cerrar»), con acceso directo al chat.
 * Solo lectura.
 */
function FilaTrabajo({ f, slug, aqui, modo }: { f: ItemCola; slug: SlugPerfil; aqui: string; modo: "atender" | "captado" }) {
  const chat = f.conversationId ? conVolver(enlaceConversacion(slug, f.conversationId), aqui) : null;
  const ficha = f.contactId ? conVolver(`/ficha/${f.contactId}`, aqui) : null;
  const escribio = modo === "captado" && f.accion === "responder";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
      <span aria-hidden="true" className="avatar-ficha grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold">
        {iniciales(f.nombre)}
      </span>
      <div className="min-w-[55%] flex-1 sm:min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-950">
          <span className="truncate">{f.nombre ?? "Sin nombre"}</span>
          {escribio && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[13px] font-medium text-amber-900">Te escribió</span>}
          {f.etiqueta && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[13px] font-medium text-slate-700">{f.etiqueta}</span>}
        </p>
        <p className="mt-0.5 text-[13px] text-slate-600 sm:truncate">
          {f.at ? cuandoCorto(f.at) : ""}
          {f.detalle ? `${f.at ? " · " : ""}${f.detalle}` : ""}
        </p>
      </div>
      <div className="flex w-full shrink-0 gap-2 pl-12 sm:w-auto sm:pl-0 [&>a]:flex-1 [&>a]:justify-center sm:[&>a]:flex-none">
        {modo === "atender" ? (
          <>
            {chat && <Link prefetch={false} href={chat} className="btn-gold-sm">Responder</Link>}
            {ficha && <Link prefetch={false} href={ficha} className="btn-suave-sm">Ficha</Link>}
          </>
        ) : (
          <>
            {ficha && <Link prefetch={false} href={ficha} className="btn-gold-sm">Derivar</Link>}
            {chat && <Link prefetch={false} href={chat} className="btn-suave-sm">{escribio ? "Responder" : "Chat"}</Link>}
          </>
        )}
      </div>
    </li>
  );
}

/** Cuántas personas de la cola se muestran sin pedir «ver todas». */
const VISIBLES_EN_COLA = 12;

export interface EnMarcha {
  titulo: string;
  n: number | null | undefined;
  detalle: string;
  href: string;
}

/** Algo que el bot lleva adelante solo: «7 en charla con el bot», «127 de 192 enviados de …». */
export interface DatoDelBot {
  texto: string;
  n: number | null | undefined;
  de?: number | null;
  href: string;
}

export async function TableroHoy({
  slug,
  rubroId,
  areas,
  grupo,
  captados = [],
  delBot = [],
  filtroCola,
  verTodo = false,
  saludo,
  totalCaptados = null,
  esperanDeMas = 0,
  cifrasSinLeer = 0,
}: {
  slug: SlugPerfil;
  rubroId: string;
  areas: string[];
  grupo?: string;
  /** Captados que falta derivar (los trae la página, con su cita si tienen). */
  captados?: EntradaCola[];
  delBot?: DatoDelBot[];
  filtroCola?: string;
  verTodo?: boolean;
  /** «Buen día», «Buenas tardes» o «Buenas noches» (sin nombre). Lo calcula la página con la hora argentina. */
  saludo: string;
  /** Captados sin derivar, contados completos (la lista solo trae los primeros). */
  totalCaptados?: number | null;
  /** De esos, cuántos esperan el llamado hace más de 24 horas. */
  esperanDeMas?: number;
  /** Cifras de la pantalla que no se pudieron leer. */
  cifrasSinLeer?: number;
}) {
  const s = createAdminClient();
  const aqui = `/hoy?perfil=${slug}`;
  const baseCampanas = slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`;

  const semana = rangoDePeriodo("semana", new Date());
  const [reales, posibles, colas, { data: lineasWa }, personas, { data: lineas }, { data: camps }, cifrasSemana, saludItems] = await Promise.all([
    // 13/11: «Oportunidades reales» (ordenadas por interés) y «Posible captación a revisar», con la misma definición que en Chats.
    listarIndicador(rubroId, indicadorPorClave("piden_persona")!).catch(() => ({ filas: [] as any[] })),
    listarIndicador(rubroId, indicadorPorClave("posible_captacion")!).catch(() => ({ filas: [] as any[] })),
    colasDeHoy(rubroId, areas).catch(() => ({ esperan: [], descartes: [], captadosSinDerivar: null })),
    (s.from("wasender_lineas" as any) as any).select("id, nombre, estado, habilitada").eq("rubro_id", rubroId).is("archivada_at", null),
    resumenPersonas(rubroId, areas),
    s.from("profile_lines").select("label, credential_key, active").eq("rubro_id", rubroId).eq("active", true),
    s
      .from("campaigns")
      .select("id, name, status, pause_reason, proveedor, wasender_line_id" as any)
      .in("area", areas)
      .is("archived_at", null)
      .in("status", ["en_curso", "pausada"])
      .order("created_at", { ascending: false })
      .limit(5),
    // 22/11: los tres anillos chicos usan las mismas cuentas que Resultados (semana desde el lunes).
    cifrasDePeriodo(rubroId, areas, semana.desde, semana.hasta).catch(() => null),
    // 22/11: la franja de estado resume lo que hoy dicen las barras de salud (cacheado un minuto).
    saludResumida().then((x) => itemsDelPerfil(x, slug)).catch(() => null),
  ]);

  const lineasActivas = ((lineas ?? []) as any[]).filter((l) => l.credential_key);
  const estados = lineasActivas.length ? await consultarEstadosLineas(lineasActivas.map((l) => l.credential_key), { memoria: true }).catch(() => ({} as Record<string, any>)) : {};
  const linea = lineasActivas[0];
  const informe = linea ? (estados as any)[linea.credential_key] : null;
  const chipLinea = !linea
    ? { tono: "rojo", texto: "Sin línea de WhatsApp" }
    : !informe
    ? { tono: "gris", texto: `Línea ${linea.label} · sin comprobar` }
    : informe.ok
    ? { tono: informe.calidad === "baja" ? "rojo" : informe.calidad === "media" ? "amarillo" : "verde", texto: `Línea ${linea.label} · calidad ${informe.calidad ?? "sin calificar"}` }
    : { tono: "rojo", texto: `Línea ${linea.label} · ${String(informe.etiqueta ?? "con problema").toLowerCase()}` };

  const lista = (camps ?? []) as any[];
  const camp = lista.find((c) => c.status === "en_curso") ?? lista[0] ?? null;
  // 12/11: una campaña «en curso» por una línea de Wasender que no puede enviar no está enviando.
  const lineasWasender = (lineasWa ?? []) as { id: string; nombre: string; estado: string | null; habilitada: boolean }[];
  const lineaDeCamp = camp?.proveedor === "wasender" ? lineasWasender.find((l) => l.id === camp.wasender_line_id) ?? null : null;
  const campFrenada = camp?.status === "en_curso" && camp?.proveedor === "wasender" && (!lineaDeCamp || lineaDeCamp.estado !== "connected" || !lineaDeCamp.habilitada);
  // 22/11: el estado sale de la definición única (avance real y fallidos de 24 h, los mismos que ve Salud).
  const [metricasCamp, fallidos24h] = camp ? await Promise.all([getCampaignMetrics(camp.id).catch(() => null), contarFallidos24h(areas).catch(() => 0)]) : [null, 0];
  const estadoCamp = camp
    ? estadoDeCampana({
        status: camp.status,
        pauseReason: camp.pause_reason,
        nombre: camp.name,
        frenadaPorLinea: campFrenada,
        prospectos: metricasCamp?.prospectos ?? 0,
        enviados: metricasCamp?.enviados ?? 0,
        fallidos: metricasCamp?.fallidos ?? 0,
        fallidos24h,
      })
    : null;
  const chipCampana = !camp || !estadoCamp ? { tono: "gris", texto: "Ninguna campaña activa", href: baseCampanas } : { tono: estadoCamp.tono, texto: estadoCamp.texto, href: `${baseCampanas}/${camp.id}` };

  // 22/11: por qué está parado el perfil (pausa, líneas, calidad, campañas pausadas, agente), con palabras y no con nombres internos.
  const pausaGeneral = await getAutomationPause().catch(() => ({ aiRepliesPaused: false, outboundPaused: false }) as any);
  const { data: agentesDelPerfil } = await s.from("ai_agents").select("area, active").in("area", areas);
  const motivosParo = motivosDeParo({
    pausaGeneral: { ia: !!pausaGeneral.aiRepliesPaused, envios: !!pausaGeneral.outboundPaused },
    lineasMeta: lineasActivas.map((l) => {
      const inf = (estados as any)[l.credential_key];
      return { nombre: l.label, estado: inf?.estado ?? null, ok: inf ? !!inf.ok : true, etiqueta: inf?.etiqueta ?? null, calidad: inf?.calidad ?? null };
    }),
    lineasWasender: lineasWasender.map((l) => ({ nombre: l.nombre, estado: l.estado, habilitada: l.habilitada })),
    campanas: lista.map((c) => ({ nombre: c.name, status: c.status, pauseReason: c.pause_reason })),
    agenteActivo: ((agentesDelPerfil ?? []) as any[]).some((a) => a.active),
  });

  const baseWasender = `/wasender?perfil=${slug}`;
  const chipsWasender = lineasWasender.map((l) => ({
    tono: l.estado === "connected" ? (l.habilitada ? "verde" : "amarillo") : "rojo",
    texto: `Wasender ${l.nombre} · ${l.estado === "connected" ? (l.habilitada ? "conectada" : "conectada, envíos apagados") : "desconectada: hay que escanear el QR"}`,
    href: baseWasender,
  }));

  // 12/11 (reorganización): «Por cerrar» ya no es una lista aparte; entra en la cola única.
  const elegido = (GRUPOS_PERSONAS.find((g) => g.clave === grupo && g.clave !== "por_cerrar" && g.clave !== "no_interesado")?.clave ?? null) as GrupoPersonas | null;
  const filas = elegido ? personas.listas[elegido] ?? [] : [];
  const infoGrupo = elegido ? GRUPOS_PERSONAS.find((g) => g.clave === elegido)! : null;

  // 12/11 (pedido de la responsable): atención humana y captados van separados, y los
  // descartes (ya tiene abogado, lo resolvió, no le interesa) no se muestran como trabajo.
  const descartadas = new Set(colas.descartes.map((d) => d.conversationId));
  const cola = unificarCola({
    esperan: colas.esperan.map((f) => ({ contactId: f.contactId, conversationId: f.conversationId, nombre: f.nombre, detalle: f.texto ? `«${f.texto}»` : null, at: f.desde })),
    porCerrar: [
      ...((posibles.filas ?? []) as any[]).map((o) => ({ contactId: o.contact_id ?? null, conversationId: o.conversation_id ?? null, nombre: o.contacts?.full_name ?? null, detalle: o.posible_captacion_reason ?? "El bot no está seguro de que haya concretado la llamada", etiqueta: "Posible captación a revisar", at: o.last_inbound_at ?? o.updated_at ?? null })),
      ...((reales.filas ?? []) as any[])
        .filter((o) => !(o.conversation_id && descartadas.has(o.conversation_id)))
        .map((o) => ({ contactId: o.contact_id ?? null, conversationId: o.conversation_id ?? null, nombre: o.contacts?.full_name ?? null, detalle: o.interest_reason ?? motivoLegible(o.attention_reason), etiqueta: "Oportunidad real", at: o.last_inbound_at ?? o.updated_at ?? null })),
    ],
    captados,
  });
  const clavesCaptados = new Set(captados.map((c) => (c.contactId ? `c:${c.contactId}` : `v:${c.conversationId}`)));
  const paraDerivar = cola.filter((i) => clavesCaptados.has(i.clave));
  const atender = cola.filter((i) => !clavesCaptados.has(i.clave));
  const porMotivo = new Map<string, number>();
  for (const d of colas.descartes) porMotivo.set(d.descarte.etiqueta, (porMotivo.get(d.descarte.etiqueta) ?? 0) + 1);
  const resumenDescartes = [...porMotivo.entries()].map(([t, n]) => `${n} ${t.toLowerCase()}`).join(", ");
  // 22/11 (orden del 19/11): sin el chip del bot ni el bloque «También hoy».
  const bot = delBot.filter((d) => d.n !== null && d.n !== undefined && (d.n > 0 || d.de != null));

  const detalle = (
    <div className="tablero-hoy space-y-4">
      <h2 id="hoy-tablero" className="sr-only">
        Detalle de hoy
      </h2>
      <ul className="d-revelar flex flex-wrap gap-2" aria-label="Estado de la línea y la campaña">
        <Chip tono={chipLinea.tono} texto={chipLinea.texto} />
        {/* 22/11: la luz late solo mientras la campaña está enviando de verdad. */}
        <Chip tono={chipCampana.tono} texto={chipCampana.texto} href={chipCampana.href} late={camp?.status === "en_curso" && !campFrenada} />
        {chipsWasender.map((c) => (
          <Chip key={c.texto} tono={c.tono} texto={c.texto} href={c.href} />
        ))}
      </ul>
      {motivosParo.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Por qué este perfil no está enviando o contestando">
          {motivosParo.map((m) => (
            <Chip key={m.texto} tono={m.tono} texto={m.texto} />
          ))}
        </ul>
      ) : null}

      {/* 1) Dos listas separadas: a quién hay que contestarle y a quién hay que derivar. Nadie se repite. */}
      <Bento className="scroll-mt-24 !items-start" revelar>
        <ColaHoy
          id="hoy-cola"
          titulo="Atención humana"
          kicker="Respondé vos"
          bajada="Escribieron y el bot no les contesta: respondeles vos."
          estado={atender.length ? "aviso" : "ok"}
          filas={verTodo ? atender : atender.slice(0, VISIBLES_EN_COLA)}
          total={atender.length}
          vacio="Nadie espera una respuesta tuya."
          verTodos={!verTodo && atender.length > VISIBLES_EN_COLA ? `${aqui}&todo=1#hoy-cola` : null}
          slug={slug}
          aqui={aqui}
          modo="atender"
        />
        <ColaHoy
          id="hoy-captados"
          titulo="Captados para derivar"
          kicker="Pasalos"
          bajada="Ya aceptaron el siguiente paso: pasalos a quien los atiende."
          estado={paraDerivar.length ? "ok" : "apagado"}
          filas={verTodo ? paraDerivar : paraDerivar.slice(0, VISIBLES_EN_COLA)}
          total={paraDerivar.length}
          vacio="Nadie pendiente de derivar."
          verTodos={!verTodo && paraDerivar.length > VISIBLES_EN_COLA ? `${aqui}&todo=1#hoy-cola` : null}
          slug={slug}
          aqui={aqui}
          modo="captado"
        />
      </Bento>

      {/* Descartes: se reconocen y no se mezclan con el trabajo. */}
      {colas.descartes.length > 0 && (
        <div className="d-tarjeta flex-row flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">
              {colas.descartes.length} {colas.descartes.length === 1 ? "respondió" : "respondieron"} que no {colas.descartes.length === 1 ? "sigue" : "siguen"}
            </span>{" "}
            ({resumenDescartes}). No {colas.descartes.length === 1 ? "aparece" : "aparecen"} arriba.
          </p>
          <CerrarDescartes perfil={slug} cantidad={colas.descartes.length} />
        </div>
      )}

      {elegido && (
        <div id="hoy-lista" className="d-tarjeta d-tarjeta--sin-relleno scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-950">
              {infoGrupo!.titulo} <span className="ml-1 tabular-nums text-slate-500">{personas.conteos[elegido] ?? "—"}</span>
            </p>
            <Link prefetch={false} href={`${aqui}#hoy-cola`} className="text-[13px] font-medium text-slate-700 underline underline-offset-2">
              Cerrar la lista
            </Link>
          </div>
          {filas.length === 0 ? (
            <Vacio titulo="Nada en este grupo por ahora" texto="Cuando alguien entre en este grupo, aparece acá." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filas.map((f, i) => (
                <li key={`${f.conversationId ?? f.contactId ?? i}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <span aria-hidden="true" className="avatar-ficha grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold">
                    {iniciales(f.nombre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{f.nombre ?? "Sin nombre"}</p>
                    <p className="truncate text-[13px] text-slate-500">
                      {motivoLegible(f.motivo)}
                      {f.at ? ` · ${cuandoCorto(f.at)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {f.conversationId && (
                      <Link prefetch={false} href={conVolver(enlaceConversacion(slug, f.conversationId), aqui)} className="btn-gold-sm">
                        Abrir chat
                      </Link>
                    )}
                    {f.contactId && (
                      <Link prefetch={false} href={conVolver(`/ficha/${f.contactId}`, aqui)} className="btn-suave-sm">
                        Ficha
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 3) Lo que el bot lleva adelante solo: una línea, cada dato abre su lista. */}
      {bot.length > 0 && (
        <div className="d-tarjeta">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Luz estado="ok" late />
            Qué está haciendo el bot
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
            {bot.map((d) => (
              <li key={d.texto} className="min-w-0">
                <Link prefetch={false} href={d.href} className="tactil inline-flex max-w-full items-baseline gap-1.5 underline-offset-2 hover:underline">
                  <span className="font-semibold tabular-nums text-slate-950">
                    {(d.n ?? 0).toLocaleString("es-AR")}
                    {d.de != null ? ` de ${d.de.toLocaleString("es-AR")}` : ""}
                  </span>
                  <span className="truncate">{d.texto}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // ---- 22/11: la pantalla principal (bento) con los mismos datos de arriba; el detalle queda en «Ver más».
  const porDerivar = totalCaptados ?? paraDerivar.length;
  const conteos = { esperan: atender.length, porDerivar, esperanDeMas, posibles: ((posibles.filas ?? []) as any[]).length };
  const salud = saludItems ? resumenSalud(saludItems) : null;
  const primero = saludItems && salud && salud.rojo > 0 ? lecturaSimple(saludItems.filter((i) => i.estado === "rojo")[0]).que : saludItems && salud && salud.amarillo > 0 ? lecturaSimple(saludItems.filter((i) => i.estado === "amarillo")[0]).que : null;
  const franja = franjaDeEstado({
    rojos: salud?.rojo ?? 0,
    amarillos: salud?.amarillo ?? 0,
    primero,
    hrefSalud: `/salud?perfil=${encodeURIComponent(slug)}`,
    lineas: [{ tono: chipLinea.tono as any, texto: chipLinea.texto }, ...chipsWasender.map((c) => ({ tono: c.tono as any, texto: c.texto, href: c.href })), ...motivosParo.map((m) => ({ tono: m.tono as any, texto: m.texto }))],
    cifrasSinLeer,
  });
  const decidir = filasParaDecidir({
    ...conteos,
    hrefResponder: `${aqui}&todo=1#hoy-cola`,
    hrefDerivar: `${aqui}&todo=1#hoy-captados`,
    hrefPosibles: enlaceIndicador(slug, "posible_captacion", aqui),
    campana: camp ? { texto: chipCampana.texto, href: chipCampana.href ?? baseCampanas, tono: chipCampana.tono as any } : null,
  });
  return (
    <HoyBento
      d={{
        slug,
        saludo,
        frases: frasesDeHoy(conteos),
        porDerivar,
        derivadosSemana: cifrasSemana?.derivados ?? null,
        semana: { contactados: cifrasSemana?.contactados ?? null, escribieron: cifrasSemana?.respondieron ?? null, captados: cifrasSemana?.captados ?? null, derivados: cifrasSemana?.derivados ?? null },
        metaAnillo: metaDelAnillo(porDerivar, cifrasSemana?.derivados ?? null),
        decidir,
        franja,
        detalle,
        verMasAbierto: verTodo || !!elegido,
      }}
    />
  );
}

function Chip({ tono, texto, href, late = false }: { tono: string; texto: string; href?: string; late?: boolean }) {
  return (
    <li className="max-w-full">
      <ChipEstado estado={estadoDeTono(tono)} texto={texto} href={href} late={late} />
    </li>
  );
}

/** Una de las dos listas de trabajo de Hoy, en su tarjeta del bento. */
function ColaHoy({
  id,
  titulo,
  kicker,
  bajada,
  estado,
  filas,
  total,
  vacio,
  verTodos,
  slug,
  aqui,
  modo,
}: {
  id?: string;
  titulo: string;
  kicker: string;
  bajada: string;
  estado: "ok" | "aviso" | "apagado";
  filas: ItemCola[];
  total: number;
  vacio: string;
  verTodos: string | null;
  slug: SlugPerfil;
  aqui: string;
  modo: "atender" | "captado";
}) {
  return (
    <section id={id} aria-label={titulo} className="d-tarjeta d-tarjeta--sin-relleno d-b-4 scroll-mt-24" data-estado={estado}>
      <header>
        <div className="min-w-0">
          <Kicker>{kicker}</Kicker>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-950">
            <Luz estado={estado} late={estado === "aviso"} />
            {titulo}
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-600">{bajada}</p>
        </div>
        {/* Accesibilidad: `aria-label` en un <p> no se anuncia; la cifra que cuenta queda oculta al lector y se lee la frase. */}
        <p className="d-stat__valor d-stat__valor--chico" data-contar="" aria-hidden="true">
          {total.toLocaleString("es-AR")}
        </p>
        <span className="sr-only">{total === 1 ? "1 persona en la lista" : `${total.toLocaleString("es-AR")} personas en la lista`}</span>
      </header>
      {filas.length === 0 ? (
        <Vacio titulo={vacio} texto="Cuando haya alguien, aparece acá." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {filas.map((f) => (
            <FilaTrabajo key={f.clave} f={f} slug={slug} aqui={aqui} modo={modo} />
          ))}
        </ul>
      )}
      {verTodos && (
        <p className="border-t border-slate-100 px-5 py-3 text-sm">
          <Link prefetch={false} href={verTodos} className="tactil inline-flex items-center font-medium text-slate-800 underline underline-offset-2">
            Ver las {total.toLocaleString("es-AR")} personas
          </Link>
        </p>
      )}
    </section>
  );
}
