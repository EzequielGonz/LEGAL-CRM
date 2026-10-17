import { ImageResponse } from "next/og";

/**
 * Iconos de la marca maestra en PNG (rediseño 17/10, bloque 2): favicon de
 * 16 y 32 px, Apple Touch Icon, iconos de la app (192, 512 y «maskable»)
 * e insignia de avisos. Se dibujan desde la misma figura que
 * public/iconos/marca.svg, así no hay archivos binarios que mantener
 * aparte. Rutas terminadas en .png: no pasan por la comprobación de sesión
 * (también se ven desde el ingreso). Se generan una vez y quedan en caché.
 */
const MEDIDAS: Record<string, { lado: number; margen: number; redondeo: boolean }> = {
  "favicon-16.png": { lado: 16, margen: 0, redondeo: true },
  "favicon-32.png": { lado: 32, margen: 0, redondeo: true },
  "insignia-96.png": { lado: 96, margen: 0, redondeo: true },
  "apple-touch-icon.png": { lado: 180, margen: 0, redondeo: false },
  "icono-192.png": { lado: 192, margen: 0, redondeo: true },
  "icono-512.png": { lado: 512, margen: 0, redondeo: true },
  "icono-512-maskable.png": { lado: 512, margen: 0.12, redondeo: false },
};

export const dynamic = "force-static";
export function generateStaticParams() {
  return Object.keys(MEDIDAS).map((archivo) => ({ archivo }));
}

export function GET(_req: Request, { params }: { params: { archivo: string } }) {
  const m = MEDIDAS[params.archivo];
  if (!m) return new Response("No existe", { status: 404 });
  const interior = Math.round(m.lado * (1 - 2 * m.margen));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#15171C",
          borderRadius: m.redondeo ? Math.round((m.lado * 7) / 32) : 0,
        }}
      >
        <svg width={interior} height={interior} viewBox="0 0 32 32">
          <path d="M5.5 19.5h21l3 8h-27z" fill="#C9A85A" fillOpacity={0.28} />
          <path d="M11 6h10l5 11H6z" fill="#C9A85A" />
          <circle cx="16" cy="19.4" r="2.1" fill="#F3EDDB" />
        </svg>
      </div>
    ),
    { width: m.lado, height: m.lado, headers: { "Cache-Control": "public, max-age=86400, immutable" } }
  );
}
