"use client";

/** Campos de velocidad/límite de envío, compartidos entre los distintos
 *  formularios de creación de campaña (el de la pantalla Campañas y el de
 *  selección de contactos dentro de una Base). */
export function SendLimitsFields({
  delaySeconds,
  onDelayChange,
  dailyLimit,
  onDailyLimitChange,
}: {
  delaySeconds: number;
  onDelayChange: (v: number) => void;
  dailyLimit: number | "";
  onDailyLimitChange: (v: number | "") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Pausa entre envíos (segundos)
        </label>
        <input
          type="number"
          min={1}
          value={delaySeconds}
          onChange={(e) => onDelayChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Límite de envíos por día
        </label>
        <input
          type="number"
          min={1}
          placeholder="Sin límite"
          value={dailyLimit}
          onChange={(e) => onDailyLimitChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <p className="col-span-2 text-xs text-slate-400">
        Para cuidar la calidad del número, empezá con valores conservadores (ej: 3-5 segundos
        entre envíos, 100-200 por día) y subilos gradualmente. Si se alcanza el límite diario, la
        campaña queda a mitad de camino: volvé a apretar &quot;Lanzar&quot; al otro día para que
        siga.
      </p>
    </div>
  );
}
