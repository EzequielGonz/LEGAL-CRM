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
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-300 via-gold-500 to-gold-700 opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="cifra mt-1 font-serif text-3xl font-semibold leading-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {href && (
        <p className="mt-3 text-xs font-semibold text-gold-800 transition-colors group-hover:text-slate-900" aria-hidden="true">
          Ver lista <span className="flecha-desliza">→</span>
        </p>
      )}
    </>
  );
  const cls = "card-lift group relative block overflow-hidden rounded-xl border border-slate-200 bg-white p-5";
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={`${label}: ${value}. Ver la lista`}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}
