"use client";

import { useEffect } from "react";

/** Registra el service worker (app instalable y avisos web). Sin efecto si el navegador no lo soporta. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // sin service worker la app sigue funcionando; solo no se instala ni recibe avisos
    });
  }, []);
  return null;
}
