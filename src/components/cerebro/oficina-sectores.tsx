import Link from "next/link";
import type { Area, TareaOficina } from "@/lib/oficina/reglas";
import { NOMBRE_MOTOR, ORDEN_SECTORES, SECTORES, cuentaMotores, estadoSector, puestosOcupados, type EstadoSector, type Sector } from "@/lib/oficina/sectores";

/**
 * Edificio de la Oficina (22/11): el Cerebro en el centro, conectado a cada sector con una línea
 * que se enciende cuando ese sector trabaja. Cada sector es una oficina entera a la que se entra
 * (`/oficina?sector=redes`), con un escritorio por tarea específica y el motor con que corre.
 * Sin estado de cliente: lo dibuja el servidor (no hay #418). Las animaciones son CSS y se apagan
 * con movimiento reducido.
 */

// Celdas de la grilla 3×3 alrededor del Cerebro (la del centro es el Cerebro).
const CELDAS: [number, number][] = [
  [0, 0], [1, 0], [2, 0],
  [0, 1],         [2, 1],
  [0, 2], [1, 2], [2, 2],
];

function pedido(texto: string): string {
  return `/asistente?pedido=${encodeURIComponent(`${texto}. No ejecutes nada hasta que yo te lo confirme.`)}`;
}

export function EdificioOficina({ tareas }: { tareas: TareaOficina[] }) {
  const sectores = ORDEN_SECTORES.filter((a) => a !== "direccion").map((a) => ({ s: SECTORES[a], e: estadoSector(a, tareas) }));
  const cerebro = estadoSector("direccion", tareas);
  const enMarcha = tareas.filter((t) => t.estado === "en_curso").length;
  return (
    <section className="cz-edif" aria-labelledby="edif-titulo">
      <h2 id="edif-titulo" className="cz-edif-titulo">
        El edificio
      </h2>
      <p className="cz-edif-bajada">Cada sector es una oficina con su equipo. El Cerebro recibe tus órdenes, las reparte y revisa todo antes de que te llegue. Tocá un sector para entrar.</p>
      <div className="cz-edif-planta">
        <svg className="cz-edif-cables" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true">
          {sectores.map(({ s, e }, i) => {
            const [c, f] = CELDAS[i] ?? [1, 1];
            const activo = e.trabajando > 0 || e.enCola > 0;
            return <line key={s.area} x1={150} y1={150} x2={50 + c * 100} y2={50 + f * 100} className={activo ? "cz-cable cz-cable--activo" : "cz-cable"} />;
          })}
        </svg>
        {sectores.map(({ s, e }, i) => {
          const [c, f] = CELDAS[i] ?? [1, 1];
          return <TarjetaSector key={s.area} sector={s} estado={e} col={c} fila={f} indice={i} />;
        })}
        <Link href="/cerebro" prefetch={false} className="cz-edif-cerebro" style={{ gridColumn: 2, gridRow: 2 }}>
          <span className="cz-edif-orbe" aria-hidden="true" />
          <span className="cz-edif-cerebro-t">Cerebro</span>
          <span className="cz-edif-cerebro-s">
            {enMarcha > 0 ? `orquestando ${enMarcha} ${enMarcha === 1 ? "tarea" : "tareas"}` : "esperando órdenes"}
            {cerebro.paraAprobar > 0 ? ` · ${cerebro.paraAprobar} para tu OK` : ""}
          </span>
        </Link>
      </div>
    </section>
  );
}

function TarjetaSector({ sector, estado, col, fila, indice }: { sector: Sector; estado: EstadoSector; col: number; fila: number; indice: number }) {
  const activo = estado.trabajando > 0;
  const motores = cuentaMotores(sector);
  return (
    <Link
      href={`/oficina?sector=${sector.area}`}
      prefetch={false}
      className={activo ? "cz-sec cz-sec--activo" : "cz-sec"}
      style={{ gridColumn: col + 1, gridRow: fila + 1, ["--i" as string]: indice }}
      aria-label={`Entrar a ${sector.titulo}: ${sector.puestos.length} puestos, ${estado.trabajando} trabajando, ${estado.enCola} en cola, ${estado.paraAprobar} para aprobar`}
    >
      <span className="cz-sec-t">{sector.titulo}</span>
      <span className="cz-sec-mesas" aria-hidden="true">
        {sector.puestos.map((p, j) => (
          <i key={p.id} className={j < puestosOcupados(sector, estado) ? "cz-mesa cz-mesa--on" : "cz-mesa"} />
        ))}
      </span>
      <span className="cz-sec-e">
        {activo ? `${estado.trabajando} trabajando` : estado.enCola > 0 ? `${estado.enCola} en cola` : "libre"}
        {estado.paraAprobar > 0 ? ` · ${estado.paraAprobar} para tu OK` : ""}
      </span>
      <span className="cz-sec-m">
        {(["claude", "gemini", "panel"] as const)
          .filter((m) => motores[m] > 0)
          .map((m) => `${motores[m]} ${NOMBRE_MOTOR[m]}`)
          .join(" · ")}
      </span>
    </Link>
  );
}

export function SectorOficina({ area, tareas }: { area: Area; tareas: TareaOficina[] }) {
  const s = SECTORES[area];
  const e = estadoSector(area, tareas);
  const ocupados = puestosOcupados(s, e);
  const propias = tareas.filter((t) => t.area === area || t.ruta.includes(area)).slice(0, 5);
  return (
    <section className="cz-sala" aria-labelledby="sala-titulo">
      <div className="cz-sala-cab">
        <Link href="/oficina" prefetch={false} className="cz-sala-volver">
          ← Edificio
        </Link>
        <Link href="/cerebro" prefetch={false} className="cz-sala-enlace">
          <span className="cz-sala-pulso" aria-hidden="true" /> Conectado al Cerebro
        </Link>
      </div>
      <h2 id="sala-titulo" className="cz-sala-titulo">
        {s.titulo}
      </h2>
      <p className="cz-edif-bajada">{s.bajada}</p>
      <ul className="cz-sala-piso">
        {s.puestos.map((p, j) => {
          const on = j < ocupados;
          return (
            <li key={p.id} className={on ? "cz-puesto cz-puesto--on" : "cz-puesto"} style={{ ["--i" as string]: j }}>
              <span className="cz-chibi" aria-hidden="true">
                <i className="cz-chibi-cabeza" />
                <i className="cz-chibi-cuerpo" />
                <i className="cz-chibi-mesa" />
              </span>
              <span className="cz-puesto-n">{p.nombre}</span>
              <span className="cz-puesto-t">{p.tarea}</span>
              <span className={`cz-motor cz-motor--${p.motor}`}>
                {on ? "Trabajando · " : ""}
                {NOMBRE_MOTOR[p.motor]}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="cz-sala-acciones">
        <a className="cz-sala-boton cz-sala-boton--pri" href={pedido(`Pedile al sector ${s.titulo}: ${s.ejemplo}`)}>
          Pedirle algo a este sector
        </a>
        <a className="cz-sala-boton" href="#oficina">
          Dejar una tarea a la oficina
        </a>
      </div>
      {propias.length > 0 ? (
        <div className="cz-sala-tareas">
          <h3>Lo que pasa por este sector</h3>
          <ul>
            {propias.map((t) => (
              <li key={t.id}>
                <span>{t.titulo}</span>
                <span className="cz-muted">{t.estado === "en_curso" ? "en marcha" : t.estado === "pendiente" ? "en cola" : t.estado === "lista" ? (t.decision ? "cerrada" : "para tu OK") : t.estado === "descartada" ? "descartada" : "trabada"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
