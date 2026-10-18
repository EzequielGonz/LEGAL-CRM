import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/telefono/pwa-register";
import { requirePageSession } from "@/lib/acceso/pagina";
import { MasOpciones, NivelProvider } from "@/components/nivel/nivel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teléfono",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15171C",
};

/** Modo teléfono (bloque 1.9): vista reducida, una columna. */
export default async function TelefonoLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  // Cada pantalla abre con lo esencial; «Más opciones» despliega el resto.
  return (
    <NivelProvider>
      <div id="contenido" className="modo-telefono min-h-screen bg-slate-50 pb-12">
        <PwaRegister />
        {children}
        <MasOpciones />
      </div>
    </NivelProvider>
  );
}
