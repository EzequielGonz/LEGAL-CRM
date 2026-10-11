"use client";

import { useState } from "react";
import clsx from "clsx";

/** Cierre manual de la sesión de este dispositivo. */
export function LogoutButton({ className, label = "Cerrar sesión" }: { className?: string; label?: string }) {
  const [busy, setBusy] = useState(false);

  async function salir() {
    setBusy(true);
    try {
      await fetch("/api/acceso/salir", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={busy}
      className={clsx(
        "text-sm font-medium text-slate-400 transition-colors hover:text-gold-200 disabled:opacity-50",
        className
      )}
    >
      {busy ? "Cerrando..." : label}
    </button>
  );
}
