import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { TareaOficina } from "@/lib/oficina/reglas";
import { etapaDe, vistaEscritorios } from "@/lib/oficina/reglas";
import { TableroPendientes } from "@/components/cerebro/tablero-pendientes";
import { HablarConClaude } from "@/components/cerebro/hablar-con-claude";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import { AccesosCerebro, BuscadorCerebro, EnsenarCerebro } from "@/components/cerebro/herramientas-cerebro";
import { AprendidoCerebro, DecisionesCerebro } from "@/components/cerebro/cerebro-vivo";
import type { Decision } from "@/lib/cerebro/decisiones";
import { ReglasVigentesCerebro } from "@/components/cerebro/reglas-vigentes";
import { recomendacionesDeHoy } from "@/lib/cerebro/recomendaciones";
import { CentroCerebro, type DatoPantalla } from "@/components/cerebro/centro-cerebro";
import { JarvisPropuestas, MapaCodigo, OficinaAhora, RecomendacionesAccion, type PropuestaVista } from "@/components/cerebro/pantallas-cerebro";
import { Circulo, Malla, Pildora, VidrioCirculos } from "@/components/cerebro/bento-cerebro";
import { Clasico } from "@/components/premium";
import { formatoNumero } from "@/lib/premium/anillo";
import { CIFRAS_SEMANA, totalSemana, variacion } from "@/lib/asistente/semana-reglas";
import type { leerSalud } from "@/lib/salud";
import { lecturaSimple, resumenSalud } from "@/lib/salud/reglas";
import { perfilDeRubroId, ETIQUETA_ESTADO, type TareaBandeja } from "@/lib/bandeja-claude";
import type { IdPantalla, ResumenGrafo } from "@/lib/cerebro/anillo";
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
 * Presentación del Cerebro del negocio. Vuelta 6 (22/11): centro de mando. Arriba de todo, la
 * barra para hablarle (Preguntale · Enseñale · Ordenale); debajo, el anillo de pantallas con cada
 * función viva. Cada pantalla se abre a pantalla completa como un bento de colores y tarjetas de
 * vidrio, con su función operable. No se perdió ninguna sección: «Lo que veo», alertas, preguntas,
 * asistente, laboratorio, lo que entiendo, pendientes, propuestas y correcciones viven ahora dentro
 * de su pantalla. Separada de la lectura de datos para poder verla con datos de ejemplo.
 */
export type PropuestaJarvisCerebro = PropuestaVista;

const SEV: Record<Gravedad, { color: string; chip: string; texto: string }> = {
  alta: { color: "var(--red)", chip: "c-bad", texto: "Alta" },
  media: { color: "var(--amber)", chip: "c-warn", texto: "Media" },
  info: { color: "var(--cyan)", chip: "c-idk", texto: "Para tener en cuenta" },
};
/** Degradé tipo nube de cada marca (tarjeta gradient mesh): su color de siempre más dos vecinos. */
const MALLA_MARCA: Record<string, [string, string, string]> = {
  juridico: ["#d4af37", "#7c6cff", "#ff7eb6"],
  marketing: ["#fc6e20", "#ff5c9a", "#7c6cff"],
  coberturas_medicas: ["#58c7a5", "#46d9e6", "#7c6cff"],
  agencia_0km: ["#4e9be4", "#46d9e6", "#ff7eb6"],
};
const COLORES_CIFRAS = ["violeta", "rosa", "amarillo", "agua", "lila", "coral", "cielo"] as const;

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
  /** Decisiones y órdenes del dueño por fecha (salen de cerebro/02-ordenes-vigentes.md). */
  decisiones?: Decision[];
  /** Cuántas cosas aprendió el cerebro (null: el cuaderno no está activado o no se pudo leer). */
  aprendidos?: number | null;
  /** Propuestas de Jarvis esperando el OK, de los cuatro perfiles. */
  propuestas?: PropuestaJarvisCerebro[] | null;
  /** Resumen del mapa del código (Graphify). */
  grafo?: ResumenGrafo | null;
};

/** Tesela del bento abierto. `c` columnas (de 6) y `f` filas. */
function B({ c = 2, f = 1, color, vidrio, children, className, i = 0 }: { c?: number; f?: number; color?: string; vidrio?: boolean; children: ReactNode; className?: string; i?: number }) {
  return (
    <div className={`cz-b${color ? " cz-b--color" : ""}${vidrio ? " cz-b--vidrio" : ""}${className ? ` ${className}` : ""}`} data-color={color} data-c={c} data-f={f} style={{ ["--i" as string]: i }}>
      {children}
    </div>
  );
}

