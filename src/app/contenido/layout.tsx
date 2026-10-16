import { Suspense } from "react";
import { TemaPorParametro } from "@/components/tema-por-parametro";

// Paleta del perfil según ?perfil=<slug> (16/10).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <TemaPorParametro>{children}</TemaPorParametro>
    </Suspense>
  );
}
