import Link from "next/link";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { Anillo } from "@/components/premium/anillo";
import "@/components/perfiles/accesos-centrales.css";
import "./resumen.css";
import { leerResumenTodo } from "@/lib/resumen/servidor";
import { cifrasSinLeer, filasParaHoy } from "@/lib/resumen/filas";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ResumenVivo } from "@/components/resumen/resumen-vivo";
import { resumenSemana } from "@/lib/asistente/semana";
import { formatoNumero } from "@/lib/premium/anillo";
import { comparacionSemanal, totalPendiente } from "@/lib/resumen/pedidos";

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
  const filas = filasParaHoy(perfiles, 20);
  const sinLeer = cifrasSinLeer(perfiles);
  return (
    <div className="escena-oscura sala-perfil flex min-h-screen items-start justify-center px-4 py-12 sm:px-6">
      <SalaLampara />
      <main id="resumen" className="escena-capa rs relative w-full max-w-6xl">
        <div className="ac-cabecera">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Resumen de todo</h1>
            <p className="mt-2 text-sm">Lo pendiente de los cuatro perfiles, en un vistazo. Tocá una cifra o una fila para ver quiénes son y resolverlo acá mismo.</p>
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

        <ResumenVivo perfiles={perfiles} filas={filas} sinLeer={sinLeer} />
      </main>
    </div>
  );
}
