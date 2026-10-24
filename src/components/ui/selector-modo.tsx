"use client";

import { useEffect, useState } from "react";

/**
 * Modo oscuro (premium, por defecto) o claro (24/10). Se guarda por
 * dispositivo y se aplica en <html data-modo>. El script de layout.tsx lo
 * pone antes de pintar, así no hay parpadeo.
 */
import { CLAVE_MODO, type Modo } from "@/lib/modo";

export function leerModo(): Modo {
  try {
    return localStorage.getItem(CLAVE_MODO) === "claro" ? "claro" : "oscuro";
  } catch {
    return "oscuro";
  }
}

export function aplicarModo(m: Modo) {
  document.documentElement.dataset.modo = m;
  try {
    localStorage.setItem(CLAVE_MODO, m);
  } catch {
    /* sin almacenamiento: queda para esta visita */
  }
}

export function SelectorModo({ className }: { className?: string }) {
  const [modo, setModo] = useState<Modo>("oscuro");
  useEffect(() => setModo(leerModo()), []);
  const cambiar = () => {
    const nuevo: Modo = modo === "oscuro" ? "claro" : "oscuro";
    setModo(nuevo);
    aplicarModo(nuevo);
  };
  return (
    <button
      type="button"
      onClick={cambiar}
      className={className ?? "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-medium"}
      aria-label={modo === "oscuro" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
    >
      <span>{modo === "oscuro" ? "Modo claro" : "Modo oscuro"}</span>
      <span aria-hidden="true">{modo === "oscuro" ? "☀" : "☾"}</span>
    </button>
  );
}
