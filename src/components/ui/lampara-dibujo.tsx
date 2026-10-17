/**
 * Dibujo de la lámpara de pie (17/10): una sola fuente para el ingreso (con
 * cordón interactivo) y para la sala de Inicio y Perfiles (estática). Latón
 * cepillado, pantalla de tela y luz cálida de 2700 K. `p` prefija los ids
 * para que dos lámparas en la misma página no compartan degradados.
 */
export function LamparaDefs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-laton`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#6e5326" />
        <stop offset="0.35" stopColor="#e3c27b" />
        <stop offset="0.6" stopColor="#b8924a" />
        <stop offset="1" stopColor="#59421d" />
      </linearGradient>
      <linearGradient id={`${p}-base`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#d9b873" />
        <stop offset="1" stopColor="#4b3716" />
      </linearGradient>
      <linearGradient id={`${p}-pantalla-on`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#efd29a" />
        <stop offset="0.55" stopColor="#f6dfae" />
        <stop offset="1" stopColor="#ffeec8" />
      </linearGradient>
      <linearGradient id={`${p}-pantalla-off`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#3d342b" />
        <stop offset="1" stopColor="#27211b" />
      </linearGradient>
      <linearGradient id={`${p}-brillo`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.28" />
        <stop offset="0.3" stopColor="#fff" stopOpacity="0.16" />
        <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <radialGradient id={`${p}-foco`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="0.45" stopColor="#ffe3a8" />
        <stop offset="1" stopColor="#ffbd63" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}-halo`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd592" stopOpacity="0.7" />
        <stop offset="1" stopColor="#ffb25a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-cono`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.5" />
        <stop offset="0.6" stopColor="#ffc47a" stopOpacity="0.13" />
        <stop offset="1" stopColor="#ffb25a" stopOpacity="0" />
      </linearGradient>
      <filter id={`${p}-suave`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id={`${p}-suave-chico`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}

/** Haz de luz que cae de la pantalla (se apaga con la lámpara). */
export function LamparaLuz({ p }: { p: string }) {
  return (
    <g className="lampara-luz" aria-hidden="true">
      <polygon points="40,128 180,128 300,416 -80,416" fill={`url(#${p}-cono)`} filter={`url(#${p}-suave)`} />
      <circle cx="110" cy="128" r="70" fill={`url(#${p}-halo)`} />
    </g>
  );
}

/** Base, pie, foco y pantalla (viewBox 0 0 220 440; el piso está en y=412). */
export function LamparaCuerpo({ p }: { p: string }) {
  return (
    <g aria-hidden="true">
      <ellipse cx="110" cy="414" rx="64" ry="7" fill="#000" opacity="0.55" filter={`url(#${p}-suave-chico)`} />
      <ellipse cx="110" cy="408" rx="48" ry="8.5" fill={`url(#${p}-base)`} />
      <ellipse cx="110" cy="404.5" rx="46" ry="6.5" fill={`url(#${p}-laton)`} />
      <ellipse cx="110" cy="402.5" rx="30" ry="4.2" fill="#f4dca1" opacity="0.32" />

      <rect x="106.5" y="148" width="7" height="256" rx="3.5" fill={`url(#${p}-laton)`} />
      <rect x="103.5" y="236" width="13" height="7" rx="2" fill={`url(#${p}-laton)`} />
      <rect x="104.5" y="250" width="11" height="4" rx="2" fill={`url(#${p}-laton)`} opacity="0.85" />
      <rect x="102" y="140" width="16" height="12" rx="3" fill="#2b2118" />
      <rect x="102" y="140" width="16" height="12" rx="3" fill={`url(#${p}-brillo)`} />

      <circle cx="110" cy="130" r="11" fill="#3b2f24" />
      <circle className="lampara-foco-on" cx="110" cy="130" r="22" fill={`url(#${p}-foco)`} />
      <circle className="lampara-foco-on" cx="110" cy="130" r="8" fill="#fffdf6" />

      <path d="M75 34 H145 L186 124 H34 Z" fill={`url(#${p}-pantalla-off)`} stroke="#5d4c39" strokeWidth="1.2" strokeLinejoin="round" />
      <path className="lampara-pantalla-on" d="M75 34 H145 L186 124 H34 Z" fill={`url(#${p}-pantalla-on)`} stroke="#f3d79d" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M75 34 H145 L186 124 H34 Z" fill={`url(#${p}-brillo)`} />
      <ellipse cx="110" cy="124" rx="76" ry="7.5" fill="#1a130d" opacity="0.55" />
      <ellipse className="lampara-borde-on" cx="110" cy="124" rx="76" ry="7.5" fill="#fff2cf" opacity="0.9" />
      <ellipse cx="110" cy="34" rx="35" ry="4" fill="#cfa965" opacity="0.8" />
    </g>
  );
}

/**
 * Sala de la lámpara (17/10). La pared (con boiserie y grano fino) va de
 * fondo en toda la pantalla; el piso, el baño de luz sobre la pared y el
 * charco de luz se anclan al marco de la lámpara para que la base apoye
 * siempre sobre la línea del piso, en cualquier tamaño de pantalla.
 */
export function SalaLampara() {
  return (
    <div className="sala" aria-hidden="true">
      <span className="sala-pared" />
    </div>
  );
}

/** Piso, baño de luz y charco: se ponen dentro del marco de la lámpara. */
export function AnclaSala() {
  return (
    <span className="sala-ancla" aria-hidden="true">
      <span className="sala-bano" />
      <span className="sala-piso" />
      <span className="sala-charco" />
    </span>
  );
}

/** Lámpara estática y prendida, para la sala de Inicio y Perfiles. */
export function LamparaDecorativa({ className = "" }: { className?: string }) {
  return (
    <div className={`lampara-deco esta-prendida ${className}`} aria-hidden="true">
      <AnclaSala />
      <svg viewBox="0 0 220 440" className="h-full w-full overflow-visible">
        <LamparaDefs p="ld" />
        <LamparaLuz p="ld" />
        <LamparaCuerpo p="ld" />
      </svg>
    </div>
  );
}

/** Marca neutra de las pantallas comunes: la lámpara en un sello de latón. */
export function SelloLampara({ className = "" }: { className?: string }) {
  return (
    <span className={`sello-lampara ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.2 3.5h5.6l3 6.5H6.2z" fill="currentColor" fillOpacity="0.16" />
        <path d="M12 10v9.2M8.6 20.5h6.8" />
        <path d="M16 10v2.6" />
        <circle cx="16" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
