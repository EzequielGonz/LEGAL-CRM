import { Suspense, cache } from "react";
import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ResumenSemana } from "@/components/asistente/resumen-semana";
import { HablarConClaude } from "@/components/cerebro/hablar-con-claude";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import { leerRubrosActivos } from "@/lib/perfiles-stats";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { perfilActivo } from "@/lib/perfil-activo";
import type { SlugPerfil } from "@/lib/marca";
import { leerSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, perfilDeRubroId, ETIQUETA_ESTADO, type TareaBandeja } from "@/lib/bandeja-claude";
import { resumenSemana } from "@/lib/asistente/semana";
import {
  ACTUALIZADO,
  ALERTAS,
  CORRECCIONES,
  ENTIENDO,
  ETIQUETA_RUBRO,
  MARCAS_CEREBRO,
  PENDIENTES,
  PREGUNTAS_ABIERTAS,
  PROPUESTAS,
  RESUMEN,
  conteoAlertas,
  fotoParaClaude,
  lecturasDelPanel,
  type Gravedad,
  type PerfilSemana,
} from "@/lib/cerebro/contenido";

export const metadata = { title: "Cerebro del negocio" };
export const dynamic = "force-dynamic";

/**
 * Cerebro del negocio (21/11, pedido de los dueños): la memoria de Claude
 * dentro del panel. Arriba lee las cifras vivas de la semana y saca sus
 * propias lecturas; abajo, lo que entiende, alertas, lo que corrigió,
 * propuestas, pendientes y preguntas abiertas. La bandeja manda pedidos a
 * Claude con la foto de la semana. Solo lectura: no cambia nada del panel.
 */
const TONO: Record<Gravedad, { chip: string; borde: string; texto: string }> = {
  alta: { chip: "border-red-300 bg-red-50 text-red-800", borde: "border-l-red-500", texto: "Alta" },
  media: { chip: "border-amber-300 bg-amber-50 text-amber-900", borde: "border-l-amber-500", texto: "Media" },
  info: { chip: "border-sky-300 bg-sky-50 text-sky-900", borde: "border-l-sky-500", texto: "Para tener en cuenta" },
};

const ACCESOS: AccesoAsistente[] = [
  { titulo: "¿Cómo vienen los 4 perfiles?", descripcion: "Un resumen corto de cada perfil.", accion: "enviar", texto: "¿Cómo vienen los cuatro perfiles? Resumilo corto, perfil por perfil." },
  { titulo: "Buscar captados sin derivar", descripcion: "Quién dejó sus datos y falta pasar.", accion: "enviar", texto: "¿Qué captados falta derivar en los cuatro perfiles?" },
  { titulo: "Chats que piden una persona", descripcion: "Los que esperan a alguien del equipo.", accion: "enviar", texto: "Mostrame los chats que piden una persona en los cuatro perfiles." },
  { titulo: "Mejorar un bot", descripcion: "Contame qué cambiar y armo una versión para probar.", accion: "enviar", texto: "Quiero mejorar el bot de un perfil. Preguntame cuál y qué querés cambiar." },
];

const SECCIONES = [
  ["veo", "Lo que veo"],
  ["alertas", "Alertas"],
  ["preguntas", "Preguntas"],
  ["hablar", "Hablale a Claude"],
  ["asistente", "Asistente"],
  ["laboratorio", "Laboratorio de bots"],
  ["entiendo", "Lo que entiendo"],
  ["pendientes", "Pendientes"],
  ["propuestas", "Propuestas"],
  ["corregi", "Lo que corregí"],
] as const;

