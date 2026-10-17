import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { contarIndicador, enlaceIndicador, indicadorPorClave, rubroIdDe } from "@/lib/indicadores";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { prioridadesDeInicio, type Pendiente } from "@/lib/inicio";
import { CircuitosMarketing } from "@/components/marketing/circuitos-marketing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicio" };

/**
 * Inicio del perfil (rediseño 17/10, bloque 3, enfoque «primero la tarea»):
 * qué necesita atención, cuál es el siguiente paso y las acciones de todos
 * los días. Cada cifra abre la lista exacta que cuenta (misma consulta) y
 * desde ahí la ficha y la conversación, con regreso a esta pantalla.
 * En Avanzado se ven también los indicadores en cero y los accesos al
 * resto de las listas. Solo lectura: no envía ni cambia nada.
 */
export default async function InicioPerfilPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const aqui = `/hoy?perfil=${slug}`;

  const claves = ["requiere_humano", "captado_sin_derivar", "revision_pendiente", "seguimiento_caido", "derivado_sin_resultado", "humano_en_curso"] as const;
  const [conteos, retenidas] = await Promise.all([
    Promise.all(claves.map(async (c) => [c, await contarIndicador(rubroId as string, indicadorPorClave(c)!)] as const)),
    createAdminClient().from("content_pieces").select("id", { count: "exact", head: true }).eq("rubro_id", rubroId).in("estado", ["retenida", "error", "incierta"]),
  ]);
  const cuenta = Object.fromEntries(conteos.map(([c, r]) => [c, r])) as Record<(typeof claves)[number], { count: number | null; error: string | null }>;
  const pendientes: Pendiente[] = prioridadesDeInicio({
    conteos: Object.fromEntries(conteos.map(([c, r]) => [c, r.count])),
    contenidoRetenido: retenidas.error ? null : retenidas.count ?? 0,
    enlace: (clave) => enlaceIndicador(slug, clave, aqui),
    enlaceContenido: `/contenido?perfil=${slug}&volver=${encodeURIComponent(aqui)}#c-acc`,
  });
  const conPendiente = pendientes.filter((p) => p.cantidad !== null && p.cantidad > 0);
  const siguiente = conPendiente[0] ?? null;
  const errores = conteos.filter(([, r]) => r.error).length + (retenidas.error ? 1 : 0);
  const base = slug === "juridico" ? "" : `/panel/${slug}`;
  const acciones = [
    { href: slug === "juridico" ? "/inbox" : enlaceIndicador(slug, "en_conversacion", aqui), texto: "Ver conversaciones" },
    { href: `/contenido?perfil=${slug}&volver=${encodeURIComponent(aqui)}`, texto: "Crear contenido" },
    { href: `${base}/bases`, texto: "Cargar una base" },
    { href: `${base}/agenda`, texto: "Ver agenda" },
  ];

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Inicio</h1>

        {errores > 0 && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
            No se pudieron leer {errores} de las cifras. Las que faltan figuran como «Sin datos»: no son cero.
          </p>
        )}

        <section aria-labelledby="hoy-siguiente" className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-6">
          <h2 id="hoy-siguiente" className="text-sm font-medium text-slate-600">Siguiente paso</h2>
          {siguiente ? (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xl font-semibold text-slate-900">
                  <span className="tabular-nums">{siguiente.cantidad!.toLocaleString("es-AR")}</span> {siguiente.titulo.toLowerCase()}
                </p>
                <p className="mt-1 max-w-xl text-sm text-slate-700">{siguiente.porQue}</p>
              </div>
              <Link href={siguiente.href} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
                {siguiente.accion} <span aria-hidden="true" className="ml-1.5">→</span>
              </Link>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-xl font-semibold text-slate-900">Todo al día</p>
              <p className="mt-1 text-sm text-slate-700">No hay conversaciones esperando a una persona, captados por derivar ni revisiones pendientes.</p>
            </div>
          )}
        </section>

        {slug === "marketing" ? <CircuitosMarketing /> : null}

        <section aria-labelledby="hoy-atencion">
          <h2 id="hoy-atencion" className="mb-2 text-base font-semibold text-slate-900">Necesita tu atención</h2>
          {conPendiente.length === 0 ? (
            <p className="solo-simple rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-700">Nada pendiente por ahora.</p>
          ) : null}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendientes.map((p) => {
              const vacio = p.cantidad === 0;
              return (
                <li key={p.clave} className={vacio ? "solo-avanzado" : ""}>
                  <Link href={p.href} className={`tarjeta-resumen flex h-full flex-col rounded-xl border bg-white p-4 hover:border-slate-500 ${p.cantidad && p.urgente ? "border-amber-400" : "border-slate-200"}`}>
                    <span className="text-sm text-slate-700">{p.titulo}</span>
                    <span className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{p.cantidad === null ? "Sin datos" : p.cantidad.toLocaleString("es-AR")}</span>
                    <span className="mt-auto pt-2 text-sm font-medium text-slate-900 underline underline-offset-2">{p.accion}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="hoy-acciones">
          <h2 id="hoy-acciones" className="mb-2 text-base font-semibold text-slate-900">Acciones de todos los días</h2>
          <ul className="flex flex-wrap gap-2">
            {acciones.map((a) => (
              <li key={a.texto}>
                <Link href={a.href} className="tactil inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50">
                  {a.texto}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="hoy-mas" className="solo-avanzado rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 id="hoy-mas" className="mb-2 text-base font-semibold text-slate-900">Más listas e indicadores</h2>
          <p className="text-slate-700">
            Atención humana en curso: <span className="tabular-nums">{cuenta.humano_en_curso.count ?? "Sin datos"}</span> ·{" "}
            <Link href={enlaceIndicador(slug, "oportunidades", aqui)} className="font-medium underline">Todas las listas de oportunidades</Link> ·{" "}
            <Link href={slug === "marketing" ? "/panel/marketing/estadisticas" : "/estadisticas"} className="font-medium underline">Estadísticas</Link> ·{" "}
            <Link href={`/salud?perfil=${slug}`} className="font-medium underline">Salud del sistema</Link>
          </p>
        </section>
      </div>
    </MarcoPerfil>
  );
}
