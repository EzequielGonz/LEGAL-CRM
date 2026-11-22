"use client";

import Link from "next/link";
import type { ParteDelDia } from "@/lib/jarvis/parte";
import { diaCorto, marcarCifra, porcentajeTexto, sumaSerie, type TableroJarvis } from "@/lib/jarvis/tablero";
import { variacion, type Variacion } from "@/lib/asistente/semana-reglas";
import { Area, Aro, Barras, Cifra, Columnas, Comparacion, fmt } from "@/components/jarvis/jv-graficos";
import { Cartel, Pildora } from "@/components/jarvis/jv-cartel";

/**
 * Estado del día de Jarvis en bento de colores (vuelta 6, marcas 1 y 4 del dueño en el video): baldosas de
 * distintos tamaños, colores planos vivos, etiqueta chica arriba a la izquierda y entrada escalonada.
 * El saludo va en una baldosa de degradé animado (gradient mesh DENTRO del componente, no en el fondo).
 * Datos reales de UN perfil (cada rubro separado): el parte del día y el tablero de la semana.
 */
export function Delta({ v }: { v: Variacion }) {
  if (v.flecha === "sin_dato") return null;
  return (
    <span className={`jv-delta jv-delta-${v.flecha}`}>
      <span aria-hidden="true">
        {v.flecha === "sube" ? "▲" : v.flecha === "baja" ? "▼" : "="} {v.texto}
      </span>
      <span className="sr-only">{v.largo}</span>
    </span>
  );
}

interface Props {
  parte: ParteDelDia | null;
  tablero: TableroJarvis | null;
  /** El tablero falló: se muestra el aviso en vez de cifras inventadas. */
  errorTablero: boolean;
  hrefChats: string;
  perfilNombre: string;
}

