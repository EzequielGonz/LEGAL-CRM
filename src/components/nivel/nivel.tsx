"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_NIVEL, DURACION_NIVEL_S, NIVEL_AYUDA, NIVEL_LABEL, nivelDe, type Nivel } from "@/lib/nivel";
import { conVolver } from "@/lib/navegacion";

/**
 * Simple / Avanzado (rediseño 17/10, bloque 3).
 *
 * Cómo funciona: el marco del panel lleva `data-nivel` y el contenido de
 * cada nivel se marca con las clases `solo-simple` / `solo-avanzado`
 * (marca.css las oculta). Al alternar solo cambia ese atributo: nada se
 * desmonta, así se conservan borradores, archivos elegidos, búsqueda,
 * filtros, página y registro abierto. No se guarda nada en la base, no se
 * envía nada y no se navega.
 */
const NivelContexto = createContext<{ nivel: Nivel; cambiar: (n: Nivel) => void }>({ nivel: "simple", cambiar: () => {} });

export function useNivel() {
  return useContext(NivelContexto);
}

function guardarCookie(n: Nivel) {
  document.cookie = `${COOKIE_NIVEL}=${n}; path=/; max-age=${DURACION_NIVEL_S}; samesite=lax`;
}

export function NivelProvider({ inicial, children, className = "" }: { inicial: Nivel; children: React.ReactNode; className?: string }) {
  const [nivel, setNivel] = useState<Nivel>(inicial);
  const cambiar = useCallback((n: Nivel) => {
    setNivel(n);
    guardarCookie(n);
  }, []);
  // `?nivel=avanzado` (accesos «Personalizar» / «Ver configuración completa»).
  // Si la página llegó de la caché del navegador con otro nivel, manda la cookie.
  useEffect(() => {
    const pedido = new URLSearchParams(window.location.search).get("nivel");
    if (pedido === "simple" || pedido === "avanzado") return cambiar(pedido);
    const guardado = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NIVEL}=`))?.split("=")[1];
    if (guardado) setNivel(nivelDe(guardado));
  }, [cambiar]);
  // Un pedido de foco (error de validación en un campo oculto o plegado).
  useEffect(() => {
    const alPedir = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const el = document.getElementById(id);
      if (!el) return;
      const oculto = !!el.closest(".solo-avanzado") && !!el.closest('[data-nivel="simple"]');
      if (oculto) cambiar("avanzado");
      let padre = el.parentElement;
      while (padre) {
        if (padre instanceof HTMLDetailsElement) padre.open = true;
        padre = padre.parentElement;
      }
      window.setTimeout(() => {
        if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }, oculto ? 60 : 0);
    };
    window.addEventListener("crm:enfocar", alPedir);
    return () => window.removeEventListener("crm:enfocar", alPedir);
  }, [cambiar]);
  return (
    <NivelContexto.Provider value={{ nivel, cambiar }}>
      <div data-nivel={nivel} className={className}>
        {children}
      </div>
    </NivelContexto.Provider>
  );
}

/** Lleva el foco a un campo aunque esté en Avanzado o dentro de una sección plegada. */
export function enfocarCampo(id: string) {
  window.dispatchEvent(new CustomEvent("crm:enfocar", { detail: id }));
}

/**
 * Selector «Simple / Avanzado»: dos opciones con semántica de radio,
 * flechas para cambiar, opción activa marcada con texto y forma (no solo
 * color) y un aviso para el lector de pantalla.
 */
export function SelectorNivel({ className = "", oscuro = false }: { className?: string; oscuro?: boolean }) {
  const { nivel, cambiar } = useNivel();
  const [aviso, setAviso] = useState("");
  const refs = useRef<Record<Nivel, HTMLButtonElement | null>>({ simple: null, avanzado: null });
  const elegir = (n: Nivel, foco = false) => {
    if (n !== nivel) {
      cambiar(n);
      setAviso(NIVEL_AYUDA[n]);
    }
    if (foco) refs.current[n]?.focus();
  };
  const opciones: Nivel[] = ["simple", "avanzado"];
  return (
    <div className={`selector-nivel ${oscuro ? "selector-nivel-oscuro" : ""} ${className}`}>
      <div
        role="radiogroup"
        aria-label="Nivel de detalle"
        className="selector-nivel-grupo"
        onKeyDown={(e) => {
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            elegir(nivel === "simple" ? "avanzado" : "simple", true);
          }
        }}
      >
        {opciones.map((n) => (
          <button
            key={n}
            ref={(el) => {
              refs.current[n] = el;
            }}
            type="button"
            role="radio"
            aria-checked={nivel === n}
            tabIndex={nivel === n ? 0 : -1}
            title={NIVEL_AYUDA[n]}
            onClick={() => elegir(n)}
            className="selector-nivel-opcion"
          >
            {NIVEL_LABEL[n]}
          </button>
        ))}
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {aviso}
      </span>
    </div>
  );
}

/** Contenido solo para un nivel. Se oculta con CSS (no se desmonta: conserva lo escrito). */
export function SoloNivel({ nivel, children, className = "", como: Etiqueta = "div" }: { nivel: Nivel; children: React.ReactNode; className?: string; como?: "div" | "section" | "span" | "li" }) {
  return <Etiqueta className={`${nivel === "simple" ? "solo-simple" : "solo-avanzado"} ${className}`}>{children}</Etiqueta>;
}

/**
 * Acceso contextual «Personalizar» / «Ver configuración completa»: pasa a
 * Avanzado y abre el apartado exacto, con regreso al trabajo en curso.
 * Solo cambia la presentación y navega: no guarda ni envía nada.
 */
export function EnlaceAvanzado({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const { cambiar } = useNivel();
  const router = useRouter();
  return (
    <a
      href={href}
      className={className || "tactil inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 underline underline-offset-2 hover:text-slate-950"}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        cambiar("avanzado");
        const aqui = window.location.pathname + window.location.search;
        const [ruta, ancla] = href.split("#");
        const destino = conVolver(ruta, aqui) + (ancla ? `#${ancla}` : "");
        if (ruta === window.location.pathname || ruta === "") {
          // Mismo lugar: solo se abre el apartado.
          if (ancla) enfocarCampo(ancla);
          return;
        }
        router.push(destino);
      }}
    >
      {children}
    </a>
  );
}

export { nivelDe };
