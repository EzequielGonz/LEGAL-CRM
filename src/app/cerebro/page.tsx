import { cache } from "react";
import Link from "next/link";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./cerebro.css";
import { requirePageSession } from "@/lib/acceso/pagina";
import { HeroCerebro } from "@/components/cerebro/escena-cerebro";
import { TableroPendientes } from "@/components/cerebro/tablero-pendientes";
import { HablarConClaude } from "@/components/cerebro/hablar-con-claude";
import { ChatAsistenteGeneral, type AccesoAsistente } from "@/components/asistente/chat-asistente-general";
import { ConocimientoBot } from "@/components/perfiles/conocimiento-bot";
import { Oficina } from "@/components/cerebro/oficina";
import { leerOficina } from "@/lib/oficina/servidor";
import { resumenSemana } from "@/lib/asistente/semana";
import { CIFRAS_SEMANA, totalSemana, variacion } from "@/lib/asistente/semana-reglas";
import { leerRubrosActivos } from "@/lib/perfiles-stats";
import { leerSalud } from "@/lib/salud";
import { lecturaSimple } from "@/lib/salud/reglas";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaATarea, perfilDeRubroId, ETIQUETA_ESTADO, type TareaBandeja } from "@/lib/bandeja-claude";
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
  frasesDelCerebro,
  lecturasDelPanel,
  type Gravedad,
  type PerfilSemana,
} from "@/lib/cerebro/contenido";

export const metadata = { title: "Cerebro del negocio" };
export const dynamic = "force-dynamic";

const fuente = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500", "600", "800"], display: "swap", variable: "--cz-f" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--cz-mono" });

/**
 * Cerebro del negocio (21/11, pedido de los dueños): pantalla aparte, con la
 * escena de la página del cerebro que armó Claude (esfera, frases, recuadro).
 * Se abre desde Inicio en una pestaña nueva. Lee el panel en vivo (cifras de
 * la semana, salud, pedidos a Claude), suma el asistente general y el
 * laboratorio de bots, y manda pedidos a la Bandeja para Claude. Solo lee:
 * el único botón que escribe es «Mandar a Claude».
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

const SECCIONES = [
  ["oficina", "Oficina"],
  ["veo", "Lo que veo"],
  ["alertas", "Alertas"],
  ["preguntas", "Preguntas"],
  ["hablar", "Hablale a Claude"],
  ["asistente", "Asistente"],
  ["laboratorio", "Laboratorio"],
  ["entiendo", "Lo que entiendo"],
  ["pendientes", "Pendientes"],
  ["propuestas", "Propuestas"],
  ["corregi", "Lo que corregí"],
] as const;

/** Una sola lectura de la semana por pedido, compartida por los bloques. */
const leerSemana = cache(async (): Promise<{ desde: string; perfiles: PerfilSemana[] } | null> => resumenSemana().catch(() => null));

async function contarContactos(): Promise<number | null> {
  try {
    const { count, error } = await createAdminClient().from("contacts").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? null;
  } catch {
    return null;
  }
}

