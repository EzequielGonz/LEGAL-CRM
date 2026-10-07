import clsx from "clsx";

const PRIORITY_COLOR: Record<string, string> = {
  alta: "bg-green-100 text-green-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-slate-100 text-slate-600",
};

export function PriorityBadge({ priority, score }: { priority: string | null; score: number | null }) {
  if (!priority) return <span className="text-xs text-slate-400">Sin analizar</span>;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        PRIORITY_COLOR[priority] ?? PRIORITY_COLOR.baja
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
      {score != null && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

export const OUTREACH_LABEL: Record<string, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado (sin respuesta)",
  respondio: "Respondió",
  repesca: "En seguimiento",
  cerrado: "Cerrado (aprobado)",
  no_interesado: "No interesado",
  baja: "Dado de baja",
};

const OUTREACH_COLOR: Record<string, string> = {
  sin_contactar: "bg-slate-100 text-slate-600",
  contactado: "bg-amber-100 text-amber-700",
  respondio: "bg-blue-100 text-blue-700",
  repesca: "bg-indigo-100 text-indigo-700",
  cerrado: "bg-green-100 text-green-700",
  no_interesado: "bg-red-100 text-red-700",
  baja: "bg-slate-200 text-slate-600",
};

export function OutreachBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        OUTREACH_COLOR[status] ?? OUTREACH_COLOR.sin_contactar
      )}
    >
      {OUTREACH_LABEL[status] ?? status}
    </span>
  );
}

export const ANALYSIS_LABEL: Record<string, string> = {
  pendiente: "En cola de análisis",
  analizando: "Analizando…",
  listo: "Analizado",
  error: "Error en el análisis",
  omitido: "Sin datos para analizar",
};
