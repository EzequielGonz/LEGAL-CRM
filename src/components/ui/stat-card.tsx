export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card-lift group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-300 via-gold-500 to-gold-700 opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
