import type { ReactNode } from "react";

/**
 * Carteles animados (vuelta 6, marcados por el dueño en el video Df93dArgY10):
 * títulos que aparecen palabra por palabra y palabras clave en itálica serif
 * dentro de un recuadro fino. En `texto`, lo que va entre corchetes se resalta:
 * «¿Con qué [perfil] trabajás?». Puro CSS (sin JS): el texto completo está en
 * el HTML y el lector de pantalla lo lee entero; con movimiento reducido aparece quieto.
 */
export interface CartelProps {
  texto: string;
  como?: "h1" | "h2" | "h3" | "p" | "div";
  /** Línea chica arriba, también palabra por palabra: «de [diferentes]». */
  antetitulo?: string;
  tamano?: "xl" | "l" | "m";
  /** Demora inicial en ms. */
  retrasoMs?: number;
  className?: string;
  id?: string;
}

/** Parte un texto con [marcas] en palabras; cada una sabe si va resaltada. */
export function palabrasDeCartel(texto: string): { palabra: string; marcada: boolean }[] {
  const salida: { palabra: string; marcada: boolean }[] = [];
  const re = /\[([^\]]+)\]|([^\s[\]]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m[1] !== undefined) salida.push({ palabra: m[1], marcada: true });
    else salida.push({ palabra: m[2], marcada: false });
  }
  return salida;
}

function Palabras({ texto, desde, pasoMs }: { texto: string; desde: number; pasoMs: number }) {
  const ps = palabrasDeCartel(texto);
  const nodos: ReactNode[] = [];
  ps.forEach((p, i) => {
    if (i > 0) nodos.push(" ");
    nodos.push(
      <span key={i} className={p.marcada ? "vv-p vv-p--marca" : "vv-p"} style={{ animationDelay: `${desde + i * pasoMs}ms` }}>
        {p.palabra}
      </span>
    );
  });
  return <>{nodos}</>;
}

export function Cartel({ texto, como: Etiqueta = "h2", antetitulo, tamano = "l", retrasoMs = 0, className, id }: CartelProps) {
  const pasos = antetitulo ? palabrasDeCartel(antetitulo).length : 0;
  return (
    <div className={`vv-cartel vv-cartel--${tamano}${className ? ` ${className}` : ""}`}>
      {antetitulo ? (
        <p className="vv-cartel__ante">
          <Palabras texto={antetitulo} desde={retrasoMs} pasoMs={90} />
        </p>
      ) : null}
      <Etiqueta id={id} className="vv-cartel__titulo">
        <Palabras texto={texto} desde={retrasoMs + pasos * 90 + (antetitulo ? 120 : 0)} pasoMs={110} />
      </Etiqueta>
    </div>
  );
}

/** Cita en serif itálica entre comillas latinas, como en el video. */
export function Cita({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`vv-cita${className ? ` ${className}` : ""}`}>«{children}»</p>;
}

/** Etiqueta-píldora amarilla en mayúsculas mono («NOMBRES» del video). */
export function PildoraAmarilla({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={`vv-pildora${className ? ` ${className}` : ""}`}>{children}</span>;
}
