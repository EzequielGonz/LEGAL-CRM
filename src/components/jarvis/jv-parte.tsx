"use client";

import Link from "next/link";
import type { ParteDelDia } from "@/lib/jarvis/parte";
import type { Propuesta } from "@/components/asistente/asistente-panel";
import { JvAnillo } from "@/components/jarvis/jv-anillo";
import { JvConfirmar } from "@/components/jarvis/jv-confirmar";

/** Un solo color en todo el parte: el acento del perfil (sin paleta de colores sueltos). */
const ACENTO = "rgb(var(--c-gold-500))";

interface Props {
  parte: ParteDelDia;
  pendientes: Propuesta[];
  otrasEnAsistente: number;
  alCerrar: () => void;
  alPedir: (pedido: string) => void;
  alIr: () => void;
  alCambiarPropuesta: (p: Propuesta) => void;
}

/**
 * Parte del día en bento (22/11): saludo con 2 o 3 frases, tres anillos y lo
 * que espera una decisión. Cada baldosa es de vidrio sutil con el acento del perfil.
 */
export function JvParte({ parte, pendientes, otrasEnAsistente, alCerrar, alPedir, alIr, alCambiarPropuesta }: Props) {
  const hayParaDecidir = parte.decisiones.length > 0 || pendientes.length > 0;
  return (
    <section className="jv-bento" aria-label="Parte del día">
      <div className="jv-baldosa jv-baldosa-saludo">
        <div className="jv-saludo-cabeza">
          <span className="jv-vivo" aria-hidden="true" />
          <button type="button" className="jv-cerrar-parte" onClick={alCerrar} aria-label="Cerrar el parte del día">
            Cerrar
          </button>
        </div>
        <h2 className="jv-saludo">{parte.saludo}.</h2>
        <p className="jv-frases">{parte.frases.join(" ")}</p>
      </div>

      {parte.anillos.map((a) => (
        <div key={a.clave} className={`jv-baldosa jv-baldosa-anillo jv-tinte-${a.clave}`}>
          <JvAnillo valor={a.valor} meta={a.meta} etiqueta={a.etiqueta} nota={a.nota} color={ACENTO} />
          <p className="jv-anillo-etiqueta">{a.etiqueta}</p>
          <p className="jv-anillo-nota">{a.nota}</p>
        </div>
      ))}

      <div className="jv-baldosa jv-baldosa-decidir">
        <h3 className="jv-titulo-baldosa">Para decidir</h3>
        {!hayParaDecidir && <p className="jv-todo-al-dia">Todo al día. No hay nada esperando tu decisión.</p>}
        {parte.decisiones.length > 0 && (
          <ul className="jv-lista">
            {parte.decisiones.map((d) => (
              <li key={d.texto}>
                <span>{d.texto}</span>
                {d.accion.tipo === "ir" ? (
                  <Link prefetch={false} href={d.accion.href} onClick={alIr} className="jv-boton jv-boton-chico">
                    {d.boton}
                  </Link>
                ) : (
                  <button type="button" className="jv-boton jv-boton-chico" onClick={() => alPedir((d.accion as { tipo: "jarvis"; pedido: string }).pedido)}>
                    {d.boton}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {pendientes.map((p) => (
          <JvConfirmar key={p.id} p={p} alCambiar={alCambiarPropuesta} />
        ))}
        {otrasEnAsistente > 0 && (
          <p className="jv-nota-chica">
            {otrasEnAsistente} {otrasEnAsistente === 1 ? "propuesta más se confirma" : "propuestas más se confirman"} desde el{" "}
            <Link prefetch={false} href="/asistente" onClick={alIr}>
              Asistente completo
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
