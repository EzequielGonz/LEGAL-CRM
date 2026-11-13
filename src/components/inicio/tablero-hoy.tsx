import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GRUPOS_PERSONAS, motivoLegible, resumenPersonas, type GrupoPersonas } from "@/lib/estadisticas-personas";
import { consultarEstadosLineas } from "@/lib/whatsapp/estado-linea";
import { getProfileMetrics } from "@/lib/metrics";
import { puntajeBot } from "@/lib/agentes/puntaje";
import { cuandoCorto, enlaceConversacion, iniciales } from "@/lib/cartera";
import { conVolver } from "@/lib/navegacion";
import type { SlugPerfil } from "@/lib/marca";
import { colasDeHoy, unificarCola, type EntradaCola, type ItemCola } from "@/lib/hoy/colas";
import { CerrarDescartes } from "@/components/inicio/cerrar-descartes";

/**
 * Tablero de «Hoy» (24/10, boceto v3 aprobado): estado de la línea, la
 * campaña y el bot en tres chips; las cinco cifras por personas; y la lista
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
            {chat && <Link href={chat} className="btn-gold-sm">Responder</Link>}
            {ficha && <Link href={ficha} className="btn-suave-sm">Ficha</Link>}
          </>
        ) : (
          <>
            {ficha && <Link href={ficha} className="btn-gold-sm">Derivar</Link>}
            {chat && <Link href={chat} className="btn-suave-sm">{escribio ? "Responder" : "Chat"}</Link>}
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

export async function TableroHoy({
  slug,
  rubroId,
  areas,
  grupo,
  captados = [],
  enMarcha = [],
  filtroCola,
  verTodo = false,
}: {
  slug: SlugPerfil;
  rubroId: string;
  areas: string[];
  grupo?: string;
  /** Captados que falta derivar (los trae la página, con su cita si tienen). */
  captados?: EntradaCola[];
  enMarcha?: EnMarcha[];
  filtroCola?: string;
  verTodo?: boolean;
}) {
  const s = createAdminClient();
  const aqui = `/hoy?perfil=${slug}`;
  const baseCampanas = slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`;
  const baseAgentes = slug === "juridico" ? "/agentes" : `/panel/${slug}/agentes`;

  const [colas, { data: lineasWa }, personas, { data: lineas }, metricas, { data: camps }] = await Promise.all([
    colasDeHoy(rubroId, areas).catch(() => ({ esperan: [], descartes: [], captadosSinDerivar: null })),
    (s.from("wasender_lineas" as any) as any).select("id, nombre, estado, habilitada").eq("rubro_id", rubroId).is("archivada_at", null),
    resumenPersonas(rubroId, areas),
    s.from("profile_lines").select("label, credential_key, active").eq("rubro_id", rubroId).eq("active", true),
    getProfileMetrics(rubroId).catch(() => null),
    s
      .from("campaigns")
      .select("id, name, status, pause_reason, proveedor, wasender_line_id" as any)
      .in("area", areas)
      .is("archived_at", null)
      .in("status", ["en_curso", "pausada"])
      .order("created_at", { ascending: false })
      .limit(5),
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
  const chipCampana = !camp
    ? { tono: "gris", texto: "Ninguna campaña activa", href: baseCampanas }
    : campFrenada
    ? { tono: "rojo", texto: `Campaña frenada · la línea de Wasender no puede enviar`, href: `${baseCampanas}/${camp.id}` }
    : camp.status === "en_curso"
    ? { tono: "verde", texto: `Campaña enviando · ${camp.name}`, href: `${baseCampanas}/${camp.id}` }
    : { tono: "amarillo", texto: `Campaña pausada · ${camp.pause_reason ? String(camp.pause_reason).slice(0, 60) : camp.name}`, href: `${baseCampanas}/${camp.id}` };

  const p = puntajeBot(metricas as any);
  const chipBot = { tono: p.puntaje === null ? "gris" : p.puntaje >= 60 ? "verde" : p.puntaje >= 35 ? "amarillo" : "rojo", texto: p.puntaje === null ? "Bot · todavía sin puntaje" : `Bot · ${p.puntaje} de 100 en captación y trato`, href: baseAgentes };
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
    porCerrar: (personas.listas.por_cerrar ?? [])
      .filter((f) => !(f.conversationId && descartadas.has(f.conversationId)))
      .map((f) => ({ contactId: f.contactId ?? null, conversationId: f.conversationId ?? null, nombre: f.nombre ?? null, detalle: motivoLegible(f.motivo), at: f.at ?? null })),
    captados,
  });
  const clavesCaptados = new Set(captados.map((c) => (c.contactId ? `c:${c.contactId}` : `v:${c.conversationId}`)));
  const paraDerivar = cola.filter((i) => clavesCaptados.has(i.clave));
  const atender = cola.filter((i) => !clavesCaptados.has(i.clave));
  const porMotivo = new Map<string, number>();
  for (const d of colas.descartes) porMotivo.set(d.descarte.etiqueta, (porMotivo.get(d.descarte.etiqueta) ?? 0) + 1);
  const resumenDescartes = [...porMotivo.entries()].map(([t, n]) => `${n} ${t.toLowerCase()}`).join(", ");

  return (
    <section aria-labelledby="hoy-tablero" className="tablero-hoy space-y-4">
      <h2 id="hoy-tablero" className="sr-only">
        Tablero de hoy
      </h2>
      <ul className="flex flex-wrap gap-2" aria-label="Estado de la línea, la campaña y el bot">
        <Chip tono={chipLinea.tono} texto={chipLinea.texto} />
        <Chip tono={chipCampana.tono} texto={chipCampana.texto} href={chipCampana.href} />
        <Chip tono={chipBot.tono} texto={chipBot.texto} href={chipBot.href} />
        {chipsWasender.map((c) => (
          <Chip key={c.texto} tono={c.tono} texto={c.texto} href={c.href} />
        ))}
      </ul>

      {/* 1) Dos listas separadas: a quién hay que contestarle y a quién hay que derivar. Nadie se repite. */}
      <div id="hoy-cola" className="grid scroll-mt-24 items-start gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm">
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3.5">
            <p className="text-base font-semibold text-slate-950">
              Atención humana <span className="ml-1 tabular-nums">{atender.length}</span>
            </p>
            <p className="text-[13px] text-slate-700">Escribieron y el bot no les contesta: respondeles vos.</p>
          </div>
          {atender.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-600">Nadie espera una respuesta tuya.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(verTodo ? atender : atender.slice(0, VISIBLES_EN_COLA)).map((f) => (
                <FilaTrabajo key={f.clave} f={f} slug={slug} aqui={aqui} modo="atender" />
              ))}
            </ul>
          )}
          {!verTodo && atender.length > VISIBLES_EN_COLA && (
            <p className="border-t border-slate-100 px-5 py-3 text-sm">
              <Link href={`${aqui}&todo=1#hoy-cola`} className="font-medium text-slate-800 underline underline-offset-2">Ver los {atender.length}</Link>
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-300 bg-white shadow-sm">
          <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3.5">
            <p className="text-base font-semibold text-slate-950">
              Captados para derivar <span className="ml-1 tabular-nums">{paraDerivar.length}</span>
            </p>
            <p className="text-[13px] text-slate-700">Ya aceptaron el siguiente paso: pasalos a quien los atiende.</p>
          </div>
          {paraDerivar.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-600">Nadie pendiente de derivar.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(verTodo ? paraDerivar : paraDerivar.slice(0, VISIBLES_EN_COLA)).map((f) => (
                <FilaTrabajo key={f.clave} f={f} slug={slug} aqui={aqui} modo="captado" />
              ))}
            </ul>
          )}
          {!verTodo && paraDerivar.length > VISIBLES_EN_COLA && (
            <p className="border-t border-slate-100 px-5 py-3 text-sm">
              <Link href={`${aqui}&todo=1#hoy-cola`} className="font-medium text-slate-800 underline underline-offset-2">Ver los {paraDerivar.length}</Link>
            </p>
          )}
        </div>
      </div>

      {/* Descartes: se reconocen y no se mezclan con el trabajo. */}
      {colas.descartes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
          <p className="min-w-0 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">
              {colas.descartes.length} {colas.descartes.length === 1 ? "respondió" : "respondieron"} que no {colas.descartes.length === 1 ? "sigue" : "siguen"}
            </span>{" "}
            ({resumenDescartes}). No {colas.descartes.length === 1 ? "aparece" : "aparecen"} arriba.
          </p>
          <CerrarDescartes perfil={slug} cantidad={colas.descartes.length} />
        </div>
      )}

      {/* 2) Para mirar: lo que puede necesitarte, sin ser urgente. */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-950">Para mirar</p>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {GRUPOS_PERSONAS.filter((g) => g.clave !== "por_cerrar").map((g) => {
            const n = personas.conteos[g.clave];
            const activo = g.clave === elegido;
            return (
              <li key={g.clave}>
                <Link
                  href={g.clave === "no_interesado" ? `/oportunidades?perfil=${slug}&indicador=detencion_reciente&volver=${encodeURIComponent(aqui)}` : `${aqui}&grupo=${g.clave}#hoy-lista`}
                  aria-current={activo ? "true" : undefined}
                  className={`kpi-hoy flex h-full flex-col rounded-2xl border p-4 ${g.tarea && n ? "" : "kpi-apagado"} ${activo ? "kpi-activo" : ""}`}
                >
                  <span className="text-[13px] font-medium text-slate-600">{g.titulo}</span>
                  <span className="cifra-premium mt-1.5 text-3xl font-semibold tabular-nums text-slate-950">{n === null ? "—" : n.toLocaleString("es-AR")}</span>
                  <span className="mt-1 text-[13px] text-slate-500">{g.detalle}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {elegido && (
        <div id="hoy-lista" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-950">
              {infoGrupo!.titulo} <span className="ml-1 tabular-nums text-slate-500">{personas.conteos[elegido] ?? "—"}</span>
            </p>
            <Link href={`${aqui}#hoy-cola`} className="text-[13px] font-medium text-slate-700 underline underline-offset-2">
              Cerrar la lista
            </Link>
          </div>
          {filas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-600">Nada en este grupo por ahora.</p>
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
                      <Link href={conVolver(enlaceConversacion(slug, f.conversationId), aqui)} className="btn-gold-sm">
                        Abrir chat
                      </Link>
                    )}
                    {f.contactId && (
                      <Link href={conVolver(`/ficha/${f.contactId}`, aqui)} className="btn-suave-sm">
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

      {/* 3) En marcha: lo que avanza solo. */}
      {enMarcha.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-950">En marcha</p>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {enMarcha.map((m) => (
              <li key={m.titulo}>
                <Link href={m.href} className={`kpi-hoy flex h-full flex-col rounded-2xl border p-4 ${m.n ? "" : "kpi-apagado"}`}>
                  <span className="text-[13px] font-medium text-slate-600">{m.titulo}</span>
                  <span className="cifra-premium mt-1.5 text-3xl font-semibold tabular-nums text-slate-950">{m.n === null || m.n === undefined ? "—" : m.n.toLocaleString("es-AR")}</span>
                  <span className="mt-1 text-[13px] text-slate-500">{m.detalle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const TONO: Record<string, string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-400",
  rojo: "bg-red-500",
  gris: "bg-slate-400",
};

function Chip({ tono, texto, href }: { tono: string; texto: string; href?: string }) {
  const cuerpo = (
    <>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TONO[tono] ?? TONO.gris}`} />
      <span className="truncate">{texto}</span>
    </>
  );
  const clase = "chip-estado inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700";
  return <li className="max-w-full">{href ? <Link href={href} className={clase}>{cuerpo}</Link> : <span className={clase}>{cuerpo}</span>}</li>;
}
