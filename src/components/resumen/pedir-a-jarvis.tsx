"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { urlAsistente } from "@/lib/resumen/pedidos";

/**
 * «Pedile a Jarvis que lo haga» (22/11). Lleva a /asistente con el pedido en la dirección y, por si
 * esa pantalla todavía no lo lee, lo deja copiado para pegarlo. Jarvis siempre pide confirmación:
 * este botón no ejecuta nada.
 */
export function PedirAJarvis({ pedido, children, className }: { pedido: string; children: ReactNode; className?: string }) {
  const copiar = () => {
    try {
      void navigator.clipboard?.writeText(pedido).catch(() => {});
    } catch {
      /* sin portapapeles: el pedido igual viaja en la dirección */
    }
  };
  return (
    <Link href={urlAsistente(pedido)} prefetch={false} onClick={copiar} className={className} title="Abre a Jarvis con el pedido escrito. Te pide confirmación antes de hacer nada.">
      {children}
    </Link>
  );
}
