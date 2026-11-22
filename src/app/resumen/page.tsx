import Link from "next/link";
import { SalaLampara } from "@/components/ui/lampara-dibujo";
import { Anillo } from "@/components/premium/anillo";
import "@/components/perfiles/accesos-centrales.css";
import "./resumen.css";
import { leerResumenTodo } from "@/lib/resumen/servidor";
import { cifrasSinLeer, filasParaHoy, textoCifra, type CifraResumen, type PerfilResumen } from "@/lib/resumen/filas";
import { requirePageSession } from "@/lib/acceso/pagina";

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
  const perfiles = await leerResumenTodo();
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

        <section aria-labelledby="rs-hoy" className="rs-hoy">
          <h2 id="rs-hoy" className="rs-hoy__titulo">Para hacer hoy</h2>
          {filas.length === 0 ? (
            <p className="rs-hoy__vacio">
              {sinLeer > 0 ? "No hay nada urgente en lo que se pudo leer. Algunas cifras figuran como «—»." : "Todo al día: no hay nada urgente en ningún perfil."}
            </p>
          ) : (
            <ol className="rs-hoy__lista">
              {filas.map((f, i) => (
                <li key={f.clave} style={{ ["--i" as string]: i }}>
                  <Link href={f.href} prefetch={false} className="rs-fila">
                    <span className="rs-fila__perfil">{f.perfil}</span>
                    <span className="rs-fila__texto">{f.texto}</span>
                    <span aria-hidden="true" className="rs-fila__ir">Ver →</span>
                  </Link>
                </li>
              ))}
            </ol>
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
