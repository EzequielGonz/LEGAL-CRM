import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./premium.css";
import "./controles.css";
import "./estudio.css";
import "./inmersivo.css";
import "./escena.css";
import { Efectos3D } from "@/components/ui/efectos-3d";

// Fuentes autoalojadas por Next (16/10): antes se pedían con un @import a
// Google Fonts dentro del CSS, que bloqueaba el primer pintado en cadena.
const sans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const serif = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap", variable: "--font-serif" });

export const viewport: Viewport = {
  themeColor: "#0a1433",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Panel de Captación Legal",
  description: "Panel central: prospectos, conversaciones, agenda y campañas.",
  // El panel ya no pide login, así que como capa extra de resguardo se le
  // pide a los buscadores que no lo indexen (esto no reemplaza ningún tipo
  // de protección de acceso, solo evita que aparezca en resultados de
  // búsqueda de Google y similares).
  robots: { index: false, follow: false },
  // App instalable (bloque 1.9): manifiesto, íconos y modo pantalla completa en iPhone.
  manifest: "/manifest.webmanifest",
  icons: { icon: "/iconos/icono-192.png", apple: "/iconos/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Panel CRM", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body className="antialiased">
        {children}
        <Efectos3D />
      </body>
    </html>
  );
}
