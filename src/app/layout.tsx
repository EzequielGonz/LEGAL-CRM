import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
