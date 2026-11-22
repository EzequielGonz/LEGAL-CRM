import Link from "next/link";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { Anillo } from "@/components/premium/anillo";
import "@/components/perfiles/accesos-centrales.css";
import "./resumen.css";
import { leerResumenTodo } from "@/lib/resumen/servidor";
import { cifrasSinLeer, filasParaHoy, textoCifra, type CifraResumen, type PerfilResumen } from "@/lib/resumen/filas";
import { requirePageSession } from "@/lib/acceso/pagina";
import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import { resumenSemana } from "@/lib/asistente/semana";
import { formatoNumero } from "@/lib/premium/anillo";
import { comparacionSemanal, pedidoDeFila, pedidoPropuestas, totalPendiente, totalPropuestas } from "@/lib/resumen/pedidos";

export const metadata = { title: "Resumen de todo" };
export const dynamic = "force-dynamic";

/**
 * Resumen de todo (22/11): seguimiento simple de los cuatro perfiles. Una tarjeta
 * por perfil con anillos de lo pendiente, cada cifra enlazada a donde se resuelve,
 * y arriba «Para hacer hoy». Solo cifras: ningún dato de prospectos. Cada rubro
 * muestra solo lo suyo; un dato que no se pudo leer figura «—», no 0.
 */
export default async function ResumenPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const [perfiles, semana] = await Promise.all([leerResumenTodo(), resumenSemana().catch(() => null)]);
  const total = totalPendiente(perfiles);
  const comparacion = comparacionSemanal(semana ? semana.perfiles.map((p) => p.cifras) : null);
  const props = totalPropuestas(perfiles);
  const filas = filasParaHoy(perfiles, 5);
  const sinLeer = cifrasSinLeer(perfiles);
  return (
    <div className="escena-oscura sala-perfil flex min-h-screen items-start justify-center px-4 py-12 sm:px-6">
      <SalaLampara />
      <main id="resumen" className="escena-capa rs relative w-full max-w-6xl">
        <div className="ac-cabecera">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Resumen de todo</h1>
            <p className="mt-2 text-sm">Lo pendiente de los cuatro perfiles, en un vistazo. Tocá una cifra para ir a resolverla.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/asistente" prefetch={false} className="ac-resumen">
              Pedile a Jarvis
              <span aria-hidden="true" className="ac-resumen__flecha">→</span>
            </Link>
            <Link href="/perfiles" prefetch={false} className="ac-volver">
              <span aria-hidden="true">←</span> Volver a Perfiles
            </Link>
          </div>
        </div>

        <section aria-labelledby="rs-total" className="rs-total">
          <h2 id="rs-total" className="rs-hoy__titulo">Los cuatro perfiles juntos</h2>
          <div className="rs-total__cuerpo">
            <div className="rs-total__anillo">
              {total === null ? (
                <span className="rs-sin rs-sin--grande" role="img" aria-label="Total pendiente: sin dato">—</span>
              ) : (
                <Anillo valor={total} meta={Math.max(10, total)} rubro="juridico" tamano="grande" nombre="Pendiente en los cuatro perfiles" unidad="pendientes" mostrarMeta={false} />
              )}
              <span className="rs-total__et">Pendiente en total</span>
            </div>
            <ul className="rs-sem" aria-label="Esta semana contra la anterior">
              {comparacion.map((c) => (
                <li key={c.clave} className="rs-sem__item">
                  <b>{c.actual === null ? "—" : formatoNumero(c.actual)}</b>
                  <span>{c.titulo}</span>
                  <i className={`rs-sem__var rs-sem__var--${c.variacion.flecha}`} aria-label={c.variacion.largo}>
                    {c.variacion.flecha === "sin_dato" ? "—" : `${c.variacion.flecha === "sube" ? "▲" : c.variacion.flecha === "baja" ? "▼" : "="} ${c.variacion.texto}`}
                  </i>
                </li>
              ))}
            </ul>
          </div>
          <p className="rs-nota rs-nota--izq">Semana contra la anterior. «—» es que no hay dato para comparar.</p>
        </section>

        <section aria-labelledby="rs-hoy" className="rs-hoy">
          <h2 id="rs-hoy" className="rs-hoy__titulo">Para hacer hoy</h2>
          {filas.length === 0 ? (
            <p className="rs-hoy__vacio">
              {sinLeer > 0 ? "No hay nada urgente en lo que se pudo leer. Algunas cifras figuran como «—»." : "Todo al día: no hay nada urgente en ningún perfil."}
            </p>
          ) : (
            <ol className="rs-hoy__lista">
              {filas.map((f, i) => (
                <li key={f.clave} style={{ ["--i" as string]: i }} className="rs-fila">
                  <span className="rs-fila__perfil">{f.perfil}</span>
                  <span className="rs-fila__texto">{f.texto}</span>
                  <span className="rs-fila__acciones">
                    <PedirAJarvis pedido={pedidoDeFila(f, perfiles)} className="rs-btn rs-btn--jarvis">
                      Pedile a Jarvis que lo haga<span className="sr-only">: {f.texto}</span>
                    </PedirAJarvis>
                    <Link href={f.href} prefetch={false} className="rs-btn">
                      Ir<span className="sr-only"> a {f.texto}</span>
                    </Link>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="rs-prop" className="rs-hoy rs-prop">
          <h2 id="rs-prop" className="rs-hoy__titulo">Tareas y propuestas por confirmar</h2>
          {props.total === 0 ? (
            <p className="rs-hoy__vacio">No hay propuestas esperando tu confirmación.</p>
          ) : (
            <>
              <ul className="rs-prop__lista">
                {props.porPerfil.map((x) => (
                  <li key={x.slug}>
                    <span>{x.nombre}</span>
                    <b>{x.valor === null ? "—" : formatoNumero(x.valor)}</b>
                  </li>
                ))}
              </ul>
              <div className="rs-prop__acciones">
                <Link href="/asistente" prefetch={false} className="rs-btn rs-btn--jarvis">
                  Confirmarlas en el asistente
                </Link>
                {props.total ? (
                  <PedirAJarvis pedido={pedidoPropuestas(props.total)} className="rs-btn">
                    Pedile a Jarvis que las repase
                  </PedirAJarvis>
                ) : null}
              </div>
            </>
          )}
        </section>

        <ul className="rs-grilla">
          {perfiles.map((p, i) => (
            <TarjetaPerfil key={p.slug} p={p} indice={i} />
          ))}
        </ul>
        {sinLeer > 0 ? <p className="rs-nota">«—» significa que ese dato no se pudo leer ahora; no es cero.</p> : null}
      </main>
    </div>
  );
}

function TarjetaPerfil({ p, indice }: { p: PerfilResumen; indice: number }) {
  return (
    <li className={`rs-card pm-rubro-${p.slug}`} style={{ ["--i" as string]: indice + 1 }}>
      <h2 className="rs-card__titulo">
        <span aria-hidden="true" className="rs-card__punto" />
        {p.nombre}
      </h2>
      <ul className="rs-cifras">
        {p.cifras.map((c) => (
          <li key={c.clave}>
            <Cifra c={c} slug={p.slug} nombre={p.nombre} />
          </li>
        ))}
      </ul>
    </li>
  );
}

function Cifra({ c, slug, nombre }: { c: CifraResumen; slug: PerfilResumen["slug"]; nombre: string }) {
  const sin = c.valor === null;
  return (
    <Link href={c.href} prefetch={false} className="rs-cifra" aria-label={`${nombre}: ${c.etiqueta}, ${sin ? "sin dato" : c.valor}. Abrir`}>
      {sin ? (
        <span aria-hidden="true" className="rs-sin">—</span>
      ) : (
        <Anillo valor={c.valor!} meta={Math.max(5, c.valor!)} rubro={slug} tamano="chico" nombre={c.etiqueta} unidad="pendientes" mostrarMeta={false} className="rs-anillo" />
      )}
      <span className="rs-cifra__etiqueta" aria-hidden="true">{c.etiqueta}</span>
      <span className="sr-only">{textoCifra(c.valor)}</span>
    </Link>
  );
}
