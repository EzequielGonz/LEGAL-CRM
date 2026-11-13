import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { Pager, pageFromParam } from "@/components/ui/pager";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { rubroIdDe } from "@/lib/indicadores";
import { AREAS_DE_PERFIL } from "@/lib/cartera-servidor";
import { conVolver } from "@/lib/navegacion";
import { enlaceConversacion } from "@/lib/cartera";
import {
  esPeriodoResultado,
  esVistaResultado,
  leerResultados,
  PERIODOS_RESULTADO,
  rangoResultado,
  TAMANO_PAGINA_RESULTADOS,
  VISTAS_RESULTADO,
  type ClavePeriodoResultado,
  type ClaveResultado,
} from "@/lib/resultados";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultados" };

const fechaHora = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(iso))
    : "Sin fecha";
const dia = (d: Date) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(d);
const iniciales = (n: string | null) =>
  (n ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const VACIO: Record<ClaveResultado, string> = {
  captados: "Nadie aceptó el siguiente paso en este período.",
  derivados: "No se derivó a nadie en este período.",
  perdidos: "No se cerró a nadie como perdido en este período.",
  respondieron: "Nadie escribió en este período.",
  contactados: "No salió ningún primer mensaje en este período.",
};

/**
 * Resultados con nombre y apellido (13/11): cada cifra de «Hoy» se abre acá.
 * Quién, cuándo, de dónde vino, quién lo hizo y por qué, con la ficha y el
 * chat a un clic. Solo lectura.
 */
export default async function Pagina({ searchParams }: { searchParams: { perfil?: string; ver?: string; periodo?: string; pagina?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const perfil = searchParams.perfil ?? "juridico";
  const rubroId = rubroIdDe(perfil);
  if (!rubroId || !esSlugPerfil(perfil)) notFound();
  const slug: SlugPerfil = perfil;
  const ver: ClaveResultado = esVistaResultado(searchParams.ver) ? searchParams.ver : "captados";
  const periodo: ClavePeriodoResultado = esPeriodoResultado(searchParams.periodo) ? searchParams.periodo : "semana";
  const pagina = pageFromParam(searchParams.pagina);
  const r = await leerResultados({ rubroId, areas: AREAS_DE_PERFIL[slug], ver, periodo, pagina });
  const vista = VISTAS_RESULTADO.find((v) => v.clave === ver)!;
  const per = PERIODOS_RESULTADO.find((p) => p.clave === periodo)!;
  const rango = rangoResultado(periodo);
  const href = (v: string, p: string) => `/resultados?perfil=${slug}&ver=${v}&periodo=${p}`;
  const aqui = href(ver, periodo) + (pagina > 1 ? `&pagina=${pagina}` : "");
  const chat = (id: string) => conVolver(enlaceConversacion(slug, id), aqui);
  const mayor = r.origenes[0]?.cantidad ?? 0;

  return (
    <MarcoPerfil slug={slug}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-slate-600">
            <Link href={`/hoy?perfil=${slug}#hoy-cifras`} className="font-medium text-slate-800 underline underline-offset-2">
              Hoy
            </Link>{" "}
            / Resultados
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {vista.titulo} · {per.titulo.toLowerCase()}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {vista.bajada}
            {rango.desde && rango.hasta ? ` · del ${dia(rango.desde)} al ${dia(new Date(rango.hasta.getTime() - 1))}` : ""} ·{" "}
            <span className="font-semibold tabular-nums text-slate-900">{r.total.toLocaleString("es-AR")}</span> {r.total === 1 ? "persona" : "personas"}
          </p>
        </div>

        <nav aria-label="Qué ver" className="flex flex-wrap gap-2">
          {VISTAS_RESULTADO.map((v) => (
            <Link
              key={v.clave}
              href={href(v.clave, periodo)}
              aria-current={v.clave === ver ? "page" : undefined}
              className={`tactil inline-flex items-center rounded-full border px-4 text-sm font-medium ${v.clave === ver ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {v.titulo}
            </Link>
          ))}
        </nav>
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {PERIODOS_RESULTADO.map((p) => (
            <Link
              key={p.clave}
              href={href(ver, p.clave)}
              aria-current={p.clave === periodo ? "page" : undefined}
              className={`tactil inline-flex items-center rounded-full border px-3 text-[13px] font-medium ${p.clave === periodo ? "border-gold-500 bg-gold-500/15 text-gold-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {p.titulo}
            </Link>
          ))}
        </nav>

        {r.origenes.length > 0 ? (
          <section aria-labelledby="res-origen" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 id="res-origen" className="text-base font-semibold text-slate-950">
              De dónde vienen
            </h2>
            <p className="text-sm text-slate-600">
              La campaña o la base de la que salió cada persona de esta lista{r.origenesParciales ? " (calculado sobre las más recientes)" : ""}.
            </p>
            <ul className="mt-4 space-y-2.5">
              {r.origenes.slice(0, 8).map((o) => (
                <li key={o.nombre} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
                  <span className="truncate text-sm text-slate-800">{o.nombre}</span>
                  <span className="text-sm font-semibold tabular-nums text-slate-950">{o.cantidad.toLocaleString("es-AR")}</span>
                  <span aria-hidden="true" className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-gold-500" style={{ width: `${mayor ? Math.max(3, Math.round((o.cantidad / mayor) * 100)) : 0}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            {r.origenes.length > 8 ? <p className="mt-3 text-[13px] text-slate-600">Y {r.origenes.length - 8} orígenes más con menos personas.</p> : null}
          </section>
        ) : null}

        <section aria-labelledby="res-lista" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 id="res-lista" className="sr-only">
            Personas
          </h2>
          {r.filas.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-base font-medium text-slate-900">{VACIO[ver]}</p>
              <p className="mt-1 text-sm text-slate-600">
                Probá con otro período:{" "}
                <Link href={href(ver, "mes")} className="font-medium underline underline-offset-2">
                  este mes
                </Link>{" "}
                o{" "}
                <Link href={href(ver, "todo")} className="font-medium underline underline-offset-2">
                  desde siempre
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {r.filas.map((f) => (
                <li key={f.clave} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-700">
                    {iniciales(f.nombre)}
                  </span>
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[15px] font-semibold text-slate-950 [overflow-wrap:anywhere]">{f.nombre ?? "Sin nombre"}</span>
                      {f.telefono ? <span className="text-[13px] tabular-nums text-slate-500">{f.telefono}</span> : null}
                    </p>
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      {fechaHora(f.at)} · <span className="font-medium text-slate-800">{f.estado}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-800 [overflow-wrap:anywhere]">
                      {f.origen}
                      {f.base ? <span className="text-slate-500"> · base «{f.base}»</span> : null}
                    </p>
                    {f.detalle ? <p className="mt-1 text-[13px] text-slate-600 [overflow-wrap:anywhere]">{f.detalle}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {f.contactId ? (
                      <Link href={conVolver(`/ficha/${f.contactId}`, aqui)} className="btn-gold-sm">
                        Abrir ficha
                      </Link>
                    ) : null}
                    {f.conversationId ? (
                      <Link href={chat(f.conversationId)} className="btn-suave-sm">
                        Ver chat
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {r.total > TAMANO_PAGINA_RESULTADOS ? (
            <Pager basePath="/resultados" params={{ perfil: slug, ver, periodo }} page={pagina} pageSize={TAMANO_PAGINA_RESULTADOS} total={r.total} unit="personas" />
          ) : null}
        </section>
      </div>
    </MarcoPerfil>
  );
}
