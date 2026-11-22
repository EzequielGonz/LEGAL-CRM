import Link from "next/link";
import { preload } from "react-dom";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "../cerebro/cerebro.css";
import "./oficina.css";
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
  // Velocidad (22/11): los modelos 3D empiezan a bajar con el HTML, en paralelo con el código de la escena.
  for (const m of ["muebles", "animaciones", "casual_male", "casual_female", "suit_male", "suit_female", "worker_female", "casual2_male"]) {
    preload(`/modelos/oficina/${m}.glb`, { as: "fetch", crossOrigin: "anonymous" });
  }
  const sp = await searchParams;
  const sector = esSector(sp.sector) ? sp.sector : null;
  const oficina = await leerOficina();
    return (
    <div className={`cz of3-pagina ${fuente.variable} ${mono.variable}`} style={{ ["--cz-f" as string]: fuente.style.fontFamily, ["--cz-mono" as string]: mono.style.fontFamily }}>
      <Clasico cerebro>
        <nav className="cz-top" aria-label="Volver">
          <Link href="/cerebro" prefetch={false}>
            ← Cerebro
          </Link>
          <Link href="/bandeja" prefetch={false}>
            Bandeja para Claude
          </Link>
        </nav>
        <header className="cz-cab of3-cab">
          <div className="cz-in">
            <p className="of3-pildora">Oficina de agentes</p>
            <h1 className="of3-titulo">
              {["Tus", "agentes,"].map((w, i) => (
                <span key={w} className="pal" style={{ animationDelay: `${i * 0.08}s` }}>
                  {w}{" "}
                </span>
              ))}
              <em className="recuadro pal" style={{ animationDelay: "0.2s" }}>
                trabajando
              </em>
              <span className="pal" style={{ animationDelay: "0.3s" }}>
                {" "}en vivo.
              </span>
            </h1>
            <p className="cz-lead of3-lead">
              Entrá a cada sala, caminá entre los escritorios y hablá con cada agente. Los que terminan llevan su carpeta al <q>Cerebro</q>, que revisa todo antes de que te llegue. Nada se publica sin tu OK.
            </p>
          </div>
        </header>
        <main>
          <section id="oficina" className="of3-seccion">
            <div className="of3-ancho">
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
