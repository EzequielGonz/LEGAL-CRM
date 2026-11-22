import type { ReactNode } from "react";
// Imports directos (no el índice): Hoy no arrastra componentes que no usa (vercel-react-best-practices, bundle-barrel-imports).
import { Anillo } from "@/components/premium/anillo";
import { Bento, BentoCelda } from "@/components/premium/bento";
import { Boton } from "@/components/premium/boton";
import { BotonJarvis } from "@/components/premium/boton-jarvis";
import { SaludoJarvis } from "@/components/premium/saludo-jarvis";
import { Tarjeta } from "@/components/premium/tarjeta";
import { VerMas } from "@/components/premium/ver-mas";
import type { SlugPerfil } from "@/lib/marca";
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

function AnilloSemana({ titulo, contexto, valor, de, delay, rubro }: { titulo: string; contexto: string; valor: number | null; de: number | null; delay: number; rubro: SlugPerfil }) {
  return (
    <li>
      {valor === null ? (
        <span className="hy-sin-dato" role="img" aria-label={`${titulo}: sin dato`} style={{ width: 120, height: 120, display: "grid", placeItems: "center", fontSize: 36, color: "var(--d-texto-3)" }}>
          —
        </span>
      ) : (
        <Anillo valor={valor} meta={Math.max(de ?? 0, valor)} rubro={rubro} tamano="medio" nombre={titulo} unidad={`de ${contexto}`} mostrarMeta={de !== null} retrasoMs={delay} />
      )}
      <span className="hy-etiqueta">{titulo}</span>
      <span className="hy-contexto">de {contexto}</span>
    </li>
  );
}

export function HoyBento({ d }: { d: DatosHoyBento }) {
  const visibles = d.decidir.slice(0, FILAS_VISIBLES);
  const resto = d.decidir.slice(FILAS_VISIBLES);
  const franja = (
    <BentoCelda columnas={12} columnasMedio={6}>
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
    </BentoCelda>
  );
  const graveArriba = d.franja.estado === "mal";
  return (
    <div className="hy-pagina">
      <Bento>
        {graveArriba ? franja : null}

        <BentoCelda columnas={12} columnasMedio={6}>
          <SaludoJarvis
            className="hy-saludo"
            saludo={`${d.saludo}.`}
            frases={d.frases}
            acciones={d.decidir.length > 0 ? [{ texto: d.decidir.length === 1 ? "Ver qué decidir" : `Ver ${d.decidir.length} cosas para decidir`, href: "#hoy-decidir" }] : undefined}
          >
            <BotonJarvis>Hablar con Jarvis</BotonJarvis>
          </SaludoJarvis>
          {/* 22/11 (revisión): Contactos, Citas y Seguimiento pasaron a «Más»; como se usan a diario, quedan a un toque desde Hoy. */}
          <nav aria-label="Atajos" className="hy-atajos">
            {(seccionesDePerfil(d.slug).find((x) => x.clave === "contactos")?.tabs ?? [])
              .filter((t) => !t.oculto)
              .slice(0, 3)
              .map((t) => (
                <a key={t.href} href={t.href} className="hy-atajo">
                  {t.label === "Etapas" ? "Contactos" : t.label}
                </a>
              ))}
          </nav>
        </BentoCelda>

        <BentoCelda columnas={4} columnasMedio={6}>
          <Tarjeta relieve aparecer={1} como="section" className="hy-protagonista-tarjeta">
            <div className="hy-protagonista">
              <Anillo valor={d.porDerivar} meta={d.metaAnillo} rubro={d.slug} tamano="grande" nombre="Captados sin derivar" unidad="captados esperan" />
              <span className="hy-etiqueta">Captados sin derivar</span>
              <span className="hy-contexto">
                {d.derivadosSemana === null ? "No se pudo leer cuántos se derivaron esta semana." : d.derivadosSemana === 0 ? "Todavía no derivaste ninguno esta semana." : `${d.derivadosSemana.toLocaleString("es-AR")} ya ${d.derivadosSemana === 1 ? "derivado" : "derivados"} esta semana.`}
              </span>
            </div>
          </Tarjeta>
        </BentoCelda>

        <BentoCelda columnas={8} columnasMedio={6}>
          <Tarjeta relieve aparecer={2} como="section" titulo="Esta semana" nivelTitulo={2}>
            <ul className="hy-semana" aria-label="Resumen de la semana">
              <AnilloSemana titulo="Escribieron" contexto="los contactados" valor={d.semana.escribieron} de={d.semana.contactados} delay={0} rubro={d.slug} />
              <AnilloSemana titulo="Captados" contexto="los que escribieron" valor={d.semana.captados} de={d.semana.escribieron} delay={80} rubro={d.slug} />
              <AnilloSemana titulo="Derivados" contexto="los captados" valor={d.semana.derivados} de={d.semana.captados} delay={160} rubro={d.slug} />
            </ul>
          </Tarjeta>
        </BentoCelda>

        <BentoCelda columnas={12} columnasMedio={6}>
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
        </BentoCelda>

        {!graveArriba ? franja : null}
      </Bento>

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
    <div className="hy-pagina" role="status" aria-label="Cargando el resumen de hoy">
      <Bento>
        <BentoCelda columnas={12} columnasMedio={6}>
          <SaludoJarvis className="hy-saludo" saludo={`${saludo}.`} frases={["Estoy armando tu resumen de hoy.", undefined]} />
        </BentoCelda>
        <BentoCelda columnas={4} columnasMedio={6} filas={2}>
          <div className="d-esqueleto !rounded-2xl" style={{ minHeight: 320 }} />
        </BentoCelda>
        <BentoCelda columnas={8} columnasMedio={6}>
          <div className="d-esqueleto !rounded-2xl" style={{ minHeight: 190 }} />
        </BentoCelda>
        <BentoCelda columnas={8} columnasMedio={6}>
          <div className="d-esqueleto !rounded-2xl" style={{ minHeight: 190 }} />
        </BentoCelda>
      </Bento>
    </div>
  );
}
