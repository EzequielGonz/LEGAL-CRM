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
  id?: string;
}

/** Tarjeta de Jarvis: vidrio intenso, radio 24, saludo en serif itálica, dos frases y como mucho dos botones. */
export function SaludoJarvis({ saludo, frases, acciones, id = "pm-jarvis" }: SaludoJarvisProps) {
  return (
    <section className="pm-tarjeta pm-tarjeta--vidrio pm-entra-vidrio pm-jarvis" aria-labelledby={`${id}-saludo`}>
      <span className="pm-jarvis__orbe" aria-hidden="true" />
      <h2 id={`${id}-saludo`} className="pm-jarvis__saludo">
        {saludo}
      </h2>
      <div className="pm-jarvis__frases">
        {frases.filter((f): f is string => !!f).map((f) => (
          <p key={f}>{f}</p>
        ))}
      </div>
      {acciones ? (
        <div className="pm-jarvis__acciones">
          {acciones
            .filter((a): a is AccionJarvis => !!a)
            .map((a, i) => (
              <Boton key={a.href + a.texto} href={a.href} variante={i === 0 ? "primario" : "secundario"}>
                {a.texto}
              </Boton>
            ))}
        </div>
      ) : null}
    </section>
  );
}
