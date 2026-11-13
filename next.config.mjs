// 13/11 · Política de contenido del navegador. Limita de dónde puede cargar
// cosas una página del panel: si algún texto ajeno (un mensaje de un contacto,
// una base, una página analizada) llegara a colarse como código, no puede
// traer programas de afuera, mandar datos a otro sitio, meter el panel en un
// marco ni cambiar a dónde envían los formularios. Los scripts y estilos en
// línea siguen permitidos porque Next los necesita; cerrarlos del todo pide
// firmar cada script, y va con la subida de versión de Next.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Fotos y logos: propios, del almacenamiento privado y de las redes (siempre por https).
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  // Llamadas del navegador: al propio panel y al almacenamiento (subida de archivos).
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // Único marco externo: la vista previa de Instagram en Redes.
  "frame-src 'self' https://www.instagram.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 13/11 (seguridad): el panel no usa el optimizador de imágenes de Next; se apaga
  // para que su dirección (/_next/image) no quede expuesta a los fallos conocidos.
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Con Next 15 la navegación ya no muestra copias viejas: el ajuste `staleTimes` dejó de hacer falta.
  // Bloque 1.12: encabezados de seguridad para todas las respuestas.
  // 13/11: se suma la política de contenido (ver CSP arriba).
  // 24/10: la vista de Teléfono se retiró; el panel normal se adapta al celular.
  async redirects() {
    return [
      { source: "/telefono", destination: "/perfiles", permanent: false },
      { source: "/telefono/:path*", destination: "/perfiles", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
