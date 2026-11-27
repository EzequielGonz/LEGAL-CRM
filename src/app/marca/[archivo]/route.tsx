import { ImageResponse } from "next/og";

/**
 * Iconos de la marca maestra en PNG (rediseño 17/10, bloque 2): favicon de
 * 16 y 32 px, Apple Touch Icon, iconos de la app (192, 512 y «maskable»)
 * e insignia de avisos. Se dibujan desde la misma figura (monograma P) que
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

export async function GET(_req: Request, props: { params: Promise<{ archivo: string }> }) {
  const params = await props.params;
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
          background: "linear-gradient(180deg, #23252B, #121317)",
          borderRadius: m.redondeo ? Math.round((m.lado * 7) / 32) : 0,
        }}
      >
        <svg width={interior} height={interior} viewBox="0 0 32 32">
          <defs>
            <linearGradient id="l" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#EBD08A" />
              <stop offset="1" stopColor="#B8934A" />
            </linearGradient>
          </defs>
          <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="none" stroke="#C9A85A" strokeOpacity="0.38" />
          <path d="M10 7h8.1a5.4 5.4 0 0 1 0 10.8h-4.5V25H10zM13.6 10.5v4h4.3a2 2 0 0 0 0-4z" fill="url(#l)" fillRule="evenodd" />
        </svg>
      </div>
    ),
    { width: m.lado, height: m.lado, headers: { "Cache-Control": "public, max-age=86400, immutable" } }
  );
}
