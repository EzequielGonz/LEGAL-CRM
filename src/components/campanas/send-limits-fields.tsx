"use client";

/** Campos de ritmo/límite de envío, compartidos entre los distintos
 *  formularios de creación de campaña (el de la pantalla Campañas y el de
 *  selección de contactos dentro de una Base).
 *
 *  Los valores por defecto (90s entre mensajes, lotes de 10, pausa de 5min)
 *  son el ritmo "seguro" pedido para no generar bloqueos de WhatsApp. */
export function SendLimitsFields({
  delaySeconds,
  onDelayChange,
  batchSize,
  onBatchSizeChange,
  batchPauseSeconds,
  onBatchPauseSecondsChange,
  dailyLimit,
  onDailyLimitChange,
}: {
  delaySeconds: number;
  onDelayChange: (v: number) => void;
  batchSize: number;
  onBatchSizeChange: (v: number) => void;
  batchPauseSeconds: number;
  onBatchPauseSecondsChange: (v: number) => void;
  dailyLimit: number | "";
  onDailyLimitChange: (v: number | "") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Segundos entre cada mensaje
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
          Mensajes por lote (antes de la pausa larga)
        </label>
        <input
          type="number"
          min={1}
          value={batchSize}
          onChange={(e) => onBatchSizeChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Pausa entre lotes (segundos)
        </label>
        <input
          type="number"
          min={1}
          value={batchPauseSeconds}
          onChange={(e) => onBatchPauseSecondsChange(Number(e.target.value))}
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
        Con los valores de por defecto: 1 mensaje nuevo cada 1.5 minutos, hasta 10 mensajes, y
        después una pausa de 5 minutos antes de seguir con el próximo lote — así se cuida la
        calidad del número y se evitan bloqueos de WhatsApp. Los envíos los va haciendo el sistema
        solo en segundo plano una vez que apretás &quot;Lanzar&quot;; no hace falta dejar la
        pantalla abierta.
      </p>
    </div>
  );
}
