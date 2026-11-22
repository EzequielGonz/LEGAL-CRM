import type { ReactNode } from "react";
// Imports directos (no el índice): Hoy no arrastra componentes que no usa (vercel-react-best-practices, bundle-barrel-imports).
import { Anillo } from "@/components/premium/anillo";
import { Cifra } from "@/components/premium/cifra";
import { Cartel } from "@/components/vivo/cartel";
import { BarrasMini, BentoColor, CeldaColor } from "@/components/vivo/bento-color";
import { VidrioCirculos } from "@/components/vivo/vidrio-circulos";
import { BotonNeu, IconoNeu } from "@/components/vivo/boton-neu";
import { Paralaje } from "@/components/vivo/paralaje";
import { formatoNumero } from "@/lib/premium/anillo";
import { Boton } from "@/components/premium/boton";
import { BotonJarvis } from "@/components/premium/boton-jarvis";
import { Tarjeta } from "@/components/premium/tarjeta";
import { VerMas } from "@/components/premium/ver-mas";
import { marcaDe, type SlugPerfil } from "@/lib/marca";
import { seccionesDePerfil } from "@/lib/menu";
import type { FilaDecidir, Franja } from "@/lib/hoy/resumen-hoy";

/**
 * «Hoy» en bento (22/11): saludo de Jarvis arriba, un anillo grande de protagonista, tres anillos chicos
 * de la semana, «Para decidir» (máximo tres filas y el resto detrás de «Ver más») y una franja de estado.
 * Es puro: recibe los datos ya leídos y arma la pantalla, así se prueba y se fotografía con datos de ejemplo.
 * Estética clásica del panel (fondo, colores y tipografía de siempre) con detalles: anillos con relieve,
 * sombras en capas, borde con brillo superior, inclinación 3D leve y entradas escalonadas.
 * Un solo acento: el del perfil (el marco lo fija con `data-tema`).
 */
export interface DatosHoyBento {
  slug: SlugPerfil;
  saludo: string;
  frases: [string, string?];
  /** Anillo grande: captados que esperan pasar a quien los atiende. */
  porDerivar: number;
  derivadosSemana: number | null;
  /** Anillos chicos de la semana (null = no se pudo leer; se muestra «—», nunca cero). */
  semana: { contactados: number | null; escribieron: number | null; captados: number | null; derivados: number | null };
  metaAnillo: number;
  decidir: FilaDecidir[];
  franja: Franja;
  /** Lo que no entra en la pantalla principal: listas completas, estado de líneas, bot, descartes. */
  detalle: ReactNode;
  /** «Ver más» abierto (el enlace de «Responder» o «Derivar» lo pide). */
  verMasAbierto?: boolean;
}

const FILAS_VISIBLES = 3;

/** «Buenas tardes» → «Buenas [tardes.]»: la última palabra del saludo va recuadrada en serif itálica. */
function saludoCartel(saludo: string): string {
  const ps = `${saludo}.`.split(" ");
  if (ps.length < 2) return ps.join(" ");
  return `${ps.slice(0, -1).join(" ")} [${ps[ps.length - 1]}]`;
}

const ICONO_ATAJO: Record<string, ReactNode> = { Contactos: IconoNeu.personas, Etapas: IconoNeu.personas, Citas: IconoNeu.calendario, Seguimiento: IconoNeu.seguimiento };

/** Cifra de una caja de color: cuenta desde 0; sin dato, «—» (nunca cero). */
function NumeroCelda({ valor, medio = false }: { valor: number | null; medio?: boolean }) {
  return <span className={`vv-num${medio ? " vv-num--m" : ""}`}>{valor === null ? "—" : <Cifra valor={valor} tamano="xl" />}</span>;
}

