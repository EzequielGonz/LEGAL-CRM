"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarjetaJarvis } from "@/lib/jarvis/tablero";
import { Barras } from "@/components/jarvis/jv-graficos";
import { Icono } from "@/components/ui/icono-seccion";

/**
 * Respuesta que se escribe en vivo (vuelta 6). El texto completo está siempre para lectores de pantalla
 * (una sola vez, sin repetir cada palabra); lo que se ve aparece palabra por palabra. Con «reducir
 * movimiento» o en respuestas viejas aparece entero.
 */
export function TextoVivo({ texto, animar, alTerminar }: { texto: string; animar: boolean; alTerminar?: () => void }) {
  const palabras = texto.split(/(\s+)/);
  const [n, setN] = useState(animar ? 0 : palabras.length);
  const fin = useRef(alTerminar);
  fin.current = alTerminar;
  useEffect(() => {
    if (!animar || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(palabras.length);
      fin.current?.();
      return;
    }
    let i = 0;
    const paso = Math.max(12, Math.min(38, 1400 / Math.max(1, palabras.length)));
    const t = window.setInterval(() => {
      i += 2;
      setN(i);
      if (i >= palabras.length) {
        window.clearInterval(t);
        fin.current?.();
      }
    }, paso);
    return () => window.clearInterval(t);
    // Solo al montar: cada mensaje se escribe una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const escribiendo = n < palabras.length;
  return (
    <p className="jv-burbuja-texto">
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {palabras.slice(0, n).join("")}
        {escribiendo && <span className="jv-cursor" />}
      </span>
    </p>
  );
}

/** Tarjeta rica de resultado: gráfico de barras, lista de personas (nombre corto) o estado. */
export function TarjetaResultado({ t, alIr }: { t: TarjetaJarvis; alIr?: () => void }) {
  return (
    <div className={`jv-res jv-res-t-${t.tipo}`}>
      <p className="jv-res-titulo">
        <span className="jv-res-icono" aria-hidden="true">
          <Icono nombre={t.tipo === "personas" ? "prospectos" : t.tipo === "estado" ? "salud" : "estadisticas"} className="h-3.5 w-3.5" />
        </span>
        {t.titulo}
      </p>
      {t.tipo === "barras" && <Barras titulo={t.titulo} datos={t.datos} />}
      {t.tipo === "personas" && (
        <ul className="jv-res-personas" aria-label={t.titulo}>
          {t.personas.map((p, i) => (
            <li key={`${p.nombre}-${i}`} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="jv-res-inicial" aria-hidden="true">
                {p.nombre.charAt(0)}
              </span>
              <span className="jv-res-quien">
                <b>{p.nombre}</b>
                <span>{p.detalle}</span>
              </span>
              <span className={`jv-res-tono jv-res-tono-${p.tono}`} aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
      {t.tipo === "estado" && (
        <ul className="jv-res-estado" aria-label={t.titulo}>
          {t.filas.map((f, i) => (
            <li key={`${f.etiqueta}-${i}`}>
              <span className={f.ok ? "jv-res-luz jv-res-luz-ok" : "jv-res-luz jv-res-luz-mal"} aria-hidden="true" />
              <span className="jv-res-quien">
                <b>{f.etiqueta}</b>
                <span>{f.valor}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {(t.nota || ("enlace" in t && t.enlace)) && (
        <div className="jv-res-pie">
          {t.nota && <span>{t.nota}</span>}
          {"enlace" in t && t.enlace && (
            <Link prefetch={false} href={t.enlace.href} onClick={alIr} className="jv-res-enlace">
              {t.enlace.texto}
              <Icono nombre="flecha" className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
