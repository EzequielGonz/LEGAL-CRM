import type { Falla } from "@/lib/salud/fallas";
import Link from "next/link";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import type { SlugPerfil } from "@/lib/marca";
import { resumenSalud, type ItemSalud } from "@/lib/salud";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import { lecturaSimple } from "@/lib/salud/reglas";
import { Bento, CabezaPantalla, Estadistica, Kicker, Luz, Tarjeta, Vacio } from "@/components/ui/diseno";
import { cantidad } from "@/lib/textos/pantalla";
import { Boton, Clasico, Medidor, Tarjeta as Tarjeta2, VerMas } from "@/components/premium";

const ESTILO: Record<ItemSalud["estado"], { caja: string; punto: string; texto: string; borde: string }> = {
  rojo: { caja: "border-red-300 bg-red-50", punto: "bg-red-600", texto: "Frena la operación", borde: "border-l-red-600" },
  amarillo: { caja: "border-amber-300 bg-amber-50", punto: "bg-amber-500", texto: "Para revisar", borde: "border-l-amber-500" },
  verde: { caja: "border-emerald-200 bg-white", punto: "bg-emerald-600", texto: "En orden", borde: "border-l-emerald-600" },
};

/** 17/11: los controles de Wasender van en su propio bloque, separados de Meta. */
function esDeWasender(i: ItemSalud): boolean {
  return i.clave.startsWith("wasender_");
}

/** La presentación de Salud, separada de la lectura de datos (así se puede ver con datos de ejemplo). */
export function SaludVista({ slug, base, wasender, fallas }: { slug: SlugPerfil; base: ItemSalud[]; wasender: ItemSalud[]; fallas: Falla[] }) {
  // 13/11 · cada rubro separado: en cada perfil, lo de todo el sistema y lo propio. Lo de otro perfil se ve en ese perfil.
  const items = itemsDelPerfil([...base, ...wasender], slug);
  const r = resumenSalud(items);
  const rojos = items.filter((i) => i.estado === "rojo");
  const amarillos = items.filter((i) => i.estado === "amarillo");
  const total = items.length;
  const enOrden = total === 0 ? 100 : Math.round((r.verde / total) * 100);
  const aRevisar = amarillos.slice(0, 3);
  const Problema = ({ i }: { i: ItemSalud }) => {
    const l = lecturaSimple(i);
    return (
      <li className="pc-falla" data-estado={i.estado === "rojo" ? "mal" : "aviso"}>
        <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <Luz estado={i.estado === "rojo" ? "mal" : "aviso"} late={i.estado === "rojo"} />
          {ESTILO[i.estado].texto} · {esDeWasender(i) ? "WhatsApp por QR (Wasender)" : "Sistema y WhatsApp oficial (Meta)"}
        </p>
        <p className="pc-falla__que">{l.que}</p>
        <div className="pc-falla__fila">
          {l.accion && l.href ? (
            <Boton href={l.href} variante="primario">
              {l.accion}
            </Boton>
          ) : null}
          {l.quien === "tecnico" ? <span className="pc-nota">Lo resuelve quien administra el sistema.</span> : null}
          <EnlaceAvanzado href={`#salud-${i.clave}`} className="tactil inline-flex items-center px-1 text-sm font-medium text-slate-700 underline underline-offset-2">
            Ver detalle técnico
          </EnlaceAvanzado>
        </div>
      </li>
    );
  };
  return (
      <Clasico className="mx-auto max-w-5xl space-y-6">
        <CabezaPantalla kicker="Salud del sistema" titulo={r.rojo ? "Hay algo que frena el trabajo" : r.amarillo ? "Nada frena el trabajo" : "Todo en orden"} bajada="Se actualiza cada vez que entrás." />

        {/* 22/11: lo grave va arriba y siempre a la vista (en los dos niveles), nunca detrás de «Ver más». */}
        {rojos.length > 0 ? (
          <div id="salud-simple" tabIndex={-1} className="scroll-mt-24">
          <Tarjeta2 rubro={slug} aparecer={0} className="pc-grave" titulo={rojos.length === 1 ? "Un problema frena el trabajo" : `${cantidad(rojos.length, "problema")} frenan el trabajo`} nivelTitulo={2} como="section">
            <ul className="pc-lista">
              {rojos.map((i) => (
                <Problema key={i.clave} i={i} />
              ))}
            </ul>
          </Tarjeta2>
          </div>
        ) : null}

        <div className="pc-salud">
          <Tarjeta2 rubro={slug} relieve aparecer={1} como="section">
            <div className="pc-medidor-celda">
              <Medidor valor={enOrden} sufijo="%" rubro={slug} nombre="Servicios en orden" unidad="por ciento" etiqueta="servicios en orden" />
              <p className="pc-nota">{total === 0 ? "No hay controles para este perfil." : `${r.verde} de ${total} funcionan bien`}</p>
            </div>
          </Tarjeta2>
          <Tarjeta2 rubro={slug} aparecer={2} como="section" titulo={aRevisar.length ? "Para revisar" : r.rojo ? "Lo demás está en orden" : "Todo en orden"} nivelTitulo={2}>
            {aRevisar.length > 0 ? (
              <ul className="pc-lista">
                {aRevisar.map((i) => (
                  <Problema key={i.clave} i={i} />
                ))}
              </ul>
            ) : (
              <p className="pc-nota">{r.rojo ? "Fuera de lo de arriba, nada más para revisar." : "No hay nada para arreglar ahora."}</p>
            )}
            {amarillos.length > aRevisar.length ? <p className="pc-nota mt-3">Y {cantidad(amarillos.length - aRevisar.length, "punto")} más para revisar en «Ver más».</p> : null}
          </Tarjeta2>
        </div>

        <VerMas cerrado={`Ver más${fallas.length ? ` · ${cantidad(fallas.length, "falla")} en 24 h` : ""}`} abierto="Ver menos">
          <div className="space-y-6">
            {amarillos.length > aRevisar.length ? (
              <ul className="pc-lista">
                {amarillos.slice(aRevisar.length).map((i) => (
                  <Problema key={i.clave} i={i} />
                ))}
              </ul>
            ) : null}
            {/* Las tres cifras del tablero en una tira bento, con su luz. */}
            <Bento etiqueta="Resumen de la salud del sistema">
              <Tarjeta ancho="3" estado={r.rojo ? "mal" : "apagado"} href={r.rojo ? "#salud-simple" : undefined} etiquetaEnlace={r.rojo ? `${r.rojo} frenan la operación: ver cuáles` : undefined}>
                <div className="flex items-center gap-2"><Luz estado={r.rojo ? "mal" : "apagado"} late={r.rojo > 0} /><Kicker>Frenan</Kicker></div>
                <Estadistica etiqueta="Frenan la operación" valor={r.rojo} />
              </Tarjeta>
              <Tarjeta ancho="3" estado={r.amarillo ? "aviso" : "apagado"}>
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
                      <Boton href={f.href}>{f.accion}</Boton>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {r.verde > 0 ? <p className="pc-nota">{r.verde === 1 ? "Un control en orden" : `${cantidad(r.verde, "control")} en orden`}. El detalle completo está en «Más opciones», al pie.</p> : null}
          </div>
        </VerMas>

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
      </Clasico>
  );
}
