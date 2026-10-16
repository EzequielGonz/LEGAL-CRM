"use client";

import { useSearchParams } from "next/navigation";
import { temaDe } from "@/lib/marca";

/** Páginas comunes (?perfil=<slug>): aplican la paleta del perfil pedido. */
export function TemaPorParametro({ children }: { children: React.ReactNode }) {
  const perfil = useSearchParams()?.get("perfil");
  return <div data-tema={temaDe(perfil)}>{children}</div>;
}
