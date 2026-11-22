"use client";

import { useRef } from "react";
import { useParalaje } from "./use-paralaje";

/**
 * Fondo vivo: gradient mesh oscuro tipo «nubes» (violeta, magenta, teal e índigo sobre casi negro).
 * Quedan fijas detrás del contenido; cada nube deriva muy lento y se corre un poco con el scroll y el
 * puntero (parallax: cada una a su distancia). Solo transform. Con «reducir movimiento» quedan quietas.
 * No recibe foco ni lo leen los lectores de pantalla.
 */
export function FondoVivo({ className }: { className?: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  useParalaje(raiz);
  return (
    <div ref={raiz} className={`pm-fondo${className ? ` ${className}` : ""}`} aria-hidden="true">
      <span className="pm-fondo__capa" style={{ ["--pm-k" as string]: 46 }}>
        <span className="pm-fondo__nube pm-fondo__nube--violeta" />
      </span>
      <span className="pm-fondo__capa" style={{ ["--pm-k" as string]: 30 }}>
        <span className="pm-fondo__nube pm-fondo__nube--magenta" />
      </span>
      <span className="pm-fondo__capa" style={{ ["--pm-k" as string]: 56 }}>
        <span className="pm-fondo__nube pm-fondo__nube--teal" />
      </span>
      <span className="pm-fondo__capa" style={{ ["--pm-k" as string]: 20 }}>
        <span className="pm-fondo__nube pm-fondo__nube--indigo" />
      </span>
      <span className="pm-fondo__grano" />
    </div>
  );
}
