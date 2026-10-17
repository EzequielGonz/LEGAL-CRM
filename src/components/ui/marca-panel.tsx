/**
 * Marca maestra del panel (rediseño 17/10, bloque 2): la pantalla de la
 * lámpara del ingreso reducida a un símbolo (pantalla de latón, foco y haz
 * de luz) sobre placa grafito. Es la misma figura del favicon, los iconos
 * de la app y el Apple Touch Icon (public/iconos/marca.svg y
 * src/app/marca/[archivo]/route.tsx). No reemplaza
 * a los logos de los perfiles: identifica al panel general. Decorativa: el
 * nombre del panel ya está escrito al lado.
 */
export function MarcaPanel({ className = "", monocroma = false }: { className?: string; monocroma?: boolean }) {
  const laton = monocroma ? "currentColor" : "#C9A85A";
  return (
    <span className={`marca-maestra ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="100%" height="100%">
        {!monocroma && <rect width="32" height="32" rx="7" fill="#15171C" />}
        <path d="M5.5 19.5h21l3 8h-27z" fill={laton} fillOpacity={0.28} />
        <path d="M11 6h10l5 11H6z" fill={laton} />
        <circle cx="16" cy="19.4" r="2.1" fill={monocroma ? "currentColor" : "#F3EDDB"} />
      </svg>
    </span>
  );
}
