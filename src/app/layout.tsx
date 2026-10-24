import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./panel.css";
import "./controles.css";
import "./marca.css";
import "./renovacion.css";
import "./afinado.css";
import "./tema-premium.css";
import "./tema-premium-ajustes.css";
import { SCRIPT_MODO } from "@/lib/modo";

// Fuentes autoalojadas por Next (16/10). Inter para toda la operación;
// Playfair solo para la marca y las pantallas de ingreso (bloque 4).
const sans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const serif = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], display: "swap", variable: "--font-serif" });

export const viewport: Viewport = {
  themeColor: "#15171C",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // «Pantalla · Marca»: cada pantalla pone su nombre; dentro de un perfil, el
  // menú lo completa con la marca del perfil (rediseño 17/10, bloque 2).
  title: { default: "Panel central", template: "%s · Panel central" },
  description: "Panel central: prospectos, conversaciones, agenda y campañas.",
  // El panel ya no pide login, así que como capa extra de resguardo se le
  // pide a los buscadores que no lo indexen (esto no reemplaza ningún tipo
  // de protección de acceso, solo evita que aparezca en resultados de
  // búsqueda de Google y similares).
  robots: { index: false, follow: false },
  // App instalable (bloque 1.9): manifiesto, íconos y modo pantalla completa en iPhone.
  manifest: "/manifest.webmanifest",
  // Marca maestra (lámpara): SVG para navegadores actuales, PNG de 16/32 px de respaldo.
  icons: {
    icon: [
      { url: "/iconos/marca.svg", type: "image/svg+xml" },
      { url: "/marca/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/marca/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/marca/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: { capable: true, title: "Panel central", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-modo="oscuro" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
      <head>
        {/* 24/10: modo oscuro premium por defecto; el claro se elige en el menú y se recuerda. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_MODO }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
