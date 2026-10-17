import Link from "next/link";

/**
 * Tarjeta de cifra. Con `href`, toda la tarjeta abre la lista exacta que
 * cuenta (misma consulta: `src/lib/indicadores.ts`). Sin `href` no se
 * presenta como clickeable.
 */
export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <span aria-hidden="true" className="tarjeta-cifra-regla" />
      <p className="tarjeta-cifra-etiqueta">{label}</p>
      <p className="cifra tarjeta-cifra-valor">{value}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        {hint ? <p className="text-xs leading-snug text-slate-500">{hint}</p> : <span />}
        {href && (
          <p className="tarjeta-cifra-ir" aria-hidden="true">
            Ver lista <span className="flecha-desliza">→</span>
          </p>
        )}
      </div>
    </>
  );
  const cls = "tarjeta-cifra group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white";
  if (href) {
    return (
      <Link href={href} className={cls} data-3d="" aria-label={`${label}: ${value}. Ver la lista`}>
        {body}
      </Link>
    );
  }
  return <div className={cls} data-3d="suave">{body}</div>;
}
