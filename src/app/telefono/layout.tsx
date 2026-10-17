import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/telefono/pwa-register";
import { requirePageSession } from "@/lib/acceso/pagina";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM · Teléfono",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

/** Modo teléfono (bloque 1.9): vista reducida, una columna. */
export default async function TelefonoLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  return (
    <div className="modo-telefono min-h-screen bg-slate-50 pb-12">
      <PwaRegister />
      {children}
    </div>
  );
}
