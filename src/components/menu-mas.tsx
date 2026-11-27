"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icono } from "@/components/ui/icono-seccion";
import { useDialogo } from "@/components/ui/use-dialogo";
import type { SlugPerfil } from "@/lib/marca";
import type { SeccionMenu } from "@/lib/menu";

/**
 * Panel «Más» (22/11, simplificación): todo lo que salió de la barra sigue a un toque.
 * En la computadora es una hoja de vidrio sutil al lado del menú; en el celular, una hoja desde abajo.
 * Cada tarjeta es una sección del perfil con sus vistas; nada de otro perfil aparece acá (los enlaces
 * salen de `secciones`, que ya es del perfil activo). Es un diálogo: Escape cierra, el foco queda adentro
 * y vuelve al botón «Más».
 */
export function HojaMas({
  abierto,
  alCerrar,
  secciones,
  activaClave,
  slug,
  plegado = false,
}: {
  abierto: boolean;
  alCerrar: () => void;
  secciones: SeccionMenu[];
  activaClave: string | null;
  slug: SlugPerfil;
  plegado?: boolean;
}) {
  const ref = useDialogo<HTMLDivElement>(abierto, alCerrar, { enfocarPrimero: true });
  if (!abierto) return null;
  const extras = [
    { href: `/asistente?perfil=${slug}`, label: "Asistente general" },
    { href: `/biblioteca-agentes?perfil=${slug}`, label: "Biblioteca de agentes" },
    { href: `/comparacion-agentes?perfil=${slug}`, label: "Comparar agentes" },
    { href: "/perfiles", label: "Cambiar de perfil" },
  ];
  return (
    <>
      <div data-no-inerte="" className="mas-velo" aria-hidden="true" onClick={alCerrar} />
      <div ref={ref} id="hoja-mas" role="dialog" aria-modal="true" aria-label="Más secciones" tabIndex={-1} data-plegado={plegado ? "1" : "0"} className="mas-hoja">
        <header className="mas-cabeza">
          <h2 className="mas-titulo">Más</h2>
          <button type="button" onClick={alCerrar} className="mas-cerrar" aria-label="Cerrar">
            <Icono nombre="cerrar" className="h-4 w-4" />
          </button>
        </header>
        <div className="mas-cuerpo">
          <ul className="mas-grilla">
            {secciones.map((s) => {
              const vistas = s.tabs.filter((t) => !t.oculto);
              return (
                <li key={s.clave} className="mas-tarjeta" data-activa={activaClave === s.clave ? "1" : undefined}>
                  <Link href={s.href} className="mas-tarjeta-cab" aria-current={activaClave === s.clave ? "page" : undefined}>
                    <span className="mas-icono" aria-hidden="true">
                      <Icono nombre={s.icono} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="mas-nombre">{s.label}</span>
                  </Link>
                  {vistas.length > 1 && (
                    <ul className="mas-vistas" aria-label={`Vistas de ${s.label}`}>
                      {vistas.map((t) => (
                        <li key={t.href}>
                          <Link href={t.href}>{t.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <ul className="mas-otros" aria-label="Otros accesos">
            <li>
              <EntradaBandeja slug={slug} />
            </li>
            {extras.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="mas-enlace">
                  {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

/** Bandeja para Claude (19/10), ahora dentro de «Más»: avisa si alguna tarea quedó en espera. */
function EntradaBandeja({ slug }: { slug: SlugPerfil }) {
  const [resumen, setResumen] = useState<{ pendiente: number; en_curso: number; en_espera: number } | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch("/api/bandeja-claude?resumen=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && d?.resumen && setResumen(d.resumen))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [slug]);
  const espera = resumen?.en_espera ?? 0;
  const abiertas = (resumen?.pendiente ?? 0) + (resumen?.en_curso ?? 0);
  const detalle = espera ? `${espera} en espera` : abiertas ? `${abiertas} abierta${abiertas === 1 ? "" : "s"}` : "Tareas para Claude";
  return (
    <Link href={`/bandeja?perfil=${slug}`} className="mas-enlace mas-enlace--bandeja">
      <span>Bandeja para Claude</span>
      <span className="mas-enlace-sub" data-espera={espera ? "" : undefined}>
        {detalle}
      </span>
    </Link>
  );
}
