"use client";

import { porcentajeTexto } from "@/lib/jarvis/tablero";
import { totalSemana, variacion, type CifrasPerfilSemana } from "@/lib/asistente/semana-reglas";
import { Aro, Barras, Cifra, Comparacion, fmt } from "@/components/jarvis/jv-graficos";
import { Delta } from "@/components/jarvis/jv-bento";

/**
 * Bento de colores de /asistente (vuelta 6): la semana de los cuatro perfiles con gráficos animados.
 * Es la pantalla general (la que se abre desde Perfiles), donde ya se ven los cuatro perfiles con su
 * nombre; cada número sigue siendo de su perfil y no se mezclan datos entre rubros.
 */
export function JvBentoGeneral({ perfiles }: { perfiles: { perfil: string; nombre: string; cifras: CifrasPerfilSemana }[] }) {
  const t = totalSemana(perfiles.map((p) => p.cifras));
  return (
    <section className="jv-bento-g" aria-label="La semana en todo el panel">
      <div className="jv-b jv-bg-env" style={{ ["--i" as string]: 0 }}>
        <p className="jv-b-et">Mensajes de la semana</p>
        <p className="jv-b-num">
          <Cifra valor={t.enviados.actual} />
          <Delta v={variacion(t.enviados.actual, t.enviados.anterior)} />
        </p>
        <p className="jv-g-leyenda" aria-hidden="true">
          <span>
            <i style={{ background: "#fff" }} />
            enviados
          </span>
          <span>
            <i style={{ background: "#ffd43b" }} />
            respondieron
          </span>
        </p>
        <Barras titulo="Mensajes enviados y personas que respondieron, por perfil" segundo="resp." datos={perfiles.map((p) => ({ etiqueta: p.nombre, valor: p.cifras.enviados.actual ?? 0, segundo: p.cifras.respondieron.actual ?? 0 }))} />
      </div>

      <div className="jv-b jv-bg-rpp" style={{ ["--i" as string]: 1 }}>
        <p className="jv-b-et">Respuestas por perfil</p>
        <ul className="jv-g-perfiles" aria-label="Porcentaje de personas que respondieron, por perfil">
          {perfiles.map((p) => (
            <li key={p.perfil}>
              <span>{p.nombre}</span>
              <b>{porcentajeTexto(p.cifras.respondieron.actual, p.cifras.enviados.actual)}</b>
            </li>
          ))}
        </ul>
      </div>

      <div className="jv-b jv-bg-esp" style={{ ["--i" as string]: 2 }}>
        <p className="jv-b-et">Chats que piden una persona</p>
        <p className="jv-b-num">
          <Cifra valor={t.piden.actual} />
        </p>
        <ul className="jv-g-perfiles" aria-label="Chats que piden una persona, por perfil">
          {perfiles.map((p) => (
            <li key={p.perfil}>
              <span>{p.nombre}</span>
              <b>{fmt(p.cifras.piden.actual)}</b>
            </li>
          ))}
        </ul>
        <p className="jv-b-nota">Ahora mismo</p>
      </div>

      <div className="jv-b jv-bg-cap" style={{ ["--i" as string]: 3 }}>
        <p className="jv-b-et">Captados</p>
        <p className="jv-b-num">
          <Cifra valor={t.captados.actual} />
          <Delta v={variacion(t.captados.actual, t.captados.anterior)} />
        </p>
        <Barras titulo="Captados de la semana, por perfil" datos={perfiles.map((p) => ({ etiqueta: p.nombre, valor: p.cifras.captados.actual ?? 0 }))} />
      </div>

      <div className="jv-b jv-bg-der" style={{ ["--i" as string]: 4 }}>
        <p className="jv-b-et">Derivados</p>
        <Aro valor={t.derivados.actual} total={t.captados.actual} etiqueta="Derivados de los captados de la semana" tamano={80} />
        <p className="jv-b-nota">de {fmt(t.captados.actual)} captados</p>
      </div>

      <div className="jv-b jv-bg-cit" style={{ ["--i" as string]: 5 }}>
        <p className="jv-b-et">Citas</p>
        <p className="jv-b-num">
          <Cifra valor={t.citas.actual} />
          <Delta v={variacion(t.citas.actual, t.citas.anterior)} />
        </p>
        <p className="jv-b-nota">nuevas esta semana</p>
      </div>

      <div className="jv-b jv-bg-cmp" style={{ ["--i" as string]: 6 }}>
        <p className="jv-b-et">Esta semana contra la anterior</p>
        <Comparacion
          titulo="Los cuatro perfiles: esta semana contra la anterior"
          filas={[
            { etiqueta: "Enviados", actual: t.enviados.actual, anterior: t.enviados.anterior },
            { etiqueta: "Captados", actual: t.captados.actual, anterior: t.captados.anterior },
            { etiqueta: "Citas", actual: t.citas.actual, anterior: t.citas.anterior },
            { etiqueta: "Derivados", actual: t.derivados.actual, anterior: t.derivados.anterior },
          ]}
        />
      </div>
    </section>
  );
}