export function HoyBento({ d }: { d: DatosHoyBento }) {
  const visibles = d.decidir.slice(0, FILAS_VISIBLES);
  const resto = d.decidir.slice(FILAS_VISIBLES);
  const franja = (
    <section className="hy-franja" data-estado={d.franja.estado} role={d.franja.estado === "mal" ? "alert" : "status"} aria-label="Estado del sistema">
      <span className="hy-franja__luz" aria-hidden="true" />
      <p className="hy-franja__texto">
        <strong>{d.franja.titulo}.</strong> {d.franja.detalle ?? ""}
      </p>
      {d.franja.accion && d.franja.href ? (
        <Boton href={d.franja.href} variante={d.franja.estado === "mal" ? "primario" : "secundario"}>
          {d.franja.accion}
        </Boton>
      ) : null}
    </section>
  );
  const graveArriba = d.franja.estado === "mal";
  const urgentes = d.decidir.filter((f) => f.urgencia === 1).length;
  const atajos = (seccionesDePerfil(d.slug).find((x) => x.clave === "contactos")?.tabs ?? []).filter((t) => !t.oculto).slice(0, 3);
  const s = d.semana;
  return (
    <div className="hy-pagina vv-hoy">
      {graveArriba ? franja : null}

      {/* Vuelta 6: cabecera parallax en capas (como «Viaja lejos» del video) con el saludo como cartel animado. */}
      <div className="vv-hoy__fila">
        <Paralaje>
          <Cartel como="h2" tamano="xl" antetitulo={`Jarvis · ${marcaDe(d.slug).nombre}`} texto={saludoCartel(d.saludo)} />
          <p className="vv-paralaje__frases">
            <span>{d.frases[0]}</span>
            {d.frases[1] ? <span>{d.frases[1]}</span> : null}
          </p>
          <div className="vv-paralaje__acciones">
            {d.decidir.length > 0 ? (
              <Boton href="#hoy-decidir" variante="primario">
                {d.decidir.length === 1 ? "Ver qué decidir" : `Ver ${d.decidir.length} cosas para decidir`}
              </Boton>
            ) : null}
            <BotonJarvis>Hablar con Jarvis</BotonJarvis>
          </div>
        </Paralaje>

        <div className="vv-hoy__lado">
          {/* Tarjeta de vidrio sobre círculos de color (dentro del componente, no en el fondo). */}
          <VidrioCirculos etiqueta="Para decidir hoy">
            <span className="vv-vidrio__chico">Para decidir hoy</span>
            <span className="vv-vidrio__nota">{urgentes > 0 ? `${urgentes === 1 ? "1 urgente" : `${urgentes} urgentes`}, primero` : "Nada urgente"}</span>
            <span className="vv-vidrio__grande">{d.decidir.length === 0 ? "Al día" : <Cifra valor={d.decidir.length} tamano="xl" />}</span>
          </VidrioCirculos>
          {/* Botones neumórficos: salen de la placa y se hunden al tocarlos. */}
          <nav aria-label="Atajos" className="vv-neu-placa">
            <BotonNeu href={`/conversaciones?perfil=${d.slug}`} icono={IconoNeu.chat}>
              Chats
            </BotonNeu>
            {atajos.map((t) => {
              const nombre = t.label === "Etapas" ? "Contactos" : t.label;
              return (
                <BotonNeu key={t.href} href={t.href} icono={ICONO_ATAJO[t.label] ?? IconoNeu.play}>
                  {nombre}
                </BotonNeu>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bento de colores con las cifras reales: cada caja entra creciendo, escalonada. */}
      <Cartel como="h2" tamano="m" antetitulo="Tu semana," texto="en [cajitas]" className="vv-seccion-titulo" retrasoMs={200} />
      <BentoColor className="vv-bento--hoy" etiqueta="Cifras de hoy y de la semana">
        <CeldaColor color="violeta" etiqueta="Captados sin derivar" area="vv-c-grande" orden={0} como="section">
          <div className="vv-celda-fila">
            <NumeroCelda valor={d.porDerivar} />
            {d.derivadosSemana === null ? null : (
              <span className="vv-anillo-pie">
                <Anillo valor={d.derivadosSemana} meta={Math.max(1, d.porDerivar + d.derivadosSemana)} rubro={d.slug} tamano="medio" nombre="Derivados esta semana" unidad="captados de la semana" />
                Derivados
              </span>
            )}
          </div>
          <p className="vv-celda__texto">
            {d.derivadosSemana === null ? "No se pudo leer cuántos se derivaron esta semana." : d.derivadosSemana === 0 ? "Todavía no derivaste ninguno esta semana." : (
              <>
                <strong>{formatoNumero(d.derivadosSemana)}</strong> ya {d.derivadosSemana === 1 ? "derivado" : "derivados"} esta semana.
              </>
            )}
          </p>
        </CeldaColor>
        <CeldaColor color="rosa" etiqueta="Escribieron" area="vv-c-media" orden={1}>
          <NumeroCelda valor={s.escribieron} medio />
          <p className="vv-celda__texto">{s.contactados === null ? "de los contactados" : `de ${formatoNumero(s.contactados)} contactados`}</p>
        </CeldaColor>
        <CeldaColor color="amarillo" etiqueta="Captados" area="vv-c-alta" orden={2}>
          <NumeroCelda valor={s.captados} medio />
          <p className="vv-celda__texto">{s.escribieron === null ? "de los que escribieron" : `de ${formatoNumero(s.escribieron)} que escribieron`}</p>
        </CeldaColor>
        <CeldaColor color="agua" etiqueta="Derivados" area="vv-c-chica" orden={3}>
          <NumeroCelda valor={s.derivados} medio />
        </CeldaColor>
        <CeldaColor color="lila" etiqueta="Contactados" area="vv-c-chica" orden={4}>
          <NumeroCelda valor={s.contactados} medio />
        </CeldaColor>
        <CeldaColor color="rosa-claro" etiqueta="La semana, paso a paso" area="vv-c-toda" orden={5}>
          <BarrasMini
            etiqueta="De los contactados a los derivados, esta semana"
            datos={[
              { nombre: "Contactados", valor: s.contactados },
              { nombre: "Escribieron", valor: s.escribieron },
              { nombre: "Captados", valor: s.captados },
              { nombre: "Derivados", valor: s.derivados, resaltar: true },
            ]}
          />
        </CeldaColor>
      </BentoColor>

      <section id="hoy-decidir" aria-labelledby="hoy-decidir-t" className="scroll-mt-24" style={{ display: "grid" }}>
        <Tarjeta aparecer={3} titulo={<span id="hoy-decidir-t">Para decidir</span>} nivelTitulo={2}>
          {d.decidir.length === 0 ? (
            <p className="hy-vacio">Todo al día. Cuando haya algo para decidir, aparece acá.</p>
          ) : (
            <>
              <FilasDecidir filas={visibles} />
              {resto.length > 0 ? (
                <VerMas cerrado={`Ver ${resto.length === 1 ? "una más" : `${resto.length} más`}`}>
                  <FilasDecidir filas={resto} />
                </VerMas>
              ) : null}
            </>
          )}
        </Tarjeta>
      </section>

      {!graveArriba ? franja : null}

      <section aria-label="Más detalle de hoy">
        <VerMas cerrado="Ver más: listas, líneas y campañas" abierto="Ver menos" abiertoAlInicio={d.verMasAbierto}>
          <div className="hy-detalle">{d.detalle}</div>
        </VerMas>
      </section>
    </div>
  );
}

function FilasDecidir({ filas }: { filas: FilaDecidir[] }) {
  return (
    <ul className="hy-decidir">
      {filas.map((f) => (
        <li key={f.clave}>
          <span className="hy-quien">
            <strong>{f.titulo}</strong>
            <span>{f.detalle}</span>
          </span>
          <Boton href={f.href} variante={f.urgencia === 1 ? "primario" : "secundario"}>
            {f.boton}
            <span className="sr-only"> · {f.titulo}</span>
          </Boton>
        </li>
      ))}
    </ul>
  );
}

/** Estado de carga: el saludo y el marco se pintan enseguida; los datos llegan apenas están. */
export function EsqueletoHoyBento({ saludo }: { saludo: string }) {
  return (
    <div className="hy-pagina vv-hoy" role="status" aria-label="Cargando el resumen de hoy">
      <div className="vv-hoy__fila">
        <Paralaje>
          <Cartel como="p" tamano="xl" texto={saludoCartel(saludo)} />
          <p className="vv-paralaje__frases">
            <span>Estoy armando tu resumen de hoy.</span>
          </p>
        </Paralaje>
        <div className="vv-hoy__lado">
          <div className="d-esqueleto" style={{ minHeight: 236, borderRadius: 26 }} />
          <div className="d-esqueleto" style={{ minHeight: 120, borderRadius: 26 }} />
        </div>
      </div>
      <div className="vv-bento">
        <div className="d-esqueleto vv-c-grande" style={{ borderRadius: 24 }} />
        <div className="d-esqueleto vv-c-media" style={{ borderRadius: 24 }} />
        <div className="d-esqueleto vv-c-alta" style={{ borderRadius: 24 }} />
        <div className="d-esqueleto vv-c-chica" style={{ borderRadius: 24 }} />
        <div className="d-esqueleto vv-c-chica" style={{ borderRadius: 24 }} />
      </div>
    </div>
  );
}
