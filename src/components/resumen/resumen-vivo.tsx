"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Anillo } from "@/components/premium/anillo";
import { ListaEnLugar } from "@/components/resumen/lista-en-lugar";
import { AnotarPedido } from "@/components/resumen/anotar-pedido";
import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import type { FilaParaHoy, PerfilResumen, CifraResumen } from "@/lib/resumen/filas";
import { claveDeFila, claveDia, filtrarFilas, NIVELES, nivelDeUrgencia, type FiltroResumen, type NivelUrgencia } from "@/lib/resumen/lista-reglas";
import { pedidoDeCifra, pedidoDeFila } from "@/lib/resumen/pedidos";
import type { SlugPerfil } from "@/lib/marca";

const CLAVE_OCULTAS = "resumen-ocultas";
const ETQ_NIVEL = { urgente: "Urgente", hoy: "Del día", despues: "Puede esperar" } as const;

/**
 * Parte de trabajo del Resumen de todo (22/11): filtros por perfil y urgencia, «Para hacer hoy» con las
 * acciones en la misma fila, propuestas por confirmar, una tarjeta por perfil con cada cifra abierta en
 * lugar y un anotador de pendientes. Los rubros no se mezclan: una lista abierta es siempre de un perfil.
 */
export function ResumenVivo({ perfiles, filas, sinLeer }: { perfiles: PerfilResumen[]; filas: FilaParaHoy[]; sinLeer: number }) {
  const [filtro, setFiltro] = useState<FiltroResumen>({ slug: "todos", nivel: "todos" });
  const [abierta, setAbierta] = useState<string | null>(null);
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [cardAbierta, setCardAbierta] = useState<Record<string, string | null>>({});

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_OCULTAS) ?? "null");
      if (g?.dia === claveDia() && Array.isArray(g.claves)) setOcultas(new Set(g.claves));
    } catch {
      /* sin almacenamiento: el resumen funciona igual */
    }
  }, []);
  const ocultar = (clave: string) => {
    const nuevo = new Set(ocultas).add(clave);
    setOcultas(nuevo);
    try {
      localStorage.setItem(CLAVE_OCULTAS, JSON.stringify({ dia: claveDia(), claves: Array.from(nuevo) }));
    } catch {
      /* idem */
    }
  };

  const visibles = filtrarFilas(filas, filtro, ocultas);
  const perfilesVisibles = perfiles.filter((p) => filtro.slug === "todos" || p.slug === filtro.slug);
  const propPorPerfil = perfilesVisibles.map((p) => ({ p, c: p.cifras.find((c) => c.clave === "propuestas")! })).filter((x) => x.c && (x.c.valor ?? 0) > 0);
  const hrefDe = (slug: SlugPerfil, c: CifraResumen["clave"]) => perfiles.find((p) => p.slug === slug)?.cifras.find((x) => x.clave === c)?.href ?? "/perfiles";
  const nombreDe = (slug: SlugPerfil) => perfiles.find((p) => p.slug === slug)?.nombre ?? slug;

  return (
    <>
      <div className="rs-filtros" role="group" aria-label="Filtros del resumen">
        <div className="rs-filtros__grupo" role="group" aria-label="Por perfil">
          {[{ slug: "todos" as const, nombre: "Todos los perfiles" }, ...perfiles].map((p) => (
            <button key={p.slug} type="button" className="rs-chip" aria-pressed={filtro.slug === p.slug} onClick={() => setFiltro({ ...filtro, slug: p.slug })}>
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="rs-filtros__grupo" role="group" aria-label="Por urgencia">
          {NIVELES.map((n) => (
            <button key={n.clave} type="button" className="rs-chip rs-chip--suave" aria-pressed={filtro.nivel === n.clave} onClick={() => setFiltro({ ...filtro, nivel: n.clave as NivelUrgencia })}>
              {n.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <section aria-labelledby="rs-hoy" className="rs-hoy">
        <div className="rs-hoy__cab">
          <h2 id="rs-hoy" className="rs-hoy__titulo">Para hacer hoy</h2>
          {ocultas.size > 0 ? (
            <button type="button" className="rs-enlace" onClick={() => { setOcultas(new Set()); try { localStorage.removeItem(CLAVE_OCULTAS); } catch { /* idem */ } }}>
              Mostrar las {ocultas.size} ocultas
            </button>
          ) : null}
        </div>
        {visibles.length === 0 ? (
          <p className="rs-hoy__vacio">
            {filas.length === 0
              ? sinLeer > 0
                ? "No hay nada urgente en lo que se pudo leer. Algunas cifras figuran como «—»."
                : "Todo al día: no hay nada urgente en ningún perfil."
              : "Con este filtro no queda nada pendiente. Probá con «Todo»."}
          </p>
        ) : (
          <ol className="rs-hoy__lista">
            {visibles.map((f, i) => {
              const clave = claveDeFila(f);
              const abiertaAhora = abierta === f.clave;
              return (
                <li key={f.clave} style={{ ["--i" as string]: i }} className="rs-fila" data-abierta={abiertaAhora ? "1" : undefined}>
                  <div className="rs-fila__cab">
                    <span className="rs-fila__perfil">{f.perfil}</span>
                    <span className="rs-fila__texto">
                      {f.texto}
                      <i className={`rs-nivel rs-nivel--${nivelDeUrgencia(f.urgencia)}`}>{ETQ_NIVEL[nivelDeUrgencia(f.urgencia)]}</i>
                    </span>
                    <span className="rs-fila__acciones">
                      <button type="button" className="rs-btn rs-btn--jarvis" aria-expanded={abiertaAhora} aria-controls={`lista-${f.clave}`} onClick={() => setAbierta(abiertaAhora ? null : f.clave)}>
                        {abiertaAhora ? "Cerrar" : "Resolver acá"}
                        <span className="sr-only">: {f.texto}</span>
                      </button>
                      <button type="button" className="rs-btn rs-btn--suave" onClick={() => ocultar(f.clave)}>
                        Ocultar por hoy<span className="sr-only">: {f.texto}</span>
                      </button>
                    </span>
                  </div>
                  {abiertaAhora ? (
                    <div id={`lista-${f.clave}`} className="rs-fila__cuerpo">
                      <ListaEnLugar slug={f.slug} clave={clave} pedido={pedidoDeFila(f, perfiles)} hrefPantalla={f.href} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="rs-prop" className="rs-hoy rs-prop">
        <h2 id="rs-prop" className="rs-hoy__titulo">Propuestas de Jarvis por confirmar</h2>
        {propPorPerfil.length === 0 ? (
          <p className="rs-hoy__vacio">No hay propuestas esperando tu confirmación{filtro.slug !== "todos" ? " en este perfil" : ""}.</p>
        ) : (
          <ul className="rs-prop__grupos">
            {propPorPerfil.map(({ p, c }) => (
              <li key={p.slug} className="rs-prop__grupo">
                <h3 className="rs-prop__perfil">{p.nombre} <b>{c.valor}</b></h3>
                <ListaEnLugar slug={p.slug} clave="propuestas" pedido={pedidoDeCifra(p.nombre, "propuestas", c.valor)} hrefPantalla="/asistente" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="rs-grilla">
        {perfilesVisibles.map((p, i) => (
          <li key={p.slug} className={`rs-card pm-rubro-${p.slug}`} style={{ ["--i" as string]: i + 1 }}>
            <h2 className="rs-card__titulo">
              <span aria-hidden="true" className="rs-card__punto" />
              {p.nombre}
            </h2>
            <ul className="rs-cifras">
              {p.cifras.map((c) => {
                const sin = c.valor === null;
                const activa = cardAbierta[p.slug] === c.clave;
                const contenido = (
                  <>
                    {sin ? (
                      <span aria-hidden="true" className="rs-sin">—</span>
                    ) : (
                      <Anillo valor={c.valor!} meta={Math.max(5, c.valor!)} rubro={p.slug} tamano="chico" nombre={c.etiqueta} unidad="pendientes" mostrarMeta={false} className="rs-anillo" />
                    )}
                    <span className="rs-cifra__etiqueta" aria-hidden="true">{c.etiqueta}</span>
                  </>
                );
                return (
                  <li key={c.clave}>
                    {sin ? (
                      <Link href={c.href} prefetch={false} className="rs-cifra" aria-label={`${p.nombre}: ${c.etiqueta}, sin dato. Abrir la pantalla`}>
                        {contenido}
                      </Link>
                    ) : (
                      <button type="button" className="rs-cifra" aria-expanded={activa} aria-controls={`card-${p.slug}`} aria-label={`${p.nombre}: ${c.etiqueta}, ${c.valor}. ${activa ? "Cerrar" : "Ver quiénes"}`} onClick={() => setCardAbierta({ ...cardAbierta, [p.slug]: activa ? null : c.clave })}>
                        {contenido}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {cardAbierta[p.slug] ? (
              <div id={`card-${p.slug}`} className="rs-card__panel">
                <h3 className="rs-prop__perfil">{p.cifras.find((c) => c.clave === cardAbierta[p.slug])?.etiqueta}</h3>
                <ListaEnLugar key={cardAbierta[p.slug]!} slug={p.slug} clave={cardAbierta[p.slug] as CifraResumen["clave"]} pedido={pedidoDeCifra(nombreDe(p.slug), cardAbierta[p.slug] as CifraResumen["clave"], p.cifras.find((c) => c.clave === cardAbierta[p.slug])?.valor ?? null)} hrefPantalla={hrefDe(p.slug, cardAbierta[p.slug] as CifraResumen["clave"])} />
              </div>
            ) : (
              <p className="rs-card__pista">Tocá una cifra para ver quiénes son y resolverlo acá.</p>
            )}
          </li>
        ))}
      </ul>
      {sinLeer > 0 ? <p className="rs-nota">«—» significa que ese dato no se pudo leer ahora; no es cero.</p> : null}

      <section aria-labelledby="rs-anotar" className="rs-hoy">
        <h2 id="rs-anotar" className="rs-hoy__titulo">Mis pendientes</h2>
        <AnotarPedido perfiles={perfiles.map((p) => ({ slug: p.slug, nombre: p.nombre }))} />
        <div className="rs-prop__acciones">
          {perfilesVisibles.map((p) => (
            <Link key={p.slug} href={`/bandeja?perfil=${p.slug}`} prefetch={false} className="rs-btn rs-btn--suave">
              Bandeja de {p.nombre}
            </Link>
          ))}
          <PedirAJarvis pedido={`Repasá mis pendientes y lo urgente de hoy en todos los perfiles y decime por dónde empezar. ${"Proponémelo paso a paso y no ejecutes nada hasta que yo te lo confirme."}`} className="rs-btn rs-btn--jarvis">
            Pedile a Jarvis que ordene mi día
          </PedirAJarvis>
        </div>
      </section>
    </>
  );
}
