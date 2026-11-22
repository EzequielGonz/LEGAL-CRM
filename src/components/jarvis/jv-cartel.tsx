"use client";

import { palabrasDeCartel } from "@/lib/jarvis/tablero";

/**
 * Carteles de Jarvis (vuelta 6, marca 6 del dueño en el video): el texto aparece palabra por palabra y lo
 * que va entre asteriscos queda en itálica serif con un recuadro fino («*3 personas*»). Para lectores de
 * pantalla se lee la frase entera, una sola vez (las palabras animadas van ocultas).
 */
export function Cartel({ texto, como: Etiqueta = "p", className = "", retrasoMs = 0, id }: { texto: string; como?: "h1" | "h2" | "h3" | "p"; className?: string; retrasoMs?: number; id?: string }) {
  const palabras = palabrasDeCartel(texto);
  const leible = texto.replace(/\*/g, "");
  return (
    <Etiqueta id={id} className={`jv-cartel ${className}`}>
      <span className="sr-only">{leible}</span>
      <span aria-hidden="true">
        {palabras.map((p, i) => (
          <span key={i} className={p.clave ? "jv-cartel-p jv-cartel-clave" : "jv-cartel-p"} style={{ animationDelay: `${retrasoMs + i * 70}ms` }}>
            {p.t}
          </span>
        ))}
      </span>
    </Etiqueta>
  );
}

/** Etiqueta píldora amarilla (como «NOMBRES» en el video). */
export function Pildora({ children, tono = "amarilla" }: { children: React.ReactNode; tono?: "amarilla" | "clara" }) {
  return <span className={`jv-pildora jv-pildora-${tono}`}>{children}</span>;
}
