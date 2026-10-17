import Link from "next/link";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { leerSalud, resumenSalud, type ItemSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Salud del sistema" };

const ESTILO: Record<ItemSalud["estado"], { caja: string; punto: string; texto: string; borde: string }> = {
  rojo: { caja: "border-red-300 bg-red-50", punto: "bg-red-600", texto: "Frena la operación", borde: "border-l-red-600" },
  amarillo: { caja: "border-amber-300 bg-amber-50", punto: "bg-amber-500", texto: "Para revisar", borde: "border-l-amber-500" },
  verde: { caja: "border-emerald-200 bg-white", punto: "bg-emerald-600", texto: "En orden", borde: "border-l-emerald-600" },
};

/**
 * Salud del sistema (rediseño 17/10, bloque 3). Simple: qué frena el
 * trabajo, qué consecuencia tiene y quién lo resuelve, en lenguaje llano.
 * Avanzado: el tablero completo con el detalle técnico. Los problemas se ven
 * en los dos niveles. Solo lectura.
 */
export default async function SaludPage({ searchParams }: { searchParams: { perfil?: string } }) {
  const slug: SlugPerfil = esSlugPerfil(searchParams.perfil) ? searchParams.perfil : "juridico";
  const items = await leerSalud();
  const r = resumenSalud(items);
  const rojos = items.filter((i) => i.estado === "rojo");
  const amarillos = items.filter((i) => i.estado === "amarillo");
  return (
    <MarcoPerfil slug={slug} sinSalud>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Salud del sistema</h1>
          <p className="mt-1 text-sm text-slate-600">
            <span className="tabular-nums">{r.rojo}</span> frenan la operación · <span className="tabular-nums">{r.amarillo}</span> para revisar ·{" "}
            <span className="tabular-nums">{r.verde}</span> en orden. Se actualiza cada vez que entrás.
          </p>
        </div>

        {/* Simple: lo que frena el trabajo, en palabras simples y con quién lo resuelve. */}
        <section aria-labelledby="salud-simple" className="solo-simple space-y-4">
          <h2 id="salud-simple" className="text-xl font-semibold text-slate-900">
            {r.rojo ? `${r.rojo} problema(s) frenan el trabajo` : r.amarillo ? "Nada frena el trabajo; hay puntos para revisar" : "Todo en orden"}
          </h2>
          {[...rojos, ...amarillos].length > 0 ? (
            <ul className="space-y-2">
              {[...rojos, ...amarillos].map((i) => {
                const l = lecturaSimple(i);
                return (
                  <li key={i.clave} className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 ${ESTILO[i.estado].borde}`}>
                    <p className="text-xs font-medium text-slate-600">{ESTILO[i.estado].texto}</p>
                    <p className="mt-1 text-base text-slate-900 [overflow-wrap:anywhere]">{l.que}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {l.accion && l.href ? (
                        <Link href={l.href} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                          {l.accion}
                        </Link>
                      ) : null}
                      {l.quien === "tecnico" ? <p className="text-sm text-slate-700">Lo resuelve quien administra el sistema.</p> : null}
                      <EnlaceAvanzado href={`#salud-${i.clave}`} className="tactil inline-flex items-center px-1 text-sm font-medium text-slate-700 underline underline-offset-2">
                        Ver detalle técnico
                      </EnlaceAvanzado>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {r.verde > 0 ? <p className="text-sm text-slate-700">{r.verde} control(es) en orden. El detalle completo está en Avanzado.</p> : null}
        </section>

        {/* Avanzado: el tablero completo. */}
        <ul className="solo-avanzado grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li key={i.clave} id={`salud-${i.clave}`} tabIndex={-1} className={`rounded-xl border p-4 ${ESTILO[i.estado].caja}`}>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-700">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${ESTILO[i.estado].punto}`} /> {ESTILO[i.estado].texto}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">{i.titulo}</p>
              <p className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]">{i.detalle}</p>
              {i.accion &&
                (i.href ? (
                  <Link href={i.href} className="tactil mt-3 inline-flex items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                    {i.accion}
                  </Link>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">Qué hacer: {i.accion}</p>
                ))}
            </li>
          ))}
        </ul>
      </div>
    </MarcoPerfil>
  );
}
