import Link from "next/link";
import type { ReactNode } from "react";
import type { EstadoLuz } from "@/lib/textos/pantalla";

/**
 * Componentes base del sistema de diseño (22/11). Solo presentación: no leen
 * datos ni cambian nada. Los estilos están en `src/app/diseno.css` (clases
 * `.d-*`) y toman el color del perfil y el modo claro u oscuro solos.
 *
 * - `Bento` y `Tarjeta`: la grilla de resumen y su tarjeta (con enlace, toda
 *   la tarjeta abre la lista que cuenta).
 * - `Estadistica`: rótulo, cifra grande (cuenta desde cero al aparecer, sin
 *   correr nada) y nota. Sin dato muestra «—», distinto de cero.
 * - `Luz` y `ChipEstado`: el punto de estado de /cerebro; `late` solo cuando
 *   algo está pasando ahora.
 * - `Vacio`, `Esqueleto` y `Cargando`: estados vacíos y de carga.
 * - `Revelar`: los hijos entran de a uno.
 */

export { estadoDeTono, type EstadoLuz } from "@/lib/textos/pantalla";

export function Bento({ children, className = "", revelar = true, etiqueta }: { children: ReactNode; className?: string; revelar?: boolean; etiqueta?: string }) {
  return (
    <div className={`d-bento ${revelar ? "d-revelar" : ""} ${className}`} aria-label={etiqueta} role={etiqueta ? "group" : undefined}>
      {children}
    </div>
  );
}

type Ancho = "2" | "3" | "4" | "6" | "12";

export function Tarjeta({
  children,
  href,
  ancho,
  alto = false,
  brillo = false,
  acento = false,
  estado,
  sinRelleno = false,
  className = "",
  como: Etiqueta = "div",
  etiquetaEnlace,
  id,
}: {
  children: ReactNode;
  /** Con enlace, toda la tarjeta abre la lista que cuenta. */
  href?: string;
  /** Columnas que ocupa dentro de un `Bento` (de 12 en la computadora). */
  ancho?: Ancho;
  alto?: boolean;
  brillo?: boolean;
  acento?: boolean;
  /** Borde izquierdo con el color del estado. */
  estado?: EstadoLuz;
  sinRelleno?: boolean;
  className?: string;
  como?: "div" | "section" | "article" | "li";
  etiquetaEnlace?: string;
  id?: string;
}) {
  const clase = [
    "d-tarjeta",
    ancho ? `d-b-${ancho}` : "",
    alto ? "d-alto" : "",
    brillo ? "d-tarjeta--brillo" : "",
    acento ? "d-tarjeta--acento" : "",
    sinRelleno ? "d-tarjeta--sin-relleno" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  if (href) {
    return (
      <Link prefetch={false} href={href} className={clase} data-estado={estado} aria-label={etiquetaEnlace} id={id}>
        {children}
      </Link>
    );
  }
  return (
    <Etiqueta className={clase} data-estado={estado} id={id}>
      {children}
    </Etiqueta>
  );
}

/** Rótulo chico en mayúsculas con letra mono, como en /cerebro. */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`d-kicker ${className}`}>{children}</p>;
}

export function Estadistica({
  etiqueta,
  valor,
  nota,
  tendencia,
  chico = false,
}: {
  etiqueta: ReactNode;
  /** `null` o `undefined` = sin dato («—»), que no es lo mismo que cero. */
  valor: number | string | null | undefined;
  nota?: ReactNode;
  tendencia?: { texto: string; tono: "sube" | "baja" | "igual" } | null;
  chico?: boolean;
}) {
  const sinDato = valor === null || valor === undefined;
  const texto = sinDato ? "—" : typeof valor === "number" ? valor.toLocaleString("es-AR") : valor;
  return (
    <div className="d-stat">
      <p className="d-stat__etiqueta">{etiqueta}</p>
      <p className={`d-stat__valor ${chico ? "d-stat__valor--chico" : ""}`} data-contar={typeof valor === "number" ? "" : undefined} data-vacio={sinDato ? "" : undefined}>
        {texto}
      </p>
      {sinDato ? <p className="sr-only">Sin dato</p> : null}
      {tendencia ? (
        <p className="d-stat__tendencia" data-tono={tendencia.tono}>
          {tendencia.texto}
        </p>
      ) : null}
      {nota ? <p className="d-stat__nota">{nota}</p> : null}
    </div>
  );
}

export function Luz({ estado = "apagado", late = false, etiqueta }: { estado?: EstadoLuz; late?: boolean; etiqueta?: string }) {
  return (
    <span
      className={`d-luz ${late ? "d-luz--late" : ""}`}
      data-estado={estado}
      role={etiqueta ? "img" : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    />
  );
}

/** Chip con luz de estado. El texto se parte en dos líneas antes que cortarse. */
export function ChipEstado({ estado, texto, href, late = false, title }: { estado: EstadoLuz; texto: string; href?: string; late?: boolean; title?: string }) {
  const cuerpo = (
    <>
      <Luz estado={estado} late={late} />
      <span>{texto}</span>
    </>
  );
  return href ? (
    <Link prefetch={false} href={href} className="d-chip chip-estado" data-estado={estado} title={title}>
      {cuerpo}
    </Link>
  ) : (
    <span className="d-chip chip-estado" data-estado={estado} title={title}>
      {cuerpo}
    </span>
  );
}

/** Estado vacío con contexto: qué significa y qué se puede hacer. */
export function Vacio({ titulo, texto, accion, icono = "listo" }: { titulo: string; texto?: ReactNode; accion?: ReactNode; icono?: "listo" | "buscar" | "nada" }) {
  return (
    <div className="d-vacio">
      <span className="d-vacio__icono" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {icono === "listo" ? <path d="m5 12.5 4.2 4.2L19 7" /> : icono === "buscar" ? <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></> : <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h5" /></>}
        </svg>
      </span>
      <p className="d-vacio__titulo">{titulo}</p>
      {texto ? <p className="d-vacio__texto">{texto}</p> : null}
      {accion ? <div className="mt-1">{accion}</div> : null}
    </div>
  );
}

/** Bloque de carga con brillo que pasa (quieto con «reducir movimiento»). */
export function Esqueleto({ alto = "1rem", ancho = "100%", className = "" }: { alto?: string; ancho?: string; className?: string }) {
  return <span aria-hidden="true" className={`d-esqueleto ${className}`} style={{ height: alto, width: ancho }} />;
}

/** «Cargando…» con tres puntos que laten. */
export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <span role="status" className="d-cargando">
      <span aria-hidden="true" className="inline-flex gap-1">
        <i />
        <i />
        <i />
      </span>
      {texto}
    </span>
  );
}

/** Los hijos entran de a uno, una sola vez (solo opacidad y 10 px). */
export function Revelar({ children, className = "", como: Etiqueta = "div" }: { children: ReactNode; className?: string; como?: "div" | "ul" | "ol" | "section" }) {
  return <Etiqueta className={`d-revelar ${className}`}>{children}</Etiqueta>;
}

/** Encabezado de pantalla: rótulo mono, título y bajada; a la derecha, la acción principal. */
export function CabezaPantalla({ kicker, titulo, bajada, accion }: { kicker?: ReactNode; titulo: ReactNode; bajada?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="d-cabeza">
      <div>
        {kicker ? <p className="d-kicker">{kicker}</p> : null}
        <h1>{titulo}</h1>
        {bajada ? <p>{bajada}</p> : null}
      </div>
      {accion}
    </div>
  );
}
