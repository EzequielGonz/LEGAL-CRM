import Link from "next/link";
import type { Area, TareaOficina } from "@/lib/oficina/reglas";
import { NOMBRE_MOTOR, ORDEN_SECTORES, SECTORES, cuentaMotores, estadoSector } from "@/lib/oficina/sectores";

/**
 * Entradas a los sectores de la Oficina (22/11). El dueño quiere la MISMA oficina animada 3D,
 * más grande, y poder entrar a cada sector: la sala 3D de `/oficina?sector=redes` muestra los
 * puestos de ese sector (guionista, render, analista…) trabajando. Acá solo van la fila de
 * entradas y la cabecera del sector; la escena la dibuja `OficinaVisual`.
 */

function pedido(texto: string): string {
  return `/asistente?pedido=${encodeURIComponent(`${texto}. No ejecutes nada hasta que yo te lo confirme.`)}`;
}

export function EntradasSectores({ actual, tareas }: { actual: Area | null; tareas: TareaOficina[] }) {
  return (
    <nav className="cz-entradas" aria-label="Sectores de la oficina">
      <Link href="/oficina" prefetch={false} className={actual ? "cz-entrada" : "cz-entrada cz-entrada--on"} aria-current={actual ? undefined : "page"}>
        Sala general
      </Link>
      {ORDEN_SECTORES.map((a) => {
        const s = SECTORES[a];
        const e = estadoSector(a, tareas);
        const on = a === actual;
        return (
          <Link key={a} href={`/oficina?sector=${a}`} prefetch={false} className={on ? "cz-entrada cz-entrada--on" : "cz-entrada"} aria-current={on ? "page" : undefined}>
            {e.trabajando > 0 ? <span className="cz-entrada-punto" aria-hidden="true" /> : null}
            {s.titulo}
            {e.trabajando > 0 ? <span className="sr-only"> (trabajando)</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function CabeceraSector({ area }: { area: Area }) {
  const s = SECTORES[area];
  const m = cuentaMotores(s);
  return (
    <div className="cz-sector-cab">
      <div>
        <h2 className="cz-sala-titulo">{s.titulo}</h2>
        <p className="cz-edif-bajada">
          {s.bajada} {s.puestos.length} puestos:{" "}
          {(["claude", "gemini", "panel"] as const)
            .filter((k) => m[k] > 0)
            .map((k) => `${m[k]} con ${NOMBRE_MOTOR[k]}`)
            .join(", ")}
          .
        </p>
      </div>
      <div className="cz-sala-acciones">
        <a className="cz-sala-boton cz-sala-boton--pri" href={pedido(`Pedile al sector ${s.titulo}: ${s.ejemplo}`)}>
          Pedirle algo a este sector
        </a>
        <a className="cz-sala-boton" href="#oficina-tarea">
          Dejar una tarea
        </a>
      </div>
    </div>
  );
}