export default async function CerebroPage(props: { searchParams: Promise<{ perfil?: string }> }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const searchParams = await props.searchParams;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  const conteo = conteoAlertas(ALERTAS);

  return (
    <MarcoPerfil slug={slug}>
      <div id="cerebro" className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Memoria de Claude · actualizada el {ACTUALIZADO}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Cerebro del negocio</h1>
            <p className="mt-2 text-sm text-slate-600">{RESUMEN}</p>
            <p className="mt-2 text-sm text-slate-600">
              {conteo.alta} alertas altas · {conteo.media} medias · {PREGUNTAS_ABIERTAS.length} preguntas para ustedes. Nada de esta pantalla cambia el panel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/bandeja?perfil=${slug}`} prefetch={false} className="btn-suave min-h-[44px]">
              Bandeja para Claude
            </Link>
            <Link href="/perfiles" prefetch={false} className="btn-suave min-h-[44px]">
              Todos los perfiles
            </Link>
          </div>
        </header>

        <nav aria-label="Secciones del cerebro" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-2 whitespace-nowrap text-sm">
            {SECCIONES.map(([id, nombre]) => (
              <li key={id}>
                <a href={`#${id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-100">
                  {nombre}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div id="veo" className="scroll-mt-4">
          <Suspense fallback={<p role="status" className="text-sm text-slate-600">Leyendo el panel…</p>}>
            <LoQueVeo />
          </Suspense>
        </div>

        <section id="alertas" aria-labelledby="alertas-titulo" className="scroll-mt-4">
          <h2 id="alertas-titulo" className="mb-3 text-lg font-semibold text-slate-900">
            Alertas
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {ALERTAS.map((a) => (
              <li key={a.titulo} className={`rounded-xl border border-l-4 border-slate-200 bg-white p-4 ${TONO[a.gravedad].borde}`}>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${TONO[a.gravedad].chip}`}>{TONO[a.gravedad].texto}</span>
                <p className="mt-2 font-medium text-slate-900">{a.titulo}</p>
                <p className="mt-1 text-sm text-slate-600">{a.detalle}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-4 rounded-2xl border border-gold-500/40 bg-white p-4 shadow-sm sm:p-5">
          <h2 id="preguntas-titulo" className="text-lg font-semibold text-slate-900">
            Preguntas para ustedes
          </h2>
          <p className="mt-1 text-sm text-slate-600">Lo que no puedo saber mirando el panel. Respondan cuando quieran, por la bandeja o en el chat.</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
            {PREGUNTAS_ABIERTAS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </section>

        <div id="hablar" className="scroll-mt-4">
          <Suspense fallback={null}>
            <HablarConClaudeConFoto />
          </Suspense>
        </div>

        <section id="asistente" aria-labelledby="asistente-titulo" className="scroll-mt-4">
          <h2 id="asistente-titulo" className="mb-1 text-lg font-semibold text-slate-900">
            Asistente del panel
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            Para preguntas rápidas sobre los cuatro perfiles, al instante. Lo que proponga queda para confirmar.{" "}
            <Link href="/asistente" prefetch={false} className="font-medium text-slate-800 underline">
              Abrir en pantalla completa
            </Link>
          </p>
          <ChatAsistenteGeneral accesos={ACCESOS} alto="h-[min(60vh,36rem)]" />
        </section>

        <section id="laboratorio" aria-labelledby="laboratorio-titulo" className="scroll-mt-4">
          <h2 id="laboratorio-titulo" className="mb-1 text-lg font-semibold text-slate-900">
            Laboratorio de bots
          </h2>
          <p className="mb-3 text-sm text-slate-600">Qué versión del conocimiento rige en cada perfil, cómo rinde contra la anterior y el laboratorio para probar cambios. Ningún botón envía mensajes.</p>
          <Suspense fallback={<p role="status" className="text-sm text-slate-600">Cargando los bots…</p>}>
            <Laboratorio />
          </Suspense>
        </section>

        <section id="entiendo" aria-labelledby="entiendo-titulo" className="scroll-mt-4">
          <h2 id="entiendo-titulo" className="mb-3 text-lg font-semibold text-slate-900">
            Lo que entiendo del negocio
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ENTIENDO.map((e) => (
              <li key={e} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                {e}
              </li>
            ))}
          </ul>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {MARCAS_CEREBRO.map((m) => (
              <li key={m.rubro} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Prioridad {m.prioridad}</p>
                <p className="mt-1 font-semibold text-slate-900">{m.nombre}</p>
                <p className="mt-1 text-sm text-slate-600">Deriva a {m.derivaA}.</p>
                <p className="mt-1 text-sm text-slate-600">{m.queVale}</p>
                <p className="mt-2 text-xs text-slate-500">Meta semanal: {m.semanal}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="pendientes" aria-labelledby="pendientes-titulo" className="scroll-mt-4">
          <h2 id="pendientes-titulo" className="mb-3 text-lg font-semibold text-slate-900">
            Pendientes
          </h2>
          <div className="grid gap-3 lg:grid-cols-3">
            {PENDIENTES.map((c) => (
              <div key={c.clave} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{c.titulo}</h3>
                  <span className="text-xs text-slate-500">{c.items.length}</span>
                </div>
                <p className="text-xs text-slate-500">{c.ayuda}</p>
                <ul className="mt-3 space-y-2">
                  {c.items.map((p) => (
                    <li key={p.texto} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">
                      <p>{p.texto}</p>
                      <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">{ETIQUETA_RUBRO[p.rubro]}</span>
                        {p.urgente && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-900">Urgente</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="propuestas" aria-labelledby="propuestas-titulo" className="scroll-mt-4">
          <h2 id="propuestas-titulo" className="mb-1 text-lg font-semibold text-slate-900">
            Propuestas de mejora
          </h2>
          <p className="mb-3 text-sm text-slate-600">Ninguna está aplicada. Cada una necesita su OK.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Qué</th>
                  <th className="px-4 py-2 font-medium">Por qué</th>
                  <th className="px-4 py-2 font-medium">Tamaño</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PROPUESTAS.map((p) => (
                  <tr key={p.titulo}>
                    <td className="px-4 py-2 font-medium text-slate-900">{p.titulo}</td>
                    <td className="px-4 py-2 text-slate-600">{p.porque}</td>
                    <td className="px-4 py-2 text-slate-600">{p.tamano}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="corregi" aria-labelledby="corregi-titulo" className="scroll-mt-4">
          <h2 id="corregi-titulo" className="mb-3 text-lg font-semibold text-slate-900">
            Lo que tenía mal y corregí
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {CORRECCIONES.map((c) => (
              <li key={c.decia} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <p className="text-slate-500 line-through">{c.decia}</p>
                <p className="mt-1 text-slate-900">{c.real}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MarcoPerfil>
  );
}

/** Una sola lectura de la semana por pedido, compartida por los bloques. */
const leerSemana = cache(async (): Promise<{ desde: string; perfiles: PerfilSemana[] } | null> => resumenSemana().catch(() => null));

/** Cifras vivas de la semana y las lecturas que el cerebro saca de ellas. */
async function LoQueVeo() {
  const datos = await leerSemana();
  const lecturas = datos ? lecturasDelPanel(datos.perfiles) : null;
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="veo-titulo" className="rounded-2xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm sm:p-5">
        <h2 id="veo-titulo" className="text-lg font-semibold">
          Lo que veo hoy en el panel
        </h2>
        {lecturas ? (
          <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
            {lecturas.map((l) => (
              <li key={l} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-300">No pude leer las cifras ahora. Probá recargar en un rato.</p>
        )}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <SaludViva />
        <PedidosACLaude />
      </div>
      <ResumenSemana />
    </div>
  );
}

/** Salud del sistema en vivo: lo que hoy frena o conviene mirar. */
async function SaludViva() {
  const items = await leerSalud().catch(() => null);
  const problemas = (items ?? []).filter((i) => i.estado !== "verde");
  const ok = (items ?? []).length - problemas.length;
  return (
    <section aria-labelledby="salud-titulo" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="salud-titulo" className="text-lg font-semibold text-slate-900">
          Salud del sistema
        </h2>
        <Link href="/salud" prefetch={false} className="text-sm font-medium text-slate-700 underline">
          Ver todo
        </Link>
      </div>
      {!items ? (
        <p className="mt-2 text-sm text-slate-600">No pude leer la salud ahora.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {problemas.length ? `${problemas.length} para mirar · ${ok} en orden.` : `Todo en orden (${ok} controles).`}
          </p>
          <ul className="mt-3 space-y-2">
            {problemas.slice(0, 6).map((i) => (
              <li key={i.clave} className={`rounded-lg border border-l-4 p-3 text-sm ${i.estado === "rojo" ? "border-slate-200 border-l-red-500" : "border-slate-200 border-l-amber-500"}`}>
                {lecturaSimple(i).que}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Lo último que se le pidió a Claude, con su estado. */
async function PedidosACLaude() {
  let tareas: TareaBandeja[] | null = null;
  try {
    const { data, error } = await createAdminClient()
      .from("bandeja_claude" as any)
      .select("id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    tareas = (data ?? []).map(filaATarea).filter((x): x is TareaBandeja => x !== null);
  } catch {
    tareas = null;
  }
  return (
    <section aria-labelledby="pedidos-titulo" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="pedidos-titulo" className="text-lg font-semibold text-slate-900">
          Pedidos a Claude
        </h2>
        <Link href="/bandeja" prefetch={false} className="text-sm font-medium text-slate-700 underline">
          Abrir la bandeja
        </Link>
      </div>
      {!tareas ? (
        <p className="mt-2 text-sm text-slate-600">No pude leer la bandeja ahora.</p>
      ) : tareas.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Todavía no hay pedidos. Escribile desde «Hablale a Claude».</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tareas.map((x) => (
            <li key={x.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">{ETIQUETA_ESTADO[x.estado]}</span>
                <span className="text-slate-500">{ETIQUETA_RUBRO[perfilDeRubroId(x.rubro_id) ?? "todos"]}</span>
              </p>
              <p className="mt-1 line-clamp-2 text-slate-800">{x.pedido.replace(/^Desde el cerebro:\s*/, "").split("\n")[0]}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function HablarConClaudeConFoto() {
  const datos = await leerSemana();
  return <HablarConClaude foto={datos ? fotoParaClaude(datos.perfiles, datos.desde) : null} />;
}

/** Conocimiento y laboratorio de los bots, el mismo de la pantalla de perfiles. */
async function Laboratorio() {
  const rubros = await leerRubrosActivos().catch(() => []);
  const nombres = Object.fromEntries(rubros.map((r) => [r.slug, r.name]));
  return <ConocimientoBot nombres={nombres} />;
}
