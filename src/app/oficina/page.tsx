import Link from "next/link";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "../cerebro/cerebro.css";
import { requirePageSession } from "@/lib/acceso/pagina";
import { Oficina } from "@/components/cerebro/oficina";
import { Clasico } from "@/components/premium";
import { leerOficina } from "@/lib/oficina/servidor";
import { esSector } from "@/lib/oficina/sectores";

export const metadata = { title: "Oficina de agentes" };
export const dynamic = "force-dynamic";

const fuente = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600", "800"], display: "swap", variable: "--cz-f" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--cz-mono" });

/**
 * Oficina de agentes (22/11): pantalla propia, con la Oficina 3D que antes vivía dentro del
 * Cerebro. Misma escena oscura y mismos datos; la escena 3D se carga perezosa (ssr:false)
 * dentro de `OficinaVisual`. Lo único que escribe: dejar una tarea, «Arrancar ahora» y
 * aprobar o descartar entregas, desde el panel lateral.
 */
export default async function OficinaPage({ searchParams }: { searchParams: Promise<{ sector?: string | string[] }> }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const sp = await searchParams;
  const sector = esSector(sp.sector) ? sp.sector : null;
  const oficina = await leerOficina();
    return (
    <div className={`cz ${fuente.variable} ${mono.variable}`} style={{ ["--cz-f" as string]: fuente.style.fontFamily, ["--cz-mono" as string]: mono.style.fontFamily }}>
      <Clasico cerebro>
        <nav className="cz-top" aria-label="Volver">
          <Link href="/cerebro" prefetch={false}>
            ← Cerebro
          </Link>
          <Link href="/bandeja" prefetch={false}>
            Bandeja para Claude
          </Link>
        </nav>
        <header className="cz-cab">
          <div className="cz-in">
            <p className="cz-k">Oficina de agentes</p>
            <h1>
              Los agentes, <b>trabajando</b>.
            </h1>
            <p className="cz-lead">Cada sector es una sala del edificio: tocala y entrás a ver a sus agentes. Cuando trabajan, llevan sus tareas al Cerebro, en el centro, que revisa todo antes de que te llegue. Nada se publica sin tu OK.</p>
          </div>
        </header>
        <main>
          <div className="cz-in">
          </div>
          <section id="oficina">
            <div className="cz-in">
              {oficina ? <Oficina inicial={oficina.tareas} arranqueInicial={oficina.arranque} sector={sector} /> : <p className="cz-muted">No pude leer la oficina ahora. Probá recargar en un rato.</p>}
            </div>
          </section>
        </main>
        <footer className="cz-foot">
          <div className="cz-in">
            <p>Los agentes dejan borradores: nada se publica ni se aplica sin tu aprobación.</p>
          </div>
        </footer>
      </Clasico>
    </div>
  );
}
