/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  // 13/11: al volver a una pantalla se piden los datos de nuevo. Antes Next mostraba
  // la copia de los últimos 30 segundos y las cifras parecían no actualizarse.
  experimental: {
    staleTimes: { dynamic: 0 },
  },
  // Bloque 1.12: encabezados de seguridad para todas las respuestas. No se
  // declara una Content-Security-Policy todavía: necesita nonces para los
  // scripts de Next.js y las fuentes de Google, y se prepara aparte.
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
