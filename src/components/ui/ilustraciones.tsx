/**
 * Ilustraciones 3D propias (16/10) para los accesos: mismo material que la
 * escena del ingreso (grafito satinado, luz lateral izquierda, reflejo frío
 * en el canto derecho y un detalle de latón). SVG nítido a cualquier tamaño.
 * Cada una recibe un `id` para no repetir gradientes en la misma página.
 */
function Materiales({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-cuerpo`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6a727f" />
        <stop offset=".45" stopColor="#353a43" />
        <stop offset="1" stopColor="#16181c" />
      </linearGradient>
      <linearGradient id={`${id}-canto`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#14161a" />
        <stop offset="1" stopColor="#7e95ad" />
      </linearGradient>
      <linearGradient id={`${id}-pantalla`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2a3442" />
        <stop offset=".6" stopColor="#141a22" />
        <stop offset="1" stopColor="#0b0e12" />
      </linearGradient>
      <linearGradient id={`${id}-laton`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a6d36" />
        <stop offset=".5" stopColor="#e2c68a" />
        <stop offset="1" stopColor="#9a7a3e" />
      </linearGradient>
      <radialGradient id={`${id}-brillo`} cx=".2" cy=".1" r=".9">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".35" />
        <stop offset=".5" stopColor="#ffffff" stopOpacity=".05" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-sombra`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  );
}

export function IlusTelefono({ className = "h-20 w-20", id = "il-tel" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <Materiales id={id} />
      <ellipse cx="64" cy="108" rx="30" ry="5" fill="#000" opacity=".5" filter={`url(#${id}-sombra)`} />
      <g transform="translate(60 58) rotate(-12) skewY(4) translate(-60 -58)">
        {/* espesor */}
        <rect x="42" y="14" width="40" height="86" rx="9" fill={`url(#${id}-canto)`} />
        {/* cuerpo */}
        <rect x="37" y="11" width="40" height="86" rx="9" fill={`url(#${id}-cuerpo)`} />
        <rect x="37.5" y="11.5" width="39" height="85" rx="8.5" fill="none" stroke="#d8e4f0" strokeOpacity=".35" />
        {/* pantalla */}
        <rect x="41" y="18" width="32" height="72" rx="5" fill={`url(#${id}-pantalla)`} />
        <rect x="45" y="27" width="16" height="2.4" rx="1.2" fill={`url(#${id}-laton)`} />
        <rect x="45" y="34" width="24" height="2" rx="1" fill="#9fb4c9" opacity=".45" />
        <rect x="45" y="39" width="20" height="2" rx="1" fill="#9fb4c9" opacity=".3" />
        <rect x="45" y="50" width="24" height="14" rx="3" fill="#9fb4c9" opacity=".12" />
        <rect x="45" y="68" width="11" height="11" rx="3" fill="#9fb4c9" opacity=".12" />
        <rect x="58" y="68" width="11" height="11" rx="3" fill={`url(#${id}-laton)`} opacity=".75" />
        <rect x="52" y="13.6" width="10" height="1.6" rx=".8" fill="#0a0b0d" />
        <rect x="37" y="11" width="40" height="86" rx="9" fill={`url(#${id}-brillo)`} />
      </g>
    </svg>
  );
}

export function IlusComputadora({ className = "h-20 w-20", id = "il-pc" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <Materiales id={id} />
      <ellipse cx="62" cy="104" rx="44" ry="6" fill="#000" opacity=".5" filter={`url(#${id}-sombra)`} />
      {/* base: espesor y teclado */}
      <path d="M14 86 L78 98 L108 80 L44 70 Z" fill={`url(#${id}-cuerpo)`} />
      <path d="M14 86 L78 98 L78 102 L14 90 Z" fill="#121418" />
      <path d="M78 98 L108 80 L108 84 L78 102 Z" fill={`url(#${id}-canto)`} />
      <path d="M26 84 L76 93 L98 80 L48 72 Z" fill="#0f1114" opacity=".55" />
      <path d="M50 88 L66 91 L72 87 L56 84 Z" fill="#9fb4c9" opacity=".18" />
      <path d="M14 86 L44 70 L108 80" fill="none" stroke="#d8e4f0" strokeOpacity=".35" />
      {/* tapa */}
      <path d="M44 70 L108 80 L104 26 L40 16 Z" fill={`url(#${id}-cuerpo)`} />
      <path d="M48 67 L103 75.5 L99.8 30.5 L44.6 21.2 Z" fill={`url(#${id}-pantalla)`} />
      <path d="M52 30 L70 33" stroke={`url(#${id}-laton)`} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M52 37 L84 42.4" stroke="#9fb4c9" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 43 L78 47.4" stroke="#9fb4c9" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
      <path d="M53 51 L73 54.4 L73.6 63 L53.6 59.6 Z" fill="#9fb4c9" opacity=".12" />
      <path d="M77 55 L95 58 L95.6 67 L77.6 64 Z" fill={`url(#${id}-laton)`} opacity=".7" />
      <path d="M40 16 L104 26" fill="none" stroke="#d8e4f0" strokeOpacity=".4" />
      <path d="M104 26 L108 80" fill="none" stroke="#9fb7d0" strokeOpacity=".55" strokeWidth="1.4" />
      <path d="M44 70 L108 80 L104 26 L40 16 Z" fill={`url(#${id}-brillo)`} />
      <path d="M64 73 L88 76.8" stroke={`url(#${id}-laton)`} strokeWidth="1.4" />
    </svg>
  );
}

/**
 * Medallón 3D para logos y monogramas: bisel de grafito satinado y cara
 * perlada donde el logo de la marca se ve tal cual (no se modifica).
 */
export function Medallon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`medallon ${className}`}>
      <span className="medallon-cara">{children}</span>
    </span>
  );
}
