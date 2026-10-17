/**
 * Escena de geometría 3D abstracta (16/10): grafito satinado, luz lateral
 * izquierda y reflejos fríos. Dos planos (lejano y cercano) servidos como
 * SVG estáticos desde /public/escena (se cachean y no usan JavaScript); el
 * motor de profundidad les da paralaje con el puntero. Decorativa.
 */
export function EscenaGeometrica() {
  return (
    <div className="escena-geo" aria-hidden="true">
      <span className="geo-fondo" />
      <span className="geo-frente" />
      <span className="geo-velo" />
    </div>
  );
}
