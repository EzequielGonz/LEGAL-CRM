import { MARCAS, SLUGS_PERFIL } from "@/lib/marca";

/**
 * Logo general del panel (17/10): cuatro piezas, una por perfil, con el
 * acento de cada marca. Simple y neutro: no reemplaza a ningún logo de
 * perfil. Decorativo (el nombre del panel ya está escrito al lado).
 */
export function MarcaPanel({ className = "" }: { className?: string }) {
  return (
    <span className={`marca-panel ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32">
        {SLUGS_PERFIL.map((s, i) => (
          <rect key={s} x={i % 2 ? 17 : 3} y={i < 2 ? 3 : 17} width="12" height="12" rx="3.5" fill={MARCAS[s].acento} />
        ))}
      </svg>
    </span>
  );
}
