import { resumenSemanaEnMemoria } from "@/lib/asistente/semana-cache";
import { CIFRAS_SEMANA, proporciones, totalSemana, variacion, type CifraSemana, type Variacion } from "@/lib/asistente/semana-reglas";
import { NOMBRE_PERFIL } from "@/lib/asistente/general";
import { Anillo } from "@/components/premium/anillo";
import type { SlugPerfil } from "@/lib/marca";

/**
 * La semana de todo el panel en Jarvis (22/11): arriba, el total de los cuatro
 * perfiles con la flecha contra la semana anterior; abajo, una tarjeta por
 * perfil con tres anillos (respondieron de los enviados, derivados de los
 * captados y citas de los captados) y dos barras simples: esta semana contra
 * la anterior. Todo con el número escrito: nada depende del color ni del arco.
 * Solo lectura; sin hora ni azar en el dibujo (el servidor y el cliente
 * pintan lo mismo).
 */
const FORMATO = new Intl.NumberFormat("es-AR");
const num = (n: number | null) => (n == null ? "—" : FORMATO.format(n));

function Flecha({ v }: { v: Variacion }) {
  if (v.flecha === "sin_dato") return null;
  const tono = v.flecha === "sube" ? " jv-flecha-sube" : v.flecha === "baja" ? " jv-flecha-baja" : "";
  return (
    <span className={`jv-flecha${tono}`}>
      <span aria-hidden="true">
        {v.flecha === "sube" ? "▲ " : v.flecha === "baja" ? "▼ " : "= "}
        {v.texto}
      </span>
      <span className="sr-only">{v.largo}</span>
    </span>
  );
}

/** Anillo con meta propia: si falta el valor, muestra «—» en vez de inventar un cero. */
function ColumnaAnillo({ rubro, etiqueta, valor, meta, unidad, retraso }: { rubro: SlugPerfil; etiqueta: string; valor: number | null; meta: number | null; unidad: string; retraso: number }) {
  return (
    <div className="jv-anillo-col">
      {valor == null ? (
        <p className="jv-dato-n" role="img" aria-label={`${etiqueta}: sin dato`}>
          —
        </p>
      ) : (
        <Anillo valor={valor} meta={Math.max(meta ?? 0, valor, 1)} rubro={rubro} tamano="chico" nombre={etiqueta} unidad={unidad} retrasoMs={retraso} />
      )}
      <p className="jv-anillo-etiqueta">{etiqueta}</p>
    </div>
  );
}

function Barras({ titulo, c }: { titulo: string; c: CifraSemana }) {
  const [a, b] = proporciones([c.actual, c.anterior]);
  return (
    <ul className="jv-barras" aria-label={titulo}>
      <li className="jv-barra">
        <span>Esta semana</span>
        <span className="jv-barra-carril" aria-hidden="true">
          <span className="jv-barra-relleno" style={{ width: `${a}%` }} />
        </span>
        <span className="jv-barra-n">{num(c.actual)}</span>
      </li>
      <li className="jv-barra">
        <span>Anterior</span>
        <span className="jv-barra-carril" aria-hidden="true">
          <span className="jv-barra-relleno jv-barra-relleno-ant" style={{ width: `${b}%` }} />
        </span>
        <span className="jv-barra-n">{num(c.anterior)}</span>
      </li>
    </ul>
  );
}

export async function ResumenSemana() {
  const datos = await resumenSemanaEnMemoria().catch(() => null);
  if (!datos) {
    return <p className="jv-dato jv-nota-chica">No se pudo leer el resumen de la semana. Probá recargar en un rato.</p>;
  }
  const total = totalSemana(datos.perfiles.map((p) => p.cifras));
  const destacadas = CIFRAS_SEMANA.filter((c) => ["enviados", "captados", "citas", "piden"].includes(c.clave));
  return (
    <section aria-labelledby="semana-titulo">
      <h2 id="semana-titulo" className="jv-semana-titulo">
        La semana en todo el panel
      </h2>
      <p className="jv-semana-sub">Últimos 7 días, con la flecha contra los 7 anteriores.</p>
      <ul className="jv-semana-total" aria-label="Total de los cuatro perfiles">
        {destacadas.map((c) => (
          <li key={c.clave} className="jv-dato">
            <p className="jv-dato-t">{c.titulo}</p>
            <p className="jv-dato-n">
              <span>{num(total[c.clave].actual)}</span>
              <Flecha v={variacion(total[c.clave].actual, total[c.clave].anterior)} />
            </p>
          </li>
        ))}
      </ul>
      <ul className="jv-semana-grilla" aria-label="La semana por perfil">
        {datos.perfiles.map((p, i) => {
          const c = p.cifras;
          const nombre = NOMBRE_PERFIL[p.perfil];
          return (
            <li key={p.perfil} className="jv-perfil">
              <h3 className="jv-perfil-nombre">{nombre}</h3>
              <div className="jv-anillos">
                <ColumnaAnillo rubro={p.perfil} etiqueta="Respondieron" valor={c.respondieron.actual} meta={c.enviados.actual} unidad={`personas respondieron, de ${num(c.enviados.actual)} mensajes enviados`} retraso={i * 80} />
                <ColumnaAnillo rubro={p.perfil} etiqueta="Derivados" valor={c.derivados.actual} meta={c.captados.actual} unidad={`derivados, de ${num(c.captados.actual)} captados`} retraso={i * 80 + 60} />
                <ColumnaAnillo rubro={p.perfil} etiqueta="Citas" valor={c.citas.actual} meta={c.captados.actual} unidad={`citas, con ${num(c.captados.actual)} captados`} retraso={i * 80 + 120} />
              </div>
              <Barras titulo={`Mensajes enviados, ${nombre}: esta semana contra la anterior`} c={c.enviados} />
              <Barras titulo={`Captados, ${nombre}: esta semana contra la anterior`} c={c.captados} />
              <p className="jv-perfil-pie">
                {num(c.campanas.actual)} {c.campanas.actual === 1 ? "campaña en curso" : "campañas en curso"} · {num(c.piden.actual)} {c.piden.actual === 1 ? "chat pide" : "chats piden"} una persona
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
