import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { perfilActivo } from "@/lib/perfil-activo";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { indicadorPorClave, rubroIdDe } from "@/lib/indicadores";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { ETAPAS, TAMANO_PAGINA_CONTACTOS, enlaceContactos, filtrosActivos, parsearFiltros } from "@/lib/contactos/consulta";
import { contarEtapas, listarContactos } from "@/lib/contactos/servidor";
import { Anillo, Tarjeta } from "@/components/premium";
import { Pager } from "@/components/ui/pager";
import { FiltrosContactos } from "@/components/contactos/filtros-contactos";
import { TablaContactos } from "@/components/contactos/tabla-contactos";
import "./contactos.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contactos" };

/**
 * Contactos (22/11): herramienta de trabajo por perfil. Arriba, el recorrido por etapas en anillos compactos
 * (cada uno filtra la lista); abajo, buscador, filtros, orden, paginación en el servidor y acciones por fila y en lote.
 */
export default async function Pagina(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = await perfilActivo(typeof sp.perfil === "string" ? sp.perfil : undefined);
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const filtros = parsearFiltros(sp, AREAS_DE_PERFIL[slug]);
  return (
    <MarcoPerfil slug={slug}>
      <div className="ct mx-auto max-w-6xl">
        <header className="ct-encabezado">
          <h1 className="ct-titulo">Contactos</h1>
          <p className="ct-bajada">Buscá, filtrá y trabajá cada persona del perfil: abrí su ficha o su chat, movela de etapa, derivala, agendale una cita o exportá.</p>
        </header>
        <Suspense fallback={<div className="ct-esqueleto" role="status" aria-label="Cargando etapas" style={{ height: 112 }} />}>
          <Etapas slug={slug} rubroId={rubroId} activa={filtros.etapa} filtros={filtros} />
        </Suspense>
        <FiltrosContactos slug={slug} f={filtros} areas={AREAS_DE_PERFIL[slug]} />
        <Suspense key={JSON.stringify(filtros)} fallback={<div className="ct-esqueleto" role="status" aria-label="Cargando contactos" style={{ height: 360 }} />}>
          <Lista slug={slug} rubroId={rubroId} filtros={filtros} />
        </Suspense>
      </div>
    </MarcoPerfil>
  );
}

async function Etapas({ slug, rubroId, activa, filtros }: { slug: SlugPerfil; rubroId: string; activa: string | null; filtros: ReturnType<typeof parsearFiltros> }) {
  const conteos = await contarEtapas(
    rubroId,
    ETAPAS.map((e) => ({ clave: e.clave, conds: indicadorPorClave(e.indicador)?.conds ?? [] }))
  );
  const total = Math.max(1, ...Object.values(conteos).map((n) => n ?? 0));
  return (
    <Tarjeta relieve rubro={slug} aparecer={0} className="ct-etapas" como="section">
      <h2 className="ct-sub">El recorrido, de la base fría al cliente</h2>
      <ol className="ct-anillos">
        {ETAPAS.map((e, i) => {
          const n = conteos[e.clave];
          const encendida = activa === e.clave;
          return (
            <li key={e.clave}>
              <Link prefetch={false} href={enlaceContactos("/contactos", slug, filtros, { etapa: encendida ? undefined : e.clave })} aria-current={encendida ? "true" : undefined} className={`ct-anillo${encendida ? " ct-anillo--on" : ""}`} aria-label={`${e.rotulo}: ${n ?? "sin dato"}. ${encendida ? "Quitar filtro" : "Filtrar la lista"}`}>
                <Anillo valor={n ?? 0} meta={total} rubro={slug} tamano="chico" nombre={e.rotulo} unidad="personas" mostrarMeta={false} retrasoMs={60 * i} />
                <span className="ct-anillo__rotulo">{e.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Tarjeta>
  );
}

async function Lista({ slug, rubroId, filtros }: { slug: SlugPerfil; rubroId: string; filtros: ReturnType<typeof parsearFiltros> }) {
  const { filas, total, error } = await listarContactos(rubroId, filtros);
  const aqui = enlaceContactos("/contactos", slug, filtros);
  const csv = new URLSearchParams(aqui.split("?")[1]);
  csv.delete("pagina");
  const hay = filtrosActivos(filtros) > 0;
  return (
    <section aria-labelledby="ct-resultado" className="ct-resultado">
      <h2 id="ct-resultado" className="ct-sub" aria-live="polite">
        {error ? "No se pudo leer la lista" : `${total.toLocaleString("es-AR")} ${total === 1 ? "persona" : "personas"}${hay ? " con estos filtros" : ""}`}
      </h2>
      {error ? (
        <div role="alert" className="ct-vacio">
          <p className="ct-vacio__t">No se pudo leer ({error}).</p>
          <p>No es «cero»: volvé a intentar.</p>
          <Link prefetch={false} href={aqui} className="pm-boton pm-boton--primario">Reintentar</Link>
        </div>
      ) : filas.length === 0 ? (
        <div className="ct-vacio">
          <p className="ct-vacio__t">{hay ? "Nadie coincide con estos filtros" : "Todavía no hay contactos en este perfil"}</p>
          <p>{hay ? "Probá con otro nombre, otra etapa o quitá los filtros." : "Cuando se cargue una base o alguien escriba, aparece acá."}</p>
          {hay ? <Link prefetch={false} href={`/contactos?perfil=${slug}`} className="pm-boton pm-boton--secundario">Quitar los filtros</Link> : null}
        </div>
      ) : (
        <>
          <TablaContactos filas={filas} slug={slug} aqui={aqui} filtrosCsv={csv.toString()} />
          <Pager basePath="/contactos" params={Object.fromEntries(Array.from(csv.entries()))} page={filtros.pagina} pageSize={TAMANO_PAGINA_CONTACTOS} total={total} unit="personas" />
        </>
      )}
    </section>
  );
}
