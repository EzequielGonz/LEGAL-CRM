import type { CSSProperties } from "react";
import type { TareaOficina } from "@/lib/oficina/reglas";
import Link from "next/link";
import { HeroCerebro } from "@/components/cerebro/escena-cerebro";
import { TableroPendientes } from "@/components/cerebro/tablero-pendientes";
import { HablarConClaude } from "@/components/cerebro/hablar-con-claude";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import { AccesosCerebro, BuscadorCerebro, EnsenarCerebro } from "@/components/cerebro/herramientas-cerebro";
import { RecomendacionesCerebro } from "@/components/cerebro/recomendaciones-cerebro";
import { ReglasVigentesCerebro } from "@/components/cerebro/reglas-vigentes";
import { recomendacionesDeHoy } from "@/lib/cerebro/recomendaciones";
import { PanelesCerebro, type PanelCerebro } from "@/components/cerebro/paneles-cerebro";
import { Anillo, Clasico, Tarjeta, VerMas } from "@/components/premium";
import { formatoNumero } from "@/lib/premium/anillo";
import { CIFRAS_SEMANA, totalSemana, variacion } from "@/lib/asistente/semana-reglas";
import type { leerSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";
import { perfilDeRubroId, ETIQUETA_ESTADO, type TareaBandeja } from "@/lib/bandeja-claude";
import {
  ACTUALIZADO,
  ALERTAS,
  CORRECCIONES,
  ENTIENDO,
  ETIQUETA_RUBRO,
  MARCAS_CEREBRO,
  PENDIENTES,
  PREGUNTAS_ABIERTAS,
  PROPUESTAS,
  RESUMEN,
  conteoAlertas,
  fotoParaClaude,
  indiceBusqueda,
  frasesDelCerebro,
  lecturasDelPanel,
  type Gravedad,
  type PerfilSemana,
} from "@/lib/cerebro/contenido";

/**
 * Presentación del Cerebro del negocio (21/11 y 22/11): la esfera arriba (la Oficina tiene su propia página, /oficina), tres anillos de estado y
 * todas las demás secciones plegadas en «Ver más» (pestañas). Separada de la lectura de datos para
 * poder verla con datos de ejemplo. Solo lee: el único botón que escribe es «Mandar a Claude».
 */
const SEV: Record<Gravedad, { color: string; chip: string; texto: string }> = {
  alta: { color: "var(--red)", chip: "c-bad", texto: "Alta" },
  media: { color: "var(--amber)", chip: "c-warn", texto: "Media" },
  info: { color: "var(--cyan)", chip: "c-idk", texto: "Para tener en cuenta" },
};
const COLOR_MARCA: Record<string, string> = { juridico: "var(--vita)", marketing: "var(--mkt)", coberturas_medicas: "var(--cob)", agencia_0km: "var(--auto)" };

const ACCESOS: AccesoAsistente[] = [
  { titulo: "¿Cómo vienen los 4 perfiles?", descripcion: "Un resumen corto de cada perfil.", accion: "enviar", texto: "¿Cómo vienen los cuatro perfiles? Resumilo corto, perfil por perfil." },
  { titulo: "Captados sin derivar", descripcion: "Quién dejó sus datos y falta pasar.", accion: "enviar", texto: "¿Qué captados falta derivar en los cuatro perfiles?" },
  { titulo: "Chats que piden una persona", descripcion: "Los que esperan a alguien del equipo.", accion: "enviar", texto: "Mostrame los chats que piden una persona en los cuatro perfiles." },
  { titulo: "Mejorar un bot", descripcion: "Contame qué cambiar y armo una versión para probar.", accion: "enviar", texto: "Quiero mejorar el bot de un perfil. Preguntame cuál y qué querés cambiar." },
];

type Vista = {
  /** Clase y estilo de las tipografías (las carga la página con next/font). */
  fuentes: { clase: string; estilo: CSSProperties };
  semana: { desde: string; perfiles: PerfilSemana[] } | null;
  contactos: number | null;
  salud: Awaited<ReturnType<typeof leerSalud>> | null;
  pedidos: TareaBandeja[] | null;
  rubros: { slug: string; name: string }[];
  /** Tareas de la Oficina: el edificio de agentes conectado al cerebro. */
  oficina?: TareaOficina[] | null;
};

/** La presentación del cerebro, separada de la lectura de datos (así se puede ver con datos de ejemplo). */
export function CerebroVista({ fuentes, semana, contactos, salud, pedidos, rubros, oficina = null }: Vista) {
  const conteo = conteoAlertas(ALERTAS);
  const frases = frasesDelCerebro(semana?.perfiles ?? null, conteo.alta, PREGUNTAS_ABIERTAS.length);
  const lecturas = semana ? lecturasDelPanel(semana.perfiles) : null;
  const total = semana ? totalSemana(semana.perfiles.map((p) => p.cifras)) : null;
  const problemas = (salud ?? []).filter((i) => i.estado !== "verde");
  const nombres = Object.fromEntries(rubros.map((r) => [r.slug, r.name]));

  const pendientesTotal = PENDIENTES.reduce((n, c) => n + c.items.length, 0);
  const pendientesUrgentes = PENDIENTES.reduce((n, c) => n + c.items.filter((x) => x.urgente).length, 0);
  const sinResolver = problemas.length;

  const paneles: PanelCerebro[] = [
    {
      id: "veo",
      titulo: "Lo que veo",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">01 · En vivo</p>
              <h2>
                Lo que veo <b>hoy</b> en el panel.
              </h2>
              <p className="cz-lead">{RESUMEN}</p>
            </div>
            {total && (
              <div className="cz-stats">
                {CIFRAS_SEMANA.map((c) => {
                  const v = variacion(total[c.clave].actual, total[c.clave].anterior);
                  return (
                    <div key={c.clave} className="cz-stat">
                      <b>{total[c.clave].actual == null ? "—" : formatoNumero(total[c.clave].actual!)}</b>
                      <span>{c.titulo}</span>
                      {v.flecha !== "sin_dato" && (
                        <i className={v.flecha} aria-label={v.largo}>
                          {v.flecha === "sube" ? "▲" : v.flecha === "baja" ? "▼" : "="} {v.texto}
                        </i>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="cz-grid2">
              <div className="cz-card">
                <header>
                  <h3>Lo que leo en las cifras</h3>
                </header>
                {lecturas ? (
                  <ul className="cz-list cz-veo">
                    {lecturas.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="cz-muted">No pude leer las cifras ahora.</p>
                )}
              </div>
              <div className="cz-card">
                <header>
                  <h3>Salud del sistema</h3>
                  <Link href="/salud" prefetch={false}>
                    Ver todo
                  </Link>
                </header>
                {!salud ? (
                  <p className="cz-muted">No pude leer la salud ahora.</p>
                ) : problemas.length === 0 ? (
                  <p className="cz-muted">Todo en orden ({salud.length} controles).</p>
                ) : (
                  <>
                    <p className="cz-muted">{problemas.length === 1 ? "Hay 1 cosa para revisar." : `Hay ${problemas.length} cosas para revisar.`}</p>
                    <VerMas cerrado="Ver cuáles" abierto="Ocultar">
                      <ul className="cz-list">
                        {problemas.slice(0, 6).map((i) => (
                          <li key={i.clave} style={{ ["--sev" as string]: i.estado === "rojo" ? "var(--red)" : "var(--amber)" }}>
                            {lecturaSimple(i).que}
                          </li>
                        ))}
                      </ul>
                    </VerMas>
                  </>
                )}
              </div>
              <div className="cz-card">
                <header>
                  <h3>Pedidos a Claude</h3>
                  <Link href="/bandeja" prefetch={false}>
                    Abrir la bandeja
                  </Link>
                </header>
                {!pedidos ? (
                  <p className="cz-muted">No pude leer la bandeja ahora.</p>
                ) : pedidos.length === 0 ? (
                  <p className="cz-muted">Todavía no hay pedidos.</p>
                ) : (
                  <ul className="cz-list">
                    {pedidos.map((x) => (
                      <li key={x.id} style={{ ["--sev" as string]: "var(--box)" }}>
                        {x.pedido.replace(/^Desde el cerebro:\s*/, "").split("\n")[0].slice(0, 140)}
                        <small>
                          {ETIQUETA_ESTADO[x.estado]} · {ETIQUETA_RUBRO[perfilDeRubroId(x.rubro_id) ?? "todos"]}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
        </div>
      ),
    },
    {
      id: "alertas",
      titulo: "Alertas",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">02 · Lo urgente</p>
              <h2>
                Alertas <b>para ustedes</b>.
              </h2>
              <p className="cz-lead">No toqué ninguna.</p>
            </div>
            <div className="cz-facts">
              {ALERTAS.map((a) => (
                <div key={a.titulo} className="cz-alert" style={{ ["--sev" as string]: SEV[a.gravedad].color }}>
                  <span className={`cz-chip ${SEV[a.gravedad].chip}`}>{SEV[a.gravedad].texto}</span>
                  <p>
                    {a.titulo}
                    <small>{a.detalle}</small>
                  </p>
                </div>
              ))}
            </div>
        </div>
      ),
    },
    {
      id: "preguntas",
      titulo: "Preguntas",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">03 · Lo que me falta</p>
              <h2>
                Preguntas <b>para ustedes</b>.
              </h2>
              <p className="cz-lead">Lo que no puedo saber mirando el panel. Respondan por la bandeja o en el chat.</p>
            </div>
            <ol className="cz-qs">
              {PREGUNTAS_ABIERTAS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
        </div>
      ),
    },
    {
      id: "hablar",
      titulo: "Hablale a Claude",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">04 · Conexión</p>
              <h2>
                Hablale a <b>Claude</b>.
              </h2>
              <p className="cz-lead">Va a la Bandeja para Claude con el contexto del cerebro y, si quieren, la foto de la semana. Lo toma cuando abran un chat del proyecto y digan «ok».</p>
            </div>
            <HablarConClaude foto={semana ? fotoParaClaude(semana.perfiles, semana.desde) : null} />
        </div>
      ),
    },
    {
      id: "asistente",
      titulo: "Asistente",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">05 · Al instante</p>
              <h2>
                Asistente <b>del panel</b>.
              </h2>
              <p className="cz-lead">Para preguntas rápidas sobre los cuatro perfiles. Lo que proponga queda para confirmar.</p>
            </div>
            <div className="cz-ventana">
              <div className="barra">
                <i />
                <i />
                <i />
                <span>Pedile algo</span>
              </div>
              <div className="cuerpo">
                <ChatAsistenteGeneral accesos={ACCESOS} alto="h-[min(60vh,34rem)]" />
              </div>
            </div>
        </div>
      ),
    },
    {
      id: "laboratorio",
      titulo: "Laboratorio",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">06 · Bots</p>
              <h2>
                Laboratorio <b>de bots</b>.
              </h2>
              <p className="cz-lead">Qué versión del conocimiento rige en cada perfil, cómo rinde contra la anterior y el laboratorio para probar cambios. Ningún botón envía mensajes.</p>
            </div>
            <div className="cz-ventana">
              <div className="barra">
                <i />
                <i />
                <i />
                <span>Conocimiento y laboratorio</span>
              </div>
              <div className="cuerpo">
                <ConocimientoBot nombres={nombres} />
              </div>
            </div>
        </div>
      ),
    },
    {
      id: "entiendo",
      titulo: "Lo que entiendo",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">07 · El negocio</p>
              <h2>
                Lo que <b>entiendo</b>.
              </h2>
            </div>
            <div className="cz-entiendo">
              {ENTIENDO.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
            <div className="cz-brands">
              {MARCAS_CEREBRO.map((m) => (
                <div key={m.rubro} className="cz-brand" style={{ ["--b" as string]: COLOR_MARCA[m.rubro] }}>
                  <span className="meta">PRIORIDAD {m.prioridad} · {m.semanal.toUpperCase()} POR SEMANA</span>
                  <h3>{m.nombre}</h3>
                  <p>Deriva a {m.derivaA}.</p>
                  <p>{m.queVale}</p>
                </div>
              ))}
            </div>
        </div>
      ),
    },
    {
      id: "pendientes",
      titulo: "Pendientes",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">08 · Lo que sigue</p>
              <h2>
                Pendientes, <b>ordenados</b>.
              </h2>
              <p className="cz-lead">Lo de Claude se hace como propuesta y con su autorización.</p>
            </div>
            <TableroPendientes columnas={PENDIENTES} />
        </div>
      ),
    },
    {
      id: "propuestas",
      titulo: "Propuestas",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">09 · Mejoras</p>
              <h2>
                Propuestas <b>sin aplicar</b>.
              </h2>
              <p className="cz-lead">Ninguna está hecha. Cada una necesita su OK.</p>
            </div>
            <div className="cz-tbl">
              <table>
                <thead>
                  <tr>
                    <th>Qué</th>
                    <th>Por qué</th>
                    <th>Tamaño</th>
                  </tr>
                </thead>
                <tbody>
                  {PROPUESTAS.map((p) => (
                    <tr key={p.titulo}>
                      <td>{p.titulo}</td>
                      <td>{p.porque}</td>
                      <td>{p.tamano}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      ),
    },
    {
      id: "corregi",
      titulo: "Lo que corregí",
      contenido: (
        <div className="cz-panel">
            <div className="cz-head">
              <p className="cz-k">10 · Memoria</p>
              <h2>
                Lo que tenía mal y <b>corregí</b>.
              </h2>
            </div>
            <div className="cz-corr">
              {CORRECCIONES.map((c) => (
                <div key={c.decia}>
                  <s>{c.decia}</s>
                  <p>{c.real}</p>
                </div>
              ))}
            </div>
        </div>
      ),
    },
  ];

  return (
    <div className={`cz ${fuentes.clase}`} style={fuentes.estilo}>
      <Clasico cerebro>
        <div className="cz-arriba">
          <nav className="cz-top" aria-label="Volver">
            <Link href="/perfiles" prefetch={false}>
              ← Perfiles
            </Link>
            <Link href="/bandeja" prefetch={false}>
              Bandeja para Claude
            </Link>
          </nav>
          <h1 className="cz-sr">Cerebro del negocio</h1>
          <HeroCerebro frases={frases} numero={contactos} bajada="contactos que el cerebro conoce" fecha={ACTUALIZADO} />
        </div>

        <main>
          <section id="atajos" aria-label="Atajos">
            <div className="cz-in">
              <div className="cz-pastillas">
                <Link href="/oficina" prefetch={false} className="cz-pastilla">
                  Ver la Oficina <span aria-hidden="true">→</span>
                </Link>
                <Link href="/asistente" prefetch={false} className="cz-pastilla sec">
                  Pedile a Jarvis <span aria-hidden="true">→</span>
                </Link>
                <Link href="/laboratorio" prefetch={false} className="cz-pastilla sec">
                  Laboratorio de bots <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>

          <section id="estado" aria-labelledby="estado-titulo">
            <div className="cz-in">
              <h2 id="estado-titulo" className="cz-estado-titulo">
                Cómo está <b>todo</b>.
              </h2>
              <ul className="cz-anillos">
                <li>
                  <Tarjeta relieve aparecer={0} rubro="juridico">
                    <div className="cz-anillo-celda">
                      <Anillo valor={conteo.alta} meta={Math.max(1, ALERTAS.length)} rubro="juridico" tamano="medio" nombre="Alertas altas" unidad="alertas" retrasoMs={0} />
                      <span className="cz-anillo-et">Alertas</span>
                      <span className="cz-anillo-ctx">
                        {conteo.alta} alta{conteo.alta === 1 ? "" : "s"} · {conteo.media} media{conteo.media === 1 ? "" : "s"} · {conteo.info} para tener en cuenta
                      </span>
                      <a className="cz-anillo-ver" href="#alertas">
                        Ver alertas
                      </a>
                    </div>
                  </Tarjeta>
                </li>
                <li>
                  <Tarjeta relieve aparecer={1} rubro="juridico">
                    <div className="cz-anillo-celda">
                      <Anillo valor={PREGUNTAS_ABIERTAS.length} meta={Math.max(1, PREGUNTAS_ABIERTAS.length)} rubro="juridico" tamano="medio" nombre="Preguntas abiertas" unidad="preguntas" mostrarMeta={false} retrasoMs={80} />
                      <span className="cz-anillo-et">Preguntas</span>
                      <span className="cz-anillo-ctx">Lo que no puedo saber mirando el panel</span>
                      <a className="cz-anillo-ver" href="#preguntas">
                        Ver preguntas
                      </a>
                    </div>
                  </Tarjeta>
                </li>
                <li>
                  <Tarjeta relieve aparecer={2} rubro="juridico">
                    <div className="cz-anillo-celda">
                      <Anillo valor={pendientesUrgentes} meta={Math.max(1, pendientesTotal)} rubro="juridico" tamano="medio" nombre="Pendientes urgentes" unidad="pendientes" retrasoMs={160} />
                      <span className="cz-anillo-et">Pendientes</span>
                      <span className="cz-anillo-ctx">
                        {pendientesUrgentes} urgente{pendientesUrgentes === 1 ? "" : "s"} · {pendientesTotal} en total
                      </span>
                      <a className="cz-anillo-ver" href="#pendientes">
                        Ver pendientes
                      </a>
                    </div>
                  </Tarjeta>
                </li>
              </ul>
              {sinResolver > 0 ? (
                <p className="cz-muted cz-estado-nota">
                  {sinResolver === 1 ? "Hay 1 cosa para revisar" : `Hay ${sinResolver} cosas para revisar`} en la salud del sistema:{" "}
                  <a href="#veo" className="cz-anillo-ver">
                    verlas en «Lo que veo»
                  </a>
                  .
                </p>
              ) : null}
            </div>
          </section>

          <section id="recomienda" aria-labelledby="reco-titulo">
            <div className="cz-in">
              <h2 id="reco-titulo" className="cz-estado-titulo">
                Lo que el cerebro <b>recomienda hoy</b>.
              </h2>
              <RecomendacionesCerebro items={recomendacionesDeHoy(3)} />
            </div>
          </section>

          <section id="herramientas" aria-labelledby="herr-titulo">
            <div className="cz-in">
              <h2 id="herr-titulo" className="cz-estado-titulo">
                Enseñale <b>algo</b>.
              </h2>
              <div className="cz-grid2">
                <div className="cz-card">
                  <header>
                    <h3>Entrenar al cerebro</h3>
                  </header>
                  <p className="cz-muted">Una nota o una regla nueva queda como propuesta en la Bandeja. No se aplica sin tu confirmación.</p>
                  <EnsenarCerebro />
                </div>
                <div className="cz-card">
                  <header>
                    <h3>Buscar y saltar</h3>
                  </header>
                  <BuscadorCerebro indice={indiceBusqueda()} />
                  <AccesosCerebro />
                </div>
              </div>
              <div className="cz-card cz-card--reglas">
                <header>
                  <h3>Reglas vigentes</h3>
                </header>
                <p className="cz-muted">Lo que rige hoy. Un cambio queda como propuesta y necesita tu confirmación.</p>
                <ReglasVigentesCerebro />
              </div>
            </div>
          </section>

          <section id="mas">
            <div className="cz-in">
              <PanelesCerebro paneles={paneles} />
            </div>
          </section>
        </main>

        <footer className="cz-foot">
        <div className="cz-in">
          <p>Memoria de Claude, sin claves, sin el código del panel y sin datos de prospectos. Las cifras de arriba se leen en vivo.</p>
          <p className="thanks">El secreto no fue la IA. Fue darle memoria y método.</p>
        </div>
      </footer>
      </Clasico>
    </div>
  );
}

