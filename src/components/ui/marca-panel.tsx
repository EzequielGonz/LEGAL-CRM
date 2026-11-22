import { useId } from "react";

/**
 * Marca maestra del panel (rediseño 22/11): monograma «P» en latón sobre
 * placa grafito, con borde fino y un brillo superior sutil. Vectorial, sin
 * rasterizar: se ve nítida a 16 px y a 96 px. Es la misma figura del
 * favicon, los iconos de la app y el Apple Touch Icon
 * (public/iconos/marca.svg, src/app/icon.svg y
 * src/app/marca/[archivo]/route.tsx). No reemplaza a los logos de los
 * perfiles: identifica al panel general. Decorativa: el nombre del panel ya
 * está escrito al lado. `animada` suma la entrada con escala y brillo
 * (solo transform y opacity; ver motion.css).
 */
export const MARCA_P = "M10 7h8.1a5.4 5.4 0 0 1 0 10.8h-4.5V25H10zM13.6 10.5v4h4.3a2 2 0 0 0 0-4z";

export function MarcaPanel({
  className = "",
  monocroma = false,
  animada = false,
}: {
  className?: string;
  monocroma?: boolean;
  animada?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gLaton = `mp-l-${uid}`;
  const gPlaca = `mp-p-${uid}`;
  const gBrillo = `mp-b-${uid}`;
  return (
    <span className={`marca-maestra${animada ? " marca-maestra--anima" : ""} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="100%" height="100%" shapeRendering="geometricPrecision">
        {monocroma ? (
          <path d={MARCA_P} fill="currentColor" fillRule="evenodd" />
        ) : (
          <>
            <defs>
              <linearGradient id={gPlaca} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#23252B" />
                <stop offset="1" stopColor="#121317" />
              </linearGradient>
              <linearGradient id={gLaton} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#EBD08A" />
                <stop offset="1" stopColor="#B8934A" />
              </linearGradient>
              <linearGradient id={gBrillo} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill={`url(#${gPlaca})`} />
            <rect width="32" height="16" rx="7" fill={`url(#${gBrillo})`} />
            <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="none" stroke="#C9A85A" strokeOpacity="0.38" />
            <path className="marca-maestra__p" d={MARCA_P} fill={`url(#${gLaton})`} fillRule="evenodd" />
          </>
        )}
      </svg>
    </span>
  );
}