export default async function CerebroPage() {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const conteo = conteoAlertas(ALERTAS);
  const [semana, contactos, salud, pedidos, rubros, oficina] = await Promise.all([
    leerSemana(),
    contarContactos(),
    leerSalud().catch(() => null),
    leerPedidos(),
    leerRubrosActivos().catch(() => []),
    leerOficina(),
  ]);
  const frases = frasesDelCerebro(semana?.perfiles ?? null, conteo.alta, PREGUNTAS_ABIERTAS.length);
  const lecturas = semana ? lecturasDelPanel(semana.perfiles) : null;
  const total = semana ? totalSemana(semana.perfiles.map((p) => p.cifras)) : null;
  const problemas = (salud ?? []).filter((i) => i.estado !== "verde");
  const nombres = Object.fromEntries(rubros.map((r) => [r.slug, r.name]));

  return (
    <div className={`cz ${fuente.variable} ${mono.variable}`} style={{ ["--cz-f" as string]: fuente.style.fontFamily, ["--cz-mono" as string]: mono.style.fontFamily }}>
      <div style={{ position: "relative" }}>
        <nav className="cz-top" aria-label="Volver">
          <Link href="/perfiles" prefetch={false}>
            ← Perfiles
          </Link>
          <Link href="/bandeja" prefetch={false}>
            Bandeja para Claude
          </Link>
        </nav>
        <HeroCerebro frases={frases} numero={contactos} bajada="contactos que el cerebro conoce" fecha={ACTUALIZADO} />
      </div>

      <nav className="cz-idx" aria-label="Secciones">
        <ul className="cz-in">
          {SECCIONES.map(([id, nombre]) => (
            <li key={id}>
              <a href={`#${id}`}>{nombre}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <section id="oficina">
          <div className="cz-in">
            <div className="cz-head">
              <p className="cz-k">00 · La oficina</p>
              <h2>
                Los agentes, <b>trabajando</b>.
              </h2>
              <p className="cz-lead">Dejá una tarea: Gemini la ordena al instante y elige por qué escritorios pasa. Con «Arrancar ahora», los agentes de Claude la trabajan área por área, Dirección revisa todo y te llega para aprobar. Nada se publica sin tu OK.</p>
            </div>
            {oficina ? (
              <Oficina inicial={oficina.tareas} arranqueInicial={oficina.arranque} />
            ) : (
              <p className="cz-muted">No pude leer la oficina ahora. Probá recargar en un rato.</p>
            )}
          </div>
        </section>

        <section id="veo">
          <div className="cz-in">
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
                      <b>{total[c.clave].actual == null ? "—" : total[c.clave].actual!.toLocaleString("es-AR")}</b>
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
                  <ul className="cz-list">
                    {problemas.slice(0, 6).map((i) => (
                      <li key={i.clave} style={{ ["--sev" as string]: i.estado === "rojo" ? "var(--red)" : "var(--amber)" }}>
                        {lecturaSimple(i).que}
                      </li>
                    ))}
                  </ul>
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
        </section>

        <section id="alertas">
          <div className="cz-in">
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
        </section>

        <section id="preguntas">
          <div className="cz-in">
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
        </section>

        <section id="hablar">
          <div className="cz-in">
            <div className="cz-head">
              <p className="cz-k">04 · Conexión</p>
              <h2>
                Hablale a <b>Claude</b>.
              </h2>
              <p className="cz-lead">Va a la Bandeja para Claude con el contexto del cerebro y, si quieren, la foto de la semana. Lo toma cuando abran un chat del proyecto y digan «ok».</p>
            </div>
            <HablarConClaude foto={semana ? fotoParaClaude(semana.perfiles, semana.desde) : null} />
          </div>
        </section>

        <section id="asistente">
          <div className="cz-in">
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
        </section>

        <section id="laboratorio">
          <div className="cz-in">
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
        </section>

        <section id="entiendo">
          <div className="cz-in">
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
        </section>

        <section id="pendientes">
          <div className="cz-in">
            <div className="cz-head">
              <p className="cz-k">08 · Lo que sigue</p>
              <h2>
                Pendientes, <b>ordenados</b>.
              </h2>
              <p className="cz-lead">Lo de Claude se hace como propuesta y con su autorización.</p>
            </div>
            <TableroPendientes columnas={PENDIENTES} />
          </div>
        </section>

        <section id="propuestas">
          <div className="cz-in">
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
        </section>

        <section id="corregi">
          <div className="cz-in">
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
        </section>
      </main>

      <footer className="cz-foot">
        <div className="cz-in">
          <p>Memoria de Claude, sin claves, sin el código del panel y sin datos de prospectos. Las cifras de arriba se leen en vivo.</p>
          <p className="thanks">El secreto no fue la IA. Fue darle memoria y método.</p>
        </div>
      </footer>
    </div>
  );
}

/** Lo último que se le pidió a Claude. */
async function leerPedidos(): Promise<TareaBandeja[] | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("bandeja_claude" as any)
      .select("id, rubro_id, pedido, enlaces, estado, motivo_espera, resultado, resultado_enlaces, motivo_descarte, created_at, updated_at, tomada_at, cerrada_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    return (data ?? []).map(filaATarea).filter((x): x is TareaBandeja => x !== null);
  } catch {
    return null;
  }
}
