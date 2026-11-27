"use client";

import { PedirAJarvis } from "@/components/resumen/pedir-a-jarvis";
import type { Recomendacion } from "@/lib/cerebro/recomendaciones";
import { ETIQUETA_RUBRO } from "@/lib/cerebro/contenido";

/** «Lo que el cerebro recomienda hoy»: tres tarjetas, cada una con «Hacerlo» (abre a Jarvis, que pide confirmación). */
export function RecomendacionesCerebro({ items }: { items: Recomendacion[] }) {
  if (items.length === 0) return <p className="cz-muted">Hoy no hay nada para recomendar.</p>;
  return (
    <ul className="cz-recos">
      {items.map((r, i) => (
        <li key={r.clave} className="cz-reco" style={{ ["--i" as string]: i }}>
          <span className="cz-reco__rubro">{ETIQUETA_RUBRO[r.rubro]}</span>
          <h3>{r.titulo}</h3>
          <p>{r.porque}</p>
          <PedirAJarvis pedido={r.pedido} className="cz-btn chico">
            Hacerlo
          </PedirAJarvis>
          <small>Jarvis te pide confirmación antes de ejecutar.</small>
        </li>
      ))}
    </ul>
  );
}
