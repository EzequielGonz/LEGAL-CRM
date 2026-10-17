import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/telefono/pwa-register";
import { cookies } from "next/headers";
import { requirePageSession } from "@/lib/acceso/pagina";
import { NivelProvider } from "@/components/nivel/nivel";
import { COOKIE_NIVEL, nivelDe } from "@/lib/nivel";

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
  // Mismo nivel Simple/Avanzado que en la computadora (se recuerda por navegador).
  const nivel = nivelDe(cookies().get(COOKIE_NIVEL)?.value);
  return (
    <NivelProvider inicial={nivel}>
      <div className="modo-telefono min-h-screen bg-slate-50 pb-12">
        <PwaRegister />
        {children}
      </div>
    </NivelProvider>
  );
}