/** Tesela de color con la cifra grande (la de la pantalla) y su estadística circular. */
function Cifra({ color, etiqueta, numero, unidad, parte, nota, i = 0, c = 2 }: { color: string; etiqueta: string; numero: number | null; unidad: string; parte?: number | null; nota?: ReactNode; i?: number; c?: number }) {
  return (
    <B c={c} color={color} i={i}>
      <span className="cz-b__et">{etiqueta}</span>
      <div className="cz-b__cifra">
        <b>{numero == null ? "—" : formatoNumero(numero)}</b>
        {parte != null && <Circulo parte={parte} tam={64} grosor={8} color="#15121c" etiqueta={`${Math.round(parte * 100)} %`} />}
      </div>
      <span className="cz-b__uni">{unidad}</span>
      {nota && <p className="cz-b__nota">{nota}</p>}
    </B>
  );
}

export function CerebroVista({ fuentes, semana, contactos, salud, pedidos, rubros, oficina = null, decisiones = [], aprendidos = null, propuestas = null, grafo = null }: Vista) {
  const conteo = conteoAlertas(ALERTAS);
  const frases = frasesDelCerebro(semana?.perfiles ?? null, conteo.alta, PREGUNTAS_ABIERTAS.length);
  const lecturas = semana ? lecturasDelPanel(semana.perfiles) : null;
  const total = semana ? totalSemana(semana.perfiles.map((p) => p.cifras)) : null;
  const problemas = (salud ?? []).filter((i) => i.estado !== "verde");
  const semaforo = salud ? resumenSalud(salud) : null;
  const nombres = Object.fromEntries(rubros.map((r) => [r.slug, r.name]));
  const recos = recomendacionesDeHoy(3);

  const pendientesTotal = PENDIENTES.reduce((n, c) => n + c.items.length, 0);
  const pendientesUrgentes = PENDIENTES.reduce((n, c) => n + c.items.filter((x) => x.urgente).length, 0);
  const duenos = PENDIENTES.find((c) => c.clave === "duenos");

  const escritorios = oficina ? vistaEscritorios(oficina) : null;
  const trabajando = escritorios ? escritorios.filter((e) => e.estado === "trabajando").length : null;
  const enCola = escritorios ? escritorios.filter((e) => e.estado === "en_cola").length : 0;
  const esperanOk = oficina ? oficina.filter((t) => etapaDe(t) === "esperando_ok").length : 0;
  const abiertasOficina = oficina ? oficina.filter((t) => etapaDe(t) !== "cerrada").length : null;
  const pedidosAbiertos = pedidos ? pedidos.filter((p) => p.estado === "pendiente" || p.estado === "en_curso" || p.estado === "en_espera").length : null;
  const enviados = total?.enviados.actual ?? null;
  const vEnviados = total ? variacion(total.enviados.actual, total.enviados.anterior) : null;

  const datos: DatoPantalla[] = [
    { id: "pendientes", numero: pendientesUrgentes, unidad: pendientesUrgentes === 1 ? "urgente" : "urgentes", contexto: `${pendientesTotal} en total · ${PREGUNTAS_ABIERTAS.length} preguntas`, parte: pendientesTotal ? pendientesUrgentes / pendientesTotal : null },
    { id: "oficina", numero: trabajando, unidad: trabajando === 1 ? "escritorio trabajando" : "escritorios trabajando", contexto: oficina ? `${abiertasOficina} tareas abiertas · ${esperanOk} esperan tu OK` : "No pude leer la Oficina", parte: escritorios ? (trabajando ?? 0) / Math.max(1, escritorios.length) : null },
    { id: "jarvis", numero: propuestas ? propuestas.length : null, unidad: propuestas?.length === 1 ? "propuesta esperando" : "propuestas esperando", contexto: "Las abrís y confirmás en Jarvis", parte: null },
    { id: "recomienda", numero: recos.length, unidad: recos.length === 1 ? "para hoy" : "para hoy", contexto: recos[0]?.titulo.slice(0, 64) ?? "Nada urgente hoy", parte: null },
    { id: "aprendido", numero: aprendidos, unidad: "cosas aprendidas", contexto: aprendidos == null ? "Cuaderno sin activar" : "Notas, reglas y aprendizajes", parte: null },
    { id: "decisiones", numero: decisiones.length, unidad: "decisiones y órdenes", contexto: decisiones[0]?.titulo.slice(0, 64) ?? "Órdenes vigentes", parte: null },
    { id: "semana", numero: enviados, unidad: "mensajes esta semana", contexto: vEnviados && vEnviados.flecha !== "sin_dato" ? `${vEnviados.texto} contra la anterior` : "En los 4 perfiles", parte: null },
    { id: "salud", numero: salud ? problemas.length : null, unidad: problemas.length === 1 ? "cosa para revisar" : "cosas para revisar", contexto: salud ? `${semaforo?.verde ?? 0} de ${salud.length} controles en verde` : "No pude leer la salud", parte: salud && salud.length ? (semaforo?.verde ?? 0) / salud.length : null },
    { id: "laboratorio", numero: 4, unidad: "bots en el laboratorio", contexto: "Versiones, rendimiento y pruebas", parte: null },
    { id: "mapa", numero: grafo?.nodos ?? null, unidad: "piezas del código", contexto: grafo ? `${formatoNumero(grafo.relaciones ?? 0)} conexiones · Graphify` : "Mapa sin armar", parte: null },
    { id: "claude", numero: pedidosAbiertos, unidad: pedidosAbiertos === 1 ? "pedido abierto" : "pedidos abiertos", contexto: "Bandeja para Claude", parte: null },
  ];

  const abiertas: Partial<Record<IdPantalla, ReactNode>> = {
    pendientes: (
      <div className="cz-bento">
        <Cifra color="amarillo" etiqueta="Urgentes" numero={pendientesUrgentes} unidad={`de ${pendientesTotal} pendientes`} parte={pendientesTotal ? pendientesUrgentes / pendientesTotal : null} i={0} />
        <B c={4} i={1} className="cz-b--sinpad">
          <VidrioCirculos tonos={["#ffd23f", "#ff7eb6", "#7c6cff"]}>
            <Pildora>Preguntas para ustedes</Pildora>
            <p className="cz-cita">«Lo que no puedo saber mirando el panel.»</p>
            <ol className="cz-qs">
              {PREGUNTAS_ABIERTAS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </VidrioCirculos>
        </B>
        <B c={6} vidrio i={2}>
          <h3 className="cz-sub">Tablero de pendientes</h3>
          <p className="cz-muted">«Ya lo hice» deja una propuesta para Claude (pide confirmación). {duenos ? `${duenos.items.length} son de los dueños.` : ""}</p>
          <TableroPendientes columnas={PENDIENTES} />
        </B>
      </div>
    ),
    oficina: (
      <div className="cz-bento">
        <Cifra color="violeta" etiqueta="Trabajando ahora" numero={trabajando} unidad="escritorios con agentes" parte={escritorios ? (trabajando ?? 0) / Math.max(1, escritorios.length) : null} nota={`${enCola} en cola · ${esperanOk} esperan tu OK`} i={0} />
        <B c={4} i={1} className="cz-b--sinpad">
          <Malla tonos={["#7c6cff", "#46d9e6", "#ff7eb6"]}>
            <Pildora>Cómo funciona</Pildora>
            <p className="cz-malla__grande">
              Gemini <em>ordena</em>, los agentes de Claude trabajan y todo vuelve como borrador para tu OK.
            </p>
          </Malla>
        </B>
        <B c={6} vidrio i={2}>
          <OficinaAhora tareas={oficina} />
        </B>
      </div>
    ),
    jarvis: (
      <div className="cz-bento">
        <Cifra color="rosa" etiqueta="Esperan tu OK" numero={propuestas ? propuestas.length : null} unidad="propuestas de Jarvis (7 días)" i={0} />
        <B c={4} vidrio i={1}>
          <h3 className="cz-sub">Propuestas esperando</h3>
          <JarvisPropuestas propuestas={propuestas} />
        </B>
        <B c={6} vidrio i={2}>
          <h3 className="cz-sub">Asistente del panel</h3>
          <p className="cz-muted">Preguntas rápidas sobre los cuatro perfiles. Lo que proponga queda para confirmar.</p>
          <div className="cz-ventana">
            <div className="barra">
              <i />
              <i />
              <i />
              <span>Pedile algo</span>
            </div>
            <div className="cuerpo">
              <ChatAsistenteGeneral accesos={ACCESOS} alto="h-[min(52vh,30rem)]" />
            </div>
          </div>
        </B>
      </div>
    ),
    recomienda: (
      <div className="cz-bento">
        <Cifra color="agua" etiqueta="Para hoy" numero={recos.length} unidad="recomendaciones" i={0} />
        <B c={4} vidrio i={1}>
          <h3 className="cz-sub">Lo que el cerebro recomienda hoy</h3>
          <RecomendacionesAccion items={recos} />
        </B>
        <B c={6} vidrio i={2}>
          <h3 className="cz-sub">Propuestas sin aplicar</h3>
          <p className="cz-muted">Ninguna está hecha. Cada una necesita su OK.</p>
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
        </B>
      </div>
    ),
    aprendido: (
      <div className="cz-bento">
        <Cifra color="lila" etiqueta="Aprendió" numero={aprendidos} unidad="notas, reglas y aprendizajes" i={0} />
        <B c={4} i={1} className="cz-b--sinpad">
          <VidrioCirculos tonos={["#b9a6ff", "#ff7eb6", "#46d9e6"]}>
            <Pildora>Buscar y saltar</Pildora>
            <BuscadorCerebro indice={indiceBusqueda()} />
            <AccesosCerebro />
          </VidrioCirculos>
        </B>
        <B c={4} vidrio i={2}>
          <h3 className="cz-sub">Lo que sabe y lo que le enseñás</h3>
          <p className="cz-muted">Guardá una nota o una regla; archivá lo que ya no sirve (no se borra). Antes de guardar o archivar te pregunta.</p>
          <AprendidoCerebro />
        </B>
        <B c={2} vidrio i={3}>
          <h3 className="cz-sub">Entrenar con propuesta</h3>
          <p className="cz-muted">Una regla que cambia bots queda como propuesta en la Bandeja. No se aplica sin tu confirmación.</p>
          <EnsenarCerebro />
        </B>
      </div>
    ),
    decisiones: (
      <div className="cz-bento">
        <Cifra color="coral" etiqueta="Decisiones" numero={decisiones.length} unidad="órdenes por fecha" i={0} />
        <B c={4} vidrio i={1}>
          <h3 className="cz-sub">Decisiones y órdenes</h3>
          <p className="cz-muted">Lo que decidiste, de lo más nuevo a lo más viejo.</p>
          <DecisionesCerebro decisiones={decisiones} />
        </B>
        <B c={3} vidrio i={2}>
          <h3 className="cz-sub">Reglas vigentes</h3>
          <p className="cz-muted">Un cambio queda como propuesta y necesita tu confirmación.</p>
          <ReglasVigentesCerebro />
        </B>
        <B c={3} vidrio i={3}>
          <h3 className="cz-sub">Lo que tenía mal y corregí</h3>
          <div className="cz-corr">
            {CORRECCIONES.map((c) => (
              <div key={c.decia}>
                <s>{c.decia}</s>
                <p>{c.real}</p>
              </div>
            ))}
          </div>
        </B>
      </div>
    ),
    semana: (
      <div className="cz-bento">
        {total ? (
          CIFRAS_SEMANA.map((c, k) => {
            const v = variacion(total[c.clave].actual, total[c.clave].anterior);
            return (
              <Cifra
                key={c.clave}
                c={k === 0 ? 3 : k < 3 ? 3 : 2}
                color={COLORES_CIFRAS[k % COLORES_CIFRAS.length]}
                etiqueta={c.titulo}
                numero={total[c.clave].actual}
                unidad={c.ayuda}
                nota={v.flecha !== "sin_dato" ? <span aria-label={v.largo}>{v.flecha === "sube" ? "▲" : v.flecha === "baja" ? "▼" : "="} {v.texto}</span> : undefined}
                i={k}
              />
            );
          })
        ) : (
          <B c={6} vidrio>
            <p className="cz-muted">No pude leer las cifras de la semana ahora.</p>
          </B>
        )}
        <B c={3} vidrio i={8}>
          <h3 className="cz-sub">Lo que leo en las cifras</h3>
          <p className="cz-muted">{RESUMEN}</p>
          {lecturas ? (
            <ul className="cz-list cz-veo">
              {lecturas.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : null}
        </B>
        <B c={3} vidrio i={9}>
          <h3 className="cz-sub">Lo que entiendo del negocio</h3>
          <div className="cz-entiendo">
            {ENTIENDO.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        </B>
        {MARCAS_CEREBRO.map((m, k) => (
          <B key={m.rubro} c={3} i={10 + k} className="cz-b--sinpad">
            <Malla tonos={MALLA_MARCA[m.rubro] ?? ["#7c6cff", "#46d9e6", "#ff7eb6"]}>
              <span className="cz-malla__meta">
                Prioridad {m.prioridad} · {m.semanal} por semana
              </span>
              <p className="cz-malla__grande">{m.nombre}</p>
              <p>Deriva a {m.derivaA}.</p>
              <p className="cz-malla__chico">{m.queVale}</p>
            </Malla>
          </B>
        ))}
      </div>
    ),
    salud: (
      <div className="cz-bento">
        <Cifra color="lima" etiqueta="Para revisar" numero={salud ? problemas.length : null} unidad={salud ? `de ${salud.length} controles` : "sin leer"} parte={salud && salud.length ? (semaforo?.verde ?? 0) / salud.length : null} nota={semaforo ? `${semaforo.rojo} en rojo · ${semaforo.amarillo} en amarillo` : undefined} i={0} />
        <B c={4} vidrio i={1}>
          <h3 className="cz-sub">Salud del sistema</h3>
          {!salud ? (
            <p className="cz-muted">No pude leer la salud ahora.</p>
          ) : problemas.length === 0 ? (
            <p className="cz-muted">Todo en orden ({salud.length} controles).</p>
          ) : (
            <ul className="cz-list">
              {problemas.slice(0, 8).map((i) => (
                <li key={i.clave} style={{ ["--sev" as string]: i.estado === "rojo" ? "var(--red)" : "var(--amber)" }}>
                  {lecturaSimple(i).que}
                </li>
              ))}
            </ul>
          )}
          <Link href="/salud" prefetch={false} className="cz-btn sec chico">
            Ver la salud completa
          </Link>
        </B>
        <B c={6} vidrio i={2}>
          <h3 className="cz-sub">Alertas para ustedes</h3>
          <p className="cz-muted">
            {conteo.alta} alta{conteo.alta === 1 ? "" : "s"} · {conteo.media} media{conteo.media === 1 ? "" : "s"} · {conteo.info} para tener en cuenta. No toqué ninguna.
          </p>
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
        </B>
      </div>
    ),
    laboratorio: (
      <div className="cz-bento">
        <B c={2} i={0} className="cz-b--sinpad">
          <Malla tonos={["#ffb38a", "#ff7eb6", "#7c6cff"]}>
            <Pildora>Laboratorio</Pildora>
            <p className="cz-malla__grande">
              Probá antes de que <em>rija</em>.
            </p>
            <p className="cz-malla__chico">Ningún botón envía mensajes.</p>
          </Malla>
        </B>
        <B c={4} vidrio i={1}>
          <h3 className="cz-sub">Conocimiento y laboratorio de bots</h3>
          <p className="cz-muted">Qué versión rige en cada perfil, cómo rinde contra la anterior y el laboratorio para probar cambios.</p>
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
          <Link href="/laboratorio" prefetch={false} className="cz-btn sec chico">
            Abrir el laboratorio completo
          </Link>
        </B>
      </div>
    ),
    mapa: (
      <div className="cz-bento">
        <Cifra color="menta" etiqueta="Mapa del código" numero={grafo?.nodos ?? null} unidad="piezas conectadas" nota={grafo ? `${formatoNumero(grafo.comunidades ?? 0)} barrios` : undefined} i={0} />
        <B c={4} vidrio i={1}>
          <MapaCodigo grafo={grafo} />
        </B>
      </div>
    ),
    claude: (
      <div className="cz-bento">
        <Cifra color="fucsia" etiqueta="Abiertos" numero={pedidosAbiertos} unidad="pedidos a Claude" i={0} />
        <B c={4} vidrio i={1}>
          <h3 className="cz-sub">Hablale a Claude</h3>
          <p className="cz-muted">Va a la Bandeja para Claude con el contexto del cerebro y, si querés, la foto de la semana. Lo toma cuando abran un chat del proyecto y digan «ok».</p>
          <HablarConClaude foto={semana ? fotoParaClaude(semana.perfiles, semana.desde) : null} />
        </B>
        <B c={6} vidrio i={2}>
          <h3 className="cz-sub">Últimos pedidos</h3>
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
          <Link href="/bandeja" prefetch={false} className="cz-btn sec chico">
            Abrir la bandeja
          </Link>
        </B>
      </div>
    ),
  };

  const frase = frases[1] ?? frases[0];

  return (
    <div className={`cz cz--v6 ${fuentes.clase}`} style={fuentes.estilo}>
      <Clasico cerebro>
        <main>
          <CentroCerebro datos={datos} abiertas={abiertas} frase={frase} contactos={contactos} fecha={ACTUALIZADO} />
        </main>
        <footer className="cz-foot">
          <div className="cz-in">
            <p>Memoria de Claude, sin claves, sin el código del panel y sin datos de prospectos. Las cifras se leen en vivo; todo lo que escribe pide confirmación.</p>
          </div>
        </footer>
      </Clasico>
    </div>
  );
}
