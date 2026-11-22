import Link from "next/link";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import "@/components/perfiles/accesos-centrales.css";
import "./resumen.css";
import { leerResumenTodo } from "@/lib/resumen/servidor";
import { cifrasSinLeer, filasParaHoy } from "@/lib/resumen/filas";
import { requirePageSession } from "@/lib/acceso/pagina";
import { ResumenVivo } from "@/components/resumen/resumen-vivo";
import { resumenSemanaEnMemoria } from "@/lib/asistente/semana-cache";
import { Cifra } from "@/components/premium/cifra";
import { Cartel } from "@/components/vivo/cartel";
import { BarrasMini, BentoColor, CeldaColor } from "@/components/vivo/bento-color";
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
  const [perfiles, semana] = await Promise.all([leerResumenTodo(), resumenSemanaEnMemoria().catch(() => null)]);
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
            <Cartel como="h1" tamano="xl" antetitulo="Los cuatro perfiles," texto="Resumen de [todo]" />
            <p className="mt-3 text-sm">Lo pendiente de los cuatro perfiles, en un vistazo. Tocá una cifra o una fila para ver quiénes son y resolverlo acá mismo.</p>
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

        {/* Vuelta 6: bento de colores con las cifras reales (cada caja entra creciendo, escalonada). */}
        <section aria-labelledby="rs-total" className="rs-total-vivo">
          <h2 id="rs-total" className="sr-only">Los cuatro perfiles juntos</h2>
          <BentoColor etiqueta="Los cuatro perfiles juntos, esta semana contra la anterior">
            <CeldaColor color="violeta" etiqueta="Pendiente en los cuatro perfiles" area="vv-c-grande" orden={0}>
              <div className="vv-celda-fila">
                <span className="vv-num">{total === null ? "—" : <Cifra valor={total} tamano="xl" />}</span>
              </div>
              <p className="vv-celda__texto">Tocá una fila de abajo para resolverlo acá mismo.</p>
            </CeldaColor>
            {comparacion.map((c, i) => {
              const color = (["rosa", "amarillo", "agua", "lila"] as const)[i % 4];
              const area = ["vv-c-media", "vv-c-chica", "vv-c-chica", "vv-c-media"][i % 4];
              return (
                <CeldaColor key={c.clave} color={color} etiqueta={c.titulo} area={area} orden={i + 1}>
                  <div className="vv-celda-fila">
                    <span className="vv-num vv-num--m">{c.actual === null ? "—" : <Cifra valor={c.actual} tamano="l" />}</span>
                    <span className="vv-variacion" aria-label={c.variacion.largo}>
                      {c.variacion.flecha === "sin_dato" ? "—" : `${c.variacion.flecha === "sube" ? "▲" : c.variacion.flecha === "baja" ? "▼" : "="} ${c.variacion.texto}`}
                    </span>
                  </div>
                  <BarrasMini
                    etiqueta={`${c.titulo}: semana anterior contra esta`}
                    datos={[
                      { nombre: "Anterior", valor: c.anterior },
                      { nombre: "Esta", valor: c.actual, resaltar: true },
                    ]}
                  />
                </CeldaColor>
              );
            })}
          </BentoColor>
          <p className="rs-nota rs-nota--izq">Semana contra la anterior. «—» es que no hay dato para comparar.</p>
        </section>

        <ResumenVivo perfiles={perfiles} filas={filas} sinLeer={sinLeer} />
      </main>
    </div>
  );
}