export function JvBento({ parte, tablero, errorTablero, hrefChats, perfilNombre }: Props) {
  const sem = tablero?.semana ?? null;
  const enviadosSemana = tablero ? sumaSerie(tablero.enviadosPorDia) : null;
  const captadosSemana = sem?.captados.actual ?? (tablero ? sumaSerie(tablero.captadosPorDia) : null);
  const chats = parte?.anillos.find((a) => a.clave === "chats") ?? null;
  const cargando = !tablero && !errorTablero;
  const saludo = parte ? `${parte.saludo}.` : "Hola.";
  const frase = parte?.frases[0] ? marcarCifra(parte.frases[0]) : `Estoy mirando *${perfilNombre}* por vos.`;

  return (
    <section className="jv-bento2" aria-label="Estado del día" aria-busy={cargando || undefined}>
      {/* Saludo: tarjeta gradient mesh con cartel palabra por palabra. */}
      <div className="jv-b jv-b-sal" style={{ ["--i" as string]: 0 }}>
        <div className="jv-mesh" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="jv-b-cont">
          <p className="jv-b-et">
            <Pildora>Hoy{parte ? ` · ${diaCorto(parte.dia)}` : ""}</Pildora>
          </p>
          <Cartel como="h2" texto={saludo} className="jv-sal-titulo" />
          <Cartel texto={frase} className="jv-sal-frase" retrasoMs={250} />
          {parte && parte.frases.length > 1 && <p className="jv-sal-resto">{parte.frases.slice(1).join(" ")}</p>}
        </div>
      </div>

      {/* Mensajes de la semana: área de 7 días. */}
      <div className="jv-b jv-b-msj" style={{ ["--i" as string]: 1 }}>
        <p className="jv-b-et">Mensajes de la semana</p>
        <p className="jv-b-num">
          <Cifra valor={enviadosSemana} />
          {sem && <Delta v={variacion(sem.enviados.actual, sem.enviados.anterior)} />}
        </p>
        {tablero ? <Area serie={tablero.enviadosPorDia} titulo="Mensajes enviados por día" /> : <div className="jv-b-esqueleto" />}
        {tablero && enviadosSemana === 0 && <p className="jv-b-nota">Esta semana no salieron campañas en este perfil.</p>}
      </div>

      {/* Captados: barritas por día. */}
      <div className="jv-b jv-b-cap" style={{ ["--i" as string]: 2 }}>
        <p className="jv-b-et">Captados</p>
        <p className="jv-b-num">
          <Cifra valor={captadosSemana} />
          {sem && <Delta v={variacion(sem.captados.actual, sem.captados.anterior)} />}
        </p>
        {tablero ? <Columnas serie={tablero.captadosPorDia} titulo="Captados por día" /> : <div className="jv-b-esqueleto" />}
      </div>

      {/* Esperan respuesta: alto, con el aro contra las charlas abiertas. */}
      <div className="jv-b jv-b-esp" style={{ ["--i" as string]: 3 }}>
        <p className="jv-b-et">Esperan respuesta</p>
        <Aro valor={chats?.valor ?? null} total={chats?.meta ?? null} etiqueta="Personas que esperan respuesta" tamano={128} />
        <p className="jv-b-nota">{chats ? chats.nota : "Leyendo los chats…"}</p>
        <Link prefetch={false} href={hrefChats} className="jv-b-boton">
          Ver chats
        </Link>
      </div>

      {/* Derivados de los captados. */}
      <div className="jv-b jv-b-der" style={{ ["--i" as string]: 4 }}>
        <p className="jv-b-et">Derivados</p>
        <Aro valor={sem?.derivados.actual ?? null} total={sem?.captados.actual ?? null} etiqueta="Derivados de los captados de la semana" tamano={78} />
        <p className="jv-b-nota">de {fmt(sem?.captados.actual)} captados</p>
      </div>

      {/* Respondieron de los enviados (tasa de respuesta). */}
      <div className="jv-b jv-b-res" style={{ ["--i" as string]: 5 }}>
        <p className="jv-b-et">Respondieron</p>
        <Aro valor={sem?.respondieron.actual ?? null} total={sem?.enviados.actual ?? null} etiqueta="Personas que respondieron de los mensajes enviados" centro={porcentajeTexto(sem?.respondieron.actual, sem?.enviados.actual)} tamano={78} />
        <p className="jv-b-nota">{fmt(sem?.respondieron.actual)} personas</p>
      </div>

      {/* Esta semana contra la anterior. */}
      <div className="jv-b jv-b-cmp" style={{ ["--i" as string]: 6 }}>
        <p className="jv-b-et">Esta semana contra la anterior</p>
        {sem ? (
          <Comparacion
            titulo="Esta semana contra la anterior"
            filas={[
              { etiqueta: "Enviados", actual: sem.enviados.actual, anterior: sem.enviados.anterior },
              { etiqueta: "Captados", actual: sem.captados.actual, anterior: sem.captados.anterior },
              { etiqueta: "Citas", actual: sem.citas.actual, anterior: sem.citas.anterior },
              { etiqueta: "Derivados", actual: sem.derivados.actual, anterior: sem.derivados.anterior },
            ]}
          />
        ) : (
          <div className="jv-b-esqueleto" />
        )}
      </div>

      {/* Campañas recientes: enviados y respuestas. */}
      <div className="jv-b jv-b-cam" style={{ ["--i" as string]: 7 }}>
        <p className="jv-b-et">Campañas recientes · total</p>
        {tablero && tablero.campanas.length > 0 ? (
          <Barras titulo="Campañas recientes: mensajes enviados y respuestas" segundo="resp." datos={tablero.campanas.map((c) => ({ etiqueta: c.nombre, valor: c.enviados, segundo: c.respondieron }))} />
        ) : tablero ? (
          <p className="jv-b-nota">Todavía no hay campañas en este perfil.</p>
        ) : (
          <div className="jv-b-esqueleto" />
        )}
      </div>

      {errorTablero && (
        <p role="status" className="jv-b-aviso">
          No pude leer los gráficos de la semana ahora. El resto de Jarvis anda igual.
        </p>
      )}
    </section>
  );
}
