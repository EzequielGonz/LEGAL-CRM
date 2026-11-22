import type { ReactNode } from "react";
import { Boton } from "./boton";

export interface AccionJarvis {
  texto: string;
  href: string;
}

export interface SaludoJarvisProps {
  /** Saludo ya armado por quien llama (por ejemplo «Buen día, Ana.»). Acá no se lee la hora: evita diferencias de hidratación. */
  saludo: string;
  /** Hasta dos frases cortas, sin jerga. */
  frases: [string, string?];
  /** Hasta dos acciones; la primera es la principal. */
  acciones?: [AccionJarvis, AccionJarvis?];
  /** Botón extra (por ejemplo el que abre Jarvis): va después de las acciones. */
  children?: ReactNode;
  className?: string;
  id?: string;
}

/** Tarjeta de Jarvis: vidrio intenso, radio 24, saludo en serif itálica, dos frases y como mucho dos botones. */
export function SaludoJarvis({ saludo, frases, acciones, children, className, id = "pm-jarvis" }: SaludoJarvisProps) {
  return (
    <section className={`pm-tarjeta pm-tarjeta--vidrio pm-entra-vidrio pm-jarvis${className ? ` ${className}` : ""}`} aria-labelledby={`${id}-saludo`}>
      <h2 id={`${id}-saludo`} className="pm-jarvis__saludo">
        {saludo}
      </h2>
      <div className="pm-jarvis__frases">
        {frases.filter((f): f is string => !!f).map((f) => (
          <p key={f}>{f}</p>
        ))}
      </div>
      {acciones || children ? (
        <div className="pm-jarvis__acciones">
          {((acciones ?? []) as (AccionJarvis | undefined)[])
            .filter((a): a is AccionJarvis => !!a)
            .map((a, i) => (
              <Boton key={a.href + a.texto} href={a.href} variante={i === 0 ? "primario" : "secundario"}>
                {a.texto}
              </Boton>
            ))}
          {children}
        </div>
      ) : null}
    </section>
  );
}
