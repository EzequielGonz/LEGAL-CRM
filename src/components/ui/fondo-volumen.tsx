/**
 * Fondo con volumen (16/10): auroras que respiran, un horizonte con
 * cuadrícula en perspectiva y partículas. Solo CSS animado sobre
 * `transform` y `opacity` (lo resuelve la GPU). Decorativo.
 */
export function FondoVolumen({ suelo = true }: { suelo?: boolean }) {
  return (
    <div className="fondo-volumen" aria-hidden="true">
      <span className="aurora aurora-1" />
      <span className="aurora aurora-2" />
      <span className="aurora aurora-3" />
      {suelo && (
        <span className="horizonte">
          <span className="suelo-3d" />
        </span>
      )}
      <span className="estrellas" />
    </div>
  );
}
