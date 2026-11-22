import { leerFallas, type Falla } from "@/lib/salud/fallas";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import { perfilActivo } from "@/lib/perfil-activo";
import Link from "next/link";
import { MarcoPerfil } from "@/components/perfiles/marco-perfil";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { esSlugPerfil, type SlugPerfil } from "@/lib/marca";
import { leerSalud, resumenSalud, type ItemSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";
import { leerSaludWasender } from "@/lib/wasender/salud";
import { Bento, CabezaPantalla, Estadistica, Kicker, Luz, Tarjeta, Vacio } from "@/components/ui/diseno";
import { cantidad } from "@/lib/textos/pantalla";

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
export default async function SaludPage(props: { searchParams: Promise<{ perfil?: string }> }) {
  const searchParams = await props.searchParams;
  const slug: SlugPerfil = await perfilActivo(searchParams.perfil);
  // 15/11: los datos se empiezan a pedir acá y se esperan adentro del marco, así la marca y el
  // menú del marco se leen a la vez que la salud (antes el marco esperaba a que terminara todo).
  // 12/11: las líneas de Wasender también son salud del sistema (antes no aparecían).
  const datos = Promise.all([leerSalud(), leerSaludWasender().catch(() => []), leerFallas(slug).catch(() => [])]);
  // Si el marco falla antes de esperar los datos, el rechazo no queda sin atender (el contenido lo vuelve a ver).
  datos.catch(() => {});
  return (
    <MarcoPerfil slug={slug} sinSalud>
      <SaludContenido slug={slug} datos={datos} />
    </MarcoPerfil>
  );
}

/** 17/11: los controles de Wasender van en su propio bloque, separados de Meta. */
function esDeWasender(i: ItemSalud): boolean {
  return i.clave.startsWith("wasender_");
}

async function SaludContenido({ slug, datos }: { slug: SlugPerfil; datos: Promise<[ItemSalud[], ItemSalud[], Falla[]]> }) {
  const [base, wasender, fallas] = await datos;
  // 13/11 · cada rubro separado: en cada perfil, lo de todo el sistema y lo propio. Lo de otro perfil se ve en ese perfil.
  const items = itemsDelPerfil([...base, ...wasender], slug);
  const r = resumenSalud(items);
  const rojos = items.filter((i) => i.estado === "rojo");
  const amarillos = items.filter((i) => i.estado === "amarillo");
  return (
      <div className="mx-auto max-w-5xl space-y-6">
        <CabezaPantalla kicker="Salud del sistema" titulo={r.rojo ? "Hay algo que frena el trabajo" : r.amarillo ? "Nada frena el trabajo" : "Todo en orden"} bajada="Se actualiza cada vez que entrás." />

        {/* 22/11: las tres cifras del tablero en una tira bento, con su luz. */}
        <Bento etiqueta="Resumen de la salud del sistema">
          <Tarjeta ancho="3" estado={r.rojo ? "mal" : "apagado"} href={r.rojo ? "#salud-simple" : undefined} etiquetaEnlace={r.rojo ? `${r.rojo} frenan la operación: ver cuáles` : undefined}>
            <div className="flex items-center gap-2"><Luz estado={r.rojo ? "mal" : "apagado"} late={r.rojo > 0} /><Kicker>Frenan</Kicker></div>
            <Estadistica etiqueta="Frenan la operación" valor={r.rojo} />
          </Tarjeta>
          <Tarjeta ancho="3" estado={r.amarillo ? "aviso" : "apagado"} href={r.amarillo ? "#salud-simple" : undefined} etiquetaEnlace={r.amarillo ? `${r.amarillo} para revisar: ver cuáles` : undefined}>
            <div className="flex items-center gap-2"><Luz estado={r.amarillo ? "aviso" : "apagado"} /><Kicker>Revisar</Kicker></div>
            <Estadistica etiqueta="Para revisar" valor={r.amarillo} />
          </Tarjeta>
          <Tarjeta ancho="3" estado="ok">
            <div className="flex items-center gap-2"><Luz estado="ok" /><Kicker>En orden</Kicker></div>
            <Estadistica etiqueta="Controles en orden" valor={r.verde} />
          </Tarjeta>
          <Tarjeta ancho="3" estado={fallas.length ? "mal" : "ok"} href="#fallas" etiquetaEnlace={`${cantidad(fallas.length, "falla")} del sistema en 24 horas: ver detalle`}>
            <div className="flex items-center gap-2"><Luz estado={fallas.length ? "mal" : "ok"} /><Kicker>Últimas 24 h</Kicker></div>
            <Estadistica etiqueta="Fallas del sistema" valor={fallas.length} />
          </Tarjeta>
        </Bento>

        {/* 13/11 · fallas del sistema: problemas nuestros, aparte de las incidencias de personas. */}
        <section id="fallas" aria-labelledby="salud-fallas" tabIndex={-1} className="d-tarjeta scroll-mt-24">
          <h2 id="salud-fallas" className="text-lg font-semibold text-slate-950">
            Fallas del sistema
          </h2>
          <p className="mt-1 text-sm text-slate-600">Cosas que fallaron de nuestro lado: mensajes que no salieron, seguimientos trabados o el bot que no pudo contestar. No son reclamos de personas.</p>
          {fallas.length === 0 ? (
            <Vacio titulo="Sin fallas en las últimas 24 horas" texto="Todos los mensajes, seguimientos y respuestas del bot salieron bien." />
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {fallas.map((f) => (
                <li key={f.clave} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{f.titulo}</p>
                    <p className="text-[13px] text-slate-600">{f.alcance === "sistema" ? "De todo el sistema" : "De este perfil"}</p>
                  </div>
                  <Link prefetch={false} href={f.href} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
                    {f.accion}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Simple: lo que frena el trabajo, en palabras simples y con quién lo resuelve. */}
        <section id="salud-simple" aria-labelledby="salud-simple-titulo" tabIndex={-1} className="solo-simple scroll-mt-24 space-y-4">
          <h2 id="salud-simple-titulo" className="text-xl font-semibold text-slate-900">
            {r.rojo ? (r.rojo === 1 ? "Un problema frena el trabajo" : `${cantidad(r.rojo, "problema")} frenan el trabajo`) : r.amarillo ? "Nada frena el trabajo; hay puntos para revisar" : "Todo en orden"}
          </h2>
          {[...rojos, ...amarillos].length > 0 ? (
            <ul className="d-revelar space-y-2">
              {[...rojos, ...amarillos].map((i) => {
                const l = lecturaSimple(i);
                return (
                  <li key={i.clave} className="d-tarjeta" data-estado={i.estado === "rojo" ? "mal" : "aviso"}>
                    <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                      <Luz estado={i.estado === "rojo" ? "mal" : "aviso"} late={i.estado === "rojo"} />
                      {ESTILO[i.estado].texto} · {esDeWasender(i) ? "WhatsApp por QR (Wasender)" : "Sistema y WhatsApp oficial (Meta)"}
                    </p>
                    <p className="mt-1 text-base text-slate-900 [overflow-wrap:anywhere]">{l.que}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {l.accion && l.href ? (
                        <Link prefetch={false} href={l.href} className="tactil inline-flex items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
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
          {r.verde > 0 ? <p className="text-sm text-slate-700">{r.verde === 1 ? "Un control en orden" : `${cantidad(r.verde, "control")} en orden`}. El detalle completo está en «Más opciones», al pie.</p> : null}
        </section>

        {/* Avanzado: el tablero completo. 17/11: Meta y Wasender en bloques separados. */}
        {([
          ["Sistema y WhatsApp oficial (Meta)", items.filter((x) => !esDeWasender(x))],
          ["WhatsApp por QR (Wasender)", items.filter(esDeWasender)],
        ] as const).map(([tituloBloque, lista]) =>
          lista.length === 0 ? null : (
          <section key={tituloBloque} aria-label={tituloBloque} className="solo-avanzado space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">{tituloBloque}</h2>
            <ul className="d-revelar grid gap-3 md:grid-cols-2">
              {lista.map((i) => (
            <li key={i.clave} id={`salud-${i.clave}`} tabIndex={-1} className={`rounded-xl border p-4 ${ESTILO[i.estado].caja}`}>
              <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">
                <Luz estado={i.estado === "rojo" ? "mal" : i.estado === "amarillo" ? "aviso" : "ok"} /> {ESTILO[i.estado].texto}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">{i.titulo}</p>
              <p className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]">{i.detalle}</p>
              {i.accion &&
                (i.href ? (
                  <Link prefetch={false} href={i.href} className="tactil mt-3 inline-flex items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                    {i.accion}
                  </Link>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">Qué hacer: {i.accion}</p>
                ))}
            </li>
          ))}
            </ul>
          </section>
          )
        )}
      </div>
  );
}
