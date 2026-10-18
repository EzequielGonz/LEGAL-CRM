"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { nivelDe, type Nivel } from "@/lib/nivel";
import { conVolver } from "@/lib/navegacion";

/**
 * Opciones avanzadas a pedido (18/10; reemplaza el selector Simple /
 * Avanzado). Cada pantalla abre con lo esencial; lo marcado como
 * `solo-avanzado` se despliega con «Más opciones» al pie de la página y se
 * vuelve a plegar al cambiar de pantalla. Nada se desmonta: se conservan
 * borradores, archivos elegidos, filtros y registro abierto. No se guarda
 * nada en la base, no se envía nada y no se navega.
 */
const NivelContexto = createContext<{ nivel: Nivel; cambiar: (n: Nivel) => void }>({ nivel: "simple", cambiar: () => {} });

export function useNivel() {
  return useContext(NivelContexto);
}

export function NivelProvider({ inicial = "simple", children, className = "" }: { inicial?: Nivel; children: React.ReactNode; className?: string }) {
  const [nivel, setNivel] = useState<Nivel>(inicial);
  const cambiar = useCallback((n: Nivel) => setNivel(n), []);
  const pathname = usePathname();
  // Cada pantalla abre plegada; `?nivel=avanzado` (accesos «Personalizar»)
  // la abre desplegada.
  useEffect(() => {
    const pedido = new URLSearchParams(window.location.search).get("nivel");
    setNivel(pedido === "avanzado" ? "avanzado" : "simple");
  }, [pathname]);
  // Un pedido de foco (error de validación en un campo plegado).
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

/**
 * «Más opciones» al pie de cada pantalla: aparece solo si la pantalla tiene
 * opciones plegadas y las despliega (o las vuelve a plegar).
 */
export function MasOpciones() {
  const { nivel, cambiar } = useNivel();
  const pathname = usePathname();
  const [hay, setHay] = useState(false);
  useEffect(() => {
    const revisar = () => setHay(!!document.querySelector("#contenido .solo-avanzado"));
    revisar();
    const t = window.setTimeout(revisar, 800);
    return () => window.clearTimeout(t);
  }, [pathname]);
  if (!hay) return null;
  const abierto = nivel === "avanzado";
  return (
    <div className="mas-opciones">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => {
          cambiar(abierto ? "simple" : "avanzado");
          if (!abierto) window.setTimeout(() => document.querySelector("#contenido .solo-avanzado")?.scrollIntoView({ block: "start", behavior: "smooth" }), 60);
        }}
      >
        {abierto ? "Ocultar opciones avanzadas" : "Más opciones"}
        <span aria-hidden="true">{abierto ? "▴" : "▾"}</span>
      </button>
    </div>
  );
}

/** Lleva el foco a un campo aunque esté en Avanzado o dentro de una sección plegada. */
export function enfocarCampo(id: string) {
  window.dispatchEvent(new CustomEvent("crm:enfocar", { detail: id }));
}

/** Ya no hay selector global (18/10): se conserva el nombre por compatibilidad. */
export function SelectorNivel(_props: { className?: string; oscuro?: boolean }) {
  return null;
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
        const conNivel = ruta ? `${ruta}${ruta.includes("?") ? "&" : "?"}nivel=avanzado` : ruta;
        const destino = conVolver(conNivel, aqui) + (ancla ? `#${ancla}` : "");
        if (ruta.split("?")[0] === window.location.pathname || ruta === "") {
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
